export default function Controls({ isRunning, onStart, onPause, onReset }) {
  return (
    <div className="controls">
      {isRunning ? (
        <button type="button" className="controls__button controls__button--primary" onClick={onPause}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1.5" />
            <rect x="14" y="5" width="4" height="14" rx="1.5" />
          </svg>
          暫停
        </button>
      ) : (
        <button type="button" className="controls__button controls__button--primary" onClick={onStart}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 4v16l14-8z" />
          </svg>
          開始
        </button>
      )}
      <button type="button" className="controls__button controls__button--secondary" onClick={onReset}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        重置
      </button>
    </div>
  )
}
