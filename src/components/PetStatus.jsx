import { useEffect, useState } from 'react'
import { getPetGrowthStage, rollRandomName } from '../utils/pet'
import { getPetImageUrl } from '../utils/petImages'
import PetNeedsBars from './PetNeedsBars'
import PetSkills from './PetSkills'
import { canVisitVet, DANGER_THRESHOLD, RANDOM_EVENT_LABELS, VET_COST } from '../utils/petNeeds'

const EVENT_LABELS = {
  ...RANDOM_EVENT_LABELS,
  obedienceIncident: '寵物惹了點小麻煩',
}

export default function PetStatus({ pet, money, skillPoints, onRenamePet, onVisitVet }) {
  const [isEditingName, setIsEditingName] = useState(!pet.name)
  const [nameInput, setNameInput] = useState(pet.name)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const stage = getPetGrowthStage(pet.pomodorosSinceBorn, pet.speciesId)
  const imageUrl = getPetImageUrl(pet.speciesId, pet.breedId, stage.stageKey)
  const showImage = imageUrl && !imageLoadFailed

  useEffect(() => {
    setImageLoadFailed(false)
  }, [imageUrl])

  const confirmName = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) return
    onRenamePet(trimmed)
    setNameInput(trimmed)
    setIsEditingName(false)
  }

  const startEditingName = () => {
    setNameInput(pet.name)
    setIsEditingName(true)
  }

  return (
    <section className="pet-status">
      {showImage ? (
        <img
          className="pet-status__avatar"
          src={imageUrl}
          alt={pet.breedLabel}
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <p className="pet-status__avatar" aria-hidden="true">
          {stage.emoji}
        </p>
      )}
      <p className="pet-status__stage">{stage.label}</p>

      {isEditingName ? (
        <div className="pet-status__name-field">
          <input
            type="text"
            placeholder="幫寵物取個名字"
            value={nameInput}
            onChange={(event) => setNameInput(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && confirmName()}
          />
          <button type="button" title="隨機取名" onClick={() => setNameInput(rollRandomName())}>
            🎲
          </button>
          <button type="button" onClick={confirmName}>
            確認
          </button>
        </div>
      ) : (
        <div className="pet-status__name-display">
          <span>{pet.name}</span>
          <button type="button" title="修改名字" onClick={startEditingName}>
            ✏️
          </button>
        </div>
      )}

      <p className="pet-status__info">
        {pet.breedLabel} · {pet.personalityLabel}
      </p>

      <ul className="pet-status__stats">
        <li>學習力 {pet.stats.learning}</li>
        <li>服從度 {pet.stats.obedience}</li>
        <li>友善度 {pet.stats.friendliness}</li>
        <li>活力 {pet.stats.energy}</li>
      </ul>

      <PetNeedsBars pet={pet} />

      <PetSkills pet={pet} />

      {pet.health < DANGER_THRESHOLD && <p className="pet-status__vet-hint">需要就醫</p>}
      <button
        type="button"
        className="pet-status__vet-button"
        onClick={onVisitVet}
        disabled={!canVisitVet({ health: pet.health, money })}
      >
        就醫（{VET_COST} 💰）
      </button>

      {pet.recentEvents?.length > 0 && (
        <ul className="pet-status__events">
          {pet.recentEvents
            .slice()
            .reverse()
            .map((event) => (
              <li key={event.occurredAt}>{EVENT_LABELS[event.id] ?? event.id}</li>
            ))}
        </ul>
      )}

      <div className="pet-status__currency">
        <span>💰 {money}</span>
        <span>⭐ {skillPoints}</span>
      </div>
    </section>
  )
}
