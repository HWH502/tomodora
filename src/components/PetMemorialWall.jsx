const DEPARTURE_REASON_LABELS = {
  health: '病逝',
  affection: '離家出走',
  replaced: '換養新寵物',
}

export default function PetMemorialWall({ memorials }) {
  if (memorials.length === 0) {
    return <p className="memorial-wall__empty">還沒有寵物離開，這裡以後會記錄牠們的故事。</p>
  }

  return (
    <ul className="memorial-wall">
      {memorials.map((memorial, index) => (
        <li key={`${memorial.name}-${index}`} className="memorial-wall__item">
          <p className="memorial-wall__name">{memorial.name}</p>
          <p className="memorial-wall__detail">
            {memorial.breedLabel} · 陪伴了 {memorial.daysWithOwner} 天 · 養到「{memorial.highestGrowthStageLabel}」
          </p>
          <p className="memorial-wall__reason">{DEPARTURE_REASON_LABELS[memorial.departureReason] ?? '離開'}</p>
        </li>
      ))}
    </ul>
  )
}
