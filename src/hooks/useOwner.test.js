import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useOwner } from './useOwner'
import { __resetForTests, __reinitForTests, __openDbForTests, __putDayRecordForTests } from '../utils/focusHistory'

describe('useOwner', () => {
  it('starts with the default owner state and no pet', () => {
    const { result } = renderHook(() => useOwner())
    expect(result.current.ownerState.lifetimePomodoros).toBe(0)
    expect(result.current.ownerState.money).toBe(0)
    expect(result.current.ownerState.pet).toBeNull()
  })

  it('addPomodoroReward updates money/skillPoints/lifetimePomodoros even with no pet', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25)
    })
    expect(result.current.ownerState.lifetimePomodoros).toBe(1)
    expect(result.current.ownerState.money).toBe(50)
    expect(result.current.ownerState.skillPoints).toBe(5)
  })

  it('createPet creates a pet of the chosen species/breed', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    expect(result.current.ownerState.pet).not.toBeNull()
    expect(result.current.ownerState.pet.speciesId).toBe('dog')
    expect(result.current.ownerState.pet.breedId).toBe('shiba')
  })

  it('createPet forwards the personalityLabel/stats args exactly as given (no re-roll)', () => {
    const { result } = renderHook(() => useOwner())
    const stats = { learning: 40, obedience: 30, friendliness: 20, energy: 10 }
    act(() => {
      result.current.createPet('dog', 'shiba', '機靈', stats)
    })
    expect(result.current.ownerState.pet.personalityLabel).toBe('機靈')
    expect(result.current.ownerState.pet.stats).toEqual(stats)
  })

  it('createPet leaves state unchanged for an invalid species/breed', () => {
    const { result } = renderHook(() => useOwner())
    const before = result.current.ownerState
    act(() => {
      result.current.createPet('dragon', 'shiba')
    })
    expect(result.current.ownerState).toEqual(before)
  })

  it('renamePet updates the pet name', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    act(() => {
      result.current.renamePet('小豆')
    })
    expect(result.current.ownerState.pet.name).toBe('小豆')
  })

  it('purchaseItem buys an affordable collectible and deducts cost', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25) // money = 50
    })
    act(() => {
      result.current.purchaseItem('bowl') // cost 15
    })
    expect(result.current.ownerState.ownedCollectibles).toEqual(['bowl'])
    expect(result.current.ownerState.money).toBe(35)
  })

  it('purchaseItem leaves state unchanged on a failed purchase (already owned)', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25)
    })
    act(() => {
      result.current.purchaseItem('bowl')
    })
    const stateAfterFirstPurchase = result.current.ownerState
    act(() => {
      result.current.purchaseItem('bowl')
    })
    expect(result.current.ownerState).toEqual(stateAfterFirstPurchase)
  })

  it('grantResources adds money and skillPoints directly', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.grantResources(100, 7)
    })
    expect(result.current.ownerState.money).toBe(100)
    expect(result.current.ownerState.skillPoints).toBe(7)
  })

  it('setGrowthProgress overwrites the pet growth counter', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    act(() => {
      result.current.setGrowthProgress(60)
    })
    expect(result.current.ownerState.pet.pomodorosSinceBorn).toBe(60)
  })

  it('setPetNeeds overwrites the given needs fields on the current pet', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    act(() => {
      result.current.setPetNeeds({ hunger: 5, cleanliness: 95, health: 50, affection: 0 })
    })
    expect(result.current.ownerState.pet.hunger).toBe(5)
    expect(result.current.ownerState.pet.cleanliness).toBe(95)
    expect(result.current.ownerState.pet.health).toBe(50)
    expect(result.current.ownerState.pet.affection).toBe(0)
  })

  it('resetOwner clears the pet and resets money/skillPoints', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
      result.current.addPomodoroReward(25)
    })
    act(() => {
      result.current.resetOwner()
    })
    expect(result.current.ownerState.pet).toBeNull()
    expect(result.current.ownerState.money).toBe(0)
  })

  it('refreshes focusHistory once IndexedDB hydration finishes after mount', async () => {
    await __resetForTests()
    const db = await __openDbForTests()
    await __putDayRecordForTests(db, { date: '2026-08-24', count: 1, minutes: 25, growthMilestoneStageKey: null })
    // Close this ad-hoc connection before reinitializing/resetting again — an open
    // connection anywhere blocks indexedDB.deleteDatabase() from ever completing,
    // which would hang the next test's __resetForTests() (see the same pattern in
    // focusHistory.test.js's 'IndexedDB wrapper' describe block).
    db.close()

    // Simulate a fresh app load: kick off reinitialization but don't await it yet,
    // so the hook's synchronous initial read happens before hydration completes,
    // and the effect has to pick up the data once whenFocusHistoryReady() resolves.
    const reinitPromise = __reinitForTests()

    const { result } = renderHook(() => useOwner())

    await reinitPromise
    await waitFor(() => {
      expect(result.current.focusHistory.days['2026-08-24']).toEqual({
        count: 1,
        minutes: 25,
        growthMilestoneStageKey: null,
      })
    })
  })
})

it('sets focusHistoryTrimmed when a pomodoro completion triggers the 90-day trim', async () => {
  vi.stubGlobal('indexedDB', undefined)
  await __resetForTests()

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
  await __resetForTests()

  const originalSetItem = Storage.prototype.setItem
  let focusHistoryCalls = 0
  const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function mocked(key, value) {
    if (key === 'pomodoro.focusHistory') {
      focusHistoryCalls += 1
      if (focusHistoryCalls === 1) {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      }
    }
    return originalSetItem.call(this, key, value)
  })

  try {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25)
    })

    expect(result.current.focusHistoryTrimmed).toBe(true)

    act(() => {
      result.current.clearFocusHistoryTrimmed()
    })
    expect(result.current.focusHistoryTrimmed).toBe(false)
  } finally {
    setItemSpy.mockRestore()
    vi.unstubAllGlobals()
  }
})
