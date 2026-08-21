import { useState } from 'react'
import { useTimer } from './hooks/useTimer'
import { useOwner } from './hooks/useOwner'
import Timer from './components/Timer'
import Controls from './components/Controls'
import Settings from './components/Settings'
import TodayStats from './components/TodayStats'
import PetStatus from './components/PetStatus'
import PetCreation from './components/PetCreation'
import Shop from './components/Shop'
import DevPanel from './components/DevPanel'

function App() {
  const { ownerState, addPomodoroReward, renamePet, createPet, purchaseItem, grantResources, setGrowthProgress, resetOwner } =
    useOwner()
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

  return (
    <main className="app">
      <h1>番茄鐘</h1>

      <div className="app__columns">
        <div className="app__left">
          <Timer phase={phase} secondsLeft={secondsLeft} />
          <Controls isRunning={isRunning} onStart={start} onPause={pause} onReset={reset} />
          <TodayStats completedToday={todayCount} />
        </div>
        <div className="app__right">
          {ownerState.pet ? (
            <PetStatus
              pet={ownerState.pet}
              money={ownerState.money}
              skillPoints={ownerState.skillPoints}
              onRenamePet={renamePet}
            />
          ) : (
            <PetCreation onCreatePet={createPet} />
          )}
        </div>
      </div>

      <Shop
        money={ownerState.money}
        ownedCollectibles={ownerState.ownedCollectibles}
        consumablePurchases={ownerState.consumablePurchases}
        onPurchase={purchaseItem}
      />

      <button
        type="button"
        className="settings-toggle"
        onClick={() => setShowSettings((value) => !value)}
      >
        {showSettings ? '關閉設定' : '設定'}
      </button>
      {showSettings && <Settings settings={settings} onSave={updateSettings} />}

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
              onResetOwner={resetOwner}
              onSimulatePreviousDay={simulatePreviousDay}
            />
          )}
        </>
      )}
    </main>
  )
}

export default App
