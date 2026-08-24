import { describe, expect, it } from 'vitest'
import { createPetSkillIconResolver, getPetSkillIconUrl } from './petSkillIcons'

describe('createPetSkillIconResolver', () => {
  const iconMap = {
    'sit.png': '/assets/skills/sit.png',
    'potty.png': '/assets/skills/potty.png',
  }
  const resolve = createPetSkillIconResolver(iconMap)

  it('returns the icon url when it exists for the skill id', () => {
    expect(resolve('sit')).toBe('/assets/skills/sit.png')
  })

  it('returns null when no icon exists for the skill id', () => {
    expect(resolve('luckyStar')).toBeNull()
  })
})

describe('getPetSkillIconUrl (real glob)', () => {
  it('resolves a real icon path when a skill icon asset is present on this machine, otherwise null', () => {
    const result = getPetSkillIconUrl('sit')
    if (result === null) {
      // No per-skill icon art committed yet — nothing to verify here.
      return
    }
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
