import { useCallback, useState } from 'react'
import {
  createPet as createPetInStorage,
  getOwnerState,
  purchaseShopItem,
  recordPomodoroReward,
  renamePet as renamePetInStorage,
} from '../utils/storage'

export function useOwner() {
  const [ownerState, setOwnerState] = useState(getOwnerState)

  const addPomodoroReward = useCallback((durationMinutes) => {
    setOwnerState(recordPomodoroReward(durationMinutes))
  }, [])

  const renamePet = useCallback((name) => {
    setOwnerState(renamePetInStorage(name))
  }, [])

  const createPet = useCallback((speciesId, breedId, personalityLabel, stats) => {
    const next = createPetInStorage({ speciesId, breedId, personalityLabel, stats })
    if (next) setOwnerState(next)
  }, [])

  const purchaseItem = useCallback((itemId) => {
    const next = purchaseShopItem(itemId)
    if (next) setOwnerState(next)
  }, [])

  return { ownerState, addPomodoroReward, renamePet, createPet, purchaseItem }
}
