import { useEffect, useState } from 'react'

const FIELDS = [
  { key: 'workMinutes', label: '工作時間', modifier: 'work' },
  { key: 'shortBreakMinutes', label: '短休息', modifier: 'short' },
  { key: 'longBreakMinutes', label: '長休息', modifier: 'long' },
]

function draftsFromSettings(settings) {
  return {
    workMinutes: String(settings.workMinutes),
    shortBreakMinutes: String(settings.shortBreakMinutes),
    longBreakMinutes: String(settings.longBreakMinutes),
  }
}

function sanitize(value) {
  return Number.isFinite(value) && value >= 1 ? value : 1
}

export default function Settings({ settings, onSave }) {
  const [drafts, setDrafts] = useState(() => draftsFromSettings(settings))

  useEffect(() => {
    setDrafts(draftsFromSettings(settings))
  }, [settings])

  const commit = (key, rawValue) => {
    const value = sanitize(Number(rawValue))
    if (value === settings[key]) {
      setDrafts((prev) => ({ ...prev, [key]: String(value) }))
      return
    }
    onSave({ ...settings, [key]: value })
  }

  const handleStep = (key, delta) => () => {
    commit(key, settings[key] + delta)
  }

  const handleDraftChange = (key) => (event) => {
    setDrafts((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleDraftCommit = (key) => () => {
    commit(key, drafts[key])
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  return (
    <div className="settings-page__card">
      <h2 className="display settings-page__card-title">番茄鐘時長</h2>
      <div className="settings-fields">
        {FIELDS.map(({ key, label, modifier }) => (
          <div className={`settings-field settings-field--${modifier}`} key={key}>
            <span className="settings-field__label">{label}</span>
            <div className="settings-field__num-box">
              <button
                type="button"
                className="settings-field__step-btn"
                aria-label={`減少${label}`}
                onClick={handleStep(key, -1)}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                className="settings-field__input display"
                aria-label={`${label}（分鐘）`}
                value={drafts[key]}
                onChange={handleDraftChange(key)}
                onBlur={handleDraftCommit(key)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="settings-field__step-btn"
                aria-label={`增加${label}`}
                onClick={handleStep(key, 1)}
              >
                +
              </button>
            </div>
            <span className="settings-field__unit" aria-hidden="true">分鐘</span>
          </div>
        ))}
      </div>
      <p className="settings-page__hint">新的時長會在下一次進入該階段時套用</p>
    </div>
  )
}
