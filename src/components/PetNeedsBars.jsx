export default function PetNeedsBars({ pet }) {
  return (
    <div className="pet-needs">
      <NeedBar label="飽食度" value={pet.hunger} variant="hunger" />
      <NeedBar label="潔淨度" value={pet.cleanliness} variant="cleanliness" />
      <NeedBar label="健康度" value={pet.health} variant="health" />
      <NeedBar label="好感度" value={pet.affection} variant="affection" />
    </div>
  )
}

function NeedBar({ label, value, variant }) {
  return (
    <div className="pet-needs__row">
      <div className="pet-needs__row-label">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className={`pet-needs__track pet-needs__track--${variant}`}>
        <div className={`pet-needs__fill pet-needs__fill--${variant}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
