import { useState } from 'react'
import { getPetGrowthStage, rollRandomName } from '../utils/pet'

export default function PetStatus({ pet, money, skillPoints, onRenamePet }) {
  const [isEditingName, setIsEditingName] = useState(!pet.name)
  const [nameInput, setNameInput] = useState(pet.name)
  const stage = getPetGrowthStage(pet.pomodorosSinceBorn, pet.speciesId)

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
      <p className="pet-status__avatar" aria-hidden="true">
        {stage.emoji}
      </p>
      <p className="pet-status__stage">{stage.label}</p>
      <p className="pet-status__info">
        {pet.breedLabel} · {pet.personalityLabel}
      </p>

      <ul className="pet-status__stats">
        <li>學習力 {pet.stats.learning}</li>
        <li>服從度 {pet.stats.obedience}</li>
        <li>友善度 {pet.stats.friendliness}</li>
        <li>活力 {pet.stats.energy}</li>
      </ul>

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

      <div className="pet-status__currency">
        <span>💰 {money}</span>
        <span>
          ⭐ {skillPoints}
          <em className="pet-status__hint">（尚未開放使用）</em>
        </span>
      </div>
    </section>
  )
}
