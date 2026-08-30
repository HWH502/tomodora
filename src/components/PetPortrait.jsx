import { useEffect, useRef, useState } from 'react'
import { getPetGrowthStage, rollRandomName } from '../utils/pet'
import { getPetImageUrl } from '../utils/petImages'
import { determineMood, MOOD_EMOJI, MOOD_LABELS } from '../utils/petNeeds'

export default function PetPortrait({ pet, onRenamePet }) {
  const [isEditingName, setIsEditingName] = useState(!pet.name)
  const [nameInput, setNameInput] = useState(pet.name)
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const [patCount, setPatCount] = useState(0)
  const [parity, setParity] = useState(false)
  const [patted, setPatted] = useState(false)
  const resetTimerRef = useRef(null)

  const stage = getPetGrowthStage(pet.pomodorosSinceBorn, pet.speciesId)
  const imageUrl = getPetImageUrl(pet.speciesId, pet.breedId, stage.stageKey)
  const showImage = imageUrl && !imageLoadFailed
  const mood = determineMood(pet)

  useEffect(() => {
    setImageLoadFailed(false)
  }, [imageUrl])

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    }
  }, [])

  const handlePat = () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    setPatCount((count) => count + 1)
    setParity((value) => !value)
    setPatted(true)
    resetTimerRef.current = setTimeout(() => setPatted(false), 700)
  }

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

  const bounceAnim = patCount === 0 ? 'none' : `pat-bounce-${parity ? 'a' : 'b'} 0.5s ease`
  const heartAnim = `pat-heart-${parity ? 'a' : 'b'} 0.7s ease forwards`

  return (
    <section className="pet-portrait">
      <button
        type="button"
        className="pet-portrait__avatar-button"
        onClick={handlePat}
        aria-label={`摸摸${pet.name || '寵物'}`}
      >
        {showImage ? (
          <img
            className="pet-portrait__avatar"
            src={imageUrl}
            alt={pet.breedLabel}
            style={{ animation: bounceAnim }}
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <p className="pet-portrait__avatar" aria-hidden="true" style={{ animation: bounceAnim }}>
            {stage.emoji}
          </p>
        )}
        {patted && (
          <span className="pet-portrait__hearts" data-testid="pet-portrait-hearts" aria-hidden="true">
            <span className="pet-portrait__heart pet-portrait__heart--a" style={{ animation: heartAnim }}>
              💗
            </span>
            <span
              className="pet-portrait__heart pet-portrait__heart--b"
              style={{ animation: heartAnim, animationDelay: '0.08s' }}
            >
              💗
            </span>
          </span>
        )}
      </button>

      {isEditingName ? (
        <div className="pet-portrait__name-field">
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
        <div className="pet-portrait__name-display">
          <span className="display">{pet.name}</span>
          <button type="button" title="修改名字" onClick={startEditingName}>
            ✏️
          </button>
        </div>
      )}

      <div className="pet-portrait__chips">
        <span className="chip pet-portrait__chip--stage">
          {stage.label} · {pet.breedLabel} · {pet.personalityLabel}
        </span>
        <span className="chip pet-portrait__chip--mood">
          {MOOD_EMOJI[mood]} {MOOD_LABELS[mood]}
        </span>
      </div>
    </section>
  )
}
