import { describe, expect, it } from 'vitest'
import { buildHeatmapMonth } from './focusHeatmapMonth'

function emptyHistory() {
  return { version: 1, days: {} }
}

describe('buildHeatmapMonth', () => {
  it('pads the leading days of the month to align on a Monday-start week', () => {
    // 2026-02-01 is a Sunday, so the grid must start on Monday 2026-01-26
    // with 6 leading padding cells before Feb 1.
    const { weeks } = buildHeatmapMonth({ year: 2026, month: 2, history: emptyHistory(), currentPet: null, petMemorials: [] })
    const firstWeek = weeks[0]
    expect(firstWeek.slice(0, 6).every((cell) => cell.date === null)).toBe(true)
    expect(firstWeek[6].date).toBe('2026-02-01')
  })

  it('covers every calendar day of the target month exactly once, with no gaps', () => {
    const { weeks } = buildHeatmapMonth({ year: 2026, month: 2, history: emptyHistory(), currentPet: null, petMemorials: [] })
    const inMonthDates = weeks.flat().map((cell) => cell.date).filter(Boolean)
    expect(inMonthDates.length).toBe(28) // Feb 2026 is not a leap year
    expect(inMonthDates[0]).toBe('2026-02-01')
    expect(inMonthDates[inMonthDates.length - 1]).toBe('2026-02-28')
  })

  it('every row is exactly 7 cells wide', () => {
    const { weeks } = buildHeatmapMonth({ year: 2026, month: 2, history: emptyHistory(), currentPet: null, petMemorials: [] })
    weeks.forEach((week) => expect(week.length).toBe(7))
  })

  it('produces a 6-row grid for a month that needs one (August 2026 starts on a Saturday)', () => {
    const { weeks } = buildHeatmapMonth({ year: 2026, month: 8, history: emptyHistory(), currentPet: null, petMemorials: [] })
    expect(weeks.length).toBe(6)
    const inMonthDates = weeks.flat().map((cell) => cell.date).filter(Boolean)
    expect(inMonthDates.length).toBe(31)
  })

  it('scales colorLevel against the whole year\'s max, not just this month\'s max', () => {
    const history = {
      version: 1,
      days: {
        '2026-06-01': { count: 1, minutes: 100, growthMilestoneStageKey: null }, // this year's max, in a different month
        '2026-02-01': { count: 1, minutes: 25, growthMilestoneStageKey: null }, // 25% of the year's max -> level 1
      },
    }
    const { weeks, maxMinutes } = buildHeatmapMonth({ year: 2026, month: 2, history, currentPet: null, petMemorials: [] })
    expect(maxMinutes).toBe(100)
    const feb1 = weeks.flat().find((cell) => cell.date === '2026-02-01')
    expect(feb1.colorLevel).toBe(1)
  })

  it('carries the growth milestone stage key and generation index the same way the year view does', () => {
    const currentPet = { generation: 2, bornAt: '2026-01-01T00:00:00.000Z' }
    const history = { version: 1, days: { '2026-02-10': { count: 1, minutes: 10, growthMilestoneStageKey: 'growing' } } }
    const { weeks } = buildHeatmapMonth({ year: 2026, month: 2, history, currentPet, petMemorials: [] })
    const cell = weeks.flat().find((c) => c.date === '2026-02-10')
    expect(cell.growthMilestoneStageKey).toBe('growing')
    expect(cell.generationIndex).toBe(2)
  })
})
