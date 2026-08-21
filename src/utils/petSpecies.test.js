import { describe, expect, it } from 'vitest'
import { SPECIES, getBreedById, getBreedByLabel, getSpeciesById } from './petSpecies'

describe('SPECIES roster', () => {
  it('has at least one species, each with at least one breed', () => {
    expect(SPECIES.length).toBeGreaterThan(0)
    for (const species of SPECIES) {
      expect(species.breeds.length).toBeGreaterThan(0)
    }
  })

  it('has unique breed ids within each species', () => {
    for (const species of SPECIES) {
      const ids = species.breeds.map((breed) => breed.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('has unique species ids', () => {
    const ids = SPECIES.map((species) => species.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every breed a non-empty tags array', () => {
    for (const species of SPECIES) {
      for (const breed of species.breeds) {
        expect(Array.isArray(breed.tags)).toBe(true)
        expect(breed.tags.length).toBeGreaterThan(0)
      }
    }
  })

  it('defines a growth stage override for all 6 stage keys, for every species', () => {
    const expectedKeys = ['young', 'growing', 'capable', 'trained', 'senior', 'legend']
    for (const species of SPECIES) {
      expect(Object.keys(species.growthStageOverrides).sort()).toEqual(expectedKeys.sort())
      for (const key of expectedKeys) {
        expect(species.growthStageOverrides[key].emoji).toBeTruthy()
      }
    }
  })
})

describe('getSpeciesById', () => {
  it('returns the matching species', () => {
    expect(getSpeciesById('dog')?.label).toBe('狗')
    expect(getSpeciesById('cat')?.label).toBe('貓')
  })

  it('returns undefined for an unknown id', () => {
    expect(getSpeciesById('dragon')).toBeUndefined()
  })
})

describe('getBreedById', () => {
  it('returns the matching breed', () => {
    expect(getBreedById('dog', 'shiba')?.label).toBe('柴犬')
  })

  it('returns undefined for an unknown breed id', () => {
    expect(getBreedById('dog', 'dragon')).toBeUndefined()
  })

  it('returns undefined for an unknown species id', () => {
    expect(getBreedById('dragon', 'shiba')).toBeUndefined()
  })
})

describe('getBreedByLabel', () => {
  it('resolves a known breed label to its species/breed ids', () => {
    expect(getBreedByLabel('柴犬')).toEqual({
      id: 'shiba',
      label: '柴犬',
      tags: ['中型'],
      speciesId: 'dog',
      speciesLabel: '狗',
    })
  })

  it('returns undefined for an unknown label', () => {
    expect(getBreedByLabel('恐龍')).toBeUndefined()
  })
})
