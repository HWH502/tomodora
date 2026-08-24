import { describe, expect, it } from 'vitest'
import { buildHeatmapYear } from './focusHeatmap'
import { todayDateString } from './date'

function emptyHistory() {
  return { version: 1, days: {} }
}

describe('buildHeatmapYear', () => {
  it('returns a 53-week by 7-day grid for a normal year', () => {
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet: null, petMemorials: [] })
    expect(weeks.length).toBe(53)
    weeks.forEach((week) => expect(week.length).toBe(7))
  })

  it('returns a 54-week grid for a leap year starting on a Sunday, without dropping any day', () => {
    // 2012-01-01 is a Sunday and 2012 is a leap year — the Monday-before to Sunday-after span is 54 weeks.
    const { weeks } = buildHeatmapYear({ year: 2012, history: emptyHistory(), currentPet: null, petMemorials: [] })
    expect(weeks.length).toBe(54)
    weeks.forEach((week) => expect(week.length).toBe(7))
    const inYearDates = weeks.flat().map((cell) => cell.date).filter(Boolean)
    expect(inYearDates.length).toBe(366) // 2012 is a leap year
    expect(inYearDates).toContain('2012-12-31') // the day the earlier fixed-53 draft silently dropped
  })

  it('marks cells outside the target year as date: null with zeroed fields', () => {
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet: null, petMemorials: [] })
    const firstCell = weeks[0][0]
    if (firstCell.date === null) {
      expect(firstCell).toEqual({
        date: null,
        minutes: 0,
        count: 0,
        colorLevel: 0,
        growthMilestoneStageKey: null,
        generationIndex: null,
      })
    }
  })

  it('places every in-year date at the row index matching its Monday-start weekday', () => {
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet: null, petMemorials: [] })
    weeks.forEach((week) => {
      week.forEach((cell, index) => {
        if (!cell.date) return
        const [y, m, d] = cell.date.split('-').map(Number)
        const weekday = new Date(y, m - 1, d).getDay() // 0=Sun..6=Sat
        const mondayIndex = weekday === 0 ? 6 : weekday - 1
        expect(index).toBe(mondayIndex)
      })
    })
  })

  it('covers every calendar day of the target year exactly once', () => {
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet: null, petMemorials: [] })
    const inYearDates = weeks.flat().map((cell) => cell.date).filter(Boolean)
    expect(inYearDates.length).toBe(365) // 2026 is not a leap year
    expect(new Set(inYearDates).size).toBe(365)
  })

  it('computes color level relative to the all-time max minutes across the whole history, not just the year', () => {
    const history = {
      version: 1,
      days: {
        '2025-01-01': { count: 1, minutes: 100, growthMilestoneStageKey: null }, // sets the all-time max, outside 2026
        '2026-03-01': { count: 1, minutes: 25, growthMilestoneStageKey: null }, // 25% of max -> level 1
        '2026-03-02': { count: 1, minutes: 50, growthMilestoneStageKey: null }, // 50% of max -> level 2
        '2026-03-03': { count: 1, minutes: 75, growthMilestoneStageKey: null }, // 75% of max -> level 3
        '2026-03-04': { count: 1, minutes: 100, growthMilestoneStageKey: null }, // 100% of max -> level 4
      },
    }
    const { weeks, maxMinutes } = buildHeatmapYear({ year: 2026, history, currentPet: null, petMemorials: [] })
    expect(maxMinutes).toBe(100)
    const byDate = Object.fromEntries(weeks.flat().filter((c) => c.date).map((c) => [c.date, c]))
    expect(byDate['2026-03-01'].colorLevel).toBe(1)
    expect(byDate['2026-03-02'].colorLevel).toBe(2)
    expect(byDate['2026-03-03'].colorLevel).toBe(3)
    expect(byDate['2026-03-04'].colorLevel).toBe(4)
    expect(byDate['2026-03-05'].colorLevel).toBe(0) // no entry -> level 0
  })

  it('carries the growth milestone stage key from the day entry', () => {
    const history = { version: 1, days: { '2026-03-01': { count: 1, minutes: 10, growthMilestoneStageKey: 'growing' } } }
    const { weeks } = buildHeatmapYear({ year: 2026, history, currentPet: null, petMemorials: [] })
    const cell = weeks.flat().find((c) => c.date === '2026-03-01')
    expect(cell.growthMilestoneStageKey).toBe('growing')
  })

  it('assigns generationIndex from the current pet when the date is on/after its bornAt', () => {
    const currentPet = { generation: 2, bornAt: '2026-03-01T00:00:00.000Z' }
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet, petMemorials: [] })
    const byDate = Object.fromEntries(weeks.flat().filter((c) => c.date).map((c) => [c.date, c]))
    expect(byDate['2026-02-28'].generationIndex).toBeNull()
    expect(byDate['2026-03-01'].generationIndex).toBe(2)
    expect(byDate['2026-06-01'].generationIndex).toBe(2)
  })

  it('gives a day with real recorded pomodoros a non-zero colorLevel (regression: green fill not showing)', () => {
    const todayString = todayDateString(new Date())
    const year = Number(todayString.slice(0, 4))
    const history = {
      version: 1,
      days: { [todayString]: { count: 1, minutes: 25, growthMilestoneStageKey: null } },
    }
    const { weeks } = buildHeatmapYear({ year, history, currentPet: null, petMemorials: [] })
    const cell = weeks.flat().find((c) => c.date === todayString)
    expect(cell).toBeDefined()
    expect(cell.colorLevel).toBeGreaterThan(0)
  })

  it('assigns generationIndex from a past generation in petMemorials for its date range', () => {
    const petMemorials = [
      { generation: 1, bornAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-02-01T00:00:00.000Z' },
    ]
    const currentPet = { generation: 2, bornAt: '2026-02-01T00:00:00.000Z' }
    const { weeks } = buildHeatmapYear({ year: 2026, history: emptyHistory(), currentPet, petMemorials })
    const byDate = Object.fromEntries(weeks.flat().filter((c) => c.date).map((c) => [c.date, c]))
    expect(byDate['2026-01-15'].generationIndex).toBe(1)
    expect(byDate['2026-02-01'].generationIndex).toBe(2)
  })
})
