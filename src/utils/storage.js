import { getShopItem } from './shopItems'
import { calculateLegacyHeadStart, getPetGrowthStage, rollPersonality, rollPetStats } from './pet'
import { getBreedById, getBreedByLabel, getSpeciesById } from './petSpecies'
import { todayDateString } from './date'
import {
  applyBargainDiscount,
  canUnlockSingle,
  canUpgradeLinearTrack,
  canUpgradeSpecialization,
  defaultOwnerSkillTree,
  getBargainDiscountRate,
  getBondingAffectionLevel,
  getBondingConsumableLevel,
  getBusinessSenseBonus,
  getCleanlinessDecayReduction,
  getEffectiveFriendliness,
  getEffectiveObedience,
  getHealthPenaltyLevel,
  getHungerDecayReduction,
  getInstantGuardReduction,
  getInsuranceTier,
  getSpeciesAffectionBonus,
  sizeTagOf,
  unlockSingle,
  upgradeLinearTrack,
  upgradeSpecialization,
} from './ownerSkillTree'
import {
  applyInsuranceDiscount,
  applyVetVisit,
  canVisitVet,
  clampNeed,
  CONSUMABLE_NEED_KEY,
  computePomodoroAffectionGain,
  determineMood,
  HEALTHY_THRESHOLD,
  rollRandomEvent,
  runDailyNeedsTick,
} from './petNeeds'
import { getUnlockedPetSkillIds, hasPetSkill } from './petSkills'
import { advanceStreak, defaultStreakState } from './streak'
import { recordFocusSession } from './focusHistory'

const SETTINGS_KEY = 'pomodoro.settings'
const TODAY_COUNT_KEY = 'pomodoro.todayCount'
const OWNER_KEY = 'pomodoro.owner'

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // localStorage can throw (quota exceeded, private browsing) - the in-memory
    // state the caller returns still reflects the update, it just won't persist.
  }
}

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
}

const MONEY_PER_MINUTE = 2
const SKILL_POINTS_PER_5_MINUTES = 1
const CONSUMABLE_RESTORE_BASE = { kibble: 5, supplement: 2, grooming: 5 }
const BONDING_CONSUMABLE_BONUS = [0, 2, 3, 5]

function buildConsumableRestoreAmounts(ownerSkillTree) {
  const amounts = {}
  for (const itemId of Object.keys(CONSUMABLE_NEED_KEY)) {
    const bondingLevel = getBondingConsumableLevel(ownerSkillTree, itemId)
    amounts[itemId] = (CONSUMABLE_RESTORE_BASE[itemId] ?? 5) + (BONDING_CONSUMABLE_BONUS[bondingLevel] ?? 0)
  }
  return amounts
}

function defaultOwnerState() {
  return {
    lifetimePomodoros: 0,
    lifetimeFocusMinutes: 0,
    lifetimeFocusMinutesStartedAt: todayDateString(),
    money: 0,
    skillPoints: 0,
    pet: null,
    petMemorials: [],
    ownedCollectibles: [],
    consumablePurchases: {},
    ownerSkillTree: defaultOwnerSkillTree(),
    pomodoroStreak: defaultStreakState(),
  }
}

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      workMinutes: Number(parsed.workMinutes) || DEFAULT_SETTINGS.workMinutes,
      shortBreakMinutes:
        Number(parsed.shortBreakMinutes) || DEFAULT_SETTINGS.shortBreakMinutes,
      longBreakMinutes:
        Number(parsed.longBreakMinutes) || DEFAULT_SETTINGS.longBreakMinutes,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  safeSetItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getTodayCount() {
  const today = todayDateString()
  try {
    const raw = localStorage.getItem(TODAY_COUNT_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && parsed.date === today && Number.isFinite(parsed.count)) {
      return parsed.count
    }
  } catch {
    // fall through to reset below
  }
  safeSetItem(TODAY_COUNT_KEY, JSON.stringify({ date: today, count: 0 }))
  return 0
}

export function incrementTodayCount() {
  const current = getTodayCount()
  const next = current + 1
  safeSetItem(
    TODAY_COUNT_KEY,
    JSON.stringify({ date: todayDateString(), count: next }),
  )
  return next
}

function saveOwnerState(state) {
  const { _autoPurchaseLog, ...toPersist } = state
  safeSetItem(OWNER_KEY, JSON.stringify(toPersist))
  return state
}

export function restoreOwnerState(rawState) {
  return saveOwnerState(rawState)
}

function isLegacyOwnerShape(parsed) {
  return Boolean(parsed) && typeof parsed === 'object' && parsed.pet === undefined && Boolean(parsed.dog)
}

function migrateLegacyOwnerState(parsed) {
  const legacyDog = parsed.dog ?? {}
  const legacyTotal = Number.isFinite(parsed.totalPomodoros) ? parsed.totalPomodoros : 0
  const matchedBreed = getBreedByLabel(legacyDog.breedLabel)
  const breedId = matchedBreed?.id ?? 'shiba'
  const personalityLabel = legacyDog.personalityLabel || rollPersonality()

  return {
    lifetimePomodoros: legacyTotal,
    lifetimeFocusMinutes: 0,
    lifetimeFocusMinutesStartedAt: todayDateString(),
    money: Number.isFinite(parsed.money) ? parsed.money : 0,
    skillPoints: Number.isFinite(parsed.skillPoints) ? parsed.skillPoints : 0,
    pet: {
      speciesId: matchedBreed?.speciesId ?? 'dog',
      speciesLabel: matchedBreed?.speciesLabel ?? getSpeciesById('dog').label,
      breedId,
      breedLabel: matchedBreed?.label ?? legacyDog.breedLabel ?? '柴犬',
      name: typeof legacyDog.name === 'string' ? legacyDog.name : '',
      personalityLabel,
      generation: 1,
      pomodorosSinceBorn: legacyTotal,
      bornAt: new Date().toISOString(),
      stats: rollPetStats(breedId, personalityLabel),
      ...rollNeedsStartingValues(),
    },
    petMemorials: [],
    ownedCollectibles: Array.isArray(parsed.ownedCollectibles) ? parsed.ownedCollectibles : [],
    consumablePurchases:
      parsed.consumablePurchases && typeof parsed.consumablePurchases === 'object'
        ? parsed.consumablePurchases
        : {},
    ownerSkillTree: defaultOwnerSkillTree(),
    pomodoroStreak: defaultStreakState(),
  }
}

function buildOwnerBonuses(pet, ownerSkillTree) {
  return {
    effectiveObedience: getEffectiveObedience(pet, ownerSkillTree),
    hungerDecayReduction: getHungerDecayReduction(pet, ownerSkillTree),
    cleanlinessDecayReduction: getCleanlinessDecayReduction(pet, ownerSkillTree),
    healthPenaltyLevel: getHealthPenaltyLevel(pet, ownerSkillTree),
    instantGuardReduction: getInstantGuardReduction(ownerSkillTree),
    insuranceTier: getInsuranceTier(ownerSkillTree),
  }
}

function pushRecentEvent(pet, eventId) {
  const entry = { id: eventId, occurredAt: new Date().toISOString() }
  return { ...pet, recentEvents: [...pet.recentEvents, entry].slice(-5) }
}

function runAutoCare({ pet, ownerSkillTree, money }) {
  let hunger = pet.hunger
  let cleanliness = pet.cleanliness
  let remainingMoney = money
  const purchases = []

  function autoBuy(itemId, getCurrent, setCurrent, restoreAmount) {
    if (!(restoreAmount > 0)) return
    let current = getCurrent()
    let count = 0
    let spent = 0
    while (current < HEALTHY_THRESHOLD) {
      const price = getShopPrice(itemId, ownerSkillTree)
      if (remainingMoney < price) break
      remainingMoney -= price
      spent += price
      current = clampNeed(current + restoreAmount)
      count += 1
    }
    setCurrent(current)
    if (count > 0) purchases.push({ itemId, count, spent })
  }

  const restoreAmounts = buildConsumableRestoreAmounts(ownerSkillTree)
  if (ownerSkillTree.autoFeed) {
    autoBuy('kibble', () => hunger, (value) => { hunger = value }, restoreAmounts.kibble)
  }
  if (ownerSkillTree.autoGrooming) {
    autoBuy('grooming', () => cleanliness, (value) => { cleanliness = value }, restoreAmounts.grooming)
  }

  return { hunger, cleanliness, money: remainingMoney, purchases }
}

function applyNeedsTickIfDue(state) {
  if (!state.pet) return state
  const today = todayDateString()
  if (state.pet.lastNeedsTickDate === today) return state

  const ownerBonuses = buildOwnerBonuses(state.pet, state.ownerSkillTree)
  const petSkillIds = getUnlockedPetSkillIds(state.pet)
  const consumableRestoreAmounts = buildConsumableRestoreAmounts(state.ownerSkillTree)
  const result = runDailyNeedsTick({
    pet: state.pet,
    ownerBonuses,
    petSkillIds,
    consumableStock: state.consumablePurchases,
    consumableRestoreAmounts,
  })

  if (result.died) {
    return {
      ...state,
      money: Math.max(0, state.money + result.moneyDelta),
      pet: null,
      petMemorials: [...state.petMemorials, archivePet(result.pet, new Date().toISOString(), result.departureReason)],
      consumablePurchases: result.consumableStock,
    }
  }

  let nextPet = { ...result.pet, lastNeedsTickDate: today }
  result.events.forEach((eventId) => {
    nextPet = pushRecentEvent(nextPet, eventId)
  })

  const moneyAfterTick = Math.max(0, state.money + result.moneyDelta)
  const autoCare = runAutoCare({ pet: nextPet, ownerSkillTree: state.ownerSkillTree, money: moneyAfterTick })
  nextPet = { ...nextPet, hunger: autoCare.hunger, cleanliness: autoCare.cleanliness }

  const nextState = {
    ...state,
    money: autoCare.money,
    pet: nextPet,
    consumablePurchases: result.consumableStock,
  }

  return autoCare.purchases.length > 0 ? { ...nextState, _autoPurchaseLog: autoCare.purchases } : nextState
}

export function getOwnerState() {
  try {
    const raw = localStorage.getItem(OWNER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isLegacyOwnerShape(parsed)) return saveOwnerState(applyNeedsTickIfDue(migrateLegacyOwnerState(parsed)))
      let state = parsed
      if (state?.pet && !state.pet.stats) {
        state = { ...state, pet: { ...state.pet, stats: rollPetStats(state.pet.breedId, state.pet.personalityLabel) } }
      }
      if (state?.pet && state.pet.hunger === undefined) {
        state = { ...state, pet: withNeedsDefaults(state.pet) }
      }
      if (!state.ownerSkillTree) {
        state = { ...state, ownerSkillTree: defaultOwnerSkillTree() }
      }
      if (!state.pomodoroStreak) {
        state = { ...state, pomodoroStreak: defaultStreakState() }
      }
      if (!Number.isFinite(state.lifetimeFocusMinutes)) {
        state = { ...state, lifetimeFocusMinutes: 0 }
      }
      if (!Number.isFinite(state.money)) {
        state = { ...state, money: 0 }
      }
      if (!Number.isFinite(state.skillPoints)) {
        state = { ...state, skillPoints: 0 }
      }
      if (!Number.isFinite(state.lifetimePomodoros)) {
        state = { ...state, lifetimePomodoros: 0 }
      }
      if (typeof state.lifetimeFocusMinutesStartedAt !== 'string') {
        state = { ...state, lifetimeFocusMinutesStartedAt: todayDateString() }
      }
      if (!Array.isArray(state.petMemorials)) {
        state = { ...state, petMemorials: [] }
      }
      if (!Array.isArray(state.ownedCollectibles)) {
        state = { ...state, ownedCollectibles: [] }
      }
      if (!state.consumablePurchases || typeof state.consumablePurchases !== 'object') {
        state = { ...state, consumablePurchases: {} }
      }
      const ticked = applyNeedsTickIfDue(state)
      if (ticked !== parsed) {
        saveOwnerState(ticked)
        return ticked
      }
      return ticked
    }
  } catch {
    // fall through to fresh state below
  }
  return saveOwnerState(defaultOwnerState())
}

function archivePet(pet, endedAt, reason = 'replaced') {
  const daysWithOwner = Math.max(0, Math.floor((new Date(endedAt) - new Date(pet.bornAt)) / 86400000))
  return {
    speciesId: pet.speciesId,
    speciesLabel: pet.speciesLabel,
    breedId: pet.breedId,
    breedLabel: pet.breedLabel,
    name: pet.name,
    generation: pet.generation,
    daysWithOwner,
    highestGrowthStageLabel: getPetGrowthStage(pet.pomodorosSinceBorn, pet.speciesId).label,
    bornAt: pet.bornAt,
    endedAt,
    departureReason: reason,
  }
}

function rollNeedsStartingValues({ lastNeedsTickDate = null } = {}) {
  return {
    hunger: 30 + Math.floor(Math.random() * 31),
    cleanliness: 30 + Math.floor(Math.random() * 31),
    health: 60,
    affection: 30,
    lastNeedsTickDate,
    recentEvents: [],
  }
}

function withNeedsDefaults(pet) {
  if (pet.hunger !== undefined) return pet
  return { ...pet, ...rollNeedsStartingValues() }
}

export function createPet({ speciesId, breedId, name = '', personalityLabel, stats }) {
  const breed = getBreedById(speciesId, breedId)
  if (!breed) return null
  const species = getSpeciesById(speciesId)
  const state = getOwnerState()
  const now = new Date().toISOString()
  const previousPet = state.pet
  const petMemorials = previousPet ? [...state.petMemorials, archivePet(previousPet, now, 'replaced')] : state.petMemorials
  const pomodorosSinceBorn = previousPet ? calculateLegacyHeadStart(previousPet.pomodorosSinceBorn) : 0
  const resolvedPersonalityLabel = personalityLabel ?? rollPersonality()
  const resolvedStats = stats ?? rollPetStats(breedId, resolvedPersonalityLabel)

  return saveOwnerState({
    ...state,
    petMemorials,
    pet: {
      speciesId,
      speciesLabel: species.label,
      breedId,
      breedLabel: breed.label,
      name,
      personalityLabel: resolvedPersonalityLabel,
      generation: previousPet ? previousPet.generation + 1 : 1,
      pomodorosSinceBorn,
      bornAt: now,
      stats: resolvedStats,
      ...rollNeedsStartingValues({ lastNeedsTickDate: todayDateString() }),
    },
  })
}

export function renamePet(name) {
  const state = getOwnerState()
  if (!state.pet) return state
  return saveOwnerState({ ...state, pet: { ...state.pet, name } })
}

function applyRandomEventEffect(eventId, pet, ownerSkillTree) {
  switch (eventId) {
    case 'foundCoins':
      return { pet, moneyDelta: 10 + Math.floor(Math.random() * 11) }
    case 'fastLearner':
      return { pet: { ...pet, pomodorosSinceBorn: pet.pomodorosSinceBorn + 5 }, moneyDelta: 0 }
    case 'greatPlay':
      return { pet: { ...pet, affection: Math.min(100, pet.affection + 3) }, moneyDelta: 0 }
    case 'spilledBowl':
      return { pet: { ...pet, cleanliness: Math.max(0, pet.cleanliness - 15) }, moneyDelta: 0 }
    case 'ateSomethingBad': {
      const baseLoss = hasPetSkill(pet, 'sturdy') ? 5 : 10
      const loss = Math.max(0, baseLoss - getInstantGuardReduction(ownerSkillTree))
      return { pet: { ...pet, health: Math.max(0, pet.health - loss) }, moneyDelta: 0 }
    }
    case 'wanderedOff': {
      const cost = applyInsuranceDiscount(20, getInsuranceTier(ownerSkillTree))
      return { pet, moneyDelta: 0 - cost }
    }
    default:
      return { pet, moneyDelta: 0 }
  }
}

export function recordPomodoroReward(durationMinutes) {
  const state = getOwnerState()
  const money = durationMinutes * MONEY_PER_MINUTE + getBusinessSenseBonus(state.ownerSkillTree)
  const skillPoints = Math.max(1, Math.round(durationMinutes / (5 / SKILL_POINTS_PER_5_MINUTES)))
  const { streak: nextStreak, bonusSkillPoints } = advanceStreak(state.pomodoroStreak)
  const totalSkillPoints = skillPoints + bonusSkillPoints

  if (!state.pet) {
    const { trimmedTo90Days } = recordFocusSession({ dateString: todayDateString(), minutes: durationMinutes })
    const saved = saveOwnerState({
      ...state,
      lifetimePomodoros: state.lifetimePomodoros + 1,
      lifetimeFocusMinutes: state.lifetimeFocusMinutes + durationMinutes,
      money: state.money + money,
      skillPoints: state.skillPoints + totalSkillPoints,
      pomodoroStreak: nextStreak,
    })
    return trimmedTo90Days ? { ...saved, _focusHistoryTrimmed: true } : saved
  }

  const stageBefore = getPetGrowthStage(state.pet.pomodorosSinceBorn, state.pet.speciesId).stageKey
  const petAfterProgress = { ...state.pet, pomodorosSinceBorn: state.pet.pomodorosSinceBorn + 1 }
  const stageAfter = getPetGrowthStage(petAfterProgress.pomodorosSinceBorn, petAfterProgress.speciesId).stageKey
  const growthMilestoneStageKey = stageAfter !== stageBefore ? stageAfter : null
  const { trimmedTo90Days } = recordFocusSession({ dateString: todayDateString(), minutes: durationMinutes, growthMilestoneStageKey })

  // useTimer.js 已經在呼叫這個函式之前先呼叫過 incrementTodayCount()，
  // 所以這裡只需要讀取（不能再遞增一次，否則今天完成數會被算兩次）。
  const isEighthToday = getTodayCount() === 8
  const affectionGain = computePomodoroAffectionGain({
    friendliness: getEffectiveFriendliness(petAfterProgress, state.ownerSkillTree),
    bondingLevel: getBondingAffectionLevel(state.ownerSkillTree),
    hasCharmSkill: hasPetSkill(petAfterProgress, 'charm') || hasPetSkill(petAfterProgress, 'clingy'),
    isEighthToday,
    speciesDailyBonus: getSpeciesAffectionBonus(petAfterProgress, state.ownerSkillTree),
  })

  let nextPet = { ...petAfterProgress, affection: Math.min(100, petAfterProgress.affection + affectionGain) }
  let moneyDelta = 0

  const isExcited = determineMood({
    health: nextPet.health,
    affection: nextPet.affection,
    cleanliness: nextPet.cleanliness,
    hunger: nextPet.hunger,
  }) === 'excited'

  if (isExcited) {
    const petSkillIds = getUnlockedPetSkillIds(nextPet)
    const eventId = rollRandomEvent({
      energy: nextPet.stats.energy,
      wanderedOffReduced: petSkillIds.includes('houseWatch') || petSkillIds.includes('comeHome'),
      luckyStar: petSkillIds.includes('luckyStar'),
    })
    if (eventId) {
      const applied = applyRandomEventEffect(eventId, nextPet, state.ownerSkillTree)
      nextPet = applied.pet
      moneyDelta += applied.moneyDelta
      nextPet = pushRecentEvent(nextPet, eventId)
    }
  }

  const saved = saveOwnerState({
    ...state,
    lifetimePomodoros: state.lifetimePomodoros + 1,
    lifetimeFocusMinutes: state.lifetimeFocusMinutes + durationMinutes,
    money: Math.max(0, state.money + money + moneyDelta),
    skillPoints: state.skillPoints + totalSkillPoints,
    pet: nextPet,
    pomodoroStreak: nextStreak,
  })
  return trimmedTo90Days ? { ...saved, _focusHistoryTrimmed: true } : saved
}

export function grantResources({ money = 0, skillPoints = 0 } = {}) {
  const state = getOwnerState()
  return saveOwnerState({
    ...state,
    money: state.money + money,
    skillPoints: state.skillPoints + skillPoints,
  })
}

export function resetOwnerState() {
  return saveOwnerState(defaultOwnerState())
}

export function setPetGrowthProgress(pomodorosSinceBorn) {
  const state = getOwnerState()
  if (!state.pet) return state
  return saveOwnerState({
    ...state,
    pet: { ...state.pet, pomodorosSinceBorn },
  })
}

export function setPetNeeds({ hunger, cleanliness, health, affection } = {}) {
  const state = getOwnerState()
  if (!state.pet) return state
  const nextPet = { ...state.pet }
  if (hunger !== undefined) nextPet.hunger = clampNeed(hunger)
  if (cleanliness !== undefined) nextPet.cleanliness = clampNeed(cleanliness)
  if (health !== undefined) nextPet.health = clampNeed(health)
  if (affection !== undefined) nextPet.affection = clampNeed(affection)
  return saveOwnerState({ ...state, pet: nextPet })
}

export function debugSetTodayCount(dateString, count) {
  safeSetItem(TODAY_COUNT_KEY, JSON.stringify({ date: dateString, count }))
}

export function getShopPrice(itemId, ownerSkillTree) {
  const item = getShopItem(itemId)
  if (!item) return 0
  return applyBargainDiscount(item.cost, getBargainDiscountRate(ownerSkillTree))
}

export function purchaseShopItem(itemId) {
  const item = getShopItem(itemId)
  if (!item) return null

  const state = getOwnerState()
  const price = getShopPrice(itemId, state.ownerSkillTree)
  if (state.money < price) return null

  if (item.category === 'collectible') {
    if (state.ownedCollectibles.includes(itemId)) return null
    return saveOwnerState({
      ...state,
      money: state.money - price,
      ownedCollectibles: [...state.ownedCollectibles, itemId],
    })
  }

  const currentStock = state.consumablePurchases[itemId] || 0

  return saveOwnerState({
    ...state,
    money: state.money - price,
    consumablePurchases: { ...state.consumablePurchases, [itemId]: currentStock + 1 },
  })
}

function countOwnerPetProgress(state) {
  const allPets = [state.pet, ...state.petMemorials].filter(Boolean)
  const size = { small: 0, medium: 0, large: 0 }
  const species = { dog: 0, cat: 0 }
  for (const pet of allPets) {
    const tag = sizeTagOf(pet)
    if (tag) size[tag] += 1
    if (species[pet.speciesId] !== undefined) species[pet.speciesId] += 1
  }
  return { size, species }
}

export function getOwnerPetProgressCounts() {
  return countOwnerPetProgress(getOwnerState())
}

export function upgradeLinearOwnerSkill(trackId) {
  const state = getOwnerState()
  const { ok, cost } = canUpgradeLinearTrack(state.ownerSkillTree, trackId)
  if (!ok || state.skillPoints < cost) return null
  return saveOwnerState({
    ...state,
    skillPoints: state.skillPoints - cost,
    ownerSkillTree: upgradeLinearTrack(state.ownerSkillTree, trackId),
  })
}

export function upgradeSpecializationOwnerSkill(category, tag) {
  const state = getOwnerState()
  const ownedCount = countOwnerPetProgress(state)[category][tag]
  const { ok, cost } = canUpgradeSpecialization(state.ownerSkillTree, category, tag, ownedCount)
  if (!ok || state.skillPoints < cost) return null
  return saveOwnerState({
    ...state,
    skillPoints: state.skillPoints - cost,
    ownerSkillTree: upgradeSpecialization(state.ownerSkillTree, category, tag),
  })
}

export function unlockSingleOwnerSkill(trackId) {
  const state = getOwnerState()
  const { ok, cost } = canUnlockSingle(state.ownerSkillTree, trackId)
  if (!ok || state.skillPoints < cost) return null
  return saveOwnerState({
    ...state,
    skillPoints: state.skillPoints - cost,
    ownerSkillTree: unlockSingle(state.ownerSkillTree, trackId),
  })
}

export function visitVet() {
  const state = getOwnerState()
  if (!state.pet) return null
  const effect = applyVetVisit({ health: state.pet.health, hunger: state.pet.hunger, cleanliness: state.pet.cleanliness })
  const actualCost = applyInsuranceDiscount(effect.cost, getInsuranceTier(state.ownerSkillTree))
  if (!canVisitVet({ health: state.pet.health, money: state.money, cost: actualCost })) return null
  return saveOwnerState({
    ...state,
    money: state.money - actualCost,
    pet: {
      ...state.pet,
      health: effect.health,
      hunger: effect.hunger,
      cleanliness: effect.cleanliness,
      affection: clampNeed(state.pet.affection + effect.affectionDelta),
    },
  })
}
