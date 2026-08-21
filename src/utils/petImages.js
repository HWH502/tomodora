export function createPetImageResolver(imageMap) {
  return function resolvePetImageUrl(speciesId, breedId, stageKey) {
    const breedKey = `${speciesId}/${breedId}/${stageKey}.png`
    const defaultKey = `${speciesId}/default/${stageKey}.png`
    return imageMap[breedKey] ?? imageMap[defaultKey] ?? null
  }
}

const rawImages = import.meta.glob('../assets/pets/**/*.png', { eager: true, import: 'default' })

const ASSET_MARKER = 'assets/pets/'

const imageMap = Object.fromEntries(
  Object.entries(rawImages).map(([path, url]) => {
    const markerIndex = path.indexOf(ASSET_MARKER)
    const key = markerIndex === -1 ? path : path.slice(markerIndex + ASSET_MARKER.length)
    return [key, url]
  }),
)

export const getPetImageUrl = createPetImageResolver(imageMap)
