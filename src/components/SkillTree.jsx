import { useState } from 'react'
import {
  canUnlockSingle,
  canUpgradeLinearTrack,
  canUpgradeSpecialization,
  getTrackLevel,
  isSpeciesTagAvailable,
  sizeTagOf,
  SKILL_TRACK_CATALOG,
  SKILL_TRACK_DESCRIPTIONS,
} from '../utils/ownerSkillTree'
import { useEdgeAwareTooltip } from '../hooks/useEdgeAwareTooltip'

const BRANCH_LABELS = {
  nurture: '養育系',
  business: '經營系',
  bonding: '羈絆系',
  auto: '自動',
  standalone: '獨立節點',
}

const BRANCH_ORDER = ['nurture', 'business', 'bonding', 'auto', 'standalone']

export default function SkillTree({
  ownerSkillTree,
  skillPoints,
  pet,
  petProgressCounts,
  onUpgradeLinear,
  onUpgradeSpecialization,
  onUnlockSingle,
}) {
  const [expanded, setExpanded] = useState(false)
  const tooltip = useEdgeAwareTooltip({ tooltipMaxWidth: 220 })

  return (
    <section className="skill-tree">
      <button
        type="button"
        className="skill-tree__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        技能樹 {expanded ? '▾' : '▸'}
      </button>
      {expanded && (
        <div className="skill-tree__body">
          <p className="skill-tree__points">可用技能點：{skillPoints}</p>
          {BRANCH_ORDER.map((branch) => (
            <div key={branch} className="skill-tree__branch">
              <h3>{BRANCH_LABELS[branch]}</h3>
              <ul className="skill-tree__list">
                {SKILL_TRACK_CATALOG.filter((track) => track.branch === branch).map((track) => (
                  <SkillTrackRow
                    key={track.id}
                    track={track}
                    ownerSkillTree={ownerSkillTree}
                    skillPoints={skillPoints}
                    pet={pet}
                    petProgressCounts={petProgressCounts}
                    onUpgradeLinear={onUpgradeLinear}
                    onUpgradeSpecialization={onUpgradeSpecialization}
                    onUnlockSingle={onUnlockSingle}
                    tooltip={tooltip}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function SkillLabel({ track, tooltip, children }) {
  const { activeId, activeAlign, showTooltip, hideTooltip, handleMouseEnter, handlePointerUp } = tooltip
  const isActive = activeId === track.id
  const tooltipId = `skill-tree-tooltip-${track.id}`
  const tooltipText = `${track.label}：${SKILL_TRACK_DESCRIPTIONS[track.id]}`

  return (
    <span className="skill-tree__item-label">
      <span className="skill-tree__item-label-text-wrapper">
        <span
          className="skill-tree__item-label-text"
          tabIndex={0}
          aria-describedby={isActive ? tooltipId : undefined}
          onMouseEnter={(event) => handleMouseEnter(track.id, event)}
          onMouseLeave={() => hideTooltip(track.id)}
          onFocus={(event) => showTooltip(track.id, event.currentTarget)}
          onBlur={() => hideTooltip(track.id)}
          onPointerUp={(event) => handlePointerUp(track.id, event)}
        >
          {track.label}
        </span>
        {isActive && (
          <span
            id={tooltipId}
            role="tooltip"
            className={`skill-tree__tooltip skill-tree__tooltip--align-${activeAlign}`}
          >
            {tooltipText}
          </span>
        )}
      </span>
      {children}
    </span>
  )
}

function SkillTrackRow({
  track,
  ownerSkillTree,
  skillPoints,
  pet,
  petProgressCounts,
  onUpgradeLinear,
  onUpgradeSpecialization,
  onUnlockSingle,
  tooltip,
}) {
  if (track.type === 'single') {
    const unlocked = ownerSkillTree[track.id]
    const { ok, cost } = canUnlockSingle(ownerSkillTree, track.id)
    const affordable = ok && skillPoints >= cost
    return (
      <li className="skill-tree__item">
        <SkillLabel track={track} tooltip={tooltip} />
        <button type="button" disabled={unlocked || !affordable} onClick={() => onUnlockSingle(track.id)}>
          {unlocked ? '已解鎖' : `解鎖（${cost} 點）`}
        </button>
      </li>
    )
  }

  if (track.type === 'specialization') {
    const level = ownerSkillTree[`${track.category}Specialization`][track.tag]
    const available = track.category === 'species' ? isSpeciesTagAvailable(track.tag) : true
    const ownedCount = petProgressCounts[track.category][track.tag] ?? 0
    const check = canUpgradeSpecialization(ownerSkillTree, track.category, track.tag, ownedCount)
    const affordable = check.ok && skillPoints >= check.cost
    const isActive = level > 0 && pet && (
      track.category === 'size' ? sizeTagOf(pet) === track.tag : pet.speciesId === track.tag
    )

    return (
      <li className="skill-tree__item">
        <SkillLabel track={track} tooltip={tooltip}>
          <span className="skill-tree__item-level"> Lv.{level}/3</span>
          {level > 0 && <span className="skill-tree__item-status">{isActive ? '（生效中）' : '（暫不生效）'}</span>}
        </SkillLabel>
        {!available ? (
          <span className="skill-tree__item-status">尚無資料，暫不可解鎖</span>
        ) : check.ok ? (
          <button type="button" disabled={!affordable} onClick={() => onUpgradeSpecialization(track.category, track.tag)}>
            升級（{check.cost} 點）
          </button>
        ) : check.reason === 'maxed' ? (
          <span className="skill-tree__item-status">已滿級</span>
        ) : (
          <span className="skill-tree__item-status">
            需養過 {check.required} 隻（目前 {check.owned}）
          </span>
        )}
      </li>
    )
  }

  const level = getTrackLevel(ownerSkillTree, track.id)
  const check = canUpgradeLinearTrack(ownerSkillTree, track.id)
  const affordable = check.ok && skillPoints >= check.cost

  return (
    <li className="skill-tree__item">
      <SkillLabel track={track} tooltip={tooltip}>
        <span className="skill-tree__item-level"> Lv.{level}/3</span>
      </SkillLabel>
      {check.ok ? (
        <button type="button" disabled={!affordable} onClick={() => onUpgradeLinear(track.id)}>
          升級（{check.cost} 點）
        </button>
      ) : (
        <span className="skill-tree__item-status">已滿級</span>
      )}
    </li>
  )
}
