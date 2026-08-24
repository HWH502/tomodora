import { SPECIES, getBreedById } from './petSpecies'

const LEVEL_5_10_15 = [0, 5, 10, 15]
const DECAY_REDUCTION_BY_LEVEL = [0, 1, 2, 3]

export function defaultOwnerSkillTree() {
  return {
    trainingTechnique: 0,
    socialTraining: 0,
    sizeSpecialization: { small: 0, medium: 0, large: 0 },
    speciesSpecialization: { dog: 0, cat: 0, rodent: 0 },
    businessSense: 0,
    bargainHunter: 0,
    bonding: { affection: 0, kibble: 0, supplement: 0, grooming: 0 },
    autoFeed: false,
    autoGrooming: false,
    instantGuard: 0,
    petInsurance: 0,
  }
}

export function sizeTagOf(pet) {
  const breed = getBreedById(pet.speciesId, pet.breedId)
  const tag = breed?.tags?.[0]
  if (tag === '小型') return 'small'
  if (tag === '中型') return 'medium'
  if (tag === '大型') return 'large'
  return null
}

export function getEffectiveObedience(pet, tree) {
  return pet.stats.obedience + (LEVEL_5_10_15[tree.trainingTechnique] ?? 0)
}

export function getEffectiveFriendliness(pet, tree) {
  return pet.stats.friendliness + (LEVEL_5_10_15[tree.socialTraining] ?? 0)
}

export function getHungerDecayReduction(pet, tree) {
  const size = sizeTagOf(pet)
  if (!size) return 0
  const sizeLevel = tree.sizeSpecialization[size] ?? 0
  return DECAY_REDUCTION_BY_LEVEL[sizeLevel] ?? 0
}

export function getCleanlinessDecayReduction(pet, tree) {
  const speciesLevel = tree.speciesSpecialization[pet.speciesId] ?? 0
  return DECAY_REDUCTION_BY_LEVEL[speciesLevel] ?? 0
}

export function getHealthPenaltyLevel(pet, tree) {
  const size = sizeTagOf(pet)
  if (!size) return 0
  return tree.sizeSpecialization[size] ?? 0
}

export function getInstantGuardReduction(tree) {
  return [0, 2, 4, 6][tree.instantGuard] ?? 0
}

export function getInsuranceTier(tree) {
  return tree.petInsurance ?? 0
}

export function getObedienceIncidentReduction(_tree) {
  return 0 // 服從度惹事事件的降低機率完全來自寵物技能（乖乖坐下/磨爪不搗蛋/老手），飼主技能樹目前沒有對應節點
}

export function getBondingAffectionLevel(tree) {
  return tree.bonding.affection ?? 0
}

export function getBondingConsumableLevel(tree, itemId) {
  const key = { kibble: 'kibble', supplement: 'supplement', grooming: 'grooming' }[itemId]
  return key ? tree.bonding[key] ?? 0 : 0
}

export const LEVEL_COSTS = [30, 80, 200]
export const SINGLE_UNLOCK_COST = 120
export const REQUIRED_PET_COUNTS = [1, 3, 5]

export const SPECIALIZATION_CATEGORIES = {
  size: { path: 'sizeSpecialization', tags: ['small', 'medium', 'large'] },
  species: { path: 'speciesSpecialization', tags: ['dog', 'cat', 'rodent'] },
}

export const SKILL_TRACK_CATALOG = [
  { id: 'trainingTechnique', label: '訓練技巧', branch: 'nurture', type: 'linear' },
  { id: 'socialTraining', label: '社交訓練', branch: 'nurture', type: 'linear' },
  { id: 'sizeSpecialization.small', label: '體型專精（小型）', branch: 'nurture', type: 'specialization', category: 'size', tag: 'small' },
  { id: 'sizeSpecialization.medium', label: '體型專精（中型）', branch: 'nurture', type: 'specialization', category: 'size', tag: 'medium' },
  { id: 'sizeSpecialization.large', label: '體型專精（大型）', branch: 'nurture', type: 'specialization', category: 'size', tag: 'large' },
  { id: 'speciesSpecialization.dog', label: '物種專精（犬類）', branch: 'nurture', type: 'specialization', category: 'species', tag: 'dog' },
  { id: 'speciesSpecialization.cat', label: '物種專精（貓類）', branch: 'nurture', type: 'specialization', category: 'species', tag: 'cat' },
  { id: 'speciesSpecialization.rodent', label: '物種專精（鼠類）', branch: 'nurture', type: 'specialization', category: 'species', tag: 'rodent' },
  { id: 'businessSense', label: '番茄生意經', branch: 'business', type: 'linear' },
  { id: 'bargainHunter', label: '比價達人', branch: 'business', type: 'linear' },
  { id: 'bonding.affection', label: '知心相伴', branch: 'bonding', type: 'linear' },
  { id: 'bonding.kibble', label: '美味料理', branch: 'bonding', type: 'linear' },
  { id: 'bonding.supplement', label: '保健秘方', branch: 'bonding', type: 'linear' },
  { id: 'bonding.grooming', label: '清潔大師', branch: 'bonding', type: 'linear' },
  { id: 'autoFeed', label: '自動餵食', branch: 'auto', type: 'single' },
  { id: 'autoGrooming', label: '自動盥洗', branch: 'auto', type: 'single' },
  { id: 'instantGuard', label: '即時守護', branch: 'standalone', type: 'linear' },
  { id: 'petInsurance', label: '寵物保險', branch: 'standalone', type: 'linear' },
]

function getPath(obj, path) {
  return path.split('.').reduce((value, key) => value[key], obj)
}

function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.')
  if (rest.length === 0) return { ...obj, [head]: value }
  return { ...obj, [head]: setPath(obj[head], rest.join('.'), value) }
}

export function getTrackLevel(tree, trackId) {
  return getPath(tree, trackId)
}

export function canUpgradeLinearTrack(tree, trackId) {
  const level = getTrackLevel(tree, trackId)
  if (level >= 3) return { ok: false, reason: 'maxed' }
  return { ok: true, cost: LEVEL_COSTS[level] }
}

export function upgradeLinearTrack(tree, trackId) {
  return setPath(tree, trackId, getTrackLevel(tree, trackId) + 1)
}

export function canUpgradeSpecialization(tree, category, tag, ownedCount) {
  const { path } = SPECIALIZATION_CATEGORIES[category]
  const level = tree[path][tag]
  if (level >= 3) return { ok: false, reason: 'maxed' }
  const required = REQUIRED_PET_COUNTS[level]
  if (ownedCount < required) return { ok: false, reason: 'needsMorePets', required, owned: ownedCount }
  return { ok: true, cost: LEVEL_COSTS[level] }
}

export function upgradeSpecialization(tree, category, tag) {
  const { path } = SPECIALIZATION_CATEGORIES[category]
  return { ...tree, [path]: { ...tree[path], [tag]: tree[path][tag] + 1 } }
}

export function canUnlockSingle(tree, trackId) {
  if (tree[trackId]) return { ok: false, reason: 'alreadyUnlocked' }
  return { ok: true, cost: SINGLE_UNLOCK_COST }
}

export function unlockSingle(tree, trackId) {
  return { ...tree, [trackId]: true }
}

export function isSpeciesTagAvailable(tag) {
  return SPECIES.some((species) => species.id === tag)
}

export const BUSINESS_SENSE_BONUS = [0, 3, 6, 10]
export const BARGAIN_DISCOUNT_RATE = [0, 0.05, 0.10, 0.15]
export const SPECIES_AFFECTION_BONUS = [0, 1, 2, 3]

export function getBusinessSenseBonus(tree) {
  return BUSINESS_SENSE_BONUS[tree.businessSense] ?? 0
}

export function getBargainDiscountRate(tree) {
  return BARGAIN_DISCOUNT_RATE[tree.bargainHunter] ?? 0
}

export function applyBargainDiscount(cost, rate) {
  return Math.round(cost * (1 - rate))
}

export function getSpeciesAffectionBonus(pet, tree) {
  const level = tree.speciesSpecialization[pet.speciesId] ?? 0
  return SPECIES_AFFECTION_BONUS[level] ?? 0
}
