export default function PetStatsCard({ stats }) {
  return (
    <div className="pet-stats-card">
      <p className="pet-stats-card__heading display">能力值</p>
      <div className="pet-stats-card__grid">
        <StatCell label="學習力" value={stats.learning} colorVar="--long" />
        <StatCell label="服從度" value={stats.obedience} colorVar="--purple" />
        <StatCell label="友善度" value={stats.friendliness} colorVar="--work" />
        <StatCell label="活力" value={stats.energy} colorVar="--peach" />
      </div>
    </div>
  )
}

function StatCell({ label, value, colorVar }) {
  return (
    <div className="pet-stats-card__cell">
      <span className="pet-stats-card__cell-label">{label}</span>
      <span className="pet-stats-card__cell-value display" style={{ color: `var(${colorVar})` }}>
        {value}
      </span>
    </div>
  )
}
