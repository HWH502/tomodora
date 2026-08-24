export default function FocusSummaryCards({ history, streak }) {
  const days = Object.values(history.days)
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0)
  const recordedDayCount = days.length
  const averageMinutesPerDay = recordedDayCount > 0 ? Math.round(totalMinutes / recordedDayCount) : 0

  return (
    <div className="focus-summary">
      <div className="focus-summary__card">
        <p className="focus-summary__label">累計專注分鐘</p>
        <p className="focus-summary__value">{totalMinutes}</p>
      </div>
      <div className="focus-summary__card">
        <p className="focus-summary__label">目前連續天數</p>
        <p className="focus-summary__value">{streak.currentStreak}</p>
      </div>
      <div className="focus-summary__card">
        <p className="focus-summary__label">平均每天分鐘數</p>
        <p className="focus-summary__value">{averageMinutesPerDay}</p>
      </div>
    </div>
  )
}
