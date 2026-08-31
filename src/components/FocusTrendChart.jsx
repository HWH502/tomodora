import { useMemo, useRef, useState } from 'react'
import { getMonthlyTotals, getWeeklyTotals } from '../utils/focusTrend'

const PAGE_SIZE = 12

// Some touch browsers replay a synthetic mouseenter after a tap for legacy
// :hover compatibility. Without this guard that replay could immediately
// reopen a tooltip a tap had just closed. Any real mouseenter within this
// window of a touch tap is treated as that replay and ignored.
const TOUCH_HOVER_SUPPRESS_MS = 500

export default function FocusTrendChart({ history }) {
  const [granularity, setGranularity] = useState('week')
  const [offset, setOffset] = useState(0)
  const [activeKey, setActiveKey] = useState(null)
  const suppressHoverUntilRef = useRef(0)

  const bars = useMemo(() => {
    if (granularity === 'week') {
      return getWeeklyTotals(history, { weeksBack: PAGE_SIZE, offsetWeeks: offset }).map((bucket) => ({
        key: bucket.weekStart,
        label: bucket.weekStart,
        minutes: bucket.minutes,
        count: bucket.count,
        month: Number(bucket.weekStart.slice(5, 7)),
      }))
    }
    return getMonthlyTotals(history, { monthsBack: PAGE_SIZE, offsetMonths: offset }).map((bucket) => ({
      key: bucket.label,
      label: bucket.label,
      minutes: bucket.minutes,
      count: bucket.count,
      month: bucket.month,
    }))
  }, [history, granularity, offset])

  const maxMinutes = Math.max(1, ...bars.map((bar) => bar.minutes))
  const rangeLabel =
    bars.length > 0
      ? bars[0].month === bars[bars.length - 1].month
        ? `${bars[0].month}月`
        : `${bars[0].month}月 - ${bars[bars.length - 1].month}月`
      : ''

  const switchGranularity = (next) => {
    setGranularity(next)
    setOffset(0)
  }

  const showTooltip = (key) => setActiveKey(key)
  const hideTooltip = (key) => setActiveKey((current) => (current === key ? null : current))
  const toggleTooltip = (key) => setActiveKey((current) => (current === key ? null : key))

  const handleMouseEnter = (key) => {
    if (Date.now() < suppressHoverUntilRef.current) return
    showTooltip(key)
  }

  const handlePointerUp = (key, event) => {
    if (event.pointerType === 'touch') {
      suppressHoverUntilRef.current = Date.now() + TOUCH_HOVER_SUPPRESS_MS
      toggleTooltip(key)
    }
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

        <div className="focus-trend__pager">
          <button type="button" aria-label="上一頁" className="focus-pager-btn" onClick={() => setOffset((o) => o + PAGE_SIZE)}>
            ‹
          </button>
          <span data-testid="focus-trend-range-label" className="focus-trend__range-label">
            {rangeLabel}
          </span>
          <button
            type="button"
            aria-label="下一頁"
            className="focus-pager-btn"
            disabled={offset === 0}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            ›
          </button>
        </div>
      </div>

      <div className="focus-trend__bars">
        {bars.map((bar) => {
          const isActive = activeKey === bar.key
          const tooltipId = `focus-trend-tooltip-${bar.key}`
          return (
            <div
              className="focus-trend__bar-column"
              key={bar.key}
              data-testid="focus-trend-bar-column"
              tabIndex={0}
              aria-describedby={isActive ? tooltipId : undefined}
              onMouseEnter={() => handleMouseEnter(bar.key)}
              onMouseLeave={() => hideTooltip(bar.key)}
              onFocus={() => showTooltip(bar.key)}
              onBlur={() => hideTooltip(bar.key)}
              onPointerUp={(event) => handlePointerUp(bar.key, event)}
            >
              <div
                data-testid="focus-trend-bar"
                className="focus-trend__bar"
                style={{ height: `${Math.round((bar.minutes / maxMinutes) * 100)}%` }}
              />
              <span className="focus-trend__bar-label">{bar.label.slice(5)}</span>
              {isActive && (
                <span id={tooltipId} role="tooltip" className="focus-trend__tooltip">
                  {bar.label}｜{bar.minutes} 分鐘｜{bar.count} 次
                </span>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
