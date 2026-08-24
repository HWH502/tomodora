import { addDays, startOfWeekMonday, todayDateString } from './date'

export function getWeeklyTotals(history, { weeksBack = 12, offsetWeeks = 0, endDate = new Date() } = {}) {
  const currentWeekStart = addDays(startOfWeekMonday(endDate), -offsetWeeks * 7)

  const results = []
  for (let i = weeksBack - 1; i >= 0; i -= 1) {
    const weekStart = addDays(currentWeekStart, -i * 7)
    const weekEnd = addDays(weekStart, 6)

    let minutes = 0
    let count = 0
    let cursor = weekStart
    while (cursor <= weekEnd) {
      const entry = history.days[todayDateString(cursor)]
      if (entry) {
        minutes += entry.minutes
        count += entry.count
      }
      cursor = addDays(cursor, 1)
    }

    results.push({ weekStart: todayDateString(weekStart), weekEnd: todayDateString(weekEnd), minutes, count })
  }
  return results
}

export function getMonthlyTotals(history, { monthsBack = 12, offsetMonths = 0, endDate = new Date() } = {}) {
  const anchorYear = endDate.getFullYear()
  const anchorMonth = endDate.getMonth() - offsetMonths // 0-indexed

  const results = []
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const target = new Date(anchorYear, anchorMonth - i, 1)
    const year = target.getFullYear()
    const month0 = target.getMonth()
    const label = `${year}-${String(month0 + 1).padStart(2, '0')}`

    let minutes = 0
    let count = 0
    Object.entries(history.days).forEach(([dateString, entry]) => {
      const [entryYear, entryMonth] = dateString.split('-').map(Number)
      if (entryYear === year && entryMonth === month0 + 1) {
        minutes += entry.minutes
        count += entry.count
      }
    })

    results.push({ year, month: month0 + 1, label, minutes, count })
  }
  return results
}
