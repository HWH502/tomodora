import { useState } from 'react'
import { useTimer } from './hooks/useTimer'
import { useOwner } from './hooks/useOwner'
import Timer from './components/Timer'
import Controls from './components/Controls'
import Settings from './components/Settings'
import BackupRestore from './components/BackupRestore'
import TodayStats from './components/TodayStats'
import PetStatus from './components/PetStatus'
import PetCreation from './components/PetCreation'
import Shop from './components/Shop'
import SkillTree from './components/SkillTree'
import DevPanel from './components/DevPanel'
import PetMemorialWall from './components/PetMemorialWall'
import FocusStatsPage from './components/FocusStatsPage'
import { getShopItem } from './utils/shopItems'

function App() {
  const {
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
  } = useOwner()
  const {
    phase,
    isRunning,
    secondsLeft,
    settings,
    todayCount,
    start,
    pause,
    reset,
    updateSettings,
    completeWorkSessionsInstantly,
    simulatePreviousDay,
  } = useTimer({ onWorkSessionComplete: addPomodoroReward })
  const [showSettings, setShowSettings] = useState(false)
  const [showDevPanel, setShowDevPanel] = useState(false)
  const [showMemorialWall, setShowMemorialWall] = useState(false)
  const [showStats, setShowStats] = useState(false)

  return (
    <main className="app">
      <h1>番茄鐘</h1>

      {!showStats && (
        <button type="button" className="focus-stats-toggle" onClick={() => setShowStats((value) => !value)}>
          查看統計
        </button>
      )}

      {showStats ? (
        <FocusStatsPage
          history={focusHistory}
          streak={ownerState.pomodoroStreak}
          currentPet={ownerState.pet}
          petMemorials={ownerState.petMemorials}
          onClose={() => setShowStats(false)}
        />
      ) : (
        <>
          {focusHistoryTrimmed && (
            <p className="app__auto-purchase-toast" role="status">
              專注紀錄的儲存空間不足，已經自動清掉 90 天以前的舊資料，最近的紀錄都還在。
              <button type="button" onClick={clearFocusHistoryTrimmed}>
                知道了
              </button>
            </p>
          )}

          {autoPurchaseLog && autoPurchaseLog.length > 0 && (
            <p className="app__auto-purchase-toast" role="status">
              自動購買：
              {autoPurchaseLog.map((entry) => `${getShopItem(entry.itemId)?.name ?? entry.itemId} ×${entry.count}（花了 ${entry.spent} 元）`).join('、')}
              <button type="button" onClick={clearAutoPurchaseLog}>
                知道了
              </button>
            </p>
          )}

          <div className="app__columns">
            <div className="app__timer-pet-row">
              <div className="app__left">
                <Timer phase={phase} secondsLeft={secondsLeft} />
                <Controls isRunning={isRunning} onStart={start} onPause={pause} onReset={reset} />
                <TodayStats completedToday={todayCount} />

                <button
                  type="button"
                  className="settings-toggle"
                  onClick={() => setShowSettings((value) => !value)}
                >
                  {showSettings ? '關閉設定' : '設定'}
                </button>
                <div className={`settings-slot${showSettings ? '' : ' settings-slot--hidden'}`}>
                  <Settings settings={settings} onSave={updateSettings} />
                  <BackupRestore />
                </div>
              </div>
              <div className="app__right">
                {ownerState.pet ? (
                  <PetStatus
                    pet={ownerState.pet}
                    money={ownerState.money}
                    skillPoints={ownerState.skillPoints}
                    onRenamePet={renamePet}
                    onVisitVet={visitVet}
                  />
                ) : (
                  <PetCreation onCreatePet={createPet} />
                )}
              </div>
            </div>
            <div className="app__skill">
              <Shop
                money={ownerState.money}
                ownedCollectibles={ownerState.ownedCollectibles}
                consumablePurchases={ownerState.consumablePurchases}
                ownerSkillTree={ownerState.ownerSkillTree}
                onPurchase={purchaseItem}
              />

              <SkillTree
                ownerSkillTree={ownerState.ownerSkillTree}
                skillPoints={ownerState.skillPoints}
                pet={ownerState.pet}
                petProgressCounts={petProgressCounts}
                onUpgradeLinear={upgradeLinearSkill}
                onUpgradeSpecialization={upgradeSpecializationSkill}
                onUnlockSingle={unlockSingleSkill}
              />

              <button
                type="button"
                className="memorial-wall-toggle"
                onClick={() => setShowMemorialWall((value) => !value)}
              >
                {showMemorialWall ? '關閉紀念牆' : '紀念牆'}
              </button>
              {showMemorialWall && <PetMemorialWall memorials={ownerState.petMemorials} />}
            </div>
          </div>

          {import.meta.env.DEV && (
            <>
              <button
                type="button"
                className="dev-panel-toggle"
                onClick={() => setShowDevPanel((value) => !value)}
              >
                {showDevPanel ? '關閉工程模式' : '工程模式'}
              </button>
              {showDevPanel && (
                <DevPanel
                  speciesId={ownerState.pet?.speciesId}
                  onCompletePomodoros={completeWorkSessionsInstantly}
                  onGrantResources={grantResources}
                  onSetGrowthProgress={setGrowthProgress}
                  onSetPetNeeds={setPetNeeds}
                  onResetOwner={resetOwner}
                  onSimulatePreviousDay={simulatePreviousDay}
                />
              )}
            </>
          )}
        </>
      )}
    </main>
  )
}

export default App
