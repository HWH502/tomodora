import { toBlob } from 'html-to-image'

export async function captureNodeAsPngBlob(node, { pixelRatio = 2 } = {}) {
  try {
    const blob = await toBlob(node, { pixelRatio, cacheBust: true })
    if (!blob) throw new Error('captureNodeAsPngBlob: html-to-image returned no blob')
    return blob
  } catch (firstError) {
    const blob = await toBlob(node, { pixelRatio, cacheBust: true, skipFonts: true })
    if (!blob) throw firstError
    return blob
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function canShareFiles(file) {
  return typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] })
}

export async function shareOrDownloadPngBlob(blob, { filename, title, text }) {
  const file = new File([blob], filename, { type: 'image/png' })

  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title, text })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
      // any other share failure: fall through to download
    }
  }

  downloadBlob(blob, filename)
  return 'downloaded'
}
