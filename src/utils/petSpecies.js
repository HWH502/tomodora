export const SPECIES = [
  {
    id: 'dog',
    label: '狗',
    breeds: [
      { id: 'poodle', label: '貴賓犬', tags: ['小型'] },
      { id: 'shiba', label: '柴犬', tags: ['中型'] },
      { id: 'golden-retriever', label: '黃金獵犬', tags: ['大型'] },
    ],
    growthStageOverrides: {
      young: { emoji: '🐶', label: '幼犬階段' },
      growing: { emoji: '🐕' },
      capable: { emoji: '🦮' },
      trained: { emoji: '🐕‍🦺' },
      senior: { emoji: '🐩' },
      legend: { emoji: '🏆🐕', label: '傳奇老狗' },
    },
  },
  {
    id: 'cat',
    label: '貓',
    breeds: [
      { id: 'american-shorthair', label: '美短', tags: ['小型'] },
      { id: 'british-shorthair', label: '英短', tags: ['中型'] },
      { id: 'ragdoll', label: '布偶貓', tags: ['大型'] },
    ],
    growthStageOverrides: {
      young: { emoji: '🐱', label: '幼貓階段' },
      growing: { emoji: '🐈' },
      capable: { emoji: '😺' },
      trained: { emoji: '😸' },
      senior: { emoji: '😻' },
      legend: { emoji: '🏆🐈', label: '傳奇老貓' },
    },
  },
]

export function getSpeciesById(speciesId) {
  return SPECIES.find((species) => species.id === speciesId)
}

export function getBreedById(speciesId, breedId) {
  return getSpeciesById(speciesId)?.breeds.find((breed) => breed.id === breedId)
}

// 只給 storage.js 的舊資料轉換用：把舊格式的 breedLabel 字串對回真正的 speciesId/breedId
export function getBreedByLabel(breedLabel) {
  for (const species of SPECIES) {
    const breed = species.breeds.find((candidate) => candidate.label === breedLabel)
    if (breed) return { ...breed, speciesId: species.id, speciesLabel: species.label }
  }
  return undefined
}
