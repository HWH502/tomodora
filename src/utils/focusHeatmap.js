import { todayDateString } from './date'

export function mondayOnOrBefore(date) {
  const weekday = date.getDay()
  const diff = weekday === 0 ? 6 : weekday - 1
  const result = new Date(date)
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function sundayOnOrAfter(date) {
  const weekday = date.getDay()
  const diff = weekday === 0 ? 0 : 7 - weekday
  const result = new Date(date)
  result.setDate(result.getDate() + diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function maxMinutesInYear(history, year) {
  const prefix = `${year}-`
  const values = Object.entries(history.days)
    .filter(([dateString]) => dateString.startsWith(prefix))
    .map(([, entry]) => entry.minutes)
  return values.length > 0 ? Math.max(...values) : 0
}

function colorLevelFor(minutes, maxMinutes) {
  if (minutes <= 0 || maxMinutes <= 0) return 0
  const ratio = minutes / maxMinutes
  if (ratio <= 0.25) return 1
  if (ratio <= 0.5) return 2
  if (ratio <= 0.75) return 3
  return 4
}

function generationIndexFor(dateString, currentPet, petMemorials) {
  if (currentPet && dateString >= todayDateString(new Date(currentPet.bornAt))) {
    return currentPet.generation
  }
  const match = petMemorials.find((memorial) => {
    const start = todayDateString(new Date(memorial.bornAt))
    const end = todayDateString(new Date(memorial.endedAt))
    return dateString >= start && dateString < end
  })
  return match ? match.generation : null
}

export function buildDayCell(dateString, { history, maxMinutes, currentPet, petMemorials }) {
  const entry = history.days[dateString]
  const minutes = entry?.minutes ?? 0
  return {
    date: dateString,
    minutes,
    count: entry?.count ?? 0,
    colorLevel: colorLevelFor(minutes, maxMinutes),
    growthMilestoneStageKey: entry?.growthMilestoneStageKey ?? null,
    generationIndex: generationIndexFor(dateString, currentPet, petMemorials),
  }
}

export function buildHeatmapYear({ year, history, currentPet, petMemorials }) {
  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  const gridStart = mondayOnOrBefore(jan1)
  const gridEnd = sundayOnOrAfter(dec31)
  const maxMinutes = maxMinutesInYear(history, year)

  const cells = []
  const cursor = new Date(gridStart)
  while (cursor <= gridEnd) {
    const inYear = cursor.getFullYear() === year
    if (!inYear) {
      cells.push({ date: null, minutes: 0, count: 0, colorLevel: 0, growthMilestoneStageKey: null, generationIndex: null })
    } else {
      cells.push(buildDayCell(todayDateString(cursor), { history, maxMinutes, currentPet, petMemorials }))
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }

  return { year, weeks, maxMinutes }
}
