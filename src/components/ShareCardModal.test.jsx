import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ShareCardModal from './ShareCardModal'
import * as shareCardImage from '../utils/shareCardImage'

const CARD_DATA = {
  variant: 'noPet',
  stats: { lifetimePomodoros: 10, focusMinutesLabel: '4 小時 10 分', startedAtLabel: '2026/08/25' },
  pet: null,
  memorial: null,
}

describe('ShareCardModal', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the ShareCard preview and both action buttons', () => {
    render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
    expect(document.querySelector('.share-card')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '分享圖卡' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下載圖片' })).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<ShareCardModal cardData={CARD_DATA} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: '關閉' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  describe('分享圖卡 button', () => {
    it('captures the card and shows a success hint after sharing', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
      vi.spyOn(shareCardImage, 'shareOrDownloadPngBlob').mockResolvedValue('shared')

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '分享圖卡' }))

      await waitFor(() => expect(screen.getByText('已分享出去！')).toBeInTheDocument())
    })

    it('shows a downloaded hint when shareOrDownloadPngBlob falls back to "downloaded"', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
      vi.spyOn(shareCardImage, 'shareOrDownloadPngBlob').mockResolvedValue('downloaded')

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '分享圖卡' }))

      await waitFor(() => expect(screen.getByText('已下載圖片！')).toBeInTheDocument())
    })

    it('shows nothing extra when the user cancels the share sheet', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
      vi.spyOn(shareCardImage, 'shareOrDownloadPngBlob').mockResolvedValue('cancelled')

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '分享圖卡' }))

      await waitFor(() => expect(screen.queryByText(/已分享出去|已下載圖片/)).not.toBeInTheDocument())
    })

    it('shows an error hint when capture fails', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockRejectedValue(new Error('boom'))

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '分享圖卡' }))

      await waitFor(() => expect(screen.getByText('圖卡產生失敗，請再試一次。')).toBeInTheDocument())
    })
  })

  describe('下載圖片 button', () => {
    it('captures the card and downloads it directly, without going through shareOrDownloadPngBlob', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockResolvedValue(new Blob(['x'], { type: 'image/png' }))
      const downloadSpy = vi.spyOn(shareCardImage, 'downloadBlob').mockImplementation(() => {})
      const shareSpy = vi.spyOn(shareCardImage, 'shareOrDownloadPngBlob')

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '下載圖片' }))

      await waitFor(() => expect(screen.getByText('已下載圖片！')).toBeInTheDocument())
      expect(downloadSpy).toHaveBeenCalledOnce()
      expect(shareSpy).not.toHaveBeenCalled()
    })

    it('shows an error hint when capture fails', async () => {
      vi.spyOn(shareCardImage, 'captureNodeAsPngBlob').mockRejectedValue(new Error('boom'))

      render(<ShareCardModal cardData={CARD_DATA} onClose={() => {}} />)
      fireEvent.click(screen.getByRole('button', { name: '下載圖片' }))

      await waitFor(() => expect(screen.getByText('圖卡產生失敗，請再試一次。')).toBeInTheDocument())
    })
  })
})
