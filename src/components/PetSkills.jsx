import {
  COMMON_SKILLS,
  getSpeciesSkillPool,
  getUnlockedPetSkillIds,
  PET_SKILL_DESCRIPTIONS,
} from '../utils/petSkills'
import { getPetSkillIconUrl } from '../utils/petSkillIcons'
import { useEdgeAwareTooltip } from '../hooks/useEdgeAwareTooltip'

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

function SkillBadgeList({ skills, unlockedIds }) {
  const { activeId, activeAlign, showTooltip, hideTooltip, handleMouseEnter, handlePointerUp } =
    useEdgeAwareTooltip()

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
              onMouseEnter={(event) => handleMouseEnter(skill.id, event)}
              onMouseLeave={() => hideTooltip(skill.id)}
              onFocus={(event) => showTooltip(skill.id, event.currentTarget)}
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
              <span
                id={tooltipId}
                role="tooltip"
                className={`pet-skills__tooltip pet-skills__tooltip--align-${activeAlign}`}
              >
                {tooltipText}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
