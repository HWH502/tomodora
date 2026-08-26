import { useState } from 'react'
import FocusSummaryCards from './FocusSummaryCards'
import FocusHeatmap from './FocusHeatmap'
import FocusTrendChart from './FocusTrendChart'
import ShareCardModal from './ShareCardModal'
import { buildShareCardData } from '../utils/shareCard'

export default function FocusStatsPage({
  history, streak, currentPet, petMemorials, onClose,
  lifetimePomodoros, lifetimeFocusMinutes, lifetimeFocusMinutesStartedAt,
}) {
  const [showShareCard, setShowShareCard] = useState(false)

  const cardData = buildShareCardData({
    pet: currentPet,
    petMemorials,
    lifetimePomodoros,
    lifetimeFocusMinutes,
    lifetimeFocusMinutesStartedAt,
  })

  return (
    <section className="focus-stats-page">
      <div className="focus-stats-page__header">
        <h2>專注成效統計</h2>
        <button type="button" onClick={() => setShowShareCard(true)}>
          產生分享圖卡
        </button>
        <button type="button" onClick={onClose}>
          關閉統計
        </button>
      </div>
      <FocusSummaryCards history={history} streak={streak} />
      <FocusHeatmap history={history} currentPet={currentPet} petMemorials={petMemorials} />
      <FocusTrendChart history={history} />
      {showShareCard && <ShareCardModal cardData={cardData} onClose={() => setShowShareCard(false)} />}
    </section>
  )
}
