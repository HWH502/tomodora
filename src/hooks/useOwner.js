import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createPet as createPetInStorage,
  getOwnerPetProgressCounts,
  getOwnerState,
  grantResources as grantResourcesInStorage,
  purchaseShopItem,
  recordPomodoroReward,
  renamePet as renamePetInStorage,
  resetOwnerState,
  setPetGrowthProgress,
  setPetNeeds as setPetNeedsInStorage,
  unlockSingleOwnerSkill,
  upgradeLinearOwnerSkill,
  upgradeSpecializationOwnerSkill,
  visitVet as visitVetInStorage,
} from '../utils/storage'
import { getFocusHistory, whenFocusHistoryReady } from '../utils/focusHistory'

export function useOwner() {
  const [initialState] = useState(getOwnerState)
  const [ownerState, setOwnerState] = useState(initialState)
  const [autoPurchaseLog, setAutoPurchaseLog] = useState(initialState._autoPurchaseLog ?? null)
  const [focusHistory, setFocusHistory] = useState(getFocusHistory)
  const [focusHistoryTrimmed, setFocusHistoryTrimmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    whenFocusHistoryReady().then(() => {
      if (!cancelled) setFocusHistory(getFocusHistory())
    })
    return () => { cancelled = true }
  }, [])

  const addPomodoroReward = useCallback((durationMinutes) => {
    const next = recordPomodoroReward(durationMinutes)
    setOwnerState(next)
    setFocusHistory(getFocusHistory())
    if (next._focusHistoryTrimmed) setFocusHistoryTrimmed(true)
  }, [])

  const clearFocusHistoryTrimmed = useCallback(() => setFocusHistoryTrimmed(false), [])

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

  const setPetNeeds = useCallback((needs) => {
    setOwnerState(setPetNeedsInStorage(needs))
  }, [])

  const resetOwner = useCallback(() => {
    setOwnerState(resetOwnerState())
  }, [])

  const visitVet = useCallback(() => {
    const next = visitVetInStorage()
    if (next) setOwnerState(next)
  }, [])

  const upgradeLinearSkill = useCallback((trackId) => {
    const next = upgradeLinearOwnerSkill(trackId)
    if (next) setOwnerState(next)
  }, [])

  const upgradeSpecializationSkill = useCallback((category, tag) => {
    const next = upgradeSpecializationOwnerSkill(category, tag)
    if (next) setOwnerState(next)
  }, [])

  const unlockSingleSkill = useCallback((trackId) => {
    const next = unlockSingleOwnerSkill(trackId)
    if (next) setOwnerState(next)
  }, [])

  const clearAutoPurchaseLog = useCallback(() => setAutoPurchaseLog(null), [])

  const petProgressCounts = useMemo(() => getOwnerPetProgressCounts(), [ownerState])

  return {
    ownerState,
    addPomodoroReward,
    renamePet,
    createPet,
    purchaseItem,
    grantResources,
    setGrowthProgress,
    setPetNeeds,
    resetOwner,
    visitVet,
    upgradeLinearSkill,
    upgradeSpecializationSkill,
    unlockSingleSkill,
    petProgressCounts,
    autoPurchaseLog,
    clearAutoPurchaseLog,
    focusHistory,
    focusHistoryTrimmed,
    clearFocusHistoryTrimmed,
  }
}
