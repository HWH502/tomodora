import { useState } from 'react'
import { useTimer } from './hooks/useTimer'
import { useOwner } from './hooks/useOwner'
import DailyTickSummaryModal from './components/DailyTickSummaryModal'
import HomePage from './components/HomePage'
import PageBlobs from './components/PageBlobs'
import Settings from './components/Settings'
import BackupRestore from './components/BackupRestore'
import PetPage from './components/PetPage'
import Shop from './components/Shop'
import SkillTree from './components/SkillTree'
import DevPanel from './components/DevPanel'
import FocusStatsPage from './components/FocusStatsPage'
import NavDock from './components/NavDock'
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
    dailyTickSummary,
    clearDailyTickSummary,
    focusHistory,
    focusHistoryTrimmed,
    clearFocusHistoryTrimmed,
  } = useOwner()
  const {
    phase,
    isRunning,
    secondsLeft,
    totalSeconds,
    currentRound,
    totalRounds,
    settings,
    todayCount,
    start,
    pause,
    reset,
    updateSettings,
    completeWorkSessionsInstantly,
    simulatePreviousDay,
  } = useTimer({ onWorkSessionComplete: addPomodoroReward })
  const [activePage, setActivePage] = useState(() => (ownerState.pet ? 'home' : 'pet'))
  const [showDevPanel, setShowDevPanel] = useState(false)

  return (
    <>
    <main className={['home', 'pet', 'skillTree', 'shop', 'stats'].includes(activePage) ? `app app--${activePage}` : activePage === 'settings' ? 'app app--settings' : 'app'}>
      {!['home', 'pet', 'skillTree', 'stats', 'shop', 'settings'].includes(activePage) && <h1>番茄鐘</h1>}

      {focusHistoryTrimmed && (
        <p className="app__auto-purchase-toast" role="status">
          儲存空間有點緊，剛剛清掉了一小段還沒同步進正式儲存空間的暫存紀錄，你完整的歷史紀錄都還在，不受影響。
          <button type="button" onClick={clearFocusHistoryTrimmed}>
            知道了
          </button>
        </p>
      )}

      <DailyTickSummaryModal summary={dailyTickSummary} onClose={clearDailyTickSummary} />

      {autoPurchaseLog && autoPurchaseLog.length > 0 && (
        <p className="app__auto-purchase-toast" role="status">
          自動購買：
          {autoPurchaseLog.map((entry) => `${getShopItem(entry.itemId)?.name ?? entry.itemId} ×${entry.count}（花了 ${entry.spent} 元）`).join('、')}
          <button type="button" onClick={clearAutoPurchaseLog}>
            知道了
          </button>
        </p>
      )}

      {activePage === 'home' && (
        <div className="app__page app__page--home">
          <HomePage
            phase={phase}
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            currentRound={currentRound}
            totalRounds={totalRounds}
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
            todayCount={todayCount}
            pet={ownerState.pet}
            streak={ownerState.pomodoroStreak.currentStreak}
          />
        </div>
      )}

      {activePage === 'stats' && (
        <FocusStatsPage
          history={focusHistory}
          streak={ownerState.pomodoroStreak}
          currentPet={ownerState.pet}
          petMemorials={ownerState.petMemorials}
          lifetimePomodoros={ownerState.lifetimePomodoros}
          lifetimeFocusMinutes={ownerState.lifetimeFocusMinutes}
          lifetimeFocusMinutesStartedAt={ownerState.lifetimeFocusMinutesStartedAt}
        />
      )}

      {activePage === 'shop' && (
        <div className="app__page app__page--shop">
          <Shop
            money={ownerState.money}
            ownedCollectibles={ownerState.ownedCollectibles}
            consumablePurchases={ownerState.consumablePurchases}
            ownerSkillTree={ownerState.ownerSkillTree}
            onPurchase={purchaseItem}
          />
        </div>
      )}

      {activePage === 'pet' && (
        <div className="app__page app__page--pet">
          <PetPage
            pet={ownerState.pet}
            money={ownerState.money}
            onRenamePet={renamePet}
            onVisitVet={visitVet}
            onCreatePet={createPet}
            petMemorials={ownerState.petMemorials}
          />
        </div>
      )}

      {activePage === 'skillTree' && (
        <div className="app__page app__page--skillTree">
          <SkillTree
            ownerSkillTree={ownerState.ownerSkillTree}
            skillPoints={ownerState.skillPoints}
            pet={ownerState.pet}
            petProgressCounts={petProgressCounts}
            onUpgradeLinear={upgradeLinearSkill}
            onUpgradeSpecialization={upgradeSpecializationSkill}
            onUnlockSingle={unlockSingleSkill}
          />
        </div>
      )}

      {activePage === 'settings' && (
        <div className="app__page app__page--settings">
          <PageBlobs />
          <h1 className="display settings-page__title">設定</h1>
          <Settings settings={settings} onSave={updateSettings} />
          <BackupRestore />
        </div>
      )}

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

    </main>
    <NavDock activePage={activePage} onNavigate={setActivePage} />
    </>
  )
}

export default App
