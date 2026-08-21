import { getSpeciesById } from './petSpecies'

const PERSONALITY_POOL = ['黏人', '獨立', '愛玩', '穩重', '機靈', '溫柔']

const BREED_BASE_STATS = {
  poodle: { learning: 22, obedience: 12, friendliness: 8, energy: 18 },
  shiba: { learning: 12, obedience: 5, friendliness: 17, energy: 26 },
  'golden-retriever': { learning: 16, obedience: 18, friendliness: 20, energy: 6 },
  'american-shorthair': { learning: 14, obedience: 9, friendliness: 17, energy: 20 },
  'british-shorthair': { learning: 15, obedience: 10, friendliness: 22, energy: 13 },
  ragdoll: { learning: 10, obedience: 15, friendliness: 29, energy: 6 },
}

const PERSONALITY_STAT_MODIFIERS = {
  黏人: { learning: 3, obedience: 6, friendliness: 12, energy: 4 },
  獨立: { learning: 6, obedience: 3, friendliness: 4, energy: 12 },
  愛玩: { learning: 3, obedience: 3, friendliness: 9, energy: 10 },
  穩重: { learning: 5, obedience: 12, friendliness: 4, energy: 4 },
  機靈: { learning: 12, obedience: 5, friendliness: 4, energy: 4 },
  溫柔: { learning: 4, obedience: 9, friendliness: 8, energy: 4 },
}

const STAT_KEYS = ['learning', 'obedience', 'friendliness', 'energy']

function rollRandomFluctuation() {
  const raw = STAT_KEYS.map(() => Math.random())
  const total = raw.reduce((sum, value) => sum + value, 0)
  const scaled = raw.map((value) => (value / total) * 15)
  const floored = scaled.map((value) => Math.floor(value))
  const remainder = 15 - floored.reduce((sum, value) => sum + value, 0)
  const orderByFractionDesc = STAT_KEYS.map((_, index) => index).sort(
    (a, b) => (scaled[b] - floored[b]) - (scaled[a] - floored[a]),
  )
  for (let i = 0; i < remainder; i += 1) {
    floored[orderByFractionDesc[i]] += 1
  }
  return floored
}

export const SUGGESTED_PET_NAMES = ['小豆', '旺財', '可樂', '饅頭', '大福', '麻糬']

export const GROWTH_STAGE_DEFS = [
  { minPomodoros: 100, stageKey: 'legend' },
  { minPomodoros: 60, stageKey: 'senior', label: '資深老友' },
  { minPomodoros: 30, stageKey: 'trained', label: '訓練有成' },
  { minPomodoros: 15, stageKey: 'capable', label: '稱職夥伴' },
  { minPomodoros: 5, stageKey: 'growing', label: '活潑成長期' },
  { minPomodoros: 0, stageKey: 'young' },
]

export const LEGACY_HEAD_START_RATE = 0.1
export const LEGACY_HEAD_START_CAP = 10

function pickRandom(pool) {
  return pool[Math.floor(Math.random() * pool.length)]
}

export function rollPersonality() {
  return pickRandom(PERSONALITY_POOL)
}

export function rollRandomName() {
  return pickRandom(SUGGESTED_PET_NAMES)
}

export function rollPetStats(breedId, personalityLabel) {
  const base = BREED_BASE_STATS[breedId] ?? BREED_BASE_STATS.shiba
  const modifier = PERSONALITY_STAT_MODIFIERS[personalityLabel] ?? PERSONALITY_STAT_MODIFIERS.穩重
  const fluctuation = rollRandomFluctuation()
  const result = {}
  STAT_KEYS.forEach((key, index) => {
    result[key] = base[key] + modifier[key] + fluctuation[index]
  })
  return result
}

export function getPetGrowthStage(pomodorosSinceBorn, speciesId) {
  const species = getSpeciesById(speciesId) ?? getSpeciesById('dog')
  const def = GROWTH_STAGE_DEFS.find((candidate) => pomodorosSinceBorn >= candidate.minPomodoros)
  const override = species.growthStageOverrides[def.stageKey]
  return { stageKey: def.stageKey, emoji: override.emoji, label: override.label ?? def.label }
}

export function calculateLegacyHeadStart(previousPetPomodorosSinceBorn) {
  return Math.min(LEGACY_HEAD_START_CAP, Math.round(previousPetPomodorosSinceBorn * LEGACY_HEAD_START_RATE))
}
