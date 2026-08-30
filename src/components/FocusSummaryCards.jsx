import { getTodayMinutes, getThisWeekMinutes, getWeekOverWeekChange } from '../utils/focusSummary'

export default function FocusSummaryCards({ history, streak, showStreakCard = true }) {
  const todayMinutes = getTodayMinutes(history)
  const thisWeekMinutes = getThisWeekMinutes(history)
  const weekOverWeekChange = getWeekOverWeekChange(history)

  return (
    <div className="focus-summary">
      <div className="focus-summary__card">
        <p className="focus-summary__label">今日專注</p>
        <p className="focus-summary__value focus-summary__value--today display">{todayMinutes} 分鐘</p>
      </div>
      <div className="focus-summary__card">
        <p className="focus-summary__label">本週專注</p>
        <p className="focus-summary__value focus-summary__value--week display">{thisWeekMinutes} 分鐘</p>
        {weekOverWeekChange !== null && (
          <p className="focus-summary__delta">
            較上週 {weekOverWeekChange >= 0 ? '+' : ''}
            {weekOverWeekChange}%
          </p>
        )}
      </div>
      {showStreakCard && (
        <div className="focus-summary__card">
          <p className="focus-summary__label">連續天數</p>
          <p className="focus-summary__value focus-summary__value--streak display">{streak.currentStreak} 天</p>
        </div>
      )}
    </div>
  )
}
