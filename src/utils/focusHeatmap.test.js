import { describe, expect, it } from 'vitest'
import { buildDayCell, buildHeatmapYear, maxMinutesInYear, mondayOnOrBefore, sundayOnOrAfter } from './focusHeatmap'
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

  it('computes color level relative to the max minutes within the displayed year, ignoring other years', () => {
    const history = {
      version: 1,
      days: {
        '2025-01-01': { count: 1, minutes: 400, growthMilestoneStageKey: null }, // an old outlier, outside 2026 - must not flatten 2026's scale
        '2026-03-01': { count: 1, minutes: 25, growthMilestoneStageKey: null }, // 25% of 2026's max -> level 1
        '2026-03-02': { count: 1, minutes: 50, growthMilestoneStageKey: null }, // 50% of 2026's max -> level 2
        '2026-03-03': { count: 1, minutes: 75, growthMilestoneStageKey: null }, // 75% of 2026's max -> level 3
        '2026-03-04': { count: 1, minutes: 100, growthMilestoneStageKey: null }, // 100% of 2026's max -> level 4
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

  it('scopes maxMinutes to the requested year even when another year has more data', () => {
    const history = {
      version: 1,
      days: {
        '2025-06-01': { count: 1, minutes: 400, growthMilestoneStageKey: null },
        '2025-06-02': { count: 1, minutes: 300, growthMilestoneStageKey: null },
      },
    }
    const { maxMinutes } = buildHeatmapYear({ year: 2026, history, currentPet: null, petMemorials: [] })
    expect(maxMinutes).toBe(0)
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

describe('mondayOnOrBefore', () => {
  it('returns the same date when it is already a Monday', () => {
    const monday = new Date(2026, 7, 24) // 2026-08-24 is a Monday
    expect(mondayOnOrBefore(monday).getDate()).toBe(24)
  })

  it('rolls back to the preceding Monday for any other weekday', () => {
    const wednesday = new Date(2026, 7, 26)
    const result = mondayOnOrBefore(wednesday)
    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(24)
  })

  it('rolls a Sunday back to the Monday six days earlier', () => {
    const sunday = new Date(2026, 7, 30)
    const result = mondayOnOrBefore(sunday)
    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(24)
  })
})

describe('sundayOnOrAfter', () => {
  it('returns the same date when it is already a Sunday', () => {
    const sunday = new Date(2026, 7, 30)
    expect(sundayOnOrAfter(sunday).getDate()).toBe(30)
  })

  it('rolls forward to the next Sunday for any other weekday', () => {
    const wednesday = new Date(2026, 7, 26)
    const result = sundayOnOrAfter(wednesday)
    expect(result.getDay()).toBe(0)
    expect(result.getDate()).toBe(30)
  })
})

describe('maxMinutesInYear', () => {
  it('finds the max minutes among days within the given year only', () => {
    const history = {
      version: 1,
      days: {
        '2025-06-01': { count: 1, minutes: 999, growthMilestoneStageKey: null },
        '2026-03-01': { count: 1, minutes: 40, growthMilestoneStageKey: null },
        '2026-03-02': { count: 1, minutes: 70, growthMilestoneStageKey: null },
      },
    }
    expect(maxMinutesInYear(history, 2026)).toBe(70)
  })

  it('returns 0 when there is no data for that year', () => {
    expect(maxMinutesInYear({ version: 1, days: {} }, 2026)).toBe(0)
  })
})

describe('buildDayCell', () => {
  it('builds a cell from a recorded day entry, scaling colorLevel against the given maxMinutes', () => {
    const history = { version: 1, days: { '2026-03-01': { count: 2, minutes: 50, growthMilestoneStageKey: 'growing' } } }
    const cell = buildDayCell('2026-03-01', { history, maxMinutes: 100, currentPet: null, petMemorials: [] })
    expect(cell).toEqual({
      date: '2026-03-01',
      minutes: 50,
      count: 2,
      colorLevel: 2,
      growthMilestoneStageKey: 'growing',
      generationIndex: null,
    })
  })

  it('builds a zeroed cell for a date with no history entry', () => {
    const cell = buildDayCell('2026-03-05', { history: { version: 1, days: {} }, maxMinutes: 100, currentPet: null, petMemorials: [] })
    expect(cell).toEqual({
      date: '2026-03-05',
      minutes: 0,
      count: 0,
      colorLevel: 0,
      growthMilestoneStageKey: null,
      generationIndex: null,
    })
  })

  it('resolves generationIndex from the current pet the same way buildHeatmapYear does', () => {
    const currentPet = { generation: 3, bornAt: '2026-01-01T00:00:00.000Z' }
    const cell = buildDayCell('2026-03-01', { history: { version: 1, days: {} }, maxMinutes: 0, currentPet, petMemorials: [] })
    expect(cell.generationIndex).toBe(3)
  })
})
