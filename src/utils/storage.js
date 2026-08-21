import { getShopItem } from './shopItems'
import { calculateLegacyHeadStart, getPetGrowthStage, rollPersonality, rollPetStats } from './pet'
import { getBreedById, getBreedByLabel, getSpeciesById } from './petSpecies'

const SETTINGS_KEY = 'pomodoro.settings'
const TODAY_COUNT_KEY = 'pomodoro.todayCount'
const OWNER_KEY = 'pomodoro.owner'

const DEFAULT_SETTINGS = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
}

const MONEY_PER_MINUTE = 2
const SKILL_POINTS_PER_5_MINUTES = 1

function defaultOwnerState() {
  return {
    lifetimePomodoros: 0,
    money: 0,
    skillPoints: 0,
    pet: null,
    petMemorials: [],
    ownedCollectibles: [],
    consumablePurchases: {},
  }
}

function todayDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
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
  localStorage.setItem(TODAY_COUNT_KEY, JSON.stringify({ date: today, count: 0 }))
  return 0
}

export function incrementTodayCount() {
  const current = getTodayCount()
  const next = current + 1
  localStorage.setItem(
    TODAY_COUNT_KEY,
    JSON.stringify({ date: todayDateString(), count: next }),
  )
  return next
}

function saveOwnerState(state) {
  localStorage.setItem(OWNER_KEY, JSON.stringify(state))
  return state
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
    },
    petMemorials: [],
    ownedCollectibles: Array.isArray(parsed.ownedCollectibles) ? parsed.ownedCollectibles : [],
    consumablePurchases:
      parsed.consumablePurchases && typeof parsed.consumablePurchases === 'object'
        ? parsed.consumablePurchases
        : {},
  }
}

export function getOwnerState() {
  try {
    const raw = localStorage.getItem(OWNER_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (isLegacyOwnerShape(parsed)) return saveOwnerState(migrateLegacyOwnerState(parsed))
      if (parsed?.pet && !parsed.pet.stats) {
        return saveOwnerState({
          ...parsed,
          pet: { ...parsed.pet, stats: rollPetStats(parsed.pet.breedId, parsed.pet.personalityLabel) },
        })
      }
      return parsed
    }
  } catch {
    // fall through to fresh state below
  }
  return saveOwnerState(defaultOwnerState())
}

function archivePet(pet, endedAt) {
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
  }
}

export function createPet({ speciesId, breedId, name = '', personalityLabel, stats }) {
  const breed = getBreedById(speciesId, breedId)
  if (!breed) return null
  const species = getSpeciesById(speciesId)
  const state = getOwnerState()
  const now = new Date().toISOString()
  const previousPet = state.pet
  const petMemorials = previousPet ? [...state.petMemorials, archivePet(previousPet, now)] : state.petMemorials
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
    },
  })
}

export function renamePet(name) {
  const state = getOwnerState()
  if (!state.pet) return state
  return saveOwnerState({ ...state, pet: { ...state.pet, name } })
}

export function recordPomodoroReward(durationMinutes) {
  const state = getOwnerState()
  const money = durationMinutes * MONEY_PER_MINUTE
  const skillPoints = Math.max(1, Math.round(durationMinutes / (5 / SKILL_POINTS_PER_5_MINUTES)))
  return saveOwnerState({
    ...state,
    lifetimePomodoros: state.lifetimePomodoros + 1,
    money: state.money + money,
    skillPoints: state.skillPoints + skillPoints,
    pet: state.pet ? { ...state.pet, pomodorosSinceBorn: state.pet.pomodorosSinceBorn + 1 } : null,
  })
}

export function purchaseShopItem(itemId) {
  const item = getShopItem(itemId)
  if (!item) return null

  const state = getOwnerState()
  if (state.money < item.cost) return null

  if (item.category === 'collectible') {
    if (state.ownedCollectibles.includes(itemId)) return null
    return saveOwnerState({
      ...state,
      money: state.money - item.cost,
      ownedCollectibles: [...state.ownedCollectibles, itemId],
    })
  }

  const currentCount = state.consumablePurchases[itemId] || 0
  return saveOwnerState({
    ...state,
    money: state.money - item.cost,
    consumablePurchases: { ...state.consumablePurchases, [itemId]: currentCount + 1 },
  })
}
