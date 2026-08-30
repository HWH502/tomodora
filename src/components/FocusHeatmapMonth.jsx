import { useMemo, useState } from 'react'
import { buildHeatmapMonth } from '../utils/focusHeatmapMonth'
import { useEdgeAwareTooltip } from '../hooks/useEdgeAwareTooltip'

const GROWTH_STAGE_LABELS = {
  young: '幼年',
  growing: '活潑成長期',
  capable: '稱職夥伴',
  trained: '訓練有成',
  senior: '資深老友',
  legend: '傳說',
}

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日']
const LEGEND_LEVELS = [0, 1, 2, 3, 4]

export default function FocusHeatmapMonth({ history, currentPet, petMemorials }) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { activeId: activeDate, activeAlign, showTooltip, hideTooltip, handleMouseEnter, handlePointerUp } =
    useEdgeAwareTooltip({ tooltipMaxWidth: 260 })

  const { weeks } = useMemo(
    () => buildHeatmapMonth({ year, month, history, currentPet, petMemorials }),
    [year, month, history, currentPet, petMemorials],
  )

  const goToPreviousMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1)
      setMonth(12)
    } else {
      setMonth((m) => m - 1)
    }
  }

  const goToNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1)
      setMonth(1)
    } else {
      setMonth((m) => m + 1)
    }
  }

  return (
    <section className="focus-heatmap-month">
      <div className="focus-heatmap-month__header">
        <button type="button" aria-label="上一月" onClick={goToPreviousMonth}>
          ‹
        </button>
        <p className="display focus-heatmap-month__title">
          {year} 年 {month} 月
        </p>
        <button type="button" aria-label="下一月" onClick={goToNextMonth}>
          ›
        </button>
      </div>

      <div className="focus-heatmap-month__weekday-row">
        {WEEKDAY_LABELS.map((label) => (
          <span className="focus-heatmap-month__weekday-label" key={label}>
            {label}
          </span>
        ))}
      </div>

      <div className="focus-heatmap-month__grid">
        {weeks.flat().map((cell, index) => {
          if (cell.date === null) {
            return <div key={`pad-${index}`} className="focus-heatmap-month__cell focus-heatmap-month__cell--empty" />
          }
          const isActive = activeDate === cell.date
          const tooltipId = `focus-heatmap-month-tooltip-${cell.date}`
          const dayNumber = Number(cell.date.slice(8, 10))

          return (
            <div
              key={cell.date}
              data-testid={`focus-heatmap-month-cell-${cell.date}`}
              className={`focus-heatmap-month__cell focus-heatmap-month__cell--level-${cell.colorLevel}${
                cell.generationIndex !== null ? ` focus-heatmap-month__cell--gen-${cell.generationIndex % 2}` : ''
              }`}
              tabIndex={0}
              aria-describedby={isActive ? tooltipId : undefined}
              onMouseEnter={(event) => handleMouseEnter(cell.date, event)}
              onMouseLeave={() => hideTooltip(cell.date)}
              onFocus={(event) => showTooltip(cell.date, event.currentTarget)}
              onBlur={() => hideTooltip(cell.date)}
              onPointerUp={(event) => handlePointerUp(cell.date, event)}
            >
              <span className="focus-heatmap-month__day-number">{dayNumber}</span>
              {cell.growthMilestoneStageKey && <span className="focus-heatmap-month__milestone-dot" aria-hidden="true" />}
              {isActive && (
                <span
                  id={tooltipId}
                  role="tooltip"
                  className={`focus-heatmap-month__tooltip focus-heatmap-month__tooltip--align-${activeAlign}`}
                >
                  {Number(cell.date.slice(5, 7))}/{dayNumber}｜完成 {cell.count} 個｜{cell.minutes} 分鐘
                  {cell.growthMilestoneStageKey && (
                    <> ｜這天長大到「{GROWTH_STAGE_LABELS[cell.growthMilestoneStageKey] ?? cell.growthMilestoneStageKey}」</>
                  )}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="focus-heatmap-month__legend">
        <span>少</span>
        {LEGEND_LEVELS.map((level) => (
          <span
            key={level}
            data-testid="focus-heatmap-month-legend-swatch"
            className={`focus-heatmap-month__cell focus-heatmap-month__legend-swatch${
              level > 0 ? ` focus-heatmap-month__cell--level-${level}` : ''
            }`}
          />
        ))}
        <span>多</span>
      </div>
    </section>
  )
}
