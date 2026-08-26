import { GROWTH_STAGE_DEFS, getPetGrowthStage } from './pet'
import { getSpeciesById } from './petSpecies'

const DEPARTURE_REASON_NOTE_ENDINGS = {
  health: '後來生病離開了。',
  replaced: '後來開始照顧新的家人了。',
  affection: '後來離開去別的地方了。',
}

function formatFocusMinutesLabel(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours} 小時 ${minutes} 分` : `${minutes} 分`
}

function formatStartedAtLabel(startedAtDateString) {
  return startedAtDateString.replaceAll('-', '/')
}

function resolveStageLabelRank(speciesId, label) {
  const species = getSpeciesById(speciesId) ?? getSpeciesById('dog')
  const index = GROWTH_STAGE_DEFS.findIndex((def) => {
    const override = species.growthStageOverrides[def.stageKey]
    return (override.label ?? def.label) === label
  })
  return index === -1 ? GROWTH_STAGE_DEFS.length : index
}

function findHighestMemorial(petMemorials) {
  return petMemorials.reduce((best, memorial) => {
    if (!best) return memorial
    const bestRank = resolveStageLabelRank(best.speciesId, best.highestGrowthStageLabel)
    const candidateRank = resolveStageLabelRank(memorial.speciesId, memorial.highestGrowthStageLabel)
    return candidateRank < bestRank ? memorial : best
  }, null)
}

function buildStats({ lifetimePomodoros, lifetimeFocusMinutes, lifetimeFocusMinutesStartedAt }) {
  return {
    lifetimePomodoros,
    focusMinutesLabel: formatFocusMinutesLabel(lifetimeFocusMinutes),
    startedAtLabel: formatStartedAtLabel(lifetimeFocusMinutesStartedAt),
  }
}

function buildPetSection(pet, petMemorials) {
  const stage = getPetGrowthStage(pet.pomodorosSinceBorn, pet.speciesId)
  const legacyLine = petMemorials.length > 0
    ? `歷代最高紀錄：長大成${findHighestMemorial(petMemorials).highestGrowthStageLabel}`
    : null

  return {
    name: pet.name,
    breedLabel: pet.breedLabel,
    stageLabel: stage.label,
    stageKey: stage.stageKey,
    emoji: stage.emoji,
    speciesId: pet.speciesId,
    breedId: pet.breedId,
    generation: pet.generation,
    legacyLine,
  }
}

function buildMemorialSection(petMemorials) {
  const lastMemorial = petMemorials[petMemorials.length - 1]
  const noteEnding = DEPARTURE_REASON_NOTE_ENDINGS[lastMemorial.departureReason] ?? '後來離開了。'
  return {
    name: lastMemorial.name,
    breedLabel: lastMemorial.breedLabel,
    daysWithOwner: lastMemorial.daysWithOwner,
    generation: lastMemorial.generation,
    noteText: `陪你度過 ${lastMemorial.daysWithOwner} 天，一起長大到「${lastMemorial.highestGrowthStageLabel}」，${noteEnding}`,
  }
}

export function buildShareCardData({ pet, petMemorials, lifetimePomodoros, lifetimeFocusMinutes, lifetimeFocusMinutesStartedAt }) {
  const stats = buildStats({ lifetimePomodoros, lifetimeFocusMinutes, lifetimeFocusMinutesStartedAt })

  if (pet) {
    return { variant: 'hasPet', stats, pet: buildPetSection(pet, petMemorials), memorial: null }
  }
  if (petMemorials.length > 0) {
    return { variant: 'memorial', stats, pet: null, memorial: buildMemorialSection(petMemorials) }
  }
  return { variant: 'noPet', stats, pet: null, memorial: null }
}
