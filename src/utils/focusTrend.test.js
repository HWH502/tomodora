import { describe, expect, it } from 'vitest'
import { getMonthlyTotals, getWeeklyTotals } from './focusTrend'

function historyWith(entries) {
  return { version: 1, days: entries }
}

describe('getWeeklyTotals', () => {
  it('sums minutes and counts within each Monday-start week', () => {
    // 2026-08-24 is a Monday; week is 2026-08-24..2026-08-30
    const history = historyWith({
      '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null },
      '2026-08-26': { count: 2, minutes: 50, growthMilestoneStageKey: null },
      '2026-08-31': { count: 1, minutes: 10, growthMilestoneStageKey: null }, // next week, excluded
    })
    const [week] = getWeeklyTotals(history, { weeksBack: 1, endDate: new Date(2026, 7, 24) })
    expect(week).toEqual({ weekStart: '2026-08-24', weekEnd: '2026-08-30', minutes: 75, count: 3 })
  })

  it('returns weeksBack entries ordered oldest first', () => {
    const weeks = getWeeklyTotals(historyWith({}), { weeksBack: 3, endDate: new Date(2026, 7, 24) })
    expect(weeks.length).toBe(3)
    expect(weeks.map((w) => w.weekStart)).toEqual(['2026-08-10', '2026-08-17', '2026-08-24'])
  })

  it('offsetWeeks shifts the whole window further into the past', () => {
    const weeks = getWeeklyTotals(historyWith({}), { weeksBack: 1, offsetWeeks: 2, endDate: new Date(2026, 7, 24) })
    expect(weeks[0].weekStart).toBe('2026-08-10')
  })

  it('correctly buckets a week that crosses the Dec/Jan year boundary', () => {
    // endDate is early Jan 2026; offsetWeeks pushes the window back into Dec 2025
    const [week] = getWeeklyTotals(historyWith({}), { weeksBack: 1, offsetWeeks: 1, endDate: new Date(2026, 0, 5) })
    // 2026-01-05 is a Monday; startOfWeekMonday keeps it as-is; offsetWeeks:1 shifts back 7 days to 2025-12-29
    expect(week.weekStart).toBe('2025-12-29')
    expect(week.weekEnd).toBe('2026-01-04')
  })
})

describe('getMonthlyTotals', () => {
  it('sums minutes and counts within each calendar month', () => {
    const history = historyWith({
      '2026-08-01': { count: 1, minutes: 25, growthMilestoneStageKey: null },
      '2026-08-31': { count: 1, minutes: 15, growthMilestoneStageKey: null },
      '2026-09-01': { count: 1, minutes: 99, growthMilestoneStageKey: null }, // next month, excluded
    })
    const [month] = getMonthlyTotals(history, { monthsBack: 1, endDate: new Date(2026, 7, 24) })
    expect(month).toEqual({ year: 2026, month: 8, label: '2026-08', minutes: 40, count: 2 })
  })

  it('returns monthsBack entries ordered oldest first', () => {
    const months = getMonthlyTotals(historyWith({}), { monthsBack: 3, endDate: new Date(2026, 7, 24) })
    expect(months.map((m) => m.label)).toEqual(['2026-06', '2026-07', '2026-08'])
  })

  it('offsetMonths shifts the whole window further into the past', () => {
    const months = getMonthlyTotals(historyWith({}), { monthsBack: 1, offsetMonths: 2, endDate: new Date(2026, 7, 24) })
    expect(months[0].label).toBe('2026-06')
  })

  it('correctly buckets a month that crosses the Dec/Jan year boundary', () => {
    const history = historyWith({
      '2025-12-15': { count: 1, minutes: 30, growthMilestoneStageKey: null },
    })
    const [month] = getMonthlyTotals(history, { monthsBack: 1, offsetMonths: 1, endDate: new Date(2026, 0, 5) })
    expect(month).toEqual({ year: 2025, month: 12, label: '2025-12', minutes: 30, count: 1 })
  })
})
