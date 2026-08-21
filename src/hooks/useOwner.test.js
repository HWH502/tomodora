import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useOwner } from './useOwner'

describe('useOwner', () => {
  it('starts with the default owner state and no pet', () => {
    const { result } = renderHook(() => useOwner())
    expect(result.current.ownerState.lifetimePomodoros).toBe(0)
    expect(result.current.ownerState.money).toBe(0)
    expect(result.current.ownerState.pet).toBeNull()
  })

  it('addPomodoroReward updates money/skillPoints/lifetimePomodoros even with no pet', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25)
    })
    expect(result.current.ownerState.lifetimePomodoros).toBe(1)
    expect(result.current.ownerState.money).toBe(50)
    expect(result.current.ownerState.skillPoints).toBe(5)
  })

  it('createPet creates a pet of the chosen species/breed', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    expect(result.current.ownerState.pet).not.toBeNull()
    expect(result.current.ownerState.pet.speciesId).toBe('dog')
    expect(result.current.ownerState.pet.breedId).toBe('shiba')
  })

  it('createPet forwards the personalityLabel/stats args exactly as given (no re-roll)', () => {
    const { result } = renderHook(() => useOwner())
    const stats = { learning: 40, obedience: 30, friendliness: 20, energy: 10 }
    act(() => {
      result.current.createPet('dog', 'shiba', '機靈', stats)
    })
    expect(result.current.ownerState.pet.personalityLabel).toBe('機靈')
    expect(result.current.ownerState.pet.stats).toEqual(stats)
  })

  it('createPet leaves state unchanged for an invalid species/breed', () => {
    const { result } = renderHook(() => useOwner())
    const before = result.current.ownerState
    act(() => {
      result.current.createPet('dragon', 'shiba')
    })
    expect(result.current.ownerState).toEqual(before)
  })

  it('renamePet updates the pet name', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.createPet('dog', 'shiba')
    })
    act(() => {
      result.current.renamePet('小豆')
    })
    expect(result.current.ownerState.pet.name).toBe('小豆')
  })

  it('purchaseItem buys an affordable collectible and deducts cost', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25) // money = 50
    })
    act(() => {
      result.current.purchaseItem('bowl') // cost 15
    })
    expect(result.current.ownerState.ownedCollectibles).toEqual(['bowl'])
    expect(result.current.ownerState.money).toBe(35)
  })

  it('purchaseItem leaves state unchanged on a failed purchase (already owned)', () => {
    const { result } = renderHook(() => useOwner())
    act(() => {
      result.current.addPomodoroReward(25)
    })
    act(() => {
      result.current.purchaseItem('bowl')
    })
    const stateAfterFirstPurchase = result.current.ownerState
    act(() => {
      result.current.purchaseItem('bowl')
    })
    expect(result.current.ownerState).toEqual(stateAfterFirstPurchase)
  })
})
