import { determineMood, MOOD_LABELS } from '../utils/petNeeds'

const MOOD_EMOJI = {
  sick: '🤒',
  hungry: '🍖',
  sad: '😢',
  dirty: '🧼',
  excited: '🤩',
  happy: '😊',
}

export default function PetNeedsBars({ pet }) {
  const mood = determineMood(pet)

  return (
    <div className="pet-needs">
      <p className="pet-needs__mood">{MOOD_EMOJI[mood]} <span>{MOOD_LABELS[mood]}</span></p>
      <ul className="pet-needs__list">
        <li>🍗 {pet.hunger}</li>
        <li>🛁 {pet.cleanliness}</li>
        <li>💊 {pet.health}</li>
        <li>😍 {pet.affection}</li>
      </ul>
    </div>
  )
}
