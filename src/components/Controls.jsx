export default function Controls({ isRunning, onStart, onPause, onReset }) {
  return (
    <div className="controls">
      {isRunning ? (
        <button type="button" onClick={onPause}>
          暫停
        </button>
      ) : (
        <button type="button" onClick={onStart}>
          開始
        </button>
      )}
      <button type="button" onClick={onReset}>
        重置
      </button>
    </div>
  )
}
