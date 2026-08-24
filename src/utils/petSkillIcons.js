export function createPetSkillIconResolver(iconMap) {
  return function resolvePetSkillIconUrl(skillId) {
    return iconMap[`${skillId}.png`] ?? null
  }
}

const rawIcons = import.meta.glob('../assets/skills/*.png', { eager: true, import: 'default' })

const ASSET_MARKER = 'assets/skills/'

const iconMap = Object.fromEntries(
  Object.entries(rawIcons).map(([path, url]) => {
    const markerIndex = path.indexOf(ASSET_MARKER)
    const key = markerIndex === -1 ? path : path.slice(markerIndex + ASSET_MARKER.length)
    return [key, url]
  }),
)

export const getPetSkillIconUrl = createPetSkillIconResolver(iconMap)
