import { useRef, useState } from 'react'
import ShareCard from './ShareCard'
import { captureNodeAsPngBlob, downloadBlob } from '../utils/shareCardImage'
import { todayDateString } from '../utils/date'

const HINT_TEXT = {
  downloaded: '已下載圖片！',
  error: '圖卡產生失敗，請再試一次。',
}

function buildFilename() {
  return `番茄鐘-成果分享-${todayDateString()}.png`
}

export default function ShareCardModal({ cardData, onClose }) {
  const cardRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | working | downloaded | error
  const isWorking = status === 'working'

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
          <button
            type="button"
            className="share-card-modal__action share-card-modal__action--primary"
            onClick={handleDownload}
            disabled={isWorking}
          >
            {isWorking ? '產生中…' : '下載圖片'}
          </button>
          <button
            type="button"
            className="share-card-modal__action share-card-modal__action--secondary"
            onClick={onClose}
          >
            關閉
          </button>
        </div>
        <p className="share-card-modal__hint">{HINT_TEXT[status] ?? ''}</p>
      </div>
    </div>
  )
}
