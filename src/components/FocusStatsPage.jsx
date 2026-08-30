import { useState } from 'react'
import FocusSummaryCards from './FocusSummaryCards'
import FocusHeatmap from './FocusHeatmap'
import FocusHeatmapMonth from './FocusHeatmapMonth'
import FocusTrendChart from './FocusTrendChart'
import FocusTrendChartMobile from './FocusTrendChartMobile'
import PageBlobs from './PageBlobs'
import ShareCardModal from './ShareCardModal'
import { buildShareCardData } from '../utils/shareCard'
import { useIsMobile } from '../hooks/useIsMobile'

export default function FocusStatsPage({
  history, streak, currentPet, petMemorials,
  lifetimePomodoros, lifetimeFocusMinutes, lifetimeFocusMinutesStartedAt,
}) {
  const [showShareCard, setShowShareCard] = useState(false)
  const [year, setYear] = useState(() => new Date().getFullYear())
  const isMobile = useIsMobile()

  const cardData = buildShareCardData({
    pet: currentPet,
    petMemorials,
    lifetimePomodoros,
    lifetimeFocusMinutes,
    lifetimeFocusMinutesStartedAt,
  })

  return (
    <section className="focus-stats-page">
      <PageBlobs />
      <div className="focus-stats-page__header">
        <p className="display focus-stats-page__title">專注成效統計</p>
        <button
          type="button"
          className="focus-stats-page__action focus-stats-page__action--primary"
          onClick={() => setShowShareCard(true)}
        >
          產生分享圖卡
        </button>
      </div>

      <FocusSummaryCards history={history} streak={streak} showStreakCard={!isMobile} />

      {isMobile ? (
        <>
          <FocusHeatmapMonth history={history} currentPet={currentPet} petMemorials={petMemorials} />
          <FocusTrendChartMobile history={history} />
        </>
      ) : (
        <>
          <FocusHeatmap
            history={history}
            currentPet={currentPet}
            petMemorials={petMemorials}
            year={year}
            onPrevYear={() => setYear((y) => y - 1)}
            onNextYear={() => setYear((y) => y + 1)}
          />
          <FocusTrendChart history={history} />
        </>
      )}

      {showShareCard && <ShareCardModal cardData={cardData} onClose={() => setShowShareCard(false)} />}
    </section>
  )
}
