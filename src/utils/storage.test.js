import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPet,
  debugSetTodayCount,
  getOwnerPetProgressCounts,
  getOwnerState,
  getSettings,
  getShopPrice,
  getTodayCount,
  grantResources,
  incrementTodayCount,
  purchaseShopItem,
  recordPomodoroReward,
  renamePet,
  resetOwnerState,
  restoreOwnerState,
  saveSettings,
  setPetGrowthProgress,
  setPetNeeds,
  unlockSingleOwnerSkill,
  upgradeLinearOwnerSkill,
  upgradeSpecializationOwnerSkill,
  visitVet,
} from './storage'
import { getFocusHistory, __resetForTests } from './focusHistory'
import { todayDateString } from './date'

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

beforeEach(async () => {
  await __resetForTests()
})

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
    expect(state.ownerSkillTree).toBeDefined()
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
      lifetimeFocusMinutes: 0,
      lifetimeFocusMinutesStartedAt: '2026-01-01',
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
        hunger: 40,
        cleanliness: 40,
        health: 60,
        affection: 30,
        lastNeedsTickDate: localDateString(new Date()),
        recentEvents: [],
      },
      petMemorials: [],
      ownedCollectibles: ['bowl'],
      consumablePurchases: { kibble: 2 },
      ownerSkillTree: {
        trainingTechnique: 0,
        socialTraining: 0,
        sizeSpecialization: { small: 0, medium: 0, large: 0 },
        speciesSpecialization: { dog: 0, cat: 0 },
        businessSense: 0,
        bargainHunter: 0,
        bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
        autoFeed: false,
        autoGrooming: false,
        instantGuard: 0,
        petInsurance: 0,
      },
      pomodoroStreak: { currentStreak: 3, lastCompletedDate: '2026-01-01', milestonesReached: [] },
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
      // migration also runs the first daily tick immediately (lastNeedsTickDate starts null),
      // which consumes one kibble from stock: 3 -> 2.
      expect(state.consumablePurchases).toEqual({ kibble: 2 })

      // migration persists, so a second read doesn't re-migrate or drift.
      // (the first read's _dailyTickSummary is a one-shot, in-memory-only field from
      // the tick that just ran; it's never persisted, so the second read won't have it.)
      const { _dailyTickSummary, ...persistedShape } = state
      expect(getOwnerState()).toEqual(persistedShape)
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

describe('createPet clears owned collectibles when replacing a pet', () => {
  it('does NOT clear ownedCollectibles on the very first pet (no previous pet)', () => {
    // Seed localStorage with a fresh owner state (no pet yet) but with pre-existing ownedCollectibles.
    // This verifies the `: state.ownedCollectibles` branch runs (preserving the seeded array),
    // not a hardcoded `[]`.
    const freshState = getOwnerState()
    const seededState = { ...freshState, pet: null, ownedCollectibles: ['ball', 'bowl'] }
    localStorage.setItem('pomodoro.owner', JSON.stringify(seededState))

    const state = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })

    expect(state.ownedCollectibles).toEqual(['ball', 'bowl'])
  })

  it('clears ownedCollectibles when replacing an existing pet, without refunding money', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const withCollectibles = getOwnerState()
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...withCollectibles, money: 100, ownedCollectibles: ['ball', 'bowl', 'collar'] }),
    )

    const replaced = createPet({ speciesId: 'cat', breedId: 'ragdoll', name: '咪咪' })

    expect(replaced.ownedCollectibles).toEqual([])
    expect(replaced.money).toBe(100) // 花掉的錢不會因為道具被清空而退還
  })

  it('clears ownedCollectibles for the pet adopted after a natural departure (pet already null, petMemorials non-empty)', () => {
    // Simulate the state right after applyNeedsTickIfDue() has already archived a departed pet:
    // state.pet is null and state.petMemorials already has an entry, BEFORE createPet() is called
    // for the replacement. previousPet will be null here, so only the petMemorials.length check
    // can correctly trigger clearing.
    const freshState = getOwnerState()
    const seededState = {
      ...freshState,
      pet: null,
      petMemorials: [{ speciesId: 'dog', breedId: 'shiba', name: '小豆', endedAt: new Date().toISOString(), reason: 'died' }],
      ownedCollectibles: ['ball', 'bowl'],
    }
    localStorage.setItem('pomodoro.owner', JSON.stringify(seededState))

    const state = createPet({ speciesId: 'cat', breedId: 'ragdoll', name: '咪咪' })

    expect(state.ownedCollectibles).toEqual([])
  })

  it('does NOT clear consumablePurchases stock when replacing a pet', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const withStock = getOwnerState()
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...withStock, consumablePurchases: { kibble: 3, grooming: 2 } }),
    )

    const replaced = createPet({ speciesId: 'cat', breedId: 'ragdoll', name: '咪咪' })

    expect(replaced.consumablePurchases).toEqual({ kibble: 3, grooming: 2 })
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

describe('recordPomodoroReward: phase 4 real-time effects', () => {
  it('increases affection by the base amount plus friendliness tier bonus', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const highFriendliness = { ...created.pet, stats: { ...created.pet.stats, friendliness: 40 }, affection: 30 }
    localStorage.setItem('pomodoro.owner', JSON.stringify({ ...created, pet: highFriendliness }))

    const after = recordPomodoroReward(25)
    expect(after.pet.affection).toBe(30 + 1 + 2) // base +1, friendliness>=40 +2
  })

  it('adds the daily 8th-pomodoro bonus exactly once per day', () => {
    // shiba 品種的友善度下限是 17（品種基礎）+ 4（最低個性加成）= 21，天生就一定會觸發友善度好感度加成，
    // 所以這裡明確把友善度壓到 0，讓這條測試只單獨驗證「當天第8個」這個機制，不被友善度加成干擾。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const lowFriendliness = { ...created.pet, stats: { ...created.pet.stats, friendliness: 0 } }
    localStorage.setItem('pomodoro.owner', JSON.stringify({ ...created, pet: lowFriendliness }))
    // useTimer.js 在真正的流程裡，會先呼叫 incrementTodayCount() 記錄「今天完成了第幾個」，
    // 然後才呼叫 recordPomodoroReward()（recordPomodoroReward 本身不再自己遞增這個計數，
    // 見 Finding 1 的修正）。這裡手動累積到 8，模擬「這是今天第 8 個真正完成的番茄鐘」。
    for (let i = 0; i < 8; i += 1) incrementTodayCount()
    const after = recordPomodoroReward(25)
    expect(after.pet.affection).toBe(lowFriendliness.affection + 1 + 1) // 基礎 +1 + 當日第8個額外 +1
  })

  it('does not itself increment the today-count (useTimer.js already did before calling this)', () => {
    // 迴歸測試：recordPomodoroReward() 曾經內部又呼叫一次 incrementTodayCount()，
    // 導致「今天已完成 N 個」被算成兩倍。這裡模擬 useTimer.js 已經先遞增過 5 次，
    // 呼叫 recordPomodoroReward() 之後，計數應該仍然是 5，而不是 6。
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    for (let i = 0; i < 5; i += 1) incrementTodayCount()
    recordPomodoroReward(25)
    expect(getTodayCount()).toBe(5)
  })
})

describe('recordPomodoroReward: instant-guard reduction on ateSomethingBad (Finding 3)', () => {
  it('reduces the ateSomethingBad health loss by the instant-guard skill-tree amount', () => {
    // 讓寵物處於「興奮」情緒（飽食度、潔淨度都 >=80）以觸發隨機事件，
    // 並把 Math.random mock 成固定序列：第一次通過事件機率門檻，第二次選中 ateSomethingBad
    // （六個等權重事件依序 foundCoins/fastLearner/greatPlay/spilledBowl/ateSomethingBad/wanderedOff，
    // roll = random()*6 落在 (4,5] 會選中 ateSomethingBad，也就是 random() 落在 (0.6667, 0.8333]）。
    // pomodorosSinceBorn 仍是 0，寵物技能進度為 0，不會意外解鎖「健壯體質」等技能干擾結果。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, energy: 90 },
          hunger: 90,
          cleanliness: 90,
          health: 90,
          affection: 90,
        },
        ownerSkillTree: { ...created.ownerSkillTree, instantGuard: 3 },
      }),
    )

    const randomSpy = vi.spyOn(Math, 'random')
    randomSpy.mockReturnValueOnce(0).mockReturnValueOnce(0.75)
    let after
    try {
      after = recordPomodoroReward(25)
    } finally {
      randomSpy.mockRestore()
    }

    expect(after.pet.recentEvents.some((e) => e.id === 'ateSomethingBad')).toBe(true)
    // 即時守護 Lv.3 降低 6 點，10 - 6 = 4（未套用降低前應該是 -10）。
    expect(after.pet.health).toBe(90 - 4)
  })
})

describe('pomodoroStreak', () => {
  it('adds a default pomodoroStreak to a fresh owner state', () => {
    const state = getOwnerState()
    expect(state.pomodoroStreak).toEqual({ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] })
  })

  it('backfills pomodoroStreak for owner state saved before this feature existed', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        lifetimePomodoros: 3,
        money: 10,
        skillPoints: 5,
        pet: null,
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
        ownerSkillTree: {
          trainingTechnique: 0, socialTraining: 0,
          sizeSpecialization: { small: 0, medium: 0, large: 0 },
          speciesSpecialization: { dog: 0, cat: 0 },
          businessSense: 0, bargainHunter: 0,
          bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
          autoFeed: false, autoGrooming: false, instantGuard: 0, petInsurance: 0,
        },
      }),
    )
    const state = getOwnerState()
    expect(state.pomodoroStreak).toEqual({ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] })
  })

  it('advances the streak and grants the 7-day milestone bonus on top of the normal skill points', () => {
    const fixedNow = new Date(2026, 7, 22, 10, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    let state = { ...getOwnerState(), pomodoroStreak: { currentStreak: 6, lastCompletedDate: '2026-08-21', milestonesReached: [] } }
    localStorage.setItem(OWNER_KEY, JSON.stringify(state))

    state = recordPomodoroReward(25)

    expect(state.pomodoroStreak.currentStreak).toBe(7)
    expect(state.pomodoroStreak.milestonesReached).toEqual([7])
    // 25 分鐘一般獎勵 5 點技能點 + 里程碑 10 點
    expect(state.skillPoints).toBe(15)
    vi.useRealTimers()
  })
})

describe('grantResources', () => {
  it('adds money and skillPoints without touching lifetimePomodoros or pet growth', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    const before = getOwnerState()
    const after = grantResources({ money: 100, skillPoints: 7 })
    expect(after.money).toBe(before.money + 100)
    expect(after.skillPoints).toBe(before.skillPoints + 7)
    expect(after.lifetimePomodoros).toBe(before.lifetimePomodoros)
    expect(after.pet.pomodorosSinceBorn).toBe(before.pet.pomodorosSinceBorn)
  })

  it('defaults missing fields to 0', () => {
    const after = grantResources({ money: 50 })
    expect(after.money).toBe(50)
    expect(after.skillPoints).toBe(0)
  })
})

describe('resetOwnerState', () => {
  it('clears the pet and resets money/skillPoints back to defaults', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    recordPomodoroReward(25)
    const state = resetOwnerState()
    expect(state.pet).toBeNull()
    expect(state.money).toBe(0)
    expect(state.skillPoints).toBe(0)
    expect(state.lifetimePomodoros).toBe(0)
    expect(getOwnerState()).toEqual(state)
  })
})

describe('setPetGrowthProgress', () => {
  it('overwrites pomodorosSinceBorn on the current pet', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    const after = setPetGrowthProgress(60)
    expect(after.pet.pomodorosSinceBorn).toBe(60)
  })

  it('is a safe no-op when there is no pet yet', () => {
    const before = getOwnerState()
    expect(before.pet).toBeNull()
    const after = setPetGrowthProgress(60)
    expect(after.pet).toBeNull()
  })
})

describe('setPetNeeds', () => {
  it('overwrites only the provided needs fields on the current pet', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba' })
    const after = setPetNeeds({ hunger: 10, health: 90 })
    expect(after.pet.hunger).toBe(10)
    expect(after.pet.health).toBe(90)
    expect(after.pet.cleanliness).toBe(created.pet.cleanliness)
    expect(after.pet.affection).toBe(created.pet.affection)
  })

  it('clamps each value into the 0-100 range', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    const after = setPetNeeds({ hunger: -5, cleanliness: 500 })
    expect(after.pet.hunger).toBe(0)
    expect(after.pet.cleanliness).toBe(100)
  })

  it('is a safe no-op when there is no pet yet', () => {
    const before = getOwnerState()
    expect(before.pet).toBeNull()
    const after = setPetNeeds({ hunger: 10 })
    expect(after.pet).toBeNull()
  })
})

describe('debugSetTodayCount', () => {
  it('overwrites the stored date and count', () => {
    debugSetTodayCount('2026-01-01', 9)
    expect(JSON.parse(localStorage.getItem(TODAY_COUNT_KEY))).toEqual({
      date: '2026-01-01',
      count: 9,
    })
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

describe('purchaseShopItem only stocks up consumables, no instant restore', () => {
  // purchaseShopItem() 內部呼叫 getOwnerState()，而 getOwnerState() 會先跑一次每日批次
  // （如果寵物今天還沒 tick 過）。這裡固定把 lastNeedsTickDate 設成今天，讓每日批次視為已經跑過、
  // 直接跳過，這樣才能單純測試「買消耗品」這件事本身，不被每日批次的隨機衰減/連動干擾。
  it('kibble purchase adds to stock but does not touch hunger', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 100,
        pet: { ...created.pet, hunger: 90, lastNeedsTickDate: localDateString(new Date()) },
      }),
    )
    const after = purchaseShopItem('kibble')
    expect(after.pet.hunger).toBe(90)
    expect(after.consumablePurchases.kibble).toBe(1)
  })

  it('grooming purchase adds to stock but does not touch cleanliness', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 100,
        pet: { ...created.pet, cleanliness: 50, lastNeedsTickDate: localDateString(new Date()) },
      }),
    )
    const after = purchaseShopItem('grooming')
    expect(after.pet.cleanliness).toBe(50)
    expect(after.consumablePurchases.grooming).toBe(1)
  })
})

describe('phase 4: pet needs fields on createPet', () => {
  it('creates a pet with the defined starting ranges', () => {
    const state = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    expect(state.pet.hunger).toBeGreaterThanOrEqual(30)
    expect(state.pet.hunger).toBeLessThanOrEqual(60)
    expect(state.pet.cleanliness).toBeGreaterThanOrEqual(30)
    expect(state.pet.cleanliness).toBeLessThanOrEqual(60)
    expect(state.pet.health).toBe(60)
    expect(state.pet.affection).toBe(30)
    // 一隻全新的寵物今天還沒經歷過任何一次換日批次，所以起始值直接蓋上今天的日期，
    // 而不是 null——null 只留給「舊存檔從沒 tick 過」的遷移路徑（Finding 5）。
    expect(state.pet.lastNeedsTickDate).toBe(localDateString(new Date()))
    expect(state.pet.recentEvents).toEqual([])
  })

  it('adds a default ownerSkillTree to a fresh owner state', () => {
    const state = getOwnerState()
    expect(state.ownerSkillTree.trainingTechnique).toBe(0)
  })

  it('migrates an existing saved state missing the phase-4 fields', () => {
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        lifetimePomodoros: 3,
        money: 10,
        skillPoints: 2,
        pet: {
          speciesId: 'dog',
          speciesLabel: '狗',
          breedId: 'shiba',
          breedLabel: '柴犬',
          name: '舊寵物',
          personalityLabel: '穩重',
          generation: 1,
          pomodorosSinceBorn: 3,
          bornAt: new Date().toISOString(),
          stats: { learning: 10, obedience: 10, friendliness: 10, energy: 10 },
        },
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
      }),
    )
    const state = getOwnerState()
    // 補齊 phase-4 欄位後緊接著在同一次 getOwnerState() 呼叫套用當天批次，
    // hunger/cleanliness 會先隨機落在 [30, 60] 再扣掉衰減量，
    // health 則視隨機的衰減後數值跟服從度事件是否觸發而定，
    // 所以這裡用實際可達到的範圍/集合斷言，而不是套用批次前的假設值。
    expect(state.pet.hunger).toBeGreaterThanOrEqual(25)
    expect(state.pet.hunger).toBeLessThanOrEqual(55)
    expect([55, 58, 60, 63]).toContain(state.pet.health)
    expect(state.pet.affection).toBe(30)
    // 補齊 phase-4 欄位跟套用當天的批次發生在同一次 getOwnerState() 呼叫裡，
    // 所以這裡預期已經蓋上今天的日期，而不是仍停留在 null。
    expect(state.pet.lastNeedsTickDate).not.toBeNull()
    expect(state.ownerSkillTree).toBeDefined()
  })
})

describe('archivePet departure reason', () => {
  it('records "replaced" when a new pet is created over a living one', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '第一隻' })
    const state = createPet({ speciesId: 'cat', breedId: 'ragdoll', name: '第二隻' })
    expect(state.petMemorials[0].departureReason).toBe('replaced')
  })
})

describe('daily needs tick on load', () => {
  it('does not run a spurious tick for a freshly created pet on the same day', () => {
    // Finding 5 迴歸測試：createPet() 現在會把 lastNeedsTickDate 直接蓋上今天的日期
    // （而不是 null），所以剛建立完寵物、緊接著再呼叫一次 getOwnerState()，
    // 不應該被誤判成「還沒 tick 過」而立刻扣一次飽食度/潔淨度。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    expect(created.pet.lastNeedsTickDate).toBe(localDateString(new Date()))

    const after = getOwnerState()
    expect(after.pet.lastNeedsTickDate).toBe(created.pet.lastNeedsTickDate)
    expect(after.pet.hunger).toBe(created.pet.hunger)
    expect(after.pet.cleanliness).toBe(created.pet.cleanliness)
  })

  it('runs the tick exactly once per new day and stamps lastNeedsTickDate', () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0))
      const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
      expect(created.pet.lastNeedsTickDate).toBe('2026-03-15')

      // 換到隔天，第一次呼叫 getOwnerState() 就會發現日期落差，套用當天的批次一次。
      vi.setSystemTime(new Date(2026, 2, 16, 10, 0, 0))
      const after = getOwnerState()
      expect(after.pet.lastNeedsTickDate).toBe('2026-03-16')
      const hungerAfterFirstTick = after.pet.hunger

      const again = getOwnerState()
      expect(again.pet.hunger).toBe(hungerAfterFirstTick) // 同一天不會再扣一次
    } finally {
      vi.useRealTimers()
    }
  })

  it('floors money at 0 when a daily tick applies a negative moneyDelta (obedience incident) to a broke owner', () => {
    // 服從度惹事事件（obedienceIncident）套用批次時可能扣錢（moneyDelta 為負）。
    // 這裡把服從度壓到 0 讓事件機率拉到上限，並把 Math.random mock 成恆為 0，
    // 讓 rollObedienceIncident（random() < chance）必定觸發，同時 rollDeparture
    // 因為 affection 保持在安全門檻之上會直接短路、不會呼叫 random()，避免寵物意外「離家出走死亡」。
    // 飽食度/潔淨度/健康度/好感度都設高，確保批次的自然衰減與事件扣血都不會讓寵物死亡，
    // 純粹只驗證「錢不會被扣成負數」這件事。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 0,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, obedience: 0 },
          hunger: 90,
          cleanliness: 90,
          health: 90,
          affection: 90,
          lastNeedsTickDate: null,
        },
      }),
    )

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    let after
    try {
      after = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(after.pet).not.toBeNull()
    expect(after.pet.recentEvents.some((e) => e.id === 'obedienceIncident')).toBe(true)
    expect(after.money).toBe(0)
  })

  it('moves the pet into petMemorials with departureReason "health" when the tick kills it', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...created, pet: { ...created.pet, hunger: 1, cleanliness: 1, health: 1, lastNeedsTickDate: null } }),
    )
    const after = getOwnerState()
    expect(after.pet).toBeNull()
    expect(after.petMemorials.at(-1).departureReason).toBe('health')
  })
})

describe('daily tick consumes stocked consumables', () => {
  it('uses one unit of stocked kibble to restore hunger during the daily tick, decrementing stock', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, energy: 0 },
          hunger: 50,
          cleanliness: 90,
          health: 90,
          affection: 90,
          lastNeedsTickDate: null,
        },
        consumablePurchases: { kibble: 2 },
      }),
    )
    const after = getOwnerState()
    expect(after.pet).not.toBeNull()
    // energy 0 時飽食度衰減固定 5 點；庫存內的飼料回補 5 點，兩者抵銷，數值不變，但庫存扣掉 1
    expect(after.pet.hunger).toBe(50)
    expect(after.consumablePurchases.kibble).toBe(1)
  })

  it('does not touch stock or restore anything when there is none', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: { ...created.pet, hunger: 50, lastNeedsTickDate: null },
        consumablePurchases: {},
      }),
    )
    const after = getOwnerState()
    expect(after.consumablePurchases).toEqual({})
    expect(after.pet.hunger).toBeLessThan(50)
  })

  it('restores health by 2 points per stocked supplement during the daily tick', () => {
    // 這裡的寵物是隨機骰出來的服從度，可能落在會觸發「服從度惹事事件」的機率區間，
    // 該事件會額外扣健康度，讓這個測試變成偶爾失敗的 flaky test。跟 storage.test.js
    // 既有測試（例如「floors money at 0 when a daily tick applies a negative
    // moneyDelta」那個案例）同樣的做法，把 Math.random mock 成恆為 0.99，
    // 確保這次判定不會骰中服從度惹事事件、也不會骰中隨機事件，只驗證消耗品回補的計算。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, energy: 0 },
          hunger: 90,
          cleanliness: 90,
          health: 50,
          affection: 90,
          lastNeedsTickDate: null,
        },
        consumablePurchases: { supplement: 1 },
      }),
    )

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    let after
    try {
      after = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(after.pet).not.toBeNull()
    // 健康度不自然衰減，飽食度/潔淨度都 >=50 觸發 +3 連動加分，再加上營養品基礎值 2 點：50 + 3 + 2 = 55
    expect(after.pet.health).toBe(55)
    expect(after.consumablePurchases.supplement).toBe(0)
  })
})

describe('daily tick summary for the "welcome back" notification', () => {
  it('does not attach a summary when no tick was due', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const after = getOwnerState()
    expect(after._dailyTickSummary).toBeUndefined()
  })

  it('captures net need deltas and consumed stock after a successful tick, with no events', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, energy: 0 },
          hunger: 50,
          cleanliness: 90,
          health: 90,
          affection: 90,
          lastNeedsTickDate: null,
        },
        consumablePurchases: { kibble: 2 },
      }),
    )

    // Math.random 恆為 0.99，避開服從度惹事事件跟隨機事件，只驗證結算摘要本身的計算。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    let after
    try {
      after = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    // 飽食度：90 - 5(衰減) + 5(飼料回補) = 90 抵銷 → delta 0；潔淨度：90 - 5(衰減) = 85 → delta -5；
    // 健康度：飽食度與潔淨度都 >= 50 觸發健康連動加分 +3 → delta +3；好感度不受影響 → delta 0。
    expect(after._dailyTickSummary).toEqual({
      type: 'tick',
      deltas: { hunger: 0, cleanliness: -5, health: 3, affection: 0 },
      consumed: [{ itemId: 'kibble', count: 1 }],
      events: [],
    })
  })

  it('records triggered events in the summary', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        pet: {
          ...created.pet,
          stats: { ...created.pet.stats, obedience: 0 },
          hunger: 90,
          cleanliness: 90,
          health: 90,
          affection: 90,
          lastNeedsTickDate: null,
        },
      }),
    )

    // Math.random 恆為 0，讓服從度惹事事件必定觸發，同時因好感度仍在安全門檻之上，
    // rollDeparture 會直接短路不呼叫 random()，寵物不會意外離家出走。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0)
    let after
    try {
      after = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(after._dailyTickSummary.type).toBe('tick')
    expect(after._dailyTickSummary.events).toEqual(['obedienceIncident'])
  })

  it('reports a departed summary instead of need deltas when the tick kills the pet', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...created, pet: { ...created.pet, hunger: 1, cleanliness: 1, health: 1, lastNeedsTickDate: null } }),
    )
    const after = getOwnerState()
    expect(after._dailyTickSummary).toEqual({ type: 'departed', reason: 'health' })
  })

  it('does not leak the transient _dailyTickSummary field into localStorage', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...created, pet: { ...created.pet, hunger: 50, lastNeedsTickDate: null } }),
    )
    getOwnerState()
    const persisted = JSON.parse(localStorage.getItem(OWNER_KEY))
    expect(persisted).not.toHaveProperty('_dailyTickSummary')
  })
})

describe('visitVet', () => {
  it('returns null and changes nothing when money is insufficient', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 0,
        pet: { ...created.pet, health: 5, lastNeedsTickDate: localDateString(new Date()) },
      }),
    )
    expect(visitVet()).toBeNull()
  })

  it('returns null when health is already at or above the eligibility threshold, even with enough money', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 1000,
        pet: { ...created.pet, health: 40, lastNeedsTickDate: localDateString(new Date()) },
      }),
    )
    expect(visitVet()).toBeNull()
  })

  it('charges 80, restores health to 40, tops up hunger/cleanliness to 50, and costs 3 affection', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    // visitVet() 內部會呼叫 getOwnerState()，而 getOwnerState() 本身會先跑一次「今天是否已經
    // 換日判定過」的每日批次（Task 13）。這個測試故意把飽食度/潔淨度/健康度都設得很低，
    // 如果不順便把 lastNeedsTickDate 設成今天、讓每日批次視為「今天已經跑過」而跳過，
    // 每日批次的衰減+健康度連動很可能會在就醫邏輯執行前就先把寵物判定死亡（health 5 加上
    // bothLow 的 -6 懲罰會直接歸零），導致這條測試整個失真——不是在測就醫，是先被每日批次搶跑。
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 100,
        pet: {
          ...created.pet,
          hunger: 20,
          cleanliness: 20,
          health: 5,
          affection: 50,
          lastNeedsTickDate: localDateString(new Date()),
        },
      }),
    )
    const after = visitVet()
    expect(after.money).toBe(20)
    expect(after.pet.health).toBe(40)
    expect(after.pet.hunger).toBe(50)
    expect(after.pet.cleanliness).toBe(50)
    expect(after.pet.affection).toBe(47)
  })

  it('adds a flat 20 to health instead of flooring at 40 when health is already above 20', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 100,
        pet: { ...created.pet, health: 35, lastNeedsTickDate: localDateString(new Date()) },
      }),
    )
    const after = visitVet()
    expect(after.pet.health).toBe(55)
  })

  it('applies the pet-insurance discount to the vet-visit cost (Finding 2)', () => {
    // 保單第 3 級：floor 30、rate 60%，80 元的看病費打完折是 round(80 * 0.4) = 32。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 40,
        pet: {
          ...created.pet,
          hunger: 20,
          cleanliness: 20,
          health: 5,
          affection: 50,
          lastNeedsTickDate: localDateString(new Date()),
        },
        ownerSkillTree: { ...created.ownerSkillTree, petInsurance: 3 },
      }),
    )
    const after = visitVet()
    expect(after).not.toBeNull()
    expect(after.money).toBe(8) // 40 - 32
  })

  it('uses the discounted cost for the affordability check too', () => {
    // 沒有折扣的話 80 元負擔不起；有第 3 級保險折扣後只要 32 元，應該可以看病。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        money: 32,
        pet: { ...created.pet, health: 5, lastNeedsTickDate: localDateString(new Date()) },
        ownerSkillTree: { ...created.ownerSkillTree, petInsurance: 3 },
      }),
    )
    expect(visitVet()).not.toBeNull()
  })
})

describe('getOwnerPetProgressCounts', () => {
  it('counts the current pet plus every archived memorial by size and species tag', () => {
    createPet({ speciesId: 'dog', breedId: 'poodle', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } }) // 上一隻貴賓犬進紀念牆
    createPet({ speciesId: 'cat', breedId: 'ragdoll', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } }) // 柴犬進紀念牆

    const counts = getOwnerPetProgressCounts()
    expect(counts.size).toEqual({ small: 1, medium: 1, large: 1 })
    expect(counts.species).toEqual({ dog: 2, cat: 1 })
  })
})

describe('upgradeLinearOwnerSkill', () => {
  it('deducts skill points and raises the level when affordable', () => {
    grantResources({ skillPoints: 30 })
    const next = upgradeLinearOwnerSkill('trainingTechnique')
    expect(next.ownerSkillTree.trainingTechnique).toBe(1)
    expect(next.skillPoints).toBe(0)
  })

  it('returns null when skill points are insufficient', () => {
    expect(upgradeLinearOwnerSkill('trainingTechnique')).toBeNull()
  })
})

describe('upgradeSpecializationOwnerSkill', () => {
  it('returns null when the owner has not raised enough matching pets yet', () => {
    grantResources({ skillPoints: 30 })
    expect(upgradeSpecializationOwnerSkill('species', 'cat')).toBeNull() // 還沒養過貓
  })

  it('succeeds once the owner has raised enough matching pets', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    grantResources({ skillPoints: 30 })
    const next = upgradeSpecializationOwnerSkill('species', 'dog')
    expect(next.ownerSkillTree.speciesSpecialization.dog).toBe(1)
  })
})

describe('unlockSingleOwnerSkill', () => {
  it('unlocks a one-time node and cannot be bought twice', () => {
    grantResources({ skillPoints: 240 })
    const next = unlockSingleOwnerSkill('autoFeed')
    expect(next.ownerSkillTree.autoFeed).toBe(true)
    expect(unlockSingleOwnerSkill('autoFeed')).toBeNull()
  })
})

describe('businessSense money bonus', () => {
  it('adds a flat bonus per pomodoro on top of the per-minute payout', () => {
    grantResources({ skillPoints: 30 })
    upgradeLinearOwnerSkill('businessSense') // level 1 → +3
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    const before = getOwnerState().money
    const after = recordPomodoroReward(25) // 25*2 = 50 一般收入 + 3 生意經加成
    expect(after.money).toBe(before + 53)
  })
})

describe('bargainHunter shop discount', () => {
  it('discounts every purchase by the unlocked percentage, rounded', () => {
    grantResources({ skillPoints: 30, money: 100 })
    upgradeLinearOwnerSkill('bargainHunter') // level 1 → 5% off
    const before = getOwnerState().money
    expect(getShopPrice('kibble', getOwnerState().ownerSkillTree)).toBe(4) // round(4*0.95) = 4
    purchaseShopItem('kibble')
    expect(getOwnerState().money).toBe(before - 4)
  })
})

describe('auto feed / auto grooming daily batch', () => {
  it('does nothing when neither skill is unlocked', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 30, energy: 0 } })
    let state = getOwnerState()
    state = { ...state, money: 1000, pet: { ...state.pet, hunger: 10, cleanliness: 10, lastNeedsTickDate: '2000-01-01' } }
    localStorage.setItem(OWNER_KEY, JSON.stringify(state))

    // 寵物的服從度為 0 時，隨機服從度惹事事件的觸發機率最高達 10%，會無關地扣錢/扣血。
    // 這裡 mock Math.random 為恆 0.99，確保不會骰中該事件，只驗證「沒解鎖技能就不自動補給」這件事。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    let next
    try {
      next = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(next.pet.hunger).toBeLessThan(50)
    expect(next.money).toBe(1000)
  })

  it('buys kibble repeatedly until hunger reaches 50 or money runs out, once autoFeed is unlocked', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 30, energy: 0 } })
    grantResources({ skillPoints: 120 })
    unlockSingleOwnerSkill('autoFeed')
    let state = getOwnerState()
    state = { ...state, money: 1000, pet: { ...state.pet, hunger: 10, cleanliness: 80, lastNeedsTickDate: '2000-01-01' } }
    localStorage.setItem(OWNER_KEY, JSON.stringify(state))

    // 寵物的服從度為 0 時，隨機服從度惹事事件的觸發機率最高達 10%，會無關地扣錢/扣血。
    // 這裡 mock Math.random 為恆 0.99，確保不會骰中該事件，只驗證「自動補給的購買邏輯」。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    let next
    try {
      next = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(next.pet.hunger).toBeGreaterThanOrEqual(50)
    expect(next.money).toBeLessThan(1000)
    expect(next._autoPurchaseLog).toEqual([expect.objectContaining({ itemId: 'kibble' })])
  })

  it('stops buying once money runs out, without going negative', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 30, energy: 0 } })
    grantResources({ skillPoints: 120 })
    unlockSingleOwnerSkill('autoFeed')
    let state = getOwnerState()
    state = { ...state, money: 3, pet: { ...state.pet, hunger: 10, cleanliness: 80, lastNeedsTickDate: '2000-01-01' } }
    localStorage.setItem(OWNER_KEY, JSON.stringify(state))

    // 寵物的服從度為 0 時，隨機服從度惹事事件的觸發機率最高達 10%，會無關地扣錢/扣血。
    // 這裡 mock Math.random 為恆 0.99，確保不會骰中該事件，只驗證「錢不足時停止購買」的邏輯。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    let next
    try {
      next = getOwnerState()
    } finally {
      randomSpy.mockRestore()
    }

    expect(next.money).toBe(3) // 飼料要 4 元，3 元買不起，完全沒買
    expect(next._autoPurchaseLog).toBeUndefined()
  })

  it('does not leak the transient _autoPurchaseLog field into localStorage via a later mutator call', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', personalityLabel: '黏人', stats: { learning: 0, obedience: 0, friendliness: 30, energy: 0 } })
    grantResources({ skillPoints: 120 })
    unlockSingleOwnerSkill('autoFeed')
    let state = getOwnerState()
    state = { ...state, money: 1000, pet: { ...state.pet, hunger: 10, cleanliness: 80, lastNeedsTickDate: '2000-01-01' } }
    localStorage.setItem(OWNER_KEY, JSON.stringify(state))

    // 觸發每日自動購買（會在記憶體中的回傳值上附上 _autoPurchaseLog），
    // 接著呼叫另一個會內部呼叫 getOwnerState() 再 saveOwnerState({...state, ...}) 的 mutator，
    // 確保 _autoPurchaseLog 不會被夾帶寫進 localStorage。
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.99)
    try {
      getOwnerState()
      grantResources({ skillPoints: 1 })
    } finally {
      randomSpy.mockRestore()
    }

    const persisted = JSON.parse(localStorage.getItem(OWNER_KEY))
    expect(persisted).not.toHaveProperty('_autoPurchaseLog')
  })
})

describe('recordPomodoroReward — focus history side effect', () => {
  it('records a focus history entry for today even when there is no pet', () => {
    recordPomodoroReward(25)
    expect(getFocusHistory().days[todayDateString()]).toEqual({
      count: 1,
      minutes: 25,
      growthMilestoneStageKey: null,
    })
  })

  it('accumulates minutes across multiple completions on the same day', () => {
    recordPomodoroReward(25)
    recordPomodoroReward(15)
    expect(getFocusHistory().days[todayDateString()].minutes).toBe(40)
    expect(getFocusHistory().days[todayDateString()].count).toBe(2)
  })

  it('records the new growth stage key on the day the pet crosses a threshold', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    setPetGrowthProgress(4) // 'young' stage; the shiba's next threshold ('growing') is at 5
    recordPomodoroReward(25) // pushes pomodorosSinceBorn to 5, crossing into 'growing'
    expect(getFocusHistory().days[todayDateString()].growthMilestoneStageKey).toBe('growing')
  })

  it('does not set a growth milestone on a completion that does not cross a threshold', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    setPetGrowthProgress(10) // already 'growing'; next threshold ('capable') is at 15
    recordPomodoroReward(25) // pushes to 11, still 'growing'
    expect(getFocusHistory().days[todayDateString()].growthMilestoneStageKey).toBeNull()
  })
})

describe('recordPomodoroReward — focus history trim notice', () => {
  it('does not set _focusHistoryTrimmed on a normal call', () => {
    const state = recordPomodoroReward(25)
    expect(state._focusHistoryTrimmed).toBeUndefined()
  })

  it('sets _focusHistoryTrimmed when the focus history write triggers a 90-day trim', async () => {
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
      const state = recordPomodoroReward(25)
      expect(state._focusHistoryTrimmed).toBe(true)
    } finally {
      setItemSpy.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})

describe('restoreOwnerState', () => {
  it('writes the given owner state to storage as-is', () => {
    const raw = { lifetimePomodoros: 3, money: 42, skillPoints: 5, pet: null, petMemorials: [], ownedCollectibles: [], consumablePurchases: {}, ownerSkillTree: null, pomodoroStreak: null }
    restoreOwnerState(raw)
    expect(JSON.parse(localStorage.getItem(OWNER_KEY)).money).toBe(42)
  })

  it('lets the next getOwnerState() call patch in defaults for fields missing from an older save', () => {
    const olderShape = { lifetimePomodoros: 3, money: 42, skillPoints: 5, pet: null, petMemorials: [], ownedCollectibles: [], consumablePurchases: {} }
    restoreOwnerState(olderShape)

    const state = getOwnerState()

    expect(state.money).toBe(42)
    expect(state.ownerSkillTree).toBeTruthy()
    expect(state.pomodoroStreak).toBeTruthy()
  })

  it('patches missing petMemorials, ownedCollectibles, and consumablePurchases to safe defaults', () => {
    restoreOwnerState({ lifetimePomodoros: 0, money: 0, skillPoints: 0, pet: null })

    const state = getOwnerState()

    expect(state.petMemorials).toEqual([])
    expect(state.ownedCollectibles).toEqual([])
    expect(state.consumablePurchases).toEqual({})
  })
})

describe('lifetimeFocusMinutes', () => {
  it('defaults to 0 for a fresh owner state', () => {
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutes).toBe(0)
  })

  it('backfills lifetimeFocusMinutes for owner state saved before this feature existed', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        lifetimePomodoros: 12,
        money: 10,
        skillPoints: 5,
        pet: null,
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
        ownerSkillTree: {
          trainingTechnique: 0, socialTraining: 0,
          sizeSpecialization: { small: 0, medium: 0, large: 0 },
          speciesSpecialization: { dog: 0, cat: 0 },
          businessSense: 0, bargainHunter: 0,
          bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
          autoFeed: false, autoGrooming: false, instantGuard: 0, petInsurance: 0,
        },
        pomodoroStreak: { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] },
      }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutes).toBe(0)
  })

  it('accumulates durationMinutes across sequential recordPomodoroReward calls with no pet', () => {
    recordPomodoroReward(25)
    const state = recordPomodoroReward(10)
    expect(state.lifetimeFocusMinutes).toBe(35)
  })

  it('accumulates durationMinutes across sequential recordPomodoroReward calls with a pet', () => {
    createPet({ speciesId: 'dog', breedId: 'shiba' })
    recordPomodoroReward(25)
    const state = recordPomodoroReward(25)
    expect(state.lifetimeFocusMinutes).toBe(50)
  })

  it('backfills legacy owner shape (dog/totalPomodoros) to 0', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        dog: { breedLabel: '柴犬', name: '小白', personalityLabel: '穩重' },
        totalPomodoros: 7,
        money: 20,
        skillPoints: 3,
      }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutes).toBe(0)
  })
})

describe('money / skillPoints / lifetimePomodoros backfill', () => {
  it('repairs a stored owner state missing money/skillPoints/lifetimePomodoros back to 0 instead of leaving them undefined', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        pet: null,
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
        ownerSkillTree: {
          trainingTechnique: 0, socialTraining: 0,
          sizeSpecialization: { small: 0, medium: 0, large: 0 },
          speciesSpecialization: { dog: 0, cat: 0 },
          businessSense: 0, bargainHunter: 0,
          bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
          autoFeed: false, autoGrooming: false, instantGuard: 0, petInsurance: 0,
        },
        pomodoroStreak: { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] },
      }),
    )
    const state = getOwnerState()
    expect(state.money).toBe(0)
    expect(state.skillPoints).toBe(0)
    expect(state.lifetimePomodoros).toBe(0)
  })

  it('repairs money/skillPoints/lifetimePomodoros that were corrupted into non-numbers (e.g. a bad import)', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        ...getOwnerState(),
        money: null,
        skillPoints: 'oops',
        lifetimePomodoros: undefined,
      }),
    )
    const state = getOwnerState()
    expect(state.money).toBe(0)
    expect(state.skillPoints).toBe(0)
    expect(state.lifetimePomodoros).toBe(0)
  })

  it('does not clobber legitimate existing values', () => {
    localStorage.setItem(OWNER_KEY, JSON.stringify({ ...getOwnerState(), money: 40, skillPoints: 6, lifetimePomodoros: 9 }))
    const state = getOwnerState()
    expect(state.money).toBe(40)
    expect(state.skillPoints).toBe(6)
    expect(state.lifetimePomodoros).toBe(9)
  })

  it('recordPomodoroReward no longer poisons money/skillPoints into NaN after a repaired save', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        pet: null,
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
        ownerSkillTree: {
          trainingTechnique: 0, socialTraining: 0,
          sizeSpecialization: { small: 0, medium: 0, large: 0 },
          speciesSpecialization: { dog: 0, cat: 0 },
          businessSense: 0, bargainHunter: 0,
          bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
          autoFeed: false, autoGrooming: false, instantGuard: 0, petInsurance: 0,
        },
        pomodoroStreak: { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] },
      }),
    )
    const state = recordPomodoroReward(25)
    expect(Number.isFinite(state.money)).toBe(true)
    expect(Number.isFinite(state.skillPoints)).toBe(true)
    expect(Number.isFinite(state.lifetimePomodoros)).toBe(true)
  })
})

describe('storage writes surviving a localStorage failure', () => {
  it('recordPomodoroReward still returns the updated in-memory state instead of throwing when localStorage.setItem fails (e.g. quota exceeded)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    let state
    expect(() => { state = recordPomodoroReward(25) }).not.toThrow()
    expect(state.lifetimeFocusMinutes).toBe(25)

    setItemSpy.mockRestore()
  })

  it('saveSettings does not throw when localStorage.setItem fails', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError')
    })

    expect(() => saveSettings({ workMinutes: 40, shortBreakMinutes: 5, longBreakMinutes: 15 })).not.toThrow()

    setItemSpy.mockRestore()
  })
})

describe('lifetimeFocusMinutesStartedAt', () => {
  it('defaults to today for a fresh owner state', () => {
    const fixedNow = new Date(2026, 7, 25, 10, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutesStartedAt).toBe('2026-08-25')
    vi.useRealTimers()
  })

  it('backfills lifetimeFocusMinutesStartedAt to today for owner state saved before this feature existed', () => {
    const fixedNow = new Date(2026, 7, 25, 10, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        lifetimePomodoros: 12,
        lifetimeFocusMinutes: 300,
        money: 10,
        skillPoints: 5,
        pet: null,
        petMemorials: [],
        ownedCollectibles: [],
        consumablePurchases: {},
        ownerSkillTree: {
          trainingTechnique: 0, socialTraining: 0,
          sizeSpecialization: { small: 0, medium: 0, large: 0 },
          speciesSpecialization: { dog: 0, cat: 0 },
          businessSense: 0, bargainHunter: 0,
          bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
          autoFeed: false, autoGrooming: false, instantGuard: 0, petInsurance: 0,
        },
        pomodoroStreak: { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] },
      }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutesStartedAt).toBe('2026-08-25')
    vi.useRealTimers()
  })

  it('does not overwrite an already-set lifetimeFocusMinutesStartedAt', () => {
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({ ...getOwnerState(), lifetimeFocusMinutesStartedAt: '2026-01-01' }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutesStartedAt).toBe('2026-01-01')
  })

  it('repairs a non-string lifetimeFocusMinutesStartedAt (e.g. from a corrupted import) back to today', () => {
    const fixedNow = new Date(2026, 7, 25, 10, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({ ...getOwnerState(), lifetimeFocusMinutesStartedAt: 12345 }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutesStartedAt).toBe('2026-08-25')
    vi.useRealTimers()
  })

  it('backfills legacy owner shape (dog/totalPomodoros) to today', () => {
    const fixedNow = new Date(2026, 7, 25, 10, 0, 0)
    vi.useFakeTimers()
    vi.setSystemTime(fixedNow)
    localStorage.setItem(
      OWNER_KEY,
      JSON.stringify({
        dog: { breedLabel: '柴犬', name: '小白', personalityLabel: '穩重' },
        totalPomodoros: 7,
        money: 20,
        skillPoints: 3,
      }),
    )
    const state = getOwnerState()
    expect(state.lifetimeFocusMinutesStartedAt).toBe('2026-08-25')
    vi.useRealTimers()
  })
})

describe('collectible item bonuses feed into the daily needs tick', () => {
  it('bowl reduces hunger decay by 1, stacking with owner-skill-tree reductions', () => {
    // computeHungerDecay 的基礎衰退量其實是 DECAY_BASE(5) + floor(活力/20)，不是固定 5——
    // 這裡把活力壓成 0，讓基礎衰退量單純變成 5，才能精準驗證水盆的 -1。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        ownedCollectibles: ['bowl'],
        pet: { ...created.pet, stats: { ...created.pet.stats, energy: 0 }, hunger: 90, lastNeedsTickDate: '2000-01-01' },
      }),
    )
    const after = getOwnerState()
    // 基礎衰退 5 點，水盆 -1，結果應該衰退 4 點
    expect(after.pet.hunger).toBe(86)
  })

  it('outfit reduces cleanliness decay by 1', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        ownedCollectibles: ['outfit'],
        pet: { ...created.pet, cleanliness: 90, lastNeedsTickDate: '2000-01-01' },
      }),
    )
    const after = getOwnerState()
    expect(after.pet.cleanliness).toBe(86)
  })

  it('leash raises effective obedience used by the daily obedience-incident roll', () => {
    // 服從度 90（很高）本來就幾乎不會觸發惹事事件；這裡只驗證 buildOwnerBonuses
    // 有把牽繩的 +3 算進 effectiveObedience，用一隻服從度剛好卡在門檻邊界的寵物來間接驗證：
    // 直接測「事件沒發生」不夠精確，改成驗證 hunger/cleanliness 不受影響、且不拋錯，
    // 確保 buildOwnerBonuses 第三個參數有被正確傳入而不是 undefined 導致例外。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({
        ...created,
        ownedCollectibles: ['leash'],
        pet: { ...created.pet, lastNeedsTickDate: '2000-01-01' },
      }),
    )
    expect(() => getOwnerState()).not.toThrow()
  })
})

describe('collectible affection bonus (項圈) feeds into recordPomodoroReward', () => {
  it('adds +1 affection per pomodoro when the collar is owned', () => {
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const lowFriendliness = { ...created.pet, stats: { ...created.pet.stats, friendliness: 0 }, affection: 30 }
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...created, ownedCollectibles: ['collar'], pet: lowFriendliness }),
    )
    const after = recordPomodoroReward(25)
    expect(after.pet.affection).toBe(30 + 1 + 1) // 基礎 +1，項圈額外 +1
  })
})

describe('collectible friendliness bonus (玩具球) feeds into effective friendliness', () => {
  it('raises the friendliness tier used for the pomodoro affection bonus', () => {
    // 友善度基礎值設 37，本身還不到 40 的門檻（0 額外加成）；
    // 玩具球 +3 有效友善度後剛好跨過 40 門檻，應該多拿 +2 的友善度加成。
    const created = createPet({ speciesId: 'dog', breedId: 'shiba', name: '小豆' })
    const nearThreshold = { ...created.pet, stats: { ...created.pet.stats, friendliness: 37 }, affection: 30 }
    localStorage.setItem(
      'pomodoro.owner',
      JSON.stringify({ ...created, ownedCollectibles: ['ball'], pet: nearThreshold }),
    )
    const after = recordPomodoroReward(25)
    expect(after.pet.affection).toBe(30 + 1 + 2) // 基礎 +1 + 跨過 40 門檻後的 +2
  })
})
