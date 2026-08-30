import { useState } from 'react'
import { getGrowthStageDefByLabel } from '../utils/pet'
import { getPetImageUrl } from '../utils/petImages'
import { DEPARTURE_REASON_NOTE_ENDINGS } from '../utils/shareCard'

export default function PetMemorialWall({ memorials }) {
  if (memorials.length === 0) {
    return <p className="memorial-wall__empty">還沒有寵物離開，這裡以後會記錄牠們的故事。</p>
  }

  return (
    <ul className="memorial-wall">
      {memorials.map((memorial, index) => (
        <MemorialCard key={`${memorial.name}-${index}`} memorial={memorial} />
      ))}
    </ul>
  )
}

function MemorialCard({ memorial }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const stage = getGrowthStageDefByLabel(memorial.speciesId, memorial.highestGrowthStageLabel)
  const imageUrl = stage ? getPetImageUrl(memorial.speciesId, memorial.breedId, stage.stageKey) : null
  const showImage = imageUrl && !imageLoadFailed
  const noteEnding = DEPARTURE_REASON_NOTE_ENDINGS[memorial.departureReason] ?? '後來離開了。'

  return (
    <li className="memorial-wall__item">
      {showImage ? (
        <img
          className="memorial-wall__avatar"
          src={imageUrl}
          alt={memorial.name}
          onError={() => setImageLoadFailed(true)}
        />
      ) : (
        <p className="memorial-wall__avatar" aria-hidden="true">
          {stage?.emoji ?? '🐾'}
        </p>
      )}
      <p className="memorial-wall__name display">{memorial.name}</p>
      <span className="chip memorial-wall__chip">
        陪伴 {memorial.daysWithOwner} 天 · {memorial.highestGrowthStageLabel}
      </span>
      <p className="memorial-wall__note">{noteEnding}</p>
    </li>
  )
}
