import { useMemo, useRef, useState } from 'react'
import { buildHeatmapYear } from '../utils/focusHeatmap'

const GROWTH_STAGE_LABELS = {
  young: '幼年',
  growing: '活潑成長期',
  capable: '稱職夥伴',
  trained: '訓練有成',
  senior: '資深老友',
  legend: '傳說',
}

// Some touch browsers replay a synthetic mouseenter after a tap for legacy
// :hover compatibility. Without this guard that replay could immediately
// reopen a tooltip a tap had just closed. Any real mouseenter within this
// window of a touch tap is treated as that replay and ignored.
const TOUCH_HOVER_SUPPRESS_MS = 500

// Row index 0 is Monday (weeks are built Monday-first, see buildHeatmapYear).
// Only every-other-day labels are shown, matching the sparse GitHub reference.
const WEEKDAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

// Indexed by month number (1-12), matching GitHub's English month abbreviations.
const MONTH_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const LEGEND_LEVELS = [0, 1, 2, 3, 4]

export default function FocusHeatmap({
  history, currentPet, petMemorials, year, onPrevYear = () => {}, onNextYear = () => {},
}) {
  const [activeDate, setActiveDate] = useState(null)
  const suppressHoverUntilRef = useRef(0)

  const { weeks } = useMemo(
    () => buildHeatmapYear({ year, history, currentPet, petMemorials }),
    [year, history, currentPet, petMemorials],
  )

  // One label per calendar month, shown above the week-column where that
  // month first appears (mirrors GitHub's contribution graph convention).
  // A month's 1st can fall anywhere within a Monday-first week (e.g. on a
  // Sunday it's the LAST cell), so check every cell for day-of-month === 1
  // rather than only the week's first cell — otherwise the label lands one
  // column late whenever a month starts on a Sunday.
  const monthLabels = useMemo(() => {
    let lastLabeledMonth = null
    return weeks.map((week) => {
      const firstOfMonthCell = week.find((cell) => cell.date !== null && Number(cell.date.slice(8, 10)) === 1)
      if (firstOfMonthCell) {
        const month = Number(firstOfMonthCell.date.slice(5, 7))
        lastLabeledMonth = month
        return month
      }
      const firstCell = week.find((cell) => cell.date !== null)
      if (!firstCell) return null
      const month = Number(firstCell.date.slice(5, 7))
      if (month === lastLabeledMonth) return null
      lastLabeledMonth = month
      return month
    })
  }, [weeks])

  const showTooltip = (date) => setActiveDate(date)
  const hideTooltip = (date) => setActiveDate((current) => (current === date ? null : current))
  const toggleTooltip = (date) => setActiveDate((current) => (current === date ? null : date))

  const handleMouseEnter = (date) => {
    if (!date) return
    if (Date.now() < suppressHoverUntilRef.current) return
    showTooltip(date)
  }

  // Mouse clicks and keyboard activation both fire onClick right after
  // onMouseEnter/onFocus already opened the tooltip, so a plain onClick
  // toggle would close it again in the same interaction. Touch taps are
  // the only pointer type with no reliable hover/focus-before-click step,
  // so only they should drive the toggle.
  const handlePointerUp = (date, event) => {
    if (!date) return
    if (event.pointerType === 'touch') {
      suppressHoverUntilRef.current = Date.now() + TOUCH_HOVER_SUPPRESS_MS
      toggleTooltip(date)
    }
  }

  return (
    <section className="focus-heatmap">
      <div className="focus-heatmap__header">
        <p className="display focus-heatmap__title">熱力圖</p>
        <div className="focus-stats-page__year-nav">
          <button type="button" aria-label="上一年" className="focus-pager-btn" onClick={onPrevYear}>
            ‹
          </button>
          <span className="focus-stats-page__year-label">{year}</span>
          <button type="button" aria-label="下一年" className="focus-pager-btn" onClick={onNextYear}>
            ›
          </button>
        </div>
      </div>

      <div className="focus-heatmap__month-row">
        <div className="focus-heatmap__weekday-gutter-spacer" aria-hidden="true" />
        <div className="focus-heatmap__month-labels">
          {monthLabels.map((month, weekIndex) => (
            <span className="focus-heatmap__month-label" key={weekIndex}>
              {month !== null ? MONTH_LABELS[month] : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="focus-heatmap__grid-row">
        <div className="focus-heatmap__weekday-gutter" aria-hidden="true">
          {WEEKDAY_LABELS.map((label, index) => (
            <span className="focus-heatmap__weekday-label" key={index}>
              {label}
            </span>
          ))}
        </div>

        <div className="focus-heatmap__grid">
        {weeks.map((week, weekIndex) => (
          <div className="focus-heatmap__week" key={weekIndex}>
            {week.map((cell, dayIndex) => {
              const key = cell.date ?? `pad-${weekIndex}-${dayIndex}`
              const isActive = activeDate === cell.date && cell.date !== null
              const tooltipId = cell.date ? `focus-heatmap-tooltip-${cell.date}` : undefined

              return (
                <div key={key} className="focus-heatmap__cell-wrapper">
                  <button
                    type="button"
                    data-testid={cell.date ? `focus-heatmap-cell-${cell.date}` : 'focus-heatmap-cell'}
                    className={`focus-heatmap__cell focus-heatmap__cell--level-${cell.colorLevel}${
                      cell.generationIndex !== null ? ` focus-heatmap__cell--gen-${cell.generationIndex % 2}` : ''
                    }${cell.date === null ? ' focus-heatmap__cell--empty' : ''}`}
                    disabled={cell.date === null}
                    aria-describedby={isActive ? tooltipId : undefined}
                    onMouseEnter={() => handleMouseEnter(cell.date)}
                    onMouseLeave={() => hideTooltip(cell.date)}
                    onFocus={() => cell.date && showTooltip(cell.date)}
                    onBlur={() => hideTooltip(cell.date)}
                    onPointerUp={(event) => handlePointerUp(cell.date, event)}
                  />
                  {cell.growthMilestoneStageKey && <span className="focus-heatmap__milestone-dot" aria-hidden="true" />}
                  {isActive && (
                    <span id={tooltipId} role="tooltip" className="focus-heatmap__tooltip">
                      {Number(cell.date.slice(5, 7))}/{Number(cell.date.slice(8, 10))}｜完成 {cell.count} 個｜{cell.minutes} 分鐘
                      {cell.growthMilestoneStageKey && (
                        <> ｜這天長大到「{GROWTH_STAGE_LABELS[cell.growthMilestoneStageKey] ?? cell.growthMilestoneStageKey}」</>
                      )}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        </div>
      </div>

      <div className="focus-heatmap__legend">
        <span>Less</span>
        {LEGEND_LEVELS.map((level) => (
          <span
            key={level}
            data-testid="focus-heatmap-legend-swatch"
            className={`focus-heatmap__cell focus-heatmap__legend-swatch${level > 0 ? ` focus-heatmap__cell--level-${level}` : ''}`}
          />
        ))}
        <span>More</span>
      </div>
    </section>
  )
}
