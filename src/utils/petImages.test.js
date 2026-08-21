import { describe, expect, it } from 'vitest'
import { createPetImageResolver, getPetImageUrl } from './petImages'

describe('createPetImageResolver', () => {
  const imageMap = {
    'dog/shiba/young.png': '/assets/dog-shiba-young.png',
    'dog/default/young.png': '/assets/dog-default-young.png',
    'cat/default/capable.png': '/assets/cat-default-capable.png',
  }
  const resolve = createPetImageResolver(imageMap)

  it('returns the breed-specific image when it exists', () => {
    expect(resolve('dog', 'shiba', 'young')).toBe('/assets/dog-shiba-young.png')
  })

  it('falls back to the default breed image when the breed-specific one is missing', () => {
    expect(resolve('dog', 'golden-retriever', 'young')).toBe('/assets/dog-default-young.png')
  })

  it('falls back to the default breed image for an unknown breed id', () => {
    expect(resolve('cat', 'unknown-breed', 'capable')).toBe('/assets/cat-default-capable.png')
  })

  it('returns null when neither the breed-specific nor the default image exists', () => {
    expect(resolve('cat', 'ragdoll', 'legend')).toBeNull()
  })
})

describe('getPetImageUrl (real glob)', () => {
  it('resolves a real image path when the gitignored art assets are present on this machine', () => {
    const result = getPetImageUrl('dog', 'shiba', 'young')
    if (result === null) {
      // Art assets aren't present on this machine (they're gitignored) — nothing to verify here.
      return
    }
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
