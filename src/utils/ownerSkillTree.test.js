import { describe, expect, it } from 'vitest'
import {
  applyBargainDiscount,
  canUnlockSingle,
  canUpgradeLinearTrack,
  canUpgradeSpecialization,
  defaultOwnerSkillTree,
  getCleanlinessDecayReduction,
  getEffectiveFriendliness,
  getEffectiveObedience,
  getBargainDiscountRate,
  getBusinessSenseBonus,
  getHealthPenaltyLevel,
  getHungerDecayReduction,
  getInsuranceTier,
  getInstantGuardReduction,
  getObedienceIncidentReduction,
  getSpeciesAffectionBonus,
  getTrackLevel,
  isSpeciesTagAvailable,
  LEVEL_COSTS,
  REQUIRED_PET_COUNTS,
  SINGLE_UNLOCK_COST,
  unlockSingle,
  upgradeLinearTrack,
  upgradeSpecialization,
} from './ownerSkillTree'

function makePet(overrides = {}) {
  return {
    speciesId: 'dog',
    breedId: 'shiba',
    stats: { learning: 0, obedience: 40, friendliness: 30, energy: 0 },
    ...overrides,
  }
}

describe('defaultOwnerSkillTree', () => {
  it('starts every track at level 0 / false', () => {
    const tree = defaultOwnerSkillTree()
    expect(tree.trainingTechnique).toBe(0)
    expect(tree.socialTraining).toBe(0)
    expect(tree.sizeSpecialization).toEqual({ small: 0, medium: 0, large: 0 })
    expect(tree.speciesSpecialization).toEqual({ dog: 0, cat: 0, rodent: 0 })
    expect(tree.autoFeed).toBe(false)
    expect(tree.autoGrooming).toBe(false)
    expect(tree.instantGuard).toBe(0)
    expect(tree.petInsurance).toBe(0)
  })
})

describe('effective stat helpers with an untouched (all-zero) tree', () => {
  const tree = defaultOwnerSkillTree()

  it('returns the base obedience/friendliness unchanged', () => {
    const pet = makePet()
    expect(getEffectiveObedience(pet, tree)).toBe(40)
    expect(getEffectiveFriendliness(pet, tree)).toBe(30)
  })

  it('returns zero for every reduction/bonus lookup', () => {
    const pet = makePet()
    expect(getHungerDecayReduction(pet, tree)).toBe(0)
    expect(getCleanlinessDecayReduction(pet, tree)).toBe(0)
    expect(getHealthPenaltyLevel(pet, tree)).toBe(0)
    expect(getInstantGuardReduction(tree)).toBe(0)
    expect(getInsuranceTier(tree)).toBe(0)
    expect(getObedienceIncidentReduction(tree)).toBe(0)
  })
})

describe('linear track upgrades', () => {
  it('costs 30/80/200 for level 1/2/3 and reports max at level 3', () => {
    const tree = defaultOwnerSkillTree()
    expect(canUpgradeLinearTrack(tree, 'trainingTechnique')).toEqual({ ok: true, cost: 30 })
    expect(canUpgradeLinearTrack({ ...tree, trainingTechnique: 1 }, 'trainingTechnique')).toEqual({ ok: true, cost: 80 })
    expect(canUpgradeLinearTrack({ ...tree, trainingTechnique: 2 }, 'trainingTechnique')).toEqual({ ok: true, cost: 200 })
    expect(canUpgradeLinearTrack({ ...tree, trainingTechnique: 3 }, 'trainingTechnique')).toEqual({ ok: false, reason: 'maxed' })
  })

  it('upgrades a dotted-path track (bonding.affection) without touching sibling bonding fields', () => {
    const tree = defaultOwnerSkillTree()
    const next = upgradeLinearTrack(tree, 'bonding.affection')
    expect(getTrackLevel(next, 'bonding.affection')).toBe(1)
    expect(next.bonding.kibble).toBe(0)
  })
})

describe('specialization upgrades gated by owned-pet count', () => {
  it('requires 1/3/5 pets of the matching tag to reach level 1/2/3', () => {
    const tree = defaultOwnerSkillTree()
    expect(canUpgradeSpecialization(tree, 'size', 'small', 0)).toEqual({ ok: false, reason: 'needsMorePets', required: 1, owned: 0 })
    expect(canUpgradeSpecialization(tree, 'size', 'small', 1)).toEqual({ ok: true, cost: 30 })
    const lvl1 = { ...tree, sizeSpecialization: { ...tree.sizeSpecialization, small: 1 } }
    expect(canUpgradeSpecialization(lvl1, 'size', 'small', 2)).toEqual({ ok: false, reason: 'needsMorePets', required: 3, owned: 2 })
    expect(canUpgradeSpecialization(lvl1, 'size', 'small', 3)).toEqual({ ok: true, cost: 80 })
  })

  it('upgrades only the targeted tag', () => {
    const tree = defaultOwnerSkillTree()
    const next = upgradeSpecialization(tree, 'species', 'dog')
    expect(next.speciesSpecialization).toEqual({ dog: 1, cat: 0, rodent: 0 })
  })

  it('flags rodent as unavailable because no rodent breed data exists yet', () => {
    expect(isSpeciesTagAvailable('dog')).toBe(true)
    expect(isSpeciesTagAvailable('rodent')).toBe(false)
  })
})

describe('single-unlock tracks', () => {
  it('costs 120 and cannot be unlocked twice', () => {
    const tree = defaultOwnerSkillTree()
    expect(canUnlockSingle(tree, 'autoFeed')).toEqual({ ok: true, cost: SINGLE_UNLOCK_COST })
    const unlocked = unlockSingle(tree, 'autoFeed')
    expect(unlocked.autoFeed).toBe(true)
    expect(canUnlockSingle(unlocked, 'autoFeed')).toEqual({ ok: false, reason: 'alreadyUnlocked' })
  })
})

it('exposes the cost tables the spec defines', () => {
  expect(LEVEL_COSTS).toEqual([30, 80, 200])
  expect(REQUIRED_PET_COUNTS).toEqual([1, 3, 5])
})

describe('effective stat helpers once levels are set (future 3B UI will drive this)', () => {
  it('adds the training-technique bonus to obedience', () => {
    const tree = { ...defaultOwnerSkillTree(), trainingTechnique: 2 }
    expect(getEffectiveObedience(makePet(), tree)).toBe(50)
  })

  it('adds the social-training bonus to friendliness', () => {
    const tree = { ...defaultOwnerSkillTree(), socialTraining: 3 }
    expect(getEffectiveFriendliness(makePet(), tree)).toBe(45)
  })

  it('resolves size specialization level from the pet breed tag', () => {
    const tree = { ...defaultOwnerSkillTree(), sizeSpecialization: { small: 0, medium: 3, large: 0 } }
    expect(getHealthPenaltyLevel(makePet({ breedId: 'shiba' }), tree)).toBe(3)
  })

  it('resolves hunger-decay reduction from the currently-owned pet size tag, not just any unlocked tier (Finding 4)', () => {
    const tree = { ...defaultOwnerSkillTree(), sizeSpecialization: { small: 0, medium: 3, large: 0 } }
    // shiba (柴犬) is medium-sized, so the medium tier 3 (-3) applies.
    expect(getHungerDecayReduction(makePet({ breedId: 'shiba' }), tree)).toBe(3)
  })

  it('returns 0 hunger-decay reduction when the unlocked tier does not match the currently-owned pet size (Finding 4)', () => {
    // Unlocked tiers are permanent once earned, but only the tier matching the CURRENT pet's size
    // tag is active. Here "large" is unlocked to level 3, but the current pet (poodle) is small.
    const tree = { ...defaultOwnerSkillTree(), sizeSpecialization: { small: 0, medium: 0, large: 3 } }
    expect(getHungerDecayReduction(makePet({ breedId: 'poodle' }), tree)).toBe(0)
  })
})

describe('economy bonuses', () => {
  it('grants flat extra money per pomodoro at 0/3/6/10 by businessSense level', () => {
    expect(getBusinessSenseBonus(defaultOwnerSkillTree())).toBe(0)
    expect(getBusinessSenseBonus({ ...defaultOwnerSkillTree(), businessSense: 3 })).toBe(10)
  })

  it('discounts shop prices by 0/5/10/15 percent by bargainHunter level', () => {
    expect(getBargainDiscountRate({ ...defaultOwnerSkillTree(), bargainHunter: 2 })).toBe(0.10)
  })

  it('rounds the discounted price to the nearest integer', () => {
    expect(applyBargainDiscount(20, 0.15)).toBe(17)
    expect(applyBargainDiscount(4, 0.05)).toBe(4)
  })
})

describe('species specialization affection bonus', () => {
  it('reads the level for the pet\'s own species, not other species', () => {
    const tree = { ...defaultOwnerSkillTree(), speciesSpecialization: { dog: 2, cat: 0, rodent: 0 } }
    expect(getSpeciesAffectionBonus({ speciesId: 'dog' }, tree)).toBe(2)
    expect(getSpeciesAffectionBonus({ speciesId: 'cat' }, tree)).toBe(0)
  })
})
