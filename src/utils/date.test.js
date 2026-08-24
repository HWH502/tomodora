import { describe, expect, it } from 'vitest'
import { todayDateString, addDays, parseDateString, startOfWeekMonday } from './date'

describe('todayDateString', () => {
  it('formats a given date as YYYY-MM-DD with zero padding', () => {
    expect(todayDateString(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('defaults to the current date when no argument is given', () => {
    const now = new Date()
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    expect(todayDateString()).toBe(expected)
  })
})

describe('parseDateString', () => {
  it('parses a YYYY-MM-DD string into a local-midnight Date', () => {
    const date = parseDateString('2026-08-24')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(7)
    expect(date.getDate()).toBe(24)
    expect(date.getHours()).toBe(0)
  })
})

describe('addDays', () => {
  it('returns a new Date shifted forward by the given number of days', () => {
    const base = new Date(2026, 7, 24)
    const result = addDays(base, 3)
    expect(result.getDate()).toBe(27)
    expect(base.getDate()).toBe(24) // original untouched
  })

  it('supports negative deltas', () => {
    const result = addDays(new Date(2026, 7, 1), -1)
    expect(result.getMonth()).toBe(6)
    expect(result.getDate()).toBe(31)
  })
})

describe('startOfWeekMonday', () => {
  it('returns the same date when given a Monday', () => {
    // 2026-08-24 is a Monday
    const result = startOfWeekMonday(new Date(2026, 7, 24))
    expect(result.getDate()).toBe(24)
  })

  it('rolls back to Monday when given a Wednesday', () => {
    const result = startOfWeekMonday(new Date(2026, 7, 26))
    expect(result.getDate()).toBe(24)
  })

  it('rolls back to Monday when given a Sunday', () => {
    const result = startOfWeekMonday(new Date(2026, 7, 30))
    expect(result.getDate()).toBe(24)
  })
})
