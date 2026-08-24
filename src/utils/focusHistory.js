const FOCUS_HISTORY_KEY = 'pomodoro.focusHistory'
const RETENTION_DAYS = 90

function defaultFocusHistory() {
  return { version: 1, days: {} }
}

export function getFocusHistory() {
  try {
    const raw = localStorage.getItem(FOCUS_HISTORY_KEY)
    if (!raw) return defaultFocusHistory()
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || typeof parsed.days !== 'object') {
      return defaultFocusHistory()
    }
    return { version: 1, days: parsed.days }
  } catch {
    return defaultFocusHistory()
  }
}

function pruneToRecentDays(history, days = RETENTION_DAYS) {
  const sortedDates = Object.keys(history.days).sort() // 'YYYY-MM-DD' sorts chronologically as a string
  const keep = new Set(sortedDates.slice(-days))
  const prunedDays = {}
  keep.forEach((dateString) => {
    prunedDays[dateString] = history.days[dateString]
  })
  return { version: 1, days: prunedDays }
}

function saveFocusHistory(history) {
  try {
    localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(history))
    return { saved: true, trimmedTo90Days: false }
  } catch {
    const trimmed = pruneToRecentDays(history, RETENTION_DAYS)
    try {
      localStorage.setItem(FOCUS_HISTORY_KEY, JSON.stringify(trimmed))
      return { saved: true, trimmedTo90Days: true, history: trimmed }
    } catch {
      return { saved: false, trimmedTo90Days: false }
    }
  }
}

export function restoreFocusHistory(history) {
  saveFocusHistory(history)
}

export function recordFocusSession({ dateString, minutes, growthMilestoneStageKey = null }) {
  const history = getFocusHistory()
  const existing = history.days[dateString]
  const nextDayEntry = {
    count: (existing?.count ?? 0) + 1,
    minutes: (existing?.minutes ?? 0) + minutes,
    growthMilestoneStageKey: growthMilestoneStageKey ?? existing?.growthMilestoneStageKey ?? null,
  }
  const nextHistory = { version: 1, days: { ...history.days, [dateString]: nextDayEntry } }

  const result = saveFocusHistory(nextHistory)
  if (result.trimmedTo90Days) {
    return { history: result.history, trimmedTo90Days: true }
  }
  return { history: nextHistory, trimmedTo90Days: false }
}
