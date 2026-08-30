import { useRef, useState } from 'react'
import { applySaveFile, buildSaveFile, getSaveFileSummary, parseSaveFile, serializeSaveFile } from '../utils/saveFile'
import { todayDateString } from '../utils/date'

const ERROR_MESSAGES = {
  invalid: '這不是有效的番茄鐘存檔檔案，請確認選對檔案。',
  tooNew: '這份存檔的版本比目前的遊戲新，請重新整理頁面更新到最新版本後再試一次。',
  tooLarge: '這個檔案太大了，不像是番茄鐘的存檔，請確認選對檔案。',
}

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024

export default function BackupRestore({ reloadPage = () => window.location.reload() } = {}) {
  const fileInputRef = useRef(null)
  const [pendingImport, setPendingImport] = useState(null)
  const [importError, setImportError] = useState(null)

  const handleExport = () => {
    const saveFile = buildSaveFile()
    const blob = new Blob([serializeSaveFile(saveFile)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `番茄鐘備份-${todayDateString()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_IMPORT_FILE_BYTES) {
      setImportError(ERROR_MESSAGES.tooLarge)
      setPendingImport(null)
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = parseSaveFile(String(reader.result))
      if (result.ok) {
        setImportError(null)
        setPendingImport(result.data)
      } else {
        setImportError(ERROR_MESSAGES[result.error])
        setPendingImport(null)
      }
    }
    reader.onerror = () => {
      setImportError(ERROR_MESSAGES.invalid)
      setPendingImport(null)
    }
    reader.readAsText(file)
  }

  const handleConfirmImport = async () => {
    await applySaveFile(pendingImport)
    reloadPage()
  }

  const handleCancelImport = () => {
    setPendingImport(null)
  }

  const summary = pendingImport ? getSaveFileSummary(pendingImport) : null

  const exportedAtLabel = (() => {
    if (!summary?.exportedAt) return '未知時間'
    const date = new Date(summary.exportedAt)
    return Number.isNaN(date.getTime()) ? '未知時間' : date.toLocaleString()
  })()

  return (
    <div className="backup-restore settings-page__card">
      <h2 className="display settings-page__card-title">備份與還原</h2>
      <p className="settings-page__card-desc">
        把目前的進度（金錢、寵物、技能樹、專注紀錄）匯出成檔案保存，或用先前匯出的檔案還原進度（會覆蓋現在的進度）
      </p>

      <div className="backup-restore__actions">
        <button type="button" className="action-btn" onClick={handleExport}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          匯出存檔
        </button>

        <button type="button" className="action-btn action-btn--outline" onClick={() => fileInputRef.current?.click()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 21V9" />
            <path d="M7 14l5-5 5 5" />
            <path d="M4 3h16" />
          </svg>
          匯入存檔
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="backup-restore__file-input"
          onChange={handleFileChange}
        />
      </div>

      {importError && (
        <p className="backup-restore__error" role="alert">
          {importError}
        </p>
      )}

      {summary && (
        <div className="backup-restore__confirm" role="alertdialog">
          <p>
            這份存檔是 {exportedAtLabel} 匯出的，寵物：
            {summary.petName ?? '尚未養寵物'}，身價 {summary.money} 元。
          </p>
          <p className="backup-restore__warning">這會蓋掉現在的進度，這個動作無法復原，確定要繼續嗎？</p>
          <div className="backup-restore__actions">
            <button type="button" className="action-btn" onClick={handleConfirmImport}>
              確定覆蓋並匯入
            </button>
            <button type="button" className="action-btn action-btn--outline" onClick={handleCancelImport}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
