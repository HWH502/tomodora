import { describe, expect, it } from 'vitest'
import {
  CAT_SKILLS,
  COMMON_SKILLS,
  DOG_SKILLS,
  getSkillProgress,
  getSpeciesSkillPool,
  getUnlockedPetSkillIds,
  hasPetSkill,
  PET_SKILL_DESCRIPTIONS,
} from './petSkills'

function makePet(overrides = {}) {
  return {
    speciesId: 'dog',
    pomodorosSinceBorn: 0,
    stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 },
    ...overrides,
  }
}

describe('getSkillProgress', () => {
  it('multiplies pomodoros by (1 + learning/100)', () => {
    expect(getSkillProgress(10, 20)).toBeCloseTo(12)
    expect(getSkillProgress(0, 50)).toBe(0)
  })
})

describe('getUnlockedPetSkillIds', () => {
  it('unlocks nothing below the lowest threshold (8)', () => {
    const pet = makePet({ pomodorosSinceBorn: 7, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    expect(getUnlockedPetSkillIds(pet)).toEqual([])
  })

  it('unlocks dog-only skill "sit" at progress 8, not the cat skill', () => {
    const pet = makePet({ speciesId: 'dog', pomodorosSinceBorn: 8, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    const ids = getUnlockedPetSkillIds(pet)
    expect(ids).toContain('sit')
    expect(ids).not.toContain('clawGentle')
  })

  it('unlocks cat-only skill "clawGentle" at progress 8 for cats', () => {
    const pet = makePet({ speciesId: 'cat', pomodorosSinceBorn: 8, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    expect(getUnlockedPetSkillIds(pet)).toContain('clawGentle')
  })

  it('unlocks common skills regardless of species once threshold is reached', () => {
    const pet = makePet({ speciesId: 'cat', pomodorosSinceBorn: 20, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    expect(getUnlockedPetSkillIds(pet)).toContain('sturdy')
  })

  it('accumulates all skills up to the pool ceiling when progress is high enough', () => {
    const pet = makePet({ speciesId: 'dog', pomodorosSinceBorn: 75, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    const ids = getUnlockedPetSkillIds(pet)
    expect(ids).toEqual(expect.arrayContaining(['sit', 'potty', 'selfEntertain', 'houseWatch', 'charm', 'sturdy', 'thrifty', 'veteran', 'luckyStar']))
  })

  it('returns no species-specific skills for species outside dog/cat', () => {
    const pet = makePet({ speciesId: 'unknown', pomodorosSinceBorn: 100, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    const ids = getUnlockedPetSkillIds(pet)
    expect(ids).not.toContain('sit')
    expect(ids).not.toContain('clawGentle')
    expect(ids).toContain('sturdy')
  })
})

describe('hasPetSkill', () => {
  it('checks a single skill id against the unlocked set', () => {
    const pet = makePet({ speciesId: 'dog', pomodorosSinceBorn: 8, stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 } })
    expect(hasPetSkill(pet, 'sit')).toBe(true)
    expect(hasPetSkill(pet, 'houseWatch')).toBe(false)
  })
})

describe('getSpeciesSkillPool', () => {
  it('returns the dog skill pool for dog', () => {
    expect(getSpeciesSkillPool('dog')).toBe(DOG_SKILLS)
  })

  it('returns the cat skill pool for cat', () => {
    expect(getSpeciesSkillPool('cat')).toBe(CAT_SKILLS)
  })

  it('returns an empty array for an unknown species', () => {
    expect(getSpeciesSkillPool('unknown')).toEqual([])
  })
})

describe('PET_SKILL_DESCRIPTIONS', () => {
  it('has a description for every dog, cat, and common skill id', () => {
    const allIds = [...DOG_SKILLS, ...CAT_SKILLS, ...COMMON_SKILLS].map((skill) => skill.id)
    allIds.forEach((id) => {
      expect(typeof PET_SKILL_DESCRIPTIONS[id]).toBe('string')
      expect(PET_SKILL_DESCRIPTIONS[id].length).toBeGreaterThan(0)
    })
  })
})
