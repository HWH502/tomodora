import { describe, expect, it } from 'vitest'
import { buildShareCardData } from './shareCard'

const BASE_INPUT = {
  pet: null,
  petMemorials: [],
  lifetimePomodoros: 0,
  lifetimeFocusMinutes: 0,
  lifetimeFocusMinutesStartedAt: '2026-08-25',
}

describe('buildShareCardData: noPet variant', () => {
  it('returns the noPet variant when there is no pet and no memorials', () => {
    const data = buildShareCardData({
      ...BASE_INPUT,
      lifetimePomodoros: 128,
      lifetimeFocusMinutes: 3200,
    })
    expect(data.variant).toBe('noPet')
    expect(data.pet).toBeNull()
    expect(data.memorial).toBeNull()
    expect(data.stats.lifetimePomodoros).toBe(128)
    expect(data.stats.focusMinutesLabel).toBe('53 小時 20 分')
    expect(data.stats.startedAtLabel).toBe('2026/08/25')
  })

  it('formats minutes under an hour without the hours part', () => {
    const data = buildShareCardData({ ...BASE_INPUT, lifetimeFocusMinutes: 45 })
    expect(data.stats.focusMinutesLabel).toBe('45 分')
  })

  it('formats zero minutes as "0 分"', () => {
    const data = buildShareCardData(BASE_INPUT)
    expect(data.stats.focusMinutesLabel).toBe('0 分')
  })
})

describe('buildShareCardData: hasPet variant', () => {
  const pet = {
    speciesId: 'dog',
    breedId: 'shiba',
    breedLabel: '柴犬',
    name: '豆豆',
    generation: 1,
    pomodorosSinceBorn: 8,
  }

  it('returns the hasPet variant with no legacyLine when this is the first pet', () => {
    const data = buildShareCardData({ ...BASE_INPUT, pet, petMemorials: [] })
    expect(data.variant).toBe('hasPet')
    expect(data.memorial).toBeNull()
    expect(data.pet.name).toBe('豆豆')
    expect(data.pet.breedLabel).toBe('柴犬')
    expect(data.pet.speciesId).toBe('dog')
    expect(data.pet.breedId).toBe('shiba')
    expect(data.pet.generation).toBe(1)
    expect(data.pet.stageLabel).toBe('活潑成長期') // 8 pomodoros -> growing (>=5 and <15)
    expect(data.pet.stageKey).toBe('growing')
    expect(data.pet.legacyLine).toBeNull()
  })

  it('adds a legacyLine citing the highest-ranked past pet when memorials exist', () => {
    const petMemorials = [
      {
        speciesId: 'dog', breedId: 'shiba', name: '小白', generation: 1,
        daysWithOwner: 10, highestGrowthStageLabel: '稱職夥伴', departureReason: 'replaced',
      },
      {
        speciesId: 'dog', breedId: 'shiba', name: '小黑', generation: 2,
        daysWithOwner: 40, highestGrowthStageLabel: '資深老友', departureReason: 'health',
      },
    ]
    const data = buildShareCardData({ ...BASE_INPUT, pet: { ...pet, generation: 3 }, petMemorials })
    expect(data.pet.legacyLine).toBe('歷代最高紀錄：長大成資深老友')
  })
})

describe('buildShareCardData: memorial variant', () => {
  it('returns the memorial variant using the most recent (last) memorial, with a warm replaced-reason note', () => {
    const petMemorials = [
      {
        speciesId: 'dog', breedId: 'shiba', breedLabel: '柴犬', name: '小白', generation: 1,
        daysWithOwner: 10, highestGrowthStageLabel: '稱職夥伴', departureReason: 'replaced',
      },
      {
        speciesId: 'dog', breedId: 'shiba', breedLabel: '柴犬', name: '小雪', generation: 2,
        daysWithOwner: 87, highestGrowthStageLabel: '資深老友', departureReason: 'replaced',
      },
    ]
    const data = buildShareCardData({ ...BASE_INPUT, pet: null, petMemorials })
    expect(data.variant).toBe('memorial')
    expect(data.pet).toBeNull()
    expect(data.memorial.name).toBe('小雪')
    expect(data.memorial.breedLabel).toBe('柴犬')
    expect(data.memorial.daysWithOwner).toBe(87)
    expect(data.memorial.generation).toBe(2)
    expect(data.memorial.noteText).toBe('陪你度過 87 天，一起長大到「資深老友」，後來開始照顧新的家人了。')
  })

  it('writes a warm note for a health departure', () => {
    const petMemorials = [{
      speciesId: 'dog', breedId: 'shiba', breedLabel: '柴犬', name: '阿福', generation: 1,
      daysWithOwner: 22, highestGrowthStageLabel: '稱職夥伴', departureReason: 'health',
    }]
    const data = buildShareCardData({ ...BASE_INPUT, pet: null, petMemorials })
    expect(data.memorial.noteText).toBe('陪你度過 22 天，一起長大到「稱職夥伴」，後來生病離開了。')
  })

  it('falls back to a generic warm note for an unrecognized departure reason', () => {
    const petMemorials = [{
      speciesId: 'dog', breedId: 'shiba', breedLabel: '柴犬', name: '阿福', generation: 1,
      daysWithOwner: 5, highestGrowthStageLabel: '幼犬階段', departureReason: 'affection',
    }]
    const data = buildShareCardData({ ...BASE_INPUT, pet: null, petMemorials })
    expect(data.memorial.noteText).toBe('陪你度過 5 天，一起長大到「幼犬階段」，後來離開去別的地方了。')
  })
})
