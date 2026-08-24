import { useMemo, useState } from 'react'
import { getMonthlyTotals, getWeeklyTotals } from '../utils/focusTrend'

export default function FocusTrendChart({ history }) {
  const [granularity, setGranularity] = useState('week')
  const [offset, setOffset] = useState(0)

  const bars = useMemo(() => {
    if (granularity === 'week') {
      return getWeeklyTotals(history, { weeksBack: 12, offsetWeeks: offset }).map((bucket) => ({
        key: bucket.weekStart,
        label: bucket.weekStart,
        minutes: bucket.minutes,
        count: bucket.count,
      }))
    }
    return getMonthlyTotals(history, { monthsBack: 12, offsetMonths: offset }).map((bucket) => ({
      key: bucket.label,
      label: bucket.label,
      minutes: bucket.minutes,
      count: bucket.count,
    }))
  }, [history, granularity, offset])

  const maxMinutes = Math.max(1, ...bars.map((bar) => bar.minutes))

  const switchGranularity = (next) => {
    setGranularity(next)
    setOffset(0)
  }

  return (
    <section className="focus-trend">
      <div className="focus-trend__controls">
        <div className="focus-trend__granularity">
          <button
            type="button"
            className={granularity === 'week' ? 'focus-trend__tab focus-trend__tab--active' : 'focus-trend__tab'}
            onClick={() => switchGranularity('week')}
          >
            週
          </button>
          <button
            type="button"
            className={granularity === 'month' ? 'focus-trend__tab focus-trend__tab--active' : 'focus-trend__tab'}
            onClick={() => switchGranularity('month')}
          >
            月
          </button>
        </div>
        <button type="button" onClick={() => setOffset((o) => o + 12)}>
          看更早
        </button>
        <button type="button" disabled={offset === 0} onClick={() => setOffset((o) => Math.max(0, o - 12))}>
          看更近
        </button>
      </div>

      <div className="focus-trend__bars">
        {bars.map((bar) => (
          <div className="focus-trend__bar-column" key={bar.key} title={`${bar.label}：${bar.minutes} 分鐘 / ${bar.count} 次`}>
            <div
              data-testid="focus-trend-bar"
              className="focus-trend__bar"
              style={{ height: `${Math.round((bar.minutes / maxMinutes) * 100)}%` }}
            />
            <span className="focus-trend__bar-label">{bar.label.slice(5)}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
