import FocusSummaryCards from './FocusSummaryCards'
import FocusHeatmap from './FocusHeatmap'
import FocusTrendChart from './FocusTrendChart'

export default function FocusStatsPage({ history, streak, currentPet, petMemorials, onClose }) {
  return (
    <section className="focus-stats-page">
      <div className="focus-stats-page__header">
        <h2>專注成效統計</h2>
        <button type="button" onClick={onClose}>
          關閉統計
        </button>
      </div>
      <FocusSummaryCards history={history} streak={streak} />
      <FocusHeatmap history={history} currentPet={currentPet} petMemorials={petMemorials} />
      <FocusTrendChart history={history} />
    </section>
  )
}
