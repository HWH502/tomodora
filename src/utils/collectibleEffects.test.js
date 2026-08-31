import { describe, expect, it } from 'vitest'
import {
  getCollectibleAffectionBonus,
  getCollectibleCleanlinessDecayReduction,
  getCollectibleFriendlinessBonus,
  getCollectibleHungerDecayReduction,
  getCollectibleObedienceBonus,
} from './collectibleEffects'

describe('collectible effect bonuses', () => {
  it('returns 0 for every bonus when nothing is owned', () => {
    expect(getCollectibleObedienceBonus([])).toBe(0)
    expect(getCollectibleFriendlinessBonus([])).toBe(0)
    expect(getCollectibleAffectionBonus([])).toBe(0)
    expect(getCollectibleHungerDecayReduction([])).toBe(0)
    expect(getCollectibleCleanlinessDecayReduction([])).toBe(0)
  })

  it('maps each collectible to its own stat, one item at a time', () => {
    expect(getCollectibleHungerDecayReduction(['bowl'])).toBe(1)
    expect(getCollectibleObedienceBonus(['leash'])).toBe(3)
    expect(getCollectibleFriendlinessBonus(['ball'])).toBe(3)
    expect(getCollectibleAffectionBonus(['collar'])).toBe(1)
    expect(getCollectibleCleanlinessDecayReduction(['outfit'])).toBe(1)
  })

  it('ignores collectibles that do not affect a given stat', () => {
    expect(getCollectibleObedienceBonus(['bowl', 'ball', 'collar', 'outfit'])).toBe(0)
    expect(getCollectibleHungerDecayReduction(['leash', 'ball', 'collar', 'outfit'])).toBe(0)
  })

  it('owning all 5 collectibles sums each stat correctly (no stat is shared by two items)', () => {
    const all = ['ball', 'bowl', 'collar', 'leash', 'outfit']
    expect(getCollectibleObedienceBonus(all)).toBe(3)
    expect(getCollectibleFriendlinessBonus(all)).toBe(3)
    expect(getCollectibleAffectionBonus(all)).toBe(1)
    expect(getCollectibleHungerDecayReduction(all)).toBe(1)
    expect(getCollectibleCleanlinessDecayReduction(all)).toBe(1)
  })

  it('ignores unknown or consumable item ids without throwing', () => {
    expect(getCollectibleObedienceBonus(['leash', 'kibble', 'not-a-real-item'])).toBe(3)
  })
})
