import { useState } from 'react'
import { SPECIES } from '../utils/petSpecies'
import { rollPersonality, rollPetStats } from '../utils/pet'

const MAX_REROLLS = 3

export default function PetCreation({ onCreatePet }) {
  const [selectedSpeciesId, setSelectedSpeciesId] = useState(null)
  const [preview, setPreview] = useState(null)
  const selectedSpecies = SPECIES.find((species) => species.id === selectedSpeciesId)

  const selectBreed = (speciesId, breedId) => {
    const personalityLabel = rollPersonality()
    setPreview({
      speciesId,
      breedId,
      personalityLabel,
      stats: rollPetStats(breedId, personalityLabel),
      rerollsUsed: 0,
    })
  }

  const reroll = () => {
    setPreview((current) => ({
      ...current,
      stats: rollPetStats(current.breedId, current.personalityLabel),
      rerollsUsed: current.rerollsUsed + 1,
    }))
  }

  const confirm = () => {
    onCreatePet(preview.speciesId, preview.breedId, preview.personalityLabel, preview.stats)
  }

  const backToPicker = () => {
    setPreview(null)
  }

  if (preview) {
    const previewSpecies = SPECIES.find((species) => species.id === preview.speciesId)
    const previewBreed = previewSpecies.breeds.find((breed) => breed.id === preview.breedId)
    const rerollsLeft = MAX_REROLLS - preview.rerollsUsed

    return (
      <section className="pet-creation">
        <p className="pet-creation__prompt">確認你的寵物</p>
        <p className="pet-creation__preview-info">
          {previewBreed.label} · {preview.personalityLabel}
        </p>
        <ul className="pet-creation__preview-stats">
          <li>學習力 {preview.stats.learning}</li>
          <li>服從度 {preview.stats.obedience}</li>
          <li>友善度 {preview.stats.friendliness}</li>
          <li>活力 {preview.stats.energy}</li>
        </ul>
        <div className="pet-creation__preview-actions">
          <button type="button" onClick={reroll} disabled={rerollsLeft <= 0}>
            重骰能力值{rerollsLeft > 0 ? `（剩 ${rerollsLeft} 次）` : '（已達上限）'}
          </button>
          <button type="button" onClick={confirm}>
            就是這隻！
          </button>
          <button type="button" onClick={backToPicker}>
            重新選擇
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="pet-creation">
      <p className="pet-creation__prompt">選擇你的第一隻寵物</p>
      <div className="pet-creation__species">
        {SPECIES.map((species) => (
          <button
            key={species.id}
            type="button"
            className={species.id === selectedSpeciesId ? 'pet-creation__species-button--selected' : ''}
            onClick={() => setSelectedSpeciesId(species.id)}
          >
            {species.label}
          </button>
        ))}
      </div>
      {selectedSpecies && (
        <div className="pet-creation__breeds">
          {selectedSpecies.breeds.map((breed) => (
            <button key={breed.id} type="button" onClick={() => selectBreed(selectedSpecies.id, breed.id)}>
              {breed.label}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
