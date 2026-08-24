import { useRef, useState } from 'react'
import {
  COMMON_SKILLS,
  getSpeciesSkillPool,
  getUnlockedPetSkillIds,
  PET_SKILL_DESCRIPTIONS,
} from '../utils/petSkills'
import { getPetSkillIconUrl } from '../utils/petSkillIcons'

export default function PetSkills({ pet }) {
  const unlockedIds = getUnlockedPetSkillIds(pet)
  const speciesSkills = getSpeciesSkillPool(pet.speciesId)
  // 品種專屬技能排前面，共通技能排後面，不分組顯示。
  const skills = [...speciesSkills, ...COMMON_SKILLS]

  return (
    <section className="pet-skills">
      <h3 className="pet-skills__heading">寵物技能</h3>
      <SkillBadgeList skills={skills} unlockedIds={unlockedIds} />
    </section>
  )
}

// Some touch browsers replay a synthetic mouseenter after a tap for legacy
// :hover compatibility. Without this guard that replay could immediately
// reopen a tooltip a tap had just closed. Any real mouseenter within this
// window of a touch tap is treated as that replay and ignored.
const TOUCH_HOVER_SUPPRESS_MS = 500

function SkillBadgeList({ skills, unlockedIds }) {
  const [activeId, setActiveId] = useState(null)
  const suppressHoverUntilRef = useRef(0)

  const showTooltip = (skillId) => setActiveId(skillId)
  const hideTooltip = (skillId) => setActiveId((current) => (current === skillId ? null : current))
  const toggleTooltip = (skillId) => setActiveId((current) => (current === skillId ? null : skillId))

  const handleMouseEnter = (skillId) => {
    if (Date.now() < suppressHoverUntilRef.current) return
    showTooltip(skillId)
  }

  // Mouse clicks and keyboard activation both fire onClick right after
  // onMouseEnter/onFocus already opened the tooltip, so a plain onClick
  // toggle would close it again in the same interaction. Touch taps are
  // the only pointer type with no reliable hover/focus-before-click step,
  // so only they should drive the toggle.
  const handlePointerUp = (skillId, event) => {
    if (event.pointerType === 'touch') {
      suppressHoverUntilRef.current = Date.now() + TOUCH_HOVER_SUPPRESS_MS
      toggleTooltip(skillId)
    }
  }

  return (
    <ul className="pet-skills__badge-grid">
      {skills.map((skill) => {
        const unlocked = unlockedIds.includes(skill.id)
        const iconUrl = getPetSkillIconUrl(skill.id)
        const tooltipText = unlocked
          ? `${skill.label}：${PET_SKILL_DESCRIPTIONS[skill.id]}`
          : `${skill.label}：門檻：${skill.threshold}`
        const isActive = activeId === skill.id
        const tooltipId = `pet-skill-tooltip-${skill.id}`

        return (
          <li key={skill.id} className="pet-skills__badge-item">
            <button
              type="button"
              data-testid="pet-skill-badge"
              aria-label={skill.label}
              aria-describedby={isActive ? tooltipId : undefined}
              className={`pet-skills__badge${unlocked ? '' : ' pet-skills__badge--locked'}`}
              onMouseEnter={() => handleMouseEnter(skill.id)}
              onMouseLeave={() => hideTooltip(skill.id)}
              onFocus={() => showTooltip(skill.id)}
              onBlur={() => hideTooltip(skill.id)}
              onPointerUp={(event) => handlePointerUp(skill.id, event)}
            >
              {iconUrl ? (
                <img className="pet-skills__badge-icon" src={iconUrl} alt="" />
              ) : (
                <span className="pet-skills__badge-icon pet-skills__badge-icon--placeholder" aria-hidden="true">
                  🏅
                </span>
              )}
            </button>
            {isActive && (
              <span id={tooltipId} role="tooltip" className="pet-skills__tooltip">
                {tooltipText}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
