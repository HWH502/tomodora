import { describe, expect, it } from 'vitest'
import { getTodayMinutes, getThisWeekMinutes, getWeekOverWeekChange } from './focusSummary'

function historyWith(entries) {
  return { version: 1, days: entries }
}

describe('getTodayMinutes', () => {
  it('returns the minutes recorded for the given date', () => {
    const history = historyWith({ '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null } })
    expect(getTodayMinutes(history, new Date(2026, 7, 24))).toBe(25)
  })

  it('returns 0 when there is no entry for today', () => {
    expect(getTodayMinutes(historyWith({}), new Date(2026, 7, 24))).toBe(0)
  })
})

describe('getThisWeekMinutes', () => {
  it('sums minutes across the Monday-start week containing endDate', () => {
    // 2026-08-24 is a Monday; week is 2026-08-24..2026-08-30
    const history = historyWith({
      '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null },
      '2026-08-26': { count: 1, minutes: 50, growthMilestoneStageKey: null },
      '2026-08-31': { count: 1, minutes: 999, growthMilestoneStageKey: null }, // next week, excluded
    })
    expect(getThisWeekMinutes(history, new Date(2026, 7, 26))).toBe(75)
  })
})

describe('getWeekOverWeekChange', () => {
  it('returns the percent change from last week to this week, rounded to the nearest integer', () => {
    const history = historyWith({
      '2026-08-17': { count: 1, minutes: 100, growthMilestoneStageKey: null }, // last week
      '2026-08-24': { count: 1, minutes: 112, growthMilestoneStageKey: null }, // this week: +12%
    })
    expect(getWeekOverWeekChange(history, new Date(2026, 7, 26))).toBe(12)
  })

  it('returns a negative number when this week is lower than last week', () => {
    const history = historyWith({
      '2026-08-17': { count: 1, minutes: 100, growthMilestoneStageKey: null },
      '2026-08-24': { count: 1, minutes: 80, growthMilestoneStageKey: null },
    })
    expect(getWeekOverWeekChange(history, new Date(2026, 7, 26))).toBe(-20)
  })

  it('returns null when last week has no recorded minutes to compare against', () => {
    const history = historyWith({
      '2026-08-24': { count: 1, minutes: 50, growthMilestoneStageKey: null },
    })
    expect(getWeekOverWeekChange(history, new Date(2026, 7, 26))).toBeNull()
  })
})
