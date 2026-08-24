export const DOG_SKILLS = [
  { id: 'sit', label: '乖乖坐下', threshold: 8 },
  { id: 'potty', label: '上廁所', threshold: 20 },
  { id: 'selfEntertain', label: '自得其樂', threshold: 35 },
  { id: 'houseWatch', label: '看家', threshold: 50 },
  { id: 'charm', label: '討好賣萌', threshold: 75 },
]

export const CAT_SKILLS = [
  { id: 'clawGentle', label: '磨爪不搗蛋', threshold: 8 },
  { id: 'selfGroom', label: '自己理毛', threshold: 20 },
  { id: 'independent', label: '獨立生活', threshold: 35 },
  { id: 'comeHome', label: '乖乖回家', threshold: 50 },
  { id: 'clingy', label: '撒嬌討摸', threshold: 75 },
]

export const COMMON_SKILLS = [
  { id: 'sturdy', label: '健壯體質', threshold: 20 },
  { id: 'thrifty', label: '節省飲食', threshold: 35 },
  { id: 'veteran', label: '老手', threshold: 50 },
  { id: 'luckyStar', label: '幸運星', threshold: 75 },
]

const SPECIES_SKILLS = {
  dog: DOG_SKILLS,
  cat: CAT_SKILLS,
}

export function getSpeciesSkillPool(speciesId) {
  return SPECIES_SKILLS[speciesId] ?? []
}

export const PET_SKILL_DESCRIPTIONS = {
  sit: '讓寵物惹麻煩的機率再降低一點',
  clawGentle: '讓寵物惹麻煩的機率再降低一點',
  potty: '讓潔淨度掉得比較慢',
  selfGroom: '讓潔淨度掉得比較慢',
  selfEntertain: '降低寵物離開飼主的機率',
  independent: '降低寵物離開飼主的機率',
  houseWatch: '降低「走失片刻」這個意外發生的機率',
  comeHome: '降低「走失片刻」這個意外發生的機率',
  charm: '完成番茄鐘時，好感度會多漲一點',
  clingy: '完成番茄鐘時，好感度會多漲一點',
  sturdy: '「貪吃亂吃東西」這個意外造成的健康度傷害會減半',
  thrifty: '讓飽食度掉得比較慢',
  veteran: '讓寵物惹麻煩的機率再降低一點',
  luckyStar: '運氣不好遇到壞事時，有機會臨時轉成好事',
}

export const PET_SKILL_LABELS = Object.fromEntries(
  [...DOG_SKILLS, ...CAT_SKILLS, ...COMMON_SKILLS].map((skill) => [skill.id, skill.label]),
)

export function getSkillProgress(pomodorosSinceBorn, learning) {
  return pomodorosSinceBorn * (1 + learning / 100)
}

export function getUnlockedPetSkillIds(pet) {
  const progress = getSkillProgress(pet.pomodorosSinceBorn, pet.stats.learning)
  const speciesPool = SPECIES_SKILLS[pet.speciesId] ?? []
  return [...speciesPool, ...COMMON_SKILLS]
    .filter((skill) => progress >= skill.threshold)
    .map((skill) => skill.id)
}

export function hasPetSkill(pet, skillId) {
  return getUnlockedPetSkillIds(pet).includes(skillId)
}
