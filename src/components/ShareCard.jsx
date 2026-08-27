import { forwardRef, useEffect, useState } from 'react'
import { getPetImageUrl } from '../utils/petImages'

const ShareCard = forwardRef(function ShareCard({ data }, ref) {
  const variantClass =
    data.variant === 'memorial' ? 'share-card--memorial'
      : data.variant === 'hasPet' ? 'share-card--pet'
      : 'share-card--stats'

  return (
    <div ref={ref} className={`share-card ${variantClass}`}>
      <p className="share-card__eyebrow">我的專注成果</p>

      {data.variant === 'hasPet' && (
        <>
          <div className="share-card__stage">
            <PetFigure pet={data.pet} />
          </div>
          <div className="share-card__name-row">
            <p className="share-card__pet-name">{data.pet.name}</p>
            <p className="share-card__pet-meta">
              {data.pet.breedLabel} · {data.pet.stageLabel} · 第 {data.pet.generation} 代
            </p>
          </div>
        </>
      )}

      {data.variant === 'memorial' && (
        <div className="share-card__name-row share-card__name-row--top">
          <p className="share-card__pet-name">{data.memorial.name}</p>
          <p className="share-card__pet-meta">
            {data.memorial.breedLabel} · 陪伴了 {data.memorial.daysWithOwner} 天 · 第 {data.memorial.generation} 代
          </p>
        </div>
      )}

      <div className="share-card__panel">
        {data.variant === 'memorial' && (
          <>
            <p className="share-card__memorial-note">{data.memorial.noteText}</p>
            <div className="share-card__divider" />
          </>
        )}

        {data.variant === 'noPet' ? (
          <div className="share-card__stat-big">
            <p className="share-card__stat-big-num">{data.stats.lifetimePomodoros}</p>
            <p className="share-card__stat-big-unit">個蕃茄鐘</p>
            <p className="share-card__stat-big-sub">
              累積專注 {data.stats.focusMinutesLabel} ・自 {data.stats.startedAtLabel} 起算
            </p>
          </div>
        ) : (
          <>
            <div className="share-card__row">
              <span className="share-card__row-label">累積完成</span>
              <span className="share-card__row-value">
                <b>{data.stats.lifetimePomodoros}</b> 個蕃茄鐘
              </span>
            </div>
            <div className="share-card__row">
              <span className="share-card__row-label">累積專注時數</span>
              <span className="share-card__row-value">{data.stats.focusMinutesLabel}</span>
            </div>
            <p className="share-card__stat-sub">自 {data.stats.startedAtLabel} 起算</p>
          </>
        )}

        {data.variant === 'hasPet' && data.pet.legacyLine && (
          <>
            <div className="share-card__divider" />
            <p className="share-card__legacy">{data.pet.legacyLine}</p>
          </>
        )}
      </div>

      <p className="share-card__footer">番茄鐘 · 專注成果卡</p>
    </div>
  )
})

function PetFigure({ pet }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const imageUrl = getPetImageUrl(pet.speciesId, pet.breedId, pet.stageKey)

  useEffect(() => {
    setImageLoadFailed(false)
  }, [imageUrl])

  if (!imageUrl || imageLoadFailed) {
    return <p className="share-card__pet-figure-emoji">{pet.emoji}</p>
  }

  return (
    <div className="share-card__pet-figure">
      <img src={imageUrl} alt={pet.name} onError={() => setImageLoadFailed(true)} />
    </div>
  )
}

export default ShareCard
