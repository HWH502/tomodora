import { buildDayCell, maxMinutesInYear, mondayOnOrBefore, sundayOnOrAfter } from './focusHeatmap'
import { todayDateString } from './date'

export function buildHeatmapMonth({ year, month, history, currentPet, petMemorials }) {
  const firstOfMonth = new Date(year, month - 1, 1)
  const lastOfMonth = new Date(year, month, 0)
  const gridStart = mondayOnOrBefore(firstOfMonth)
  const gridEnd = sundayOnOrAfter(lastOfMonth)
  const maxMinutes = maxMinutesInYear(history, year)

  const weeks = []
  let currentWeek = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const inMonth = cursor.getFullYear() === year && cursor.getMonth() === month - 1
    if (!inMonth) {
      currentWeek.push({ date: null, minutes: 0, count: 0, colorLevel: 0, growthMilestoneStageKey: null, generationIndex: null })
    } else {
      currentWeek.push(buildDayCell(todayDateString(cursor), { history, maxMinutes, currentPet, petMemorials }))
    }
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return { year, month, weeks, maxMinutes }
}
