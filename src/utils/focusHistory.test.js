import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getFocusHistory,
  recordFocusSession,
  restoreFocusHistory,
  whenFocusHistoryReady,
  __resetForTests,
  __reinitForTests,
  __openDbForTests,
  __putDayRecordForTests,
  __getAllDayRecordsForTests,
  __getMetaMarkerForTests,
  __writeReconciledDaysForTests,
  __clearAllDayRecordsForTests,
} from './focusHistory'

beforeEach(async () => {
  await __resetForTests()
})

describe('IndexedDB wrapper', () => {
  // These tests open their own ad-hoc connection via __openDbForTests(), separate
  // from the module's own internally-tracked connection. That connection has to be
  // closed before the next test's __resetForTests() calls indexedDB.deleteDatabase(),
  // or the delete request sits blocked forever (an open connection anywhere keeps
  // deleteDatabase() from ever firing 'success'), which in turn hangs every open()
  // call queued behind it — matching the established db.close()-before-deleteDatabase
  // cleanup pattern used elsewhere in this file.
  let db

  afterEach(() => {
    db?.close()
    db = undefined
  })

  it('opens a database with a days store and a meta store', async () => {
    db = await __openDbForTests()
    expect(db.objectStoreNames.contains('days')).toBe(true)
    expect(db.objectStoreNames.contains('meta')).toBe(true)
  })

  it('writes and reads back a single day record', async () => {
    db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null })
    const records = await __getAllDayRecordsForTests(db)
    expect(records).toEqual([{ date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null }])
  })

  it('returns null for a meta marker that was never set', async () => {
    db = await __openDbForTests()
    expect(await __getMetaMarkerForTests(db)).toBeNull()
  })

  it('writes multiple day records and a meta marker atomically', async () => {
    db = await __openDbForTests()
    await __writeReconciledDaysForTests(
      db,
      [
        { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null },
        { date: '2026-08-25', count: 2, minutes: 40, growthMilestoneStageKey: 'growing' },
      ],
      'raw-snapshot-string',
    )
    const records = await __getAllDayRecordsForTests(db)
    expect(records.length).toBe(2)
    expect(await __getMetaMarkerForTests(db)).toBe('raw-snapshot-string')
  })

  it('clears all day records', async () => {
    db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null })
    await __clearAllDayRecordsForTests(db)
    expect(await __getAllDayRecordsForTests(db)).toEqual([])
  })
})

describe('init / hydration', () => {
  let db

  afterEach(() => {
    db?.close()
    db = undefined
  })

  it('resolves whenFocusHistoryReady() and loads existing IndexedDB records into getFocusHistory()', async () => {
    db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null })

    await __reinitForTests()
    await whenFocusHistoryReady()

    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 1, minutes: 25, growthMilestoneStageKey: null })
  })

  it('falls back to localStorage-based history when indexedDB is unavailable', async () => {
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify({
      version: 1,
      days: { '2026-08-24': { count: 3, minutes: 75, growthMilestoneStageKey: null } },
    }))

    vi.stubGlobal('indexedDB', undefined)
    try {
      await __reinitForTests()
      expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 3, minutes: 75, growthMilestoneStageKey: null })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('reconciliation of leftover fallback data', () => {
  let db

  afterEach(() => {
    db?.close()
    db = undefined
  })

  it('merges leftover localStorage days into IndexedDB and clears localStorage', async () => {
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify({
      version: 1,
      days: { '2026-08-24': { count: 2, minutes: 50, growthMilestoneStageKey: null } },
    }))

    await __reinitForTests()

    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 2, minutes: 50, growthMilestoneStageKey: null })
    expect(localStorage.getItem('pomodoro.focusHistory')).toBeNull()
  })

  it('adds leftover localStorage counts to an existing IndexedDB day rather than overwriting it', async () => {
    db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null })
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify({
      version: 1,
      days: { '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null } },
    }))

    await __reinitForTests()

    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 2, minutes: 50, growthMilestoneStageKey: null })
  })

  it('does not double-count when reconciliation runs twice for the same untouched leftover batch', async () => {
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify({
      version: 1,
      days: { '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null } },
    }))

    await __reinitForTests()
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify({
      version: 1,
      days: { '2026-08-24': { count: 1, minutes: 25, growthMilestoneStageKey: null } },
    }))

    await __reinitForTests()

    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 1, minutes: 25, growthMilestoneStageKey: null })
  })

  it('keeps the hydrated IndexedDB history and stays in indexeddb mode when reconciliation itself fails', async () => {
    db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 3, minutes: 75, growthMilestoneStageKey: null })
    db.close()
    db = undefined

    const leftover = JSON.stringify({
      version: 1,
      days: { '2026-08-25': { count: 1, minutes: 25, growthMilestoneStageKey: null } },
    })
    localStorage.setItem('pomodoro.focusHistory', leftover)

    // Hydration (a 'days' transaction) succeeds; reconciliation fails at its very
    // first step, the 'meta' marker read.
    const originalTransaction = IDBDatabase.prototype.transaction
    const txSpy = vi.spyOn(IDBDatabase.prototype, 'transaction').mockImplementation(function mocked(storeNames, ...rest) {
      const names = Array.isArray(storeNames) ? storeNames : [storeNames]
      if (names.includes('meta')) throw new DOMException('reconciliation failed', 'InvalidStateError')
      return originalTransaction.call(this, storeNames, ...rest)
    })
    try {
      await __reinitForTests()
    } finally {
      txSpy.mockRestore()
    }

    // The history read out of IndexedDB must survive — it must NOT be replaced by
    // the leftover buffer, which holds only the not-yet-merged delta.
    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 3, minutes: 75, growthMilestoneStageKey: null })

    // The failed attempt left the buffer intact, so the next startup can retry it.
    expect(localStorage.getItem('pomodoro.focusHistory')).toBe(leftover)

    // Still in 'indexeddb' mode: a new session goes to IndexedDB, not the buffer.
    recordFocusSession({ dateString: '2026-08-26', minutes: 25 })
    expect(localStorage.getItem('pomodoro.focusHistory')).toBe(leftover)
  })

  it('does nothing when there is no leftover localStorage data', async () => {
    await __reinitForTests()
    expect(getFocusHistory()).toEqual({ version: 1, days: {} })
  })
})

describe('getFocusHistory', () => {
  it('returns an empty default history when nothing is stored', () => {
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

  it('never trims when running in indexeddb mode, even past 90 days', () => {
    let cursor = new Date(2026, 0, 1)
    for (let i = 0; i < 120; i += 1) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      recordFocusSession({ dateString: `${y}-${m}-${d}`, minutes: 10 })
      cursor.setDate(cursor.getDate() + 1)
    }
    expect(Object.keys(getFocusHistory().days).length).toBe(120)
  })

  it('trims the localStorage fallback buffer to 90 days on a quota error, without touching the in-memory cache', async () => {
    // `recordFocusSession` never lets the in-memory `cache` shrink — only the
    // localStorage delta buffer (the thing reconciliation later adds onto IndexedDB)
    // gets pruned, and only when a real write actually hits a quota error. jsdom's
    // localStorage doesn't have a low-enough quota to hit that naturally at 91 tiny
    // entries, so this test forces one `Storage.prototype.setItem` call to throw,
    // matching how the pre-migration test forced the same failure.
    vi.stubGlobal('indexedDB', undefined)
    try {
      await __reinitForTests()

      const seeded = {}
      let cursor = new Date(2026, 0, 1)
      for (let i = 0; i < 90; i += 1) {
        const y = cursor.getFullYear()
        const m = String(cursor.getMonth() + 1).padStart(2, '0')
        const d = String(cursor.getDate()).padStart(2, '0')
        seeded[`${y}-${m}-${d}`] = { count: 1, minutes: 10, growthMilestoneStageKey: null }
        cursor.setDate(cursor.getDate() + 1)
      }
      localStorage.setItem('pomodoro.focusHistory', JSON.stringify({ version: 1, days: seeded }))
      await __reinitForTests() // re-hydrate cache from this seeded fallback buffer; indexedDB is still stubbed undefined, so mode stays 'fallback'

      const originalSetItem = Storage.prototype.setItem
      let calls = 0
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function mocked(key, value) {
        calls += 1
        if (key === 'pomodoro.focusHistory' && calls === 1) {
          throw new DOMException('quota exceeded', 'QuotaExceededError')
        }
        return originalSetItem.call(this, key, value)
      })

      const { trimmedTo90Days } = recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
      setItemSpy.mockRestore()

      expect(trimmedTo90Days).toBe(true)
      const bufferedDays = JSON.parse(localStorage.getItem('pomodoro.focusHistory')).days
      expect(Object.keys(bufferedDays).length).toBe(90)
      expect(bufferedDays['2026-08-24']).toEqual({ count: 1, minutes: 25, growthMilestoneStageKey: null })
      expect(bufferedDays['2026-01-01']).toBeUndefined()

      // the in-memory cache (what getFocusHistory returns) is never pruned — it still shows all 91 days
      expect(Object.keys(getFocusHistory().days).length).toBe(91)
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('falls back to localStorage mid-session when an IndexedDB write fails', async () => {
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    // give the background persist a tick to run and flip mode to 'fallback'
    await new Promise((resolve) => setTimeout(resolve, 0))
    recordFocusSession({ dateString: '2026-08-25', minutes: 10 })

    expect(JSON.parse(localStorage.getItem('pomodoro.focusHistory')).days['2026-08-25']).toEqual({
      count: 1,
      minutes: 10,
      growthMilestoneStageKey: null,
    })

    putSpy.mockRestore()
  })

  it('reconciles correctly without double-counting when a fallback delta overlaps a day that already has IndexedDB history', async () => {
    // Two pomodoros land on this day while IndexedDB is healthy.
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    await new Promise((resolve) => setTimeout(resolve, 0))

    // IndexedDB starts failing; two more pomodoros land on the SAME day.
    const putSpy = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })
    recordFocusSession({ dateString: '2026-08-24', minutes: 10 })
    await new Promise((resolve) => setTimeout(resolve, 0))
    recordFocusSession({ dateString: '2026-08-24', minutes: 5 })
    putSpy.mockRestore()

    // This session's own view is already correct: all 4 sessions, 65 minutes.
    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 4, minutes: 65, growthMilestoneStageKey: null })

    // Simulate a fresh app load: IndexedDB is available again. Reconciliation must
    // add only the 2-session/15-minute fallback delta on top of the 2 sessions that
    // were already safely written to IndexedDB before the outage — not all 4 again.
    await __reinitForTests()

    expect(getFocusHistory().days['2026-08-24']).toEqual({ count: 4, minutes: 65, growthMilestoneStageKey: null })
  })
})

describe('restoreFocusHistory', () => {
  it('writes the given history to storage as-is', async () => {
    await restoreFocusHistory({ version: 1, days: { '2026-03-01': { count: 2, minutes: 50, growthMilestoneStageKey: null } } })
    expect(getFocusHistory().days['2026-03-01']).toEqual({ count: 2, minutes: 50, growthMilestoneStageKey: null })
  })

  it('overwrites any previously existing days', async () => {
    recordFocusSession({ dateString: '2026-08-24', minutes: 25 })
    await restoreFocusHistory({ version: 1, days: { '2026-03-01': { count: 2, minutes: 50, growthMilestoneStageKey: null } } })
    expect(getFocusHistory().days['2026-08-24']).toBeUndefined()
    expect(getFocusHistory().days['2026-03-01']).toBeDefined()
  })
})
