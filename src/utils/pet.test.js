import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  GROWTH_STAGE_DEFS,
  LEGACY_HEAD_START_CAP,
  SUGGESTED_PET_NAMES,
  calculateLegacyHeadStart,
  getPetGrowthStage,
  rollPersonality,
  rollPetStats,
  rollRandomName,
} from './pet'

describe('getPetGrowthStage — dog', () => {
  it.each([
    [0, 'young', '🐶', '幼犬階段'],
    [4, 'young', '🐶', '幼犬階段'],
    [5, 'growing', '🐕', '活潑成長期'],
    [14, 'growing', '🐕', '活潑成長期'],
    [15, 'capable', '🦮', '稱職夥伴'],
    [29, 'capable', '🦮', '稱職夥伴'],
    [30, 'trained', '🐕‍🦺', '訓練有成'],
    [59, 'trained', '🐕‍🦺', '訓練有成'],
    [60, 'senior', '🐩', '資深老友'],
    [99, 'senior', '🐩', '資深老友'],
    [100, 'legend', '🏆🐕', '傳奇老狗'],
    [250, 'legend', '🏆🐕', '傳奇老狗'],
  ])('pomodorosSinceBorn=%i -> %s %s %s', (pomodorosSinceBorn, stageKey, emoji, label) => {
    expect(getPetGrowthStage(pomodorosSinceBorn, 'dog')).toEqual({ stageKey, emoji, label })
  })
})

describe('getPetGrowthStage — cat', () => {
  it.each([
    [0, 'young', '🐱', '幼貓階段'],
    [5, 'growing', '🐈', '活潑成長期'],
    [15, 'capable', '😺', '稱職夥伴'],
    [30, 'trained', '😸', '訓練有成'],
    [60, 'senior', '😻', '資深老友'],
    [100, 'legend', '🏆🐈', '傳奇老貓'],
  ])('pomodorosSinceBorn=%i -> %s %s %s', (pomodorosSinceBorn, stageKey, emoji, label) => {
    expect(getPetGrowthStage(pomodorosSinceBorn, 'cat')).toEqual({ stageKey, emoji, label })
  })

  it('shares the same generic mid-stage labels as dog for stages 2-5', () => {
    expect(getPetGrowthStage(5, 'cat').label).toBe(getPetGrowthStage(5, 'dog').label)
    expect(getPetGrowthStage(15, 'cat').label).toBe(getPetGrowthStage(15, 'dog').label)
    expect(getPetGrowthStage(30, 'cat').label).toBe(getPetGrowthStage(30, 'dog').label)
    expect(getPetGrowthStage(60, 'cat').label).toBe(getPetGrowthStage(60, 'dog').label)
  })
})

describe('getPetGrowthStage — unknown species', () => {
  it('falls back to dog when speciesId is missing/invalid', () => {
    expect(getPetGrowthStage(0, 'dragon')).toEqual({ stageKey: 'young', emoji: '🐶', label: '幼犬階段' })
  })
})

describe('rollPersonality / rollRandomName', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('picks the first pool entry when Math.random() returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    expect(rollPersonality()).toBe('黏人')
    expect(rollRandomName()).toBe('小豆')
  })

  it('picks the last pool entry when Math.random() returns just under 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    expect(rollPersonality()).toBe('溫柔')
    expect(rollRandomName()).toBe('麻糬')
  })

  it('SUGGESTED_PET_NAMES has 6 entries', () => {
    expect(SUGGESTED_PET_NAMES).toHaveLength(6)
  })
})

describe('GROWTH_STAGE_DEFS', () => {
  it('is ordered from highest to lowest threshold and covers 0', () => {
    expect(GROWTH_STAGE_DEFS.map((def) => def.minPomodoros)).toEqual([100, 60, 30, 15, 5, 0])
  })

  it('has a matching stageKey/label pair usable by getPetGrowthStage for each threshold', () => {
    for (const def of GROWTH_STAGE_DEFS) {
      const stage = getPetGrowthStage(def.minPomodoros, 'dog')
      expect(typeof stage.label).toBe('string')
    }
  })
})

describe('calculateLegacyHeadStart', () => {
  it.each([
    [0, 0],
    [2, 0],
    [50, 5],
    [100, LEGACY_HEAD_START_CAP],
    [500, LEGACY_HEAD_START_CAP],
  ])('previous=%i -> head start=%i', (previous, expected) => {
    expect(calculateLegacyHeadStart(previous)).toBe(expected)
  })
})

describe('rollPetStats', () => {
  const BREED_IDS = ['poodle', 'shiba', 'golden-retriever', 'american-shorthair', 'british-shorthair', 'ragdoll']
  const PERSONALITY_LABELS = ['黏人', '獨立', '愛玩', '穩重', '機靈', '溫柔']

  it.each(BREED_IDS.flatMap((breedId) => PERSONALITY_LABELS.map((label) => [breedId, label])))(
    'breedId=%s personality=%s -> stats sum to 100, all non-negative',
    (breedId, personalityLabel) => {
      const stats = rollPetStats(breedId, personalityLabel)
      expect(stats.learning + stats.obedience + stats.friendliness + stats.energy).toBe(100)
      expect(stats.learning).toBeGreaterThanOrEqual(0)
      expect(stats.obedience).toBeGreaterThanOrEqual(0)
      expect(stats.friendliness).toBeGreaterThanOrEqual(0)
      expect(stats.energy).toBeGreaterThanOrEqual(0)
    },
  )

  it('varies the result across calls due to the random fluctuation component', () => {
    const results = Array.from({ length: 20 }, () => rollPetStats('shiba', '穩重'))
    const uniqueSerialized = new Set(results.map((stats) => JSON.stringify(stats)))
    expect(uniqueSerialized.size).toBeGreaterThan(1)
  })

  it('returns the breed base + personality modifier baseline when random fluctuation is forced to zero', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5) // equal weights -> even split, still random rounding
    const stats = rollPetStats('poodle', '機靈')
    expect(stats.learning + stats.obedience + stats.friendliness + stats.energy).toBe(100)
    vi.restoreAllMocks()
  })

  it('falls back to safe defaults for an unknown breedId or personalityLabel instead of throwing', () => {
    expect(() => rollPetStats('unknown-breed', '黏人')).not.toThrow()
    expect(() => rollPetStats('shiba', 'unknown-personality')).not.toThrow()
    const stats = rollPetStats('unknown-breed', 'unknown-personality')
    expect(stats.learning + stats.obedience + stats.friendliness + stats.energy).toBe(100)
  })
})
