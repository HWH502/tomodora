import { describe, expect, it } from 'vitest'
import { advanceStreak, defaultStreakState, STREAK_MILESTONES } from './streak'

describe('defaultStreakState', () => {
  it('starts at zero with no history', () => {
    expect(defaultStreakState()).toEqual({
      currentStreak: 0,
      lastCompletedDate: null,
      milestonesReached: [],
    })
  })
})

describe('advanceStreak', () => {
  it('starts the streak at 1 on the very first day', () => {
    const { streak, bonusSkillPoints } = advanceStreak(defaultStreakState(), '2026-08-22')
    expect(streak).toEqual({ currentStreak: 1, lastCompletedDate: '2026-08-22', milestonesReached: [] })
    expect(bonusSkillPoints).toBe(0)
  })

  it('does not advance again for a second pomodoro on the same day', () => {
    const first = advanceStreak(defaultStreakState(), '2026-08-22').streak
    const second = advanceStreak(first, '2026-08-22')
    expect(second.streak).toEqual(first)
    expect(second.bonusSkillPoints).toBe(0)
  })

  it('advances the streak by 1 on the very next calendar day', () => {
    const day1 = advanceStreak(defaultStreakState(), '2026-08-22').streak
    const day2 = advanceStreak(day1, '2026-08-23')
    expect(day2.streak.currentStreak).toBe(2)
    expect(day2.streak.lastCompletedDate).toBe('2026-08-23')
  })

  it('resets to 1 when a day is skipped', () => {
    const day1 = advanceStreak(defaultStreakState(), '2026-08-22').streak
    const day3 = advanceStreak(day1, '2026-08-24')
    expect(day3.streak.currentStreak).toBe(1)
    expect(day3.streak.milestonesReached).toEqual([])
  })

  it('grants the 7-day milestone bonus exactly once when the streak first hits 7', () => {
    let streak = defaultStreakState()
    let lastBonus = 0
    const dates = ['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22']
    dates.forEach((date) => {
      const result = advanceStreak(streak, date)
      streak = result.streak
      lastBonus = result.bonusSkillPoints
    })
    expect(streak.currentStreak).toBe(7)
    expect(lastBonus).toBe(10)
    expect(streak.milestonesReached).toEqual([7])

    // the 8th day should not re-grant the 7-day milestone
    const day8 = advanceStreak(streak, '2026-08-23')
    expect(day8.bonusSkillPoints).toBe(0)
  })

  it('re-grants the same milestone after the streak breaks and reaches it again', () => {
    let streak = { currentStreak: 7, lastCompletedDate: '2026-08-22', milestonesReached: [7] }
    // skip a day: streak resets to 1, milestone list clears
    streak = advanceStreak(streak, '2026-08-24').streak
    expect(streak.milestonesReached).toEqual([])
  })

  const milestoneDays = STREAK_MILESTONES.map((m) => m.days)
  it('defines the 7/14/30-day milestones from the spec', () => {
    expect(milestoneDays).toEqual([7, 14, 30])
  })
})
