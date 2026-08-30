import { getWeeklyTotals } from './focusTrend'
import { todayDateString } from './date'

export function getTodayMinutes(history, endDate = new Date()) {
  const entry = history.days[todayDateString(endDate)]
  return entry?.minutes ?? 0
}

export function getThisWeekMinutes(history, endDate = new Date()) {
  return getWeeklyTotals(history, { weeksBack: 1, offsetWeeks: 0, endDate })[0].minutes
}

export function getWeekOverWeekChange(history, endDate = new Date()) {
  const thisWeek = getWeeklyTotals(history, { weeksBack: 1, offsetWeeks: 0, endDate })[0].minutes
  const lastWeek = getWeeklyTotals(history, { weeksBack: 1, offsetWeeks: 1, endDate })[0].minutes
  if (lastWeek <= 0) return null
  return Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
}
