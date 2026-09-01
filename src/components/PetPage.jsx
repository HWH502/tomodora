import { useState } from 'react'
import PageBlobs from './PageBlobs'
import PetCreation from './PetCreation'
import PetMemorialWall from './PetMemorialWall'
import PetNeedsBars from './PetNeedsBars'
import PetPortrait from './PetPortrait'
import PetSkills from './PetSkills'
import PetStatsCard from './PetStatsCard'
import { canVisitVet, DANGER_THRESHOLD, EVENT_LABELS, VET_COST } from '../utils/petNeeds'

const MS_PER_DAY = 86400000

function daysWithOwner(bornAt) {
  if (!bornAt) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(bornAt).getTime()) / MS_PER_DAY))
}

export default function PetPage({ pet, money, onRenamePet, onVisitVet, onCreatePet, petMemorials }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!pet) {
    return (
      <div className="pet-page">
        <PageBlobs />
        <PetCreation onCreatePet={onCreatePet} />
      </div>
    )
  }

  return (
    <div className="pet-page">
      <PageBlobs />
      <div className="pet-page__header">
        {activeTab === 'overview' ? (
          <div>
            <p className="pet-page__title display">我的寵物</p>
            <p className="pet-page__subtitle">陪伴 {daysWithOwner(pet.bornAt)} 天</p>
          </div>
        ) : (
          <div>
            <p className="pet-page__title display">紀念牆</p>
            <p className="pet-page__subtitle">曾經陪伴過 {petMemorials.length} 段旅程</p>
          </div>
        )}
        <div className="pet-page__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`pet-page__tab${activeTab === 'overview' ? ' pet-page__tab--active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            總覽
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'memorial'}
            className={`pet-page__tab${activeTab === 'memorial' ? ' pet-page__tab--active' : ''}`}
            onClick={() => setActiveTab('memorial')}
          >
            紀念牆
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="pet-page__layout">
          <PetPortrait pet={pet} onRenamePet={onRenamePet} />

          <div className="pet-page__cards">
            <PetStatsCard stats={pet.stats} />

            <div className="pet-page__care-card">
              <div className="pet-page__care-card-header">
                <p className="display pet-page__care-card-heading">照護狀態</p>
                <button
                  type="button"
                  className="pet-page__vet-button"
                  onClick={onVisitVet}
                  disabled={!canVisitVet({ health: pet.health, money })}
                >
                  就醫（{VET_COST} 💰）
                </button>
              </div>
              {pet.health < DANGER_THRESHOLD && <p className="pet-page__vet-hint">需要就醫</p>}
              <PetNeedsBars pet={pet} />
            </div>

            <PetSkills pet={pet} />

            {pet.recentEvents?.length > 0 && (
              <ul className="pet-page__events">
                {pet.recentEvents
                  .slice()
                  .reverse()
                  .map((event) => (
                    <li key={event.occurredAt}>{EVENT_LABELS[event.id] ?? event.id}</li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <PetMemorialWall memorials={petMemorials} />
      )}
    </div>
  )
}
