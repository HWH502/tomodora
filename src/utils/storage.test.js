import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPet,
  getOwnerState,
  getSettings,
  getTodayCount,
  incrementTodayCount,
  purchaseShopItem,
  recordPomodoroReward,
  renamePet,
  saveSettings,
} from './storage'

const PERSONALITY_POOL = ['黏人', '獨立', '愛玩', '穩重', '機靈', '溫柔']

const SETTINGS_KEY = 'pomodoro.settings'
const TODAY_COUNT_KEY = 'pomodoro.todayCount'
const OWNER_KEY = 'pomodoro.owner'

function localDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

describe('getSettings / saveSettings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(getSettings()).toEqual({ workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 })
  })

  it('returns stored values when valid', () => {
    saveSettings({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
    expect(getSettings()).toEqual({ workMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20 })
  })

  it('falls back to defaults when stored JSON is corrupt', () => {
    localStorage.setItem(SETTINGS_KEY, 'not json {')
    expect(getSettings()).toEqual({ workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 })
  })

  it('falls back per-field when only some fields are invalid', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ workMinutes: 'abc', shortBreakMinutes: 10, longBreakMinutes: 20 }),
    )
    expect(getSettings()).toEqual({ workMinutes: 25, shortBreakMinutes: 10, longBreakMinutes: 20 })
  })
})

describe('getTodayCount / incrementTodayCount', () => {
  const fixedNow = new Date(2026, 2, 15, 10, 0, 0)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns 0 and writes today when nothing is stored', () => {
    expect(getTodayCount()).toBe(0)
    expect(JSON.parse(localStorage.getItem(TODAY_COUNT_KEY))).toEqual({
      date: localDateString(fixedNow),
      count: 0,
    })
  })

  it('returns the stored count when the stored date is today', () => {
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(fixedNow), count: 3 }))
    expect(getTodayCount()).toBe(3)
  })

  it('resets to 0 when the stored date is yesterday', () => {
    const yesterday = new Date(2026, 2, 14, 23, 0, 0)
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(yesterday), count: 7 }))
    expect(getTodayCount()).toBe(0)
  })

  it('falls back to 0 when stored JSON is corrupt', () => {
    localStorage.setItem(TODAY_COUNT_KEY, 'not json {')
    expect(getTodayCount()).toBe(0)
  })

  it('increments the stored count for the same day', () => {
    expect(incrementTodayCount()).toBe(1)
    expect(incrementTodayCount()).toBe(2)
    expect(incrementTodayCount()).toBe(3)
  })

  it('starts back at 1 when incrementing right after a date rollover', () => {
    const yesterday = new Date(2026, 2, 14, 23, 0, 0)
    localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: localDateString(yesterday), count: 9 }))
    expect(incrementTodayCount()).toBe(1)
  })
})

describe('getOwnerState', () => {
  it('creates and persists a default state with no pet when nothing is stored', () => {
    const state = getOwnerState()
    expect(state.lifetimePomodoros).toBe(0)
    expect(state.money).toBe(0)
    expect(state.skillPoints).toBe(0)
    expect(state.pet).toBeNull()
    expect(state.petMemorials).toEqual([])
    expect(state.ownedCollectibles).toEqual([])
    expect(state.consumablePurchases).toEqual({})
    expect(JSON.parse(localStorage.getItem(OWNER_KEY))).toEqual(state)
  })

  it('falls back to a fresh default state when stored JSON is corrupt', () => {
    localStorage.setItem(OWNER_KEY, 'not json {')
    const state = getOwnerState()
    expect(state.lifetimePomodoros).toBe(0)
    expect(state.pet).toBeNull()
    expect(JSON.parse(localStorage.getItem(OWNER_KEY))).toEqual(state)
  })

  it('returns stored data verbatim when already in the current shape', () => {
    const stored = {
      lifetimePomodoros: 12,
      money: 100,
      skillPoints: 8,
      pet: {
        speciesId: 'dog',
        speciesLabel: '狗',
        breedId: 'shiba',
        breedLabel: '柴犬',
        name: '小白',
        personalityLabel: '穩重',
        generation: 1,
        pomodorosSinceBorn: 12,
        bornAt: '2026-01-01T00:00:00.000Z',
        stats: { learning: 20, obedience: 30, friendliness: 20, energy: 30 },
      },
      petMemorials: [],
      ownedCollectibles: ['bowl'],
      consumablePurchases: { kibble: 2 },
    }
    localStorage.setItem(OWNER_KEY, JSON.stringify(stored))
    expect(getOwnerState()).toEqual(stored)
  })

  describe('stats backfill', () => {
    it('backfills stats for an existing pet that predates stage 3A, and persists it', () => {
      const stored = {
        lifetimePomodoros: 5,
        money: 0,
        skillPoints: 0,
        pet: {
          speciesId: 'dog',
          speciesLabel: '狗',
          breedId: 'shiba',
          breedLabel: '柴犬',
          name: '小白',
          personalityLabel: '穩重',
          generation: 1,
          pomodorosSinceBorn: 5,
          bornAt: '2026-01-01T00:00:00.000Z',
        },
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
      }
      localStorage.setItem(OWNER_KEY, JSON.stringify(stored))

      const state = getOwnerState()
      expect(state.pet.stats).toBeDefined()
      const { learning, obedience, friendliness, energy } = state.pet.stats
      expect(learning + obedience + friendliness + energy).toBe(100)

      // second read must not re-roll
      const second = getOwnerState()
      expect(second.pet.stats).toEqual(state.pet.stats)
    })

    it('does nothing when there is no pet', () => {
      const state = getOwnerState()
      expect(state.pet).toBeNull()
    })
  })

  describe('legacy shape migration', () => {
    it('migrates the old { dog, totalPomodoros } shape without losing progress', () => {
      const legacy = {
        totalPomodoros: 42,
        money: 100,
        skillPoints: 20,
        dog: { name: '小白', breedLabel: '柴犬', personalityLabel: '穩重' },
        ownedCollectibles: ['bowl'],
        consumablePurchases: { kibble: 3 },
      }
      localStorage.setItem(OWNER_KEY, JSON.stringify(legacy))

      const state = getOwnerState()

      expect(state.lifetimePomodoros).toBe(42)
      expect(state.money).toBe(100)
      expect(state.skillPoints).toBe(20)
      expect(state.pet).not.toBeNull()
      expect(state.pet.speciesId).toBe('dog')
      expect(state.pet.breedId).toBe('shiba')
      expect(state.pet.breedLabel).toBe('柴犬')
      expect(state.pet.name).toBe('小白')
      expect(state.pet.personalityLabel).toBe('穩重')
      expect(state.pet.generation).toBe(1)
      expect(state.pet.pomodorosSinceBorn).toBe(42) // carried forward, not reset
      expect(state.petMemorials).toEqual([])
      expect(state.ownedCollectibles).toEqual(['bowl'])
      expect(state.consumablePurchases).toEqual({ kibble: 3 })

      // migration persists, so a second read doesn't re-migrate or drift
      expect(getOwnerState()).toEqual(state)
    })

    it('rolls a personality when the legacy data has none', () => {
      const legacy = {
        totalPomodoros: 0,
        money: 0,
        skillPoints: 0,
        dog: { name: '', breedLabel: '柴犬', personalityLabel: '' },
        ownedCollectibles: [],
        consumablePurchases: {},
      }
      localStorage.setItem(OWNER_KEY, JSON.stringify(legacy))
      expect(PERSONALITY_POOL).toContain(getOwnerState().pet.personalityLabel)
    })

    it('also backfills stats for the migrated pet', () => {
      const legacy = {
        totalPomodoros: 10,
        money: 0,
        skillPoints: 0,
        dog: { name: '小白', breedLabel: '柴犬', personalityLabel: '穩重' },
        ownedCollectibles: [],
        consumablePurchases: {},
      }
      localStorage.setItem(OWNER_KEY, JSON.stringify(legacy))
      const state = getOwnerState()
      const { learning, obedience, friendliness, energy } = state.pet.stats
      expect(learning + obedience + friendliness + energy).toBe(100)
    })
  })
})

describe('createPet', () => {
  it('creates the first pet with generation 1 and no head start', () => {
    const state = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    expect(state.pet.speciesId).toBe('dog')
    expect(state.pet.breedId).toBe('shiba')
    expect(state.pet.breedLabel).toBe('柴犬')
    expect(state.pet.name).toBe('小豆')
    expect(state.pet.generation).toBe(1)
    expect(state.pet.pomodorosSinceBorn).toBe(0)
    expect(PERSONALITY_POOL).toContain(state.pet.personalityLabel)
    expect(state.petMemorials).toEqual([])
  })

  it('returns null and leaves state untouched for an invalid species/breed', () => {
    const before = getOwnerState()
    expect(createPet({ speciesId: 'dragon', breedId: 'shiba' })).toBeNull()
    expect(createPet({ speciesId: 'dog', breedId: 'dragon' })).toBeNull()
    expect(getOwnerState()).toEqual(before)
  })

  it('archives the previous pet into petMemorials and applies a capped legacy head start on succession', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    for (let i = 0; i < 60; i += 1) recordPomodoroReward(25) // pomodorosSinceBorn = 60

    const state = createPet({ speciesId: 'cat', breedId: 'ragdoll', name: '咪咪' })

    expect(state.petMemorials).toHaveLength(1)
    expect(state.petMemorials[0].name).toBe('小豆')
    expect(state.petMemorials[0].breedLabel).toBe('柴犬')
    expect(state.petMemorials[0].generation).toBe(1)
    expect(state.petMemorials[0].highestGrowthStageLabel).toBe('資深老友')
    expect(state.petMemorials[0].daysWithOwner).toBeGreaterThanOrEqual(0)

    expect(state.pet.speciesId).toBe('cat')
    expect(state.pet.generation).toBe(2)
    expect(state.pet.pomodorosSinceBorn).toBe(6) // round(60 * 0.1)
  })

  it('caps the legacy head start regardless of how far the previous pet progressed', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    for (let i = 0; i < 200; i += 1) recordPomodoroReward(25)

    const state = createPet({ speciesId: 'dog', breedId: 'poodle' })
    expect(state.pet.pomodorosSinceBorn).toBe(10) // capped, not round(200 * 0.1) = 20
  })

  it('rolls and stores stats summing to 100', () => {
    const state = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    expect(state.pet.stats).toBeDefined()
    const { learning, obedience, friendliness, energy } = state.pet.stats
    expect(learning + obedience + friendliness + energy).toBe(100)
  })

  it('uses explicitly provided personalityLabel and stats instead of rolling new ones', () => {
    const fixedStats = { learning: 40, obedience: 30, friendliness: 20, energy: 10 }
    const state = createPet({
      speciesId: 'dog',
      breedId: 'shiba',
      name: '小豆',
      personalityLabel: '機靈',
      stats: fixedStats,
    })
    expect(state.pet.personalityLabel).toBe('機靈')
    expect(state.pet.stats).toEqual(fixedStats)
  })
})

describe('renamePet', () => {
  it('updates only pet.name and preserves everything else', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    const before = getOwnerState()
    const after = renamePet('小豆')
    expect(after.pet.name).toBe('小豆')
    expect(after.pet.breedLabel).toBe(before.pet.breedLabel)
    expect(after.pet.personalityLabel).toBe(before.pet.personalityLabel)
    expect(after.lifetimePomodoros).toBe(before.lifetimePomodoros)
    expect(after.money).toBe(before.money)
    expect(getOwnerState().pet.name).toBe('小豆')
  })

  it('is a safe no-op when there is no pet yet', () => {
    const before = getOwnerState()
    expect(before.pet).toBeNull()
    const after = renamePet('小豆')
    expect(after.pet).toBeNull()
  })
})

describe('recordPomodoroReward', () => {
  it.each([
    [1, 2, 1],
    [2, 4, 1],
    [3, 6, 1],
    [5, 10, 1],
    [8, 16, 2],
    [25, 50, 5],
    [60, 120, 12],
  ])('durationMinutes=%i -> money=%i, skillPoints=%i', (minutes, money, skillPoints) => {
    const state = recordPomodoroReward(minutes)
    expect(state.money).toBe(money)
    expect(state.skillPoints).toBe(skillPoints)
    expect(state.lifetimePomodoros).toBe(1)
  })

  it('accumulates across sequential calls', () => {
    recordPomodoroReward(25)
    const state = recordPomodoroReward(25)
    expect(state.lifetimePomodoros).toBe(2)
    expect(state.money).toBe(100)
    expect(state.skillPoints).toBe(10)
  })

  it('still updates money/skillPoints/lifetimePomodoros when there is no pet yet', () => {
    const state = recordPomodoroReward(25)
    expect(state.pet).toBeNull()
    expect(state.lifetimePomodoros).toBe(1)
    expect(state.money).toBe(50)
    expect(state.skillPoints).toBe(5)
  })

  it('increments pomodorosSinceBorn on the current pet', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    recordPomodoroReward(25)
    const state = recordPomodoroReward(25)
    expect(state.pet.pomodorosSinceBorn).toBe(2)
    expect(state.lifetimePomodoros).toBe(2)
  })
})

describe('purchaseShopItem', () => {
  it('returns null and does not mutate state for an unknown item id', () => {
    const before = getOwnerState()
    expect(purchaseShopItem('nope')).toBeNull()
    expect(getOwnerState()).toEqual(before)
  })

  it('returns null and does not mutate state when funds are insufficient', () => {
    const before = getOwnerState()
    expect(before.money).toBe(0)
    expect(purchaseShopItem('bowl')).toBeNull()
    expect(getOwnerState()).toEqual(before)
  })

  it('buys an affordable, unowned collectible and deducts the cost', () => {
    recordPomodoroReward(25) // money = 50
    const after = purchaseShopItem('bowl') // cost 15
    expect(after.money).toBe(35)
    expect(after.ownedCollectibles).toEqual(['bowl'])
  })

  it('blocks buying the same collectible twice even with enough money', () => {
    recordPomodoroReward(25)
    purchaseShopItem('bowl')
    const before = getOwnerState()
    expect(purchaseShopItem('bowl')).toBeNull()
    expect(getOwnerState()).toEqual(before)
  })

  it('allows repeated purchases of a consumable, incrementing its count', () => {
    recordPomodoroReward(25) // money = 50
    const first = purchaseShopItem('kibble') // cost 4
    expect(first.consumablePurchases.kibble).toBe(1)
    const second = purchaseShopItem('kibble')
    expect(second.consumablePurchases.kibble).toBe(2)
    expect(second.money).toBe(42)
  })
})
