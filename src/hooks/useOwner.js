import { useCallback, useState } from 'react'
import {
  createPet as createPetInStorage,
  getOwnerState,
  grantResources as grantResourcesInStorage,
  purchaseShopItem,
  recordPomodoroReward,
  renamePet as renamePetInStorage,
  resetOwnerState,
  setPetGrowthProgress,
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

  const grantResources = useCallback((money, skillPoints) => {
    setOwnerState(grantResourcesInStorage({ money, skillPoints }))
  }, [])

  const setGrowthProgress = useCallback((pomodorosSinceBorn) => {
    setOwnerState(setPetGrowthProgress(pomodorosSinceBorn))
  }, [])

  const resetOwner = useCallback(() => {
    setOwnerState(resetOwnerState())
  }, [])

  return {
    ownerState,
    addPomodoroReward,
    renamePet,
    createPet,
    purchaseItem,
    grantResources,
    setGrowthProgress,
    resetOwner,
  }
}
