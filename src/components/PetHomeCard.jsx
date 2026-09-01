import { useEffect, useRef, useState } from 'react'
import { getPetGrowthStage } from '../utils/pet'
import { getPetImageUrl } from '../utils/petImages'
import { determineMood, MOOD_EMOJI, MOOD_LABELS } from '../utils/petNeeds'

export default function PetHomeCard({ pet }) {
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

  const bounceAnim = patCount === 0 ? 'none' : `pat-bounce-${parity ? 'a' : 'b'} 0.5s ease`
  const heartAnim = `pat-heart-${parity ? 'a' : 'b'} 0.7s ease forwards`

  return (
    <section className="pet-home-card">
      <div className="pet-home-card__avatar-cluster">
        <button
          type="button"
          className="pet-home-card__avatar-button"
          onClick={handlePat}
          aria-label={`摸摸${pet.name || '寵物'}`}
        >
          {showImage ? (
            <img
              className="pet-home-card__avatar"
              src={imageUrl}
              alt={pet.breedLabel}
              style={{ animation: bounceAnim }}
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <p className="pet-home-card__avatar" aria-hidden="true" style={{ animation: bounceAnim }}>
              {stage.emoji}
            </p>
          )}
          {patted && (
            <span className="pet-home-card__hearts" data-testid="pet-home-card-hearts" aria-hidden="true">
              <span className="pet-home-card__heart pet-home-card__heart--a" style={{ animation: heartAnim }}>
                💗
              </span>
              <span
                className="pet-home-card__heart pet-home-card__heart--b"
                style={{ animation: heartAnim, animationDelay: '0.08s' }}
              >
                💗
              </span>
            </span>
          )}
        </button>

        <p className="pet-home-card__name display">{pet.name}</p>

        <div className="pet-home-card__chips">
          <span className="chip pet-home-card__chip--stage">
            {stage.label} · {pet.breedLabel}
          </span>
          <span className="chip pet-home-card__chip--mood">
            {MOOD_EMOJI[mood]} {MOOD_LABELS[mood]}
          </span>
        </div>
      </div>

      <div className="pet-home-card__details">
        <ul className="pet-home-card__stats">
          <li className="chip pet-home-card__stat-chip">學習力 {pet.stats.learning}</li>
          <li className="chip pet-home-card__stat-chip">服從度 {pet.stats.obedience}</li>
          <li className="chip pet-home-card__stat-chip">友善度 {pet.stats.friendliness}</li>
          <li className="chip pet-home-card__stat-chip">活力 {pet.stats.energy}</li>
        </ul>

        <div className="pet-home-card__needs">
          <NeedBar label="飽食度" value={pet.hunger} variant="hunger" />
          <NeedBar label="潔淨度" value={pet.cleanliness} variant="cleanliness" />
          <NeedBar label="好感度" value={pet.affection} variant="mood" />
        </div>
      </div>
    </section>
  )
}

function NeedBar({ label, value, variant }) {
  const modifier = variant && variant !== 'hunger' ? ` pet-home-card__need-track--${variant}` : ''
  const fillModifier = variant && variant !== 'hunger' ? ` pet-home-card__need-fill--${variant}` : ''
  return (
    <div className="pet-home-card__need">
      <div className="pet-home-card__need-label">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className={`pet-home-card__need-track${modifier}`}>
        <div className={`pet-home-card__need-fill${fillModifier}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
