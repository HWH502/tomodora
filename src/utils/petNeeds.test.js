import { describe, expect, it } from 'vitest'
import { clampNeed, computeCleanlinessDecay, computeHealthDelta, computeHungerDecay, determineMood, MOOD_LABELS, getObedienceIncidentChance, rollObedienceIncident } from './petNeeds'
import { buildEventWeights, getRandomEventChance, pickWeightedEvent, RANDOM_EVENTS, rollRandomEvent } from './petNeeds'
import {
  AFFECTION_DAILY_BONUS,
  AFFECTION_PER_POMODORO,
  computeLowStatAffectionPenalty,
  computePomodoroAffectionGain,
  getFriendlinessAffectionBonus,
  rollDeparture,
  applyInsuranceDiscount,
  applyVetVisit,
  canVisitVet,
} from './petNeeds'

describe('clampNeed', () => {
  it('clamps between 0 and 100', () => {
    expect(clampNeed(-5)).toBe(0)
    expect(clampNeed(150)).toBe(100)
    expect(clampNeed(42)).toBe(42)
  })
})

describe('computeHungerDecay', () => {
  it('is base 5 plus floor(energy/20) with no reductions', () => {
    expect(computeHungerDecay({ energy: 0, ownerReduction: 0, petSkillReduction: 0 })).toBe(5)
    expect(computeHungerDecay({ energy: 39, ownerReduction: 0, petSkillReduction: 0 })).toBe(6)
    expect(computeHungerDecay({ energy: 100, ownerReduction: 0, petSkillReduction: 0 })).toBe(10)
  })

  it('subtracts owner and pet skill reductions but floors at 1', () => {
    expect(computeHungerDecay({ energy: 0, ownerReduction: 3, petSkillReduction: 2 })).toBe(1)
    expect(computeHungerDecay({ energy: 100, ownerReduction: 3, petSkillReduction: 2 })).toBe(5)
  })
})

describe('computeCleanlinessDecay', () => {
  it('is base 5, unaffected by energy', () => {
    expect(computeCleanlinessDecay({ ownerReduction: 0, petSkillReduction: 0 })).toBe(5)
  })

  it('subtracts reductions but floors at 1', () => {
    expect(computeCleanlinessDecay({ ownerReduction: 3, petSkillReduction: 3 })).toBe(1)
  })
})

describe('computeHealthDelta', () => {
  it('is +3 unconditionally when both are at or above 50', () => {
    expect(computeHealthDelta({ hunger: 60, cleanliness: 60, healthPenaltyLevel: 0 })).toBe(3)
  })

  it('is +3 when both are at or above 50', () => {
    expect(computeHealthDelta({ hunger: 50, cleanliness: 80, healthPenaltyLevel: 0 })).toBe(3)
  })

  it('is -3 by default when exactly one is below 20', () => {
    expect(computeHealthDelta({ hunger: 19, cleanliness: 60, healthPenaltyLevel: 0 })).toBe(-3)
  })

  it('is -6 by default when both are below 20', () => {
    expect(computeHealthDelta({ hunger: 10, cleanliness: 5, healthPenaltyLevel: 0 })).toBe(-6)
  })

  it('applies size-specialization penalty tables for level 1..3', () => {
    expect(computeHealthDelta({ hunger: 19, cleanliness: 60, healthPenaltyLevel: 1 })).toBe(-2)
    expect(computeHealthDelta({ hunger: 10, cleanliness: 5, healthPenaltyLevel: 1 })).toBe(-4)
    expect(computeHealthDelta({ hunger: 19, cleanliness: 60, healthPenaltyLevel: 2 })).toBe(-2)
    expect(computeHealthDelta({ hunger: 10, cleanliness: 5, healthPenaltyLevel: 2 })).toBe(-3)
    expect(computeHealthDelta({ hunger: 19, cleanliness: 60, healthPenaltyLevel: 3 })).toBe(-1)
    expect(computeHealthDelta({ hunger: 10, cleanliness: 5, healthPenaltyLevel: 3 })).toBe(-2)
  })
})

describe('determineMood', () => {
  it('picks sick first when health is low, even if other stats look excited', () => {
    expect(determineMood({ health: 10, affection: 90, cleanliness: 90, hunger: 90 })).toBe('sick')
  })

  it('picks hungry when hunger is low and health is fine, ahead of sad/dirty', () => {
    expect(determineMood({ health: 90, affection: 10, cleanliness: 10, hunger: 10 })).toBe('hungry')
  })

  it('picks sad when affection is low and health is fine', () => {
    expect(determineMood({ health: 90, affection: 10, cleanliness: 90, hunger: 90 })).toBe('sad')
  })

  it('picks dirty when cleanliness is low and health/affection are fine', () => {
    expect(determineMood({ health: 90, affection: 90, cleanliness: 10, hunger: 90 })).toBe('dirty')
  })

  it('picks excited when hunger and cleanliness are both >= 80 and nothing else is low', () => {
    expect(determineMood({ health: 90, affection: 90, cleanliness: 80, hunger: 80 })).toBe('excited')
  })

  it('defaults to happy otherwise', () => {
    expect(determineMood({ health: 60, affection: 60, cleanliness: 60, hunger: 60 })).toBe('happy')
  })

  it('exposes a Chinese label for every mood id', () => {
    expect(MOOD_LABELS).toEqual({
      sick: '生病',
      hungry: '飢餓',
      sad: '難過',
      dirty: '骯髒',
      excited: '興奮',
      happy: '開心',
    })
  })
})

describe('getObedienceIncidentChance', () => {
  it('reads the base probability table by effective obedience tier', () => {
    expect(getObedienceIncidentChance(0, 0)).toBeCloseTo(0.10)
    expect(getObedienceIncidentChance(20, 0)).toBeCloseTo(0.10)
    expect(getObedienceIncidentChance(21, 0)).toBeCloseTo(0.07)
    expect(getObedienceIncidentChance(60, 0)).toBeCloseTo(0.04)
    expect(getObedienceIncidentChance(80, 0)).toBeCloseTo(0.02)
    expect(getObedienceIncidentChance(100, 0)).toBeCloseTo(0.01)
  })

  it('subtracts the reduction but never drops below 1%', () => {
    expect(getObedienceIncidentChance(0, 0.04)).toBeCloseTo(0.06)
    expect(getObedienceIncidentChance(100, 0.04)).toBeCloseTo(0.01)
  })
})

describe('rollObedienceIncident', () => {
  it('triggers when the random roll is below the chance', () => {
    expect(rollObedienceIncident(0, 0, () => 0.05)).toBe(true)
  })

  it('does not trigger when the random roll is at or above the chance', () => {
    expect(rollObedienceIncident(0, 0, () => 0.5)).toBe(false)
  })
})

describe('getRandomEventChance', () => {
  it('is 15% base with no energy bonus below 1', () => {
    expect(getRandomEventChance(0)).toBeCloseTo(0.15)
  })

  it('adds the energy-tier bonus', () => {
    expect(getRandomEventChance(10)).toBeCloseTo(0.16)
    expect(getRandomEventChance(50)).toBeCloseTo(0.18)
    expect(getRandomEventChance(100)).toBeCloseTo(0.20)
  })
})

describe('buildEventWeights', () => {
  it('splits evenly across all six events when nothing is reduced', () => {
    const weights = buildEventWeights({ wanderedOffReduced: false })
    expect(Object.values(weights)).toEqual([1, 1, 1, 1, 1, 1])
  })

  it('halves wanderedOff and redistributes evenly to the other five', () => {
    const weights = buildEventWeights({ wanderedOffReduced: true })
    expect(weights.wanderedOff).toBeCloseTo(0.5)
    const others = RANDOM_EVENTS.filter((e) => e.id !== 'wanderedOff').map((e) => weights[e.id])
    others.forEach((w) => expect(w).toBeCloseTo(1.1))
  })
})

describe('pickWeightedEvent', () => {
  it('picks the first event whose cumulative weight covers the roll', () => {
    const weights = buildEventWeights({ wanderedOffReduced: false })
    expect(pickWeightedEvent(weights, () => 0)).toBe('foundCoins')
  })
})

describe('rollRandomEvent', () => {
  it('returns null when the base roll misses the chance', () => {
    expect(rollRandomEvent({ energy: 0, wanderedOffReduced: false, luckyStar: false, random: () => 0.99 })).toBeNull()
  })

  it('returns a negative event id as-is when luckyStar is off', () => {
    const random = (() => {
      const values = [0.01, 0.55] // hits, then lands on a negative-weighted slot
      let i = 0
      return () => values[Math.min(i++, values.length - 1)]
    })()
    const eventId = rollRandomEvent({ energy: 0, wanderedOffReduced: false, luckyStar: false, random })
    expect(RANDOM_EVENTS.map((e) => e.id)).toContain(eventId)
  })

  it('rerolls a negative event into a positive one when luckyStar procs', () => {
    const random = (() => {
      const values = [0.01, 0.99, 0.0, 0.0] // hits chance, picks last (negative) event, luckyStar procs, picks first positive
      let i = 0
      return () => values[Math.min(i++, values.length - 1)]
    })()
    const eventId = rollRandomEvent({ energy: 0, wanderedOffReduced: false, luckyStar: true, random })
    const kind = RANDOM_EVENTS.find((e) => e.id === eventId).kind
    expect(kind).toBe('positive')
  })
})

describe('getFriendlinessAffectionBonus', () => {
  it('is 0 below 20, 1 from 20-39, 2 from 40+', () => {
    expect(getFriendlinessAffectionBonus(19)).toBe(0)
    expect(getFriendlinessAffectionBonus(20)).toBe(1)
    expect(getFriendlinessAffectionBonus(39)).toBe(1)
    expect(getFriendlinessAffectionBonus(40)).toBe(2)
  })
})

describe('computePomodoroAffectionGain', () => {
  it('is the base +1 with no bonuses', () => {
    expect(computePomodoroAffectionGain({ friendliness: 0, bondingLevel: 0, hasCharmSkill: false, isEighthToday: false })).toBe(1)
  })

  it('stacks friendliness, bonding level, charm skill, and the daily-8th bonus independently', () => {
    expect(
      computePomodoroAffectionGain({ friendliness: 40, bondingLevel: 3, hasCharmSkill: true, isEighthToday: true }),
    ).toBe(1 + 2 + 3 + 1 + 1)
  })
})

describe('computePomodoroAffectionGain species specialization bonus', () => {
  it('adds nothing when speciesDailyBonus is omitted (backward compatible)', () => {
    expect(computePomodoroAffectionGain({ friendliness: 0, isEighthToday: true })).toBe(
      AFFECTION_PER_POMODORO + AFFECTION_DAILY_BONUS,
    )
  })

  it('only applies the species bonus on the 8th-pomodoro day, not every pomodoro', () => {
    const withBonus = computePomodoroAffectionGain({ friendliness: 0, isEighthToday: false, speciesDailyBonus: 3 })
    expect(withBonus).toBe(AFFECTION_PER_POMODORO)
  })

  it('stacks the species bonus on top of the existing daily bonus on the 8th day', () => {
    const withBonus = computePomodoroAffectionGain({ friendliness: 0, isEighthToday: true, speciesDailyBonus: 3 })
    expect(withBonus).toBe(AFFECTION_PER_POMODORO + AFFECTION_DAILY_BONUS + 3)
  })
})

describe('computeLowStatAffectionPenalty', () => {
  it('is 0 when nothing is below 20', () => {
    expect(computeLowStatAffectionPenalty({ hunger: 50, cleanliness: 50, health: 50 })).toBe(0)
  })

  it('subtracts 2 per stat below 20, up to -6', () => {
    expect(computeLowStatAffectionPenalty({ hunger: 10, cleanliness: 50, health: 50 })).toBe(-2)
    expect(computeLowStatAffectionPenalty({ hunger: 10, cleanliness: 10, health: 10 })).toBe(-6)
  })
})

describe('rollDeparture', () => {
  it('never rolls when affection is 20 or above', () => {
    expect(rollDeparture(20, false, () => 0)).toBe(false)
  })

  it('uses the 15% base chance below 20', () => {
    expect(rollDeparture(10, false, () => 0.1)).toBe(true)
    expect(rollDeparture(10, false, () => 0.2)).toBe(false)
  })

  it('uses the reduced 12% chance when the independence skill is learned', () => {
    expect(rollDeparture(10, true, () => 0.13)).toBe(false)
    expect(rollDeparture(10, true, () => 0.1)).toBe(true)
  })
})

describe('applyVetVisit', () => {
  it('tops up hunger/cleanliness to 50 only if below', () => {
    expect(applyVetVisit({ health: 10, hunger: 30, cleanliness: 60 })).toEqual({
      health: 40,
      hunger: 50,
      cleanliness: 60,
      affectionDelta: -3,
      cost: 80,
    })
  })

  it('floors the health result at 40 when health + 20 would land at or below it', () => {
    expect(applyVetVisit({ health: 19, hunger: 60, cleanliness: 60 }).health).toBe(40)
    expect(applyVetVisit({ health: 20, hunger: 60, cleanliness: 60 }).health).toBe(40)
  })

  it('adds a flat 20 when health + 20 is above the floor', () => {
    expect(applyVetVisit({ health: 35, hunger: 60, cleanliness: 60 }).health).toBe(55)
    expect(applyVetVisit({ health: 21, hunger: 60, cleanliness: 60 }).health).toBe(41)
  })
})

describe('canVisitVet', () => {
  it('is false when health is at or above the threshold, even with plenty of money', () => {
    expect(canVisitVet({ health: 40, money: 1000 })).toBe(false)
  })

  it('is false when health is low but money is short of the cost', () => {
    expect(canVisitVet({ health: 39, money: 79 })).toBe(false)
  })

  it('is true when health is below the threshold and money covers the cost', () => {
    expect(canVisitVet({ health: 39, money: 80 })).toBe(true)
  })

  it('honors a custom (e.g. insurance-discounted) cost', () => {
    expect(canVisitVet({ health: 39, money: 64, cost: 64 })).toBe(true)
  })
})

describe('applyInsuranceDiscount', () => {
  it('charges full price at tier 0', () => {
    expect(applyInsuranceDiscount(80, 0)).toBe(80)
  })

  it('waives the cost entirely when at or below the tier floor', () => {
    expect(applyInsuranceDiscount(20, 3)).toBe(0)
  })

  it('applies the percentage discount above the floor', () => {
    expect(applyInsuranceDiscount(80, 3)).toBe(32)
    expect(applyInsuranceDiscount(20, 1)).toBe(16)
    expect(applyInsuranceDiscount(80, 1)).toBe(64)
    expect(applyInsuranceDiscount(10, 1)).toBe(0)
  })
})

import { runDailyNeedsTick } from './petNeeds'

function makePet(overrides = {}) {
  return {
    hunger: 60,
    cleanliness: 60,
    health: 60,
    affection: 60,
    stats: { learning: 0, obedience: 90, friendliness: 0, energy: 0 },
    ...overrides,
  }
}

function defaultBonuses(overrides = {}) {
  return {
    effectiveObedience: 90,
    hungerDecayReduction: 0,
    cleanlinessDecayReduction: 0,
    healthPenaltyLevel: 0,
    instantGuardReduction: 0,
    insuranceTier: 0,
    ...overrides,
  }
}

describe('runDailyNeedsTick', () => {
  it('applies decay and health linkage for an ordinary day with no incident', () => {
    const result = runDailyNeedsTick({
      pet: makePet(),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      random: () => 0.99, // never triggers the obedience incident or departure roll
    })
    expect(result.died).toBe(false)
    expect(result.pet.hunger).toBe(55)
    expect(result.pet.cleanliness).toBe(55)
    expect(result.pet.health).toBe(63) // 55/55 are both >= 50 (HEALTHY_THRESHOLD) -> regla 3 "both >= 50" -> +3
    expect(result.moneyDelta).toBe(0)
  })

  it('stops the whole tick and reports death when health reaches 0 from the linkage step', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ hunger: 3, cleanliness: 3, health: 4 }),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      random: () => 0.99,
    })
    expect(result.died).toBe(true)
    expect(result.departureReason).toBe('health')
  })

  it('applies an obedience incident (health loss + money loss) when the roll hits', () => {
    const result = runDailyNeedsTick({
      pet: makePet(),
      ownerBonuses: defaultBonuses({ effectiveObedience: 0 }),
      petSkillIds: [],
      random: () => 0.0, // hits every roll it is asked to make
    })
    expect(result.events).toContain('obedienceIncident')
    expect(result.moneyDelta).toBe(-10)
  })

  it('also stops and reports death when the obedience-incident health loss finishes the pet off (not decay alone)', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ hunger: 60, cleanliness: 60, health: 2 }),
      ownerBonuses: defaultBonuses({ effectiveObedience: 0 }),
      petSkillIds: [],
      random: () => 0.0,
    })
    expect(result.died).toBe(true)
    expect(result.departureReason).toBe('health')
    expect(result.events).toContain('obedienceIncident')
    expect(result.moneyDelta).toBe(-10)
  })

  it('applies instant-guard reduction to the obedience incident health loss, floored at 0', () => {
    const result = runDailyNeedsTick({
      pet: makePet(),
      ownerBonuses: defaultBonuses({ effectiveObedience: 0, instantGuardReduction: 6 }),
      petSkillIds: [],
      random: () => 0.0,
    })
    expect(result.pet.health).toBeGreaterThanOrEqual(makePet().health - 3) // decay's health delta only, incident fully absorbed
  })

  it('reports affection-based departure with reason "affection" when the roll hits', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ affection: 10 }),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      random: () => 0.0,
    })
    expect(result.died).toBe(true)
    expect(result.departureReason).toBe('affection')
  })

  it('consumes one unit of each available consumable: kibble restores hunger, grooming restores cleanliness, supplement restores health', () => {
    const result = runDailyNeedsTick({
      pet: makePet(),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      consumableStock: { kibble: 2, supplement: 1, grooming: 1 },
      consumableRestoreAmounts: { kibble: 5, supplement: 2, grooming: 5 },
      random: () => 0.99,
    })
    // hunger: 60 - 5 (decay) + 5 (kibble) = 60; cleanliness: 60 - 5 + 5 (grooming) = 60
    expect(result.pet.hunger).toBe(60)
    expect(result.pet.cleanliness).toBe(60)
    // health: 60 (no decay) + 2 (supplement) + 3 (both hunger/cleanliness ended >=50 -> +3 linkage bonus) = 65
    expect(result.pet.health).toBe(65)
    expect(result.consumableStock).toEqual({ kibble: 1, supplement: 0, grooming: 0 })
  })

  it('leaves needs to decay normally when a consumable is out of stock', () => {
    const result = runDailyNeedsTick({
      pet: makePet(),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      consumableStock: { kibble: 0 },
      consumableRestoreAmounts: { kibble: 5 },
      random: () => 0.99,
    })
    expect(result.pet.hunger).toBe(55)
    expect(result.consumableStock).toEqual({ kibble: 0 })
  })

  it('uses an extra serving of kibble when hunger is in the danger zone and stock allows it', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ hunger: 15 }), // 15 - 5 (decay) = 10，衰減後低於危險門檻 20
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      consumableStock: { kibble: 2 },
      consumableRestoreAmounts: { kibble: 5 },
      random: () => 0.99,
    })
    // 危險區間：正常 1 份 + 急救 1 份 = 2 份，回補 10 點：10 + 10 = 20
    expect(result.pet.hunger).toBe(20)
    expect(result.consumableStock.kibble).toBe(0)
  })

  it('only uses the emergency serving if stock allows, does not force a purchase', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ hunger: 15 }),
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      consumableStock: { kibble: 1 }, // 庫存只夠正常那 1 份，急救那份沒庫存
      consumableRestoreAmounts: { kibble: 5 },
      random: () => 0.99,
    })
    // 10 + 5 (只夠用 1 份) = 15，還是低於 20，但不會強制花錢多買
    expect(result.pet.hunger).toBe(15)
    expect(result.consumableStock.kibble).toBe(0)
  })

  it('applies the same emergency top-up rule to cleanliness via grooming supplies', () => {
    const result = runDailyNeedsTick({
      pet: makePet({ cleanliness: 15 }), // 15 - 5 (decay) = 10，低於危險門檻
      ownerBonuses: defaultBonuses(),
      petSkillIds: [],
      consumableStock: { grooming: 2 },
      consumableRestoreAmounts: { grooming: 5 },
      random: () => 0.99,
    })
    expect(result.pet.cleanliness).toBe(20)
    expect(result.consumableStock.grooming).toBe(0)
  })
})
