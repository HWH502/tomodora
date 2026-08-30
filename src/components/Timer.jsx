const PHASE_LABELS = {
  work: '工作時間',
  shortBreak: '短休息',
  longBreak: '長休息',
}

const PHASE_COLOR_VARS = {
  work: { color: 'var(--work)', tint: 'var(--work-tint)' },
  shortBreak: { color: 'var(--short)', tint: 'var(--short-tint)' },
  longBreak: { color: 'var(--long)', tint: 'var(--long-tint)' },
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Timer({ phase, secondsLeft, totalSeconds, currentRound, totalRounds }) {
  const progressPercent = totalSeconds
    ? Math.min(100, Math.max(0, ((totalSeconds - secondsLeft) / totalSeconds) * 100))
    : 0
  const { color, tint } = PHASE_COLOR_VARS[phase] ?? PHASE_COLOR_VARS.work
  const showRound = Boolean(currentRound) && Boolean(totalRounds)

  return (
    <div className={`timer timer--${phase}`}>
      <span className="chip display timer__phase-chip" style={{ background: tint, color }}>
        {PHASE_LABELS[phase]}
      </span>

      <div className="timer__ring" style={{ '--timer-progress-color': color, '--timer-progress-tint': tint }}>
        <div
          className="timer__ring-progress"
          data-testid="timer-ring-progress"
          style={{ '--timer-progress': `${progressPercent}%` }}
        />
        <div className="timer__ring-face">
          <p className="timer__display display">{formatTime(secondsLeft)}</p>
          {showRound && (
            <p className="timer__round">
              第 {currentRound} / {totalRounds} 輪
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
