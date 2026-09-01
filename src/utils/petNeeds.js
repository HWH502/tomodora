export const NEEDS_CAP = 100
export const DECAY_BASE = 5
export const DANGER_THRESHOLD = 20
export const HEALTHY_THRESHOLD = 50
export const EXCITED_THRESHOLD = 80

export function clampNeed(value) {
  return Math.max(0, Math.min(NEEDS_CAP, value))
}

export function computeHungerDecay({ energy, ownerReduction = 0, petSkillReduction = 0 }) {
  const base = DECAY_BASE + Math.floor(energy / 20)
  return Math.max(1, base - ownerReduction - petSkillReduction)
}

export function computeCleanlinessDecay({ ownerReduction = 0, petSkillReduction = 0 }) {
  return Math.max(1, DECAY_BASE - ownerReduction - petSkillReduction)
}

const HEALTH_PENALTY_TABLE = {
  0: { oneLow: -3, bothLow: -6 },
  1: { oneLow: -2, bothLow: -4 },
  2: { oneLow: -2, bothLow: -3 },
  3: { oneLow: -1, bothLow: -2 },
}

export function computeHealthDelta({ hunger, cleanliness, healthPenaltyLevel = 0 }) {
  const table = HEALTH_PENALTY_TABLE[healthPenaltyLevel] ?? HEALTH_PENALTY_TABLE[0]
  const bothLow = hunger < DANGER_THRESHOLD && cleanliness < DANGER_THRESHOLD
  const oneLow = hunger < DANGER_THRESHOLD || cleanliness < DANGER_THRESHOLD
  const bothHigh = hunger >= HEALTHY_THRESHOLD && cleanliness >= HEALTHY_THRESHOLD
  if (bothLow) return table.bothLow
  if (oneLow) return table.oneLow
  if (bothHigh) return 3
  return 0
}

export const MOOD_LABELS = {
  sick: '生病',
  hungry: '飢餓',
  sad: '難過',
  dirty: '骯髒',
  excited: '興奮',
  happy: '開心',
}

export const MOOD_EMOJI = {
  sick: '🤒',
  hungry: '🍖',
  sad: '😢',
  dirty: '🧼',
  excited: '🤩',
  happy: '😊',
}

export function determineMood({ health, affection, cleanliness, hunger }) {
  if (health < DANGER_THRESHOLD) return 'sick'
  if (hunger < DANGER_THRESHOLD) return 'hungry'
  if (affection < DANGER_THRESHOLD) return 'sad'
  if (cleanliness < DANGER_THRESHOLD) return 'dirty'
  if (hunger >= EXCITED_THRESHOLD && cleanliness >= EXCITED_THRESHOLD) return 'excited'
  return 'happy'
}

export const OBEDIENCE_INCIDENT_HEALTH_LOSS = 5
export const OBEDIENCE_INCIDENT_MONEY_LOSS = 10
export const OBEDIENCE_INCIDENT_MIN_CHANCE = 0.01

const OBEDIENCE_INCIDENT_TABLE = [
  { min: 0, max: 20, chance: 0.10 },
  { min: 21, max: 40, chance: 0.07 },
  { min: 41, max: 60, chance: 0.04 },
  { min: 61, max: 80, chance: 0.02 },
  { min: 81, max: 100, chance: 0.01 },
]

export function getObedienceIncidentChance(effectiveObedience, reductionPercent = 0) {
  const tier = OBEDIENCE_INCIDENT_TABLE.find((t) => effectiveObedience >= t.min && effectiveObedience <= t.max)
    ?? OBEDIENCE_INCIDENT_TABLE[0]
  return Math.max(OBEDIENCE_INCIDENT_MIN_CHANCE, tier.chance - reductionPercent)
}

export function rollObedienceIncident(effectiveObedience, reductionPercent = 0, random = Math.random) {
  return random() < getObedienceIncidentChance(effectiveObedience, reductionPercent)
}

export const RANDOM_EVENT_BASE_CHANCE = 0.15

const ENERGY_EVENT_BONUS_TABLE = [
  { min: 1, max: 20, bonus: 0.01 },
  { min: 21, max: 40, bonus: 0.02 },
  { min: 41, max: 60, bonus: 0.03 },
  { min: 61, max: 80, bonus: 0.04 },
  { min: 81, max: 100, bonus: 0.05 },
]

export function getRandomEventChance(energy) {
  const tier = ENERGY_EVENT_BONUS_TABLE.find((t) => energy >= t.min && energy <= t.max)
  return RANDOM_EVENT_BASE_CHANCE + (tier?.bonus ?? 0)
}

export const RANDOM_EVENTS = [
  { id: 'foundCoins', kind: 'positive' },
  { id: 'fastLearner', kind: 'positive' },
  { id: 'greatPlay', kind: 'positive' },
  { id: 'spilledBowl', kind: 'negative' },
  { id: 'ateSomethingBad', kind: 'negative' },
  { id: 'wanderedOff', kind: 'negative' },
]

export const RANDOM_EVENT_LABELS = {
  foundCoins: '撿到零錢',
  fastLearner: '學得特別快',
  greatPlay: '玩到特別開心',
  spilledBowl: '打翻水盆',
  ateSomethingBad: '貪吃亂吃東西',
  wanderedOff: '走失片刻嚇壞飼主',
}

export const EVENT_LABELS = {
  ...RANDOM_EVENT_LABELS,
  obedienceIncident: '寵物惹了點小麻煩',
}

export function buildEventWeights({ wanderedOffReduced = false } = {}) {
  const weights = Object.fromEntries(RANDOM_EVENTS.map((e) => [e.id, 1]))
  if (wanderedOffReduced) {
    const freed = weights.wanderedOff * 0.5
    weights.wanderedOff -= freed
    const others = RANDOM_EVENTS.filter((e) => e.id !== 'wanderedOff')
    others.forEach((e) => {
      weights[e.id] += freed / others.length
    })
  }
  return weights
}

export function pickWeightedEvent(weights, random = Math.random) {
  const total = Object.values(weights).reduce((sum, w) => sum + w, 0)
  let roll = random() * total
  for (const event of RANDOM_EVENTS) {
    roll -= weights[event.id]
    if (roll <= 0) return event.id
  }
  return RANDOM_EVENTS[RANDOM_EVENTS.length - 1].id
}

export function rollRandomEvent({ energy, wanderedOffReduced = false, luckyStar = false, random = Math.random }) {
  if (random() >= getRandomEventChance(energy)) return null
  const weights = buildEventWeights({ wanderedOffReduced })
  let eventId = pickWeightedEvent(weights, random)
  const isNegative = RANDOM_EVENTS.find((e) => e.id === eventId).kind === 'negative'
  if (isNegative && luckyStar && random() < 0.3) {
    const positiveIds = RANDOM_EVENTS.filter((e) => e.kind === 'positive').map((e) => e.id)
    eventId = positiveIds[Math.floor(random() * positiveIds.length)]
  }
  return eventId
}

export const AFFECTION_PER_POMODORO = 1
export const AFFECTION_DAILY_BONUS_THRESHOLD = 8
export const AFFECTION_DAILY_BONUS = 1
export const AFFECTION_LOW_STAT_PENALTY = -2
export const AFFECTION_VET_PENALTY = -3
export const DEPARTURE_BASE_CHANCE = 0.15
export const DEPARTURE_REDUCED_CHANCE = 0.12

const BONDING_LEVEL_BONUS = [0, 1, 2, 3]

export function getFriendlinessAffectionBonus(friendliness) {
  if (friendliness >= 40) return 2
  if (friendliness >= 20) return 1
  return 0
}

export function computePomodoroAffectionGain({ friendliness, bondingLevel = 0, hasCharmSkill = false, isEighthToday = false, speciesDailyBonus = 0, collectibleBonus = 0 }) {
  const bondingBonus = BONDING_LEVEL_BONUS[bondingLevel] ?? 0
  const friendlinessBonus = getFriendlinessAffectionBonus(friendliness)
  const charmBonus = hasCharmSkill ? 1 : 0
  const dailyBonus = isEighthToday ? AFFECTION_DAILY_BONUS + speciesDailyBonus : 0
  return AFFECTION_PER_POMODORO + bondingBonus + friendlinessBonus + charmBonus + dailyBonus + collectibleBonus
}

export function computeLowStatAffectionPenalty({ hunger, cleanliness, health }) {
  let penalty = 0
  if (hunger < DANGER_THRESHOLD) penalty += AFFECTION_LOW_STAT_PENALTY
  if (cleanliness < DANGER_THRESHOLD) penalty += AFFECTION_LOW_STAT_PENALTY
  if (health < DANGER_THRESHOLD) penalty += AFFECTION_LOW_STAT_PENALTY
  return penalty
}

export function rollDeparture(affection, reducedChance = false, random = Math.random) {
  if (affection >= DANGER_THRESHOLD) return false
  const chance = reducedChance ? DEPARTURE_REDUCED_CHANCE : DEPARTURE_BASE_CHANCE
  return random() < chance
}

export const VET_COST = 80
export const VET_HEALTH_GAIN = 20
export const VET_HEALTH_FLOOR = 40
export const VET_CARE_FLOOR = 50
export const VET_ELIGIBLE_HEALTH_THRESHOLD = 40

export function canVisitVet({ health, money, cost = VET_COST }) {
  return health < VET_ELIGIBLE_HEALTH_THRESHOLD && money >= cost
}

export function applyVetVisit({ health, hunger, cleanliness }) {
  const boostedHealth = health + VET_HEALTH_GAIN
  return {
    health: boostedHealth <= VET_HEALTH_FLOOR ? VET_HEALTH_FLOOR : boostedHealth,
    hunger: hunger < VET_CARE_FLOOR ? VET_CARE_FLOOR : hunger,
    cleanliness: cleanliness < VET_CARE_FLOOR ? VET_CARE_FLOOR : cleanliness,
    affectionDelta: AFFECTION_VET_PENALTY,
    cost: VET_COST,
  }
}

export const INSURANCE_TIERS = {
  1: { floor: 10, rate: 0.2 },
  2: { floor: 20, rate: 0.4 },
  3: { floor: 30, rate: 0.6 },
}

export function applyInsuranceDiscount(cost, tier = 0) {
  const config = INSURANCE_TIERS[tier]
  if (!config) return cost
  if (cost <= config.floor) return 0
  return Math.round(cost * (1 - config.rate))
}

export const CONSUMABLE_NEED_KEY = { kibble: 'hunger', supplement: 'health', grooming: 'cleanliness' }

function consumeDailyStock(stock, restoreAmounts, hunger, cleanliness) {
  const nextStock = { ...stock }
  let nextHunger = hunger
  let nextCleanliness = cleanliness
  let healthGain = 0

  const hungerInDanger = hunger < DANGER_THRESHOLD
  const cleanlinessInDanger = cleanliness < DANGER_THRESHOLD

  for (const itemId of Object.keys(CONSUMABLE_NEED_KEY)) {
    const needKey = CONSUMABLE_NEED_KEY[itemId]
    const isEmergency = (needKey === 'hunger' && hungerInDanger) || (needKey === 'cleanliness' && cleanlinessInDanger)
    const servings = Math.min(nextStock[itemId] || 0, isEmergency ? 2 : 1)
    if (servings <= 0) continue

    const restoreAmount = (restoreAmounts[itemId] || 0) * servings
    if (needKey === 'hunger') {
      nextHunger = clampNeed(nextHunger + restoreAmount)
    } else if (needKey === 'cleanliness') {
      nextCleanliness = clampNeed(nextCleanliness + restoreAmount)
    } else if (needKey === 'health') {
      healthGain += restoreAmount
    }
    nextStock[itemId] -= servings
  }

  return { nextStock, nextHunger, nextCleanliness, healthGain }
}

export function runDailyNeedsTick({
  pet,
  ownerBonuses,
  petSkillIds,
  consumableStock = {},
  consumableRestoreAmounts = {},
  random = Math.random,
}) {
  const hungerDecay = computeHungerDecay({
    energy: pet.stats.energy,
    ownerReduction: ownerBonuses.hungerDecayReduction,
    petSkillReduction: petSkillIds.includes('thrifty') ? 2 : 0,
  })
  const cleanlinessDecay = computeCleanlinessDecay({
    ownerReduction: ownerBonuses.cleanlinessDecayReduction,
    petSkillReduction: petSkillIds.includes('potty') || petSkillIds.includes('selfGroom') ? 2 : 0,
  })
  const hungerAfterDecay = clampNeed(pet.hunger - hungerDecay)
  const cleanlinessAfterDecay = clampNeed(pet.cleanliness - cleanlinessDecay)

  const { nextStock: nextConsumableStock, nextHunger, nextCleanliness, healthGain } = consumeDailyStock(
    consumableStock,
    consumableRestoreAmounts,
    hungerAfterDecay,
    cleanlinessAfterDecay,
  )

  const healthDelta = computeHealthDelta({
    hunger: nextHunger,
    cleanliness: nextCleanliness,
    healthPenaltyLevel: ownerBonuses.healthPenaltyLevel,
  })
  const nextHealth = clampNeed(pet.health + healthGain + healthDelta)

  const basePet = { ...pet, hunger: nextHunger, cleanliness: nextCleanliness }

  if (nextHealth <= 0) {
    return {
      pet: { ...basePet, health: 0 },
      died: true,
      departureReason: 'health',
      moneyDelta: 0,
      events: [],
      consumableStock: nextConsumableStock,
    }
  }

  const hasSitOrClaw = petSkillIds.includes('sit') || petSkillIds.includes('clawGentle')
  const hasVeteran = petSkillIds.includes('veteran')
  const obedienceReduction = (hasSitOrClaw ? 0.02 : 0) + (hasVeteran ? 0.02 : 0)
  const incidentHappened = rollObedienceIncident(ownerBonuses.effectiveObedience, obedienceReduction, random)

  let healthAfterIncident = nextHealth
  let moneyDelta = 0
  const events = []
  if (incidentHappened) {
    events.push('obedienceIncident')
    const healthLoss = Math.max(0, OBEDIENCE_INCIDENT_HEALTH_LOSS - ownerBonuses.instantGuardReduction)
    const moneyLoss = applyInsuranceDiscount(OBEDIENCE_INCIDENT_MONEY_LOSS, ownerBonuses.insuranceTier)
    healthAfterIncident = clampNeed(nextHealth - healthLoss)
    moneyDelta -= moneyLoss
  }

  if (healthAfterIncident <= 0) {
    return {
      pet: { ...basePet, health: 0 },
      died: true,
      departureReason: 'health',
      moneyDelta,
      events,
      consumableStock: nextConsumableStock,
    }
  }

  const lowStatPenalty = computeLowStatAffectionPenalty({ hunger: nextHunger, cleanliness: nextCleanliness, health: healthAfterIncident })
  const nextAffection = clampNeed(pet.affection + lowStatPenalty)

  const hasIndependenceSkill = petSkillIds.includes('selfEntertain') || petSkillIds.includes('independent')
  const departed = rollDeparture(nextAffection, hasIndependenceSkill, random)

  const finalPet = { ...basePet, health: healthAfterIncident, affection: nextAffection }

  if (departed) {
    return {
      pet: finalPet,
      died: true,
      departureReason: 'affection',
      moneyDelta,
      events,
      consumableStock: nextConsumableStock,
    }
  }

  return { pet: finalPet, died: false, moneyDelta, events, consumableStock: nextConsumableStock }
}
