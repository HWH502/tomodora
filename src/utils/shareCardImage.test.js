import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as htmlToImage from 'html-to-image'
import { canShareFiles, captureNodeAsPngBlob, downloadBlob, shareOrDownloadPngBlob } from './shareCardImage'

describe('captureNodeAsPngBlob', () => {
  it('calls html-to-image toBlob with the node and pixelRatio, and returns the blob', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' })
    const toBlobSpy = vi.spyOn(htmlToImage, 'toBlob').mockResolvedValue(fakeBlob)
    const node = document.createElement('div')

    const result = await captureNodeAsPngBlob(node)

    expect(toBlobSpy).toHaveBeenCalledWith(node, expect.objectContaining({ pixelRatio: 2 }))
    expect(result).toBe(fakeBlob)
    toBlobSpy.mockRestore()
  })

  it('throws when html-to-image returns null', async () => {
    const toBlobSpy = vi.spyOn(htmlToImage, 'toBlob').mockResolvedValue(null)
    await expect(captureNodeAsPngBlob(document.createElement('div'))).rejects.toThrow()
    toBlobSpy.mockRestore()
  })

  it('falls back to skipFonts when the first capture attempt fails (e.g. font fetch failure)', async () => {
    const fakeBlob = new Blob(['fake'], { type: 'image/png' })
    const toBlobSpy = vi.spyOn(htmlToImage, 'toBlob')
      .mockRejectedValueOnce(new Error('font fetch failed'))
      .mockResolvedValueOnce(fakeBlob)
    const node = document.createElement('div')

    const result = await captureNodeAsPngBlob(node)

    expect(toBlobSpy).toHaveBeenCalledTimes(2)
    expect(toBlobSpy).toHaveBeenNthCalledWith(2, node, expect.objectContaining({ skipFonts: true }))
    expect(result).toBe(fakeBlob)
    toBlobSpy.mockRestore()
  })
})

describe('downloadBlob', () => {
  it('creates an object URL and clicks a download link immediately, but only revokes the URL after a delay', () => {
    vi.useFakeTimers()
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    downloadBlob(new Blob(['x']), 'test.png')

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    // Not revoked synchronously: on Safari/older Firefox, click() only starts
    // an async blob fetch, and an immediate revoke can produce a broken file.
    expect(revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url')

    clickSpy.mockRestore()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
})

describe('canShareFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when navigator.share and navigator.canShare accept the file', () => {
    const file = new File(['x'], 'test.png', { type: 'image/png' })
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: vi.fn(() => true) })
    expect(canShareFiles(file)).toBe(true)
  })

  it('returns false when navigator.share is missing', () => {
    const file = new File(['x'], 'test.png', { type: 'image/png' })
    vi.stubGlobal('navigator', {})
    expect(canShareFiles(file)).toBe(false)
  })

  it('returns false when navigator.canShare rejects the file', () => {
    const file = new File(['x'], 'test.png', { type: 'image/png' })
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: vi.fn(() => false) })
    expect(canShareFiles(file)).toBe(false)
  })
})

describe('shareOrDownloadPngBlob', () => {
  let downloadSpy

  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:fake-url'), revokeObjectURL: vi.fn() })
    downloadSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    downloadSpy.mockRestore()
  })

  it('calls navigator.share when sharing files is supported, and returns "shared"', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share, canShare: vi.fn(() => true) })

    const result = await shareOrDownloadPngBlob(new Blob(['x'], { type: 'image/png' }), {
      filename: 'card.png', title: '我的專注成果', text: '',
    })

    expect(share).toHaveBeenCalledOnce()
    expect(result).toBe('shared')
    expect(downloadSpy).not.toHaveBeenCalled()
  })

  it('returns "cancelled" without falling back to download when the user cancels the share sheet', async () => {
    const abortError = Object.assign(new Error('cancelled'), { name: 'AbortError' })
    const share = vi.fn().mockRejectedValue(abortError)
    vi.stubGlobal('navigator', { share, canShare: vi.fn(() => true) })

    const result = await shareOrDownloadPngBlob(new Blob(['x'], { type: 'image/png' }), { filename: 'card.png' })

    expect(result).toBe('cancelled')
    expect(downloadSpy).not.toHaveBeenCalled()
  })

  it('falls back to download when share fails for a non-cancel reason', async () => {
    const share = vi.fn().mockRejectedValue(new Error('boom'))
    vi.stubGlobal('navigator', { share, canShare: vi.fn(() => true) })

    const result = await shareOrDownloadPngBlob(new Blob(['x'], { type: 'image/png' }), { filename: 'card.png' })

    expect(result).toBe('downloaded')
    expect(downloadSpy).toHaveBeenCalledOnce()
  })

  it('downloads directly when sharing files is not supported', async () => {
    vi.stubGlobal('navigator', {})

    const result = await shareOrDownloadPngBlob(new Blob(['x'], { type: 'image/png' }), { filename: 'card.png' })

    expect(result).toBe('downloaded')
    expect(downloadSpy).toHaveBeenCalledOnce()
  })
})
