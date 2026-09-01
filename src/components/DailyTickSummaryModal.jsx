import { EVENT_LABELS } from '../utils/petNeeds'
import { getShopItem } from '../utils/shopItems'

const NEED_LABELS = { hunger: '飽食度', cleanliness: '潔淨度', health: '健康度', affection: '好感度' }

const DEPARTED_MESSAGES = {
  affection: '寵物因為好感度太低，離家出走了。可以到紀念牆查看牠的紀錄。',
  health: '寵物因為健康狀況惡化而離開了。可以到紀念牆查看牠的紀錄。',
}

function formatDelta(value) {
  return value > 0 ? `+${value}` : `${value}`
}

export default function DailyTickSummaryModal({ summary, onClose }) {
  if (!summary) return null

  const changedDeltas = summary.type === 'tick'
    ? Object.entries(summary.deltas).filter(([, value]) => value !== 0)
    : []

  return (
    <div className="daily-tick-summary-modal__overlay">
      <div className="daily-tick-summary-modal__panel">
        <h2 className="daily-tick-summary-modal__title">歡迎回來！</h2>

        {summary.type === 'departed' ? (
          <p className="daily-tick-summary-modal__departed">{DEPARTED_MESSAGES[summary.reason]}</p>
        ) : (
          <>
            <p className="daily-tick-summary-modal__intro">你上次離開期間，寵物的狀態發生了這些變化：</p>
            <ul className="daily-tick-summary-modal__deltas">
              {changedDeltas.length > 0
                ? changedDeltas.map(([key, value]) => (
                    <li key={key}>{NEED_LABELS[key]} {formatDelta(value)}</li>
                  ))
                : <li>沒有明顯變化</li>}
            </ul>
            {summary.consumed.length > 0 && (
              <p className="daily-tick-summary-modal__consumed">
                消耗了{summary.consumed
                  .map((entry) => `${getShopItem(entry.itemId)?.name ?? entry.itemId} x${entry.count}`)
                  .join('、')}
              </p>
            )}
            {summary.events.length > 0 && (
              <ul className="daily-tick-summary-modal__events">
                {summary.events.map((eventId, index) => (
                  <li key={`${eventId}-${index}`}>發生事件：{EVENT_LABELS[eventId] ?? eventId}</li>
                ))}
              </ul>
            )}
          </>
        )}

        <button type="button" className="daily-tick-summary-modal__close" onClick={onClose}>
          知道了
        </button>
      </div>
    </div>
  )
}
