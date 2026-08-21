const PHASE_LABELS = {
  work: '工作時間',
  shortBreak: '短休息',
  longBreak: '長休息',
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Timer({ phase, secondsLeft }) {
  return (
    <div className={`timer timer--${phase}`}>
      <p className="timer__phase">{PHASE_LABELS[phase]}</p>
      <p className="timer__display">{formatTime(secondsLeft)}</p>
    </div>
  )
}
