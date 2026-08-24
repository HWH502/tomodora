import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getFocusHistory, recordFocusSession, restoreFocusHistory } from './focusHistory'

describe('getFocusHistory', () => {
  it('returns an empty default history when nothing is stored', () => {
    expect(getFocusHistory()).toEqual({ version: 1, days: {} })
  })

  it('returns the default history when localStorage holds corrupt JSON', () => {
    localStorage.setItem('pomodoro.focusHistory', 'not json')
    expect(getFocusHistory()).toEqual({ version: 1, days: {} })
  })
})

describe('recordFocusSession', () => {
  it('creates a new day entry on first call', () => {
    const { history } = recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    expect(history.days['2026-08-24']).toEqual({ count: 1, minutes: 25, growthMilestoneStageKey: null })
  })

  it('accumulates count and minutes across multiple calls on the same day', () => {
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    const { history } = recordFocusSession({ dateString: '2026-08-24', minutes: 15 })
    expect(history.days['2026-08-24']).toEqual({ count: 2, minutes: 40, growthMilestoneStageKey: null })
  })

  it('keeps separate entries for different days', () => {
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    const { history } = recordFocusSession({ dateString: '2026-08-25', minutes: 10 })
    expect(history.days['2026-08-24'].minutes).toBe(25)
    expect(history.days['2026-08-25'].minutes).toBe(10)
  })

  it('sets growthMilestoneStageKey when passed', () => {
    const { history } = recordFocusSession({ dateString: '2026-08-24', minutes: 25, growthMilestoneStageKey: 'growing' })
    expect(history.days['2026-08-24'].growthMilestoneStageKey).toBe('growing')
  })

  it('does not clear an existing milestone on a later call that omits it', () => {
    recordFocusSession({ dateString: '2026-08-24', minutes: 25, growthMilestoneStageKey: 'growing' })
    const { history } = recordFocusSession({ dateString: '2026-08-24', minutes: 10 })
    expect(history.days['2026-08-24'].growthMilestoneStageKey).toBe('growing')
  })

  it('persists across calls to getFocusHistory', () => {
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    expect(getFocusHistory().days['2026-08-24'].minutes).toBe(25)
  })

  it('trims to the most recent 90 days and retries when the write hits a quota error', () => {
    const seeded = { version: 1, days: {} }
    let cursor = new Date(2026, 0, 1)
    for (let i = 0; i < 91; i += 1) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      seeded.days[`${y}-${m}-${d}`] = { count: 1, minutes: 10, growthMilestoneStageKey: null }
      cursor.setDate(cursor.getDate() + 1)
    }
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify(seeded))

    const originalSetItem = Storage.prototype.setItem
    let calls = 0
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function mocked(key, value) {
      calls += 1
      if (key === 'pomodoro.focusHistory' && calls === 1) {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
      return originalSetItem.call(this, key, value)
    })

    const { history, trimmedTo90Days } = recordFocusSession({ dateString: '2026-08-24', minutes: 25 })

    expect(trimmedTo90Days).toBe(true)
    expect(Object.keys(history.days).length).toBe(90)
    expect(history.days['2026-08-24'].minutes).toBe(25) // the new entry survives the trim
    expect(history.days['2026-01-01']).toBeUndefined() // oldest seeded day is gone

    setItemSpy.mockRestore()
  })
})

describe('restoreFocusHistory', () => {
  it('writes the given history to storage as-is', () => {
    restoreFocusHistory({ version: 1, days: { '2026-03-01': { count: 2, minutes: 50, growthMilestoneStageKey: null } } })
    expect(getFocusHistory().days['2026-03-01']).toEqual({ count: 2, minutes: 50, growthMilestoneStageKey: null })
  })
})
