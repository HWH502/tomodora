import Controls from './Controls'
import PageBlobs from './PageBlobs'
import PetHomeCard from './PetHomeCard'
import Timer from './Timer'
import TodayStats from './TodayStats'

function greetingForHour(hour) {
  if (hour < 5) return '晚安'
  if (hour < 12) return '早安'
  if (hour < 18) return '午安'
  return '晚安'
}

export default function HomePage({
  phase,
  secondsLeft,
  totalSeconds,
  currentRound,
  totalRounds,
  isRunning,
  onStart,
  onPause,
  onReset,
  todayCount,
  pet,
  streak,
}) {
  const greeting = greetingForHour(new Date().getHours())

  return (
    <div className="home-page">
      <PageBlobs />
      <div className="home-page__paw-trail" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="home-page__paw home-page__paw--1">
          <circle cx="8" cy="7" r="1.6" fill="currentColor" />
          <circle cx="16" cy="7" r="1.6" fill="currentColor" />
          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
          <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          <ellipse cx="12" cy="16" rx="4.4" ry="3.4" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 24 24" className="home-page__paw home-page__paw--2">
          <circle cx="8" cy="7" r="1.6" fill="currentColor" />
          <circle cx="16" cy="7" r="1.6" fill="currentColor" />
          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
          <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          <ellipse cx="12" cy="16" rx="4.4" ry="3.4" fill="currentColor" />
        </svg>
        <svg viewBox="0 0 24 24" className="home-page__paw home-page__paw--3">
          <circle cx="8" cy="7" r="1.6" fill="currentColor" />
          <circle cx="16" cy="7" r="1.6" fill="currentColor" />
          <circle cx="5" cy="12" r="1.6" fill="currentColor" />
          <circle cx="19" cy="12" r="1.6" fill="currentColor" />
          <ellipse cx="12" cy="16" rx="4.4" ry="3.4" fill="currentColor" />
        </svg>
      </div>
      <div className="home-page__header">
        <div>
          <p className="home-page__greeting display">
            {greeting}{pet?.name ? `，今天想跟${pet.name}一起放鬆專注嗎` : ''}
          </p>
          <p className="home-page__streak">已連續專注 {streak} 天</p>
        </div>
      </div>

      <div className="home-page__layout">
        <div className="home-page__timer-column">
          <Timer
            phase={phase}
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            currentRound={currentRound}
            totalRounds={totalRounds}
          />
          <Controls isRunning={isRunning} onStart={onStart} onPause={onPause} onReset={onReset} />
          <TodayStats completedToday={todayCount} />
        </div>

        {pet && (
          <div className="home-page__pet-column">
            <PetHomeCard pet={pet} />
          </div>
        )}
      </div>
    </div>
  )
}
