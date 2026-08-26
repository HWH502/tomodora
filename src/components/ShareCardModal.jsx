import { useRef, useState } from 'react'
import ShareCard from './ShareCard'
import { captureNodeAsPngBlob, downloadBlob, shareOrDownloadPngBlob } from '../utils/shareCardImage'
import { todayDateString } from '../utils/date'

const HINT_TEXT = {
  shared: '已分享出去！',
  downloaded: '已下載圖片！',
  cancelled: null,
  error: '圖卡產生失敗，請再試一次。',
}

function buildFilename() {
  return `番茄鐘-成果分享-${todayDateString()}.png`
}

export default function ShareCardModal({ cardData, onClose }) {
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | working | shared | downloaded | cancelled | error
  const isWorking = status === 'working'

  const handleShare = async () => {
    setStatus('working')
    try {
      const blob = await captureNodeAsPngBlob(cardRef.current)
      const result = await shareOrDownloadPngBlob(blob, {
        filename: buildFilename(),
        title: '我的專注成果',
        text: '',
      })
      setStatus(result)
    } catch {
      setStatus('error')
    }
  }

  const handleDownload = async () => {
    setStatus('working')
    try {
      const blob = await captureNodeAsPngBlob(cardRef.current)
      downloadBlob(blob, buildFilename())
      setStatus('downloaded')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="share-card-modal__overlay">
      <div className="share-card-modal__panel">
        <ShareCard ref={cardRef} data={cardData} />
        <div className="share-card-modal__actions">
          <button type="button" onClick={handleShare} disabled={isWorking}>
            {isWorking ? '產生中…' : '分享圖卡'}
          </button>
          <button type="button" onClick={handleDownload} disabled={isWorking}>
            {isWorking ? '產生中…' : '下載圖片'}
          </button>
          <button type="button" onClick={onClose}>
            關閉
          </button>
        </div>
        <p className="share-card-modal__hint">{HINT_TEXT[status] ?? ''}</p>
      </div>
    </div>
  )
}
