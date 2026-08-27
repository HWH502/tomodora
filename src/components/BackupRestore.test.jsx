import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BackupRestore from './BackupRestore'
import { buildSaveFile, CURRENT_SCHEMA_VERSION, serializeSaveFile } from '../utils/saveFile'
import { createPet, saveSettings } from '../utils/storage'

describe('BackupRestore - 匯出', () => {
  let createObjectURL
  let revokeObjectURL
  let clickSpy

  beforeEach(() => {
    createObjectURL = vi.fn(() => 'blob:mock-url')
    revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    clickSpy.mockRestore()
  })

  it('renders an export button', () => {
    render(<BackupRestore />)
    expect(screen.getByText('匯出存檔')).toBeInTheDocument()
  })

  it('downloads a JSON file containing the current save data when clicked', async () => {
    saveSettings({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })

    render(<BackupRestore />)
    fireEvent.click(screen.getByText('匯出存檔'))

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blob = createObjectURL.mock.calls[0][0]
    expect(blob.type).toBe('application/json')

    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.schemaVersion).toBe(1)
    expect(parsed.settings).toEqual({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })

    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('BackupRestore - 匯入', () => {
  function buildFile(content, name = 'backup.json') {
    return new File([content], name, { type: 'application/json' })
  }

  it('shows a confirmation with the save file summary after picking a valid file', async () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小福' })
    const validText = serializeSaveFile(buildSaveFile())

    render(<BackupRestore />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile(validText)] } })

    expect(await screen.findByText(/小福/)).toBeInTheDocument()
    expect(screen.getByText(/這會蓋掉現在的進度/)).toBeInTheDocument()
    expect(screen.getByText('確定覆蓋並匯入')).toBeInTheDocument()
  })

  it('shows an error and no confirmation when the file is not valid JSON', async () => {
    render(<BackupRestore />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile('not json {')] } })

    expect(await screen.findByText('這不是有效的番茄鐘存檔檔案，請確認選對檔案。')).toBeInTheDocument()
    expect(screen.queryByText('確定覆蓋並匯入')).not.toBeInTheDocument()
  })

  it('shows a version-mismatch error when the file is from a newer schema version', async () => {
    const future = { ...buildSaveFile(), schemaVersion: CURRENT_SCHEMA_VERSION + 1 }

    render(<BackupRestore />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile(JSON.stringify(future))] } })

    expect(
      await screen.findByText('這份存檔的版本比目前的遊戲新，請重新整理頁面更新到最新版本後再試一次。'),
    ).toBeInTheDocument()
  })

  it('rejects an oversized file before reading it, instead of parsing a huge string', async () => {
    const oversized = buildFile('x'.repeat(6 * 1024 * 1024))
    const readAsTextSpy = vi.spyOn(FileReader.prototype, 'readAsText')

    render(<BackupRestore />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [oversized] } })

    expect(await screen.findByText('這個檔案太大了，不像是番茄鐘的存檔，請確認選對檔案。')).toBeInTheDocument()
    expect(screen.queryByText('確定覆蓋並匯入')).not.toBeInTheDocument()
    expect(readAsTextSpy).not.toHaveBeenCalled()

    readAsTextSpy.mockRestore()
  })

  it('applies the save file and reloads the page after confirming', async () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小福' })
    const validText = serializeSaveFile(buildSaveFile())
    const reloadPage = vi.fn()

    render(<BackupRestore reloadPage={reloadPage} />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile(validText)] } })
    fireEvent.click(await screen.findByText('確定覆蓋並匯入'))

    await waitFor(() => expect(reloadPage).toHaveBeenCalledTimes(1))
  })

  it('falls back to 未知時間 when the exported date cannot be parsed', async () => {
    const malformed = { ...buildSaveFile(), exportedAt: 'not-a-real-date' }

    render(<BackupRestore />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile(JSON.stringify(malformed))] } })

    expect(await screen.findByText(/未知時間/)).toBeInTheDocument()
  })

  it('shows an error message when the file cannot be read', async () => {
    const OriginalFileReader = global.FileReader
    class FailingFileReader {
      readAsText() {
        this.onerror?.(new Error('read failed'))
      }
    }
    global.FileReader = FailingFileReader

    try {
      render(<BackupRestore />)
      const input = document.querySelector('.backup-restore__file-input')
      fireEvent.change(input, { target: { files: [buildFile('irrelevant content')] } })

      expect(await screen.findByText('這不是有效的番茄鐘存檔檔案，請確認選對檔案。')).toBeInTheDocument()
    } finally {
      global.FileReader = OriginalFileReader
    }
  })

  it('closes the confirmation without applying anything when cancelled', async () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小福' })
    const validText = serializeSaveFile(buildSaveFile())
    const reloadPage = vi.fn()

    render(<BackupRestore reloadPage={reloadPage} />)
    const input = document.querySelector('.backup-restore__file-input')
    fireEvent.change(input, { target: { files: [buildFile(validText)] } })
    fireEvent.click(await screen.findByText('取消'))

    expect(screen.queryByText('確定覆蓋並匯入')).not.toBeInTheDocument()
    expect(reloadPage).not.toHaveBeenCalled()
  })
})
