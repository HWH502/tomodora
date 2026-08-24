import { useState } from 'react'
import { GROWTH_STAGE_DEFS, getPetGrowthStage } from '../utils/pet'

export default function DevPanel({
  speciesId = 'dog',
  onCompletePomodoros,
  onGrantResources,
  onSetGrowthProgress,
  onSetPetNeeds,
  onResetOwner,
  onSimulatePreviousDay,
}) {
  const [pomodoroCount, setPomodoroCount] = useState(1)
  const [money, setMoney] = useState(0)
  const [skillPoints, setSkillPoints] = useState(0)
  const [hunger, setHunger] = useState(60)
  const [cleanliness, setCleanliness] = useState(60)
  const [health, setHealth] = useState(60)
  const [affection, setAffection] = useState(60)

  const handleResetOwner = () => {
    if (window.confirm('確定要清空存檔重新開始嗎？此動作無法復原。')) {
      onResetOwner()
    }
  }

  return (
    <section className="dev-panel">
      <h2 className="dev-panel__title">工程模式</h2>

      <div className="dev-panel__section">
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-pomodoro-count">模擬完成番茄鐘數量</label>
          <input
            id="dev-panel-pomodoro-count"
            type="number"
            min="1"
            value={pomodoroCount}
            onChange={(event) => setPomodoroCount(Number(event.target.value))}
          />
        </div>
        <button type="button" onClick={() => onCompletePomodoros(pomodoroCount)}>
          模擬完成
        </button>
      </div>

      <div className="dev-panel__section">
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-money">灌金錢</label>
          <input
            id="dev-panel-money"
            type="number"
            value={money}
            onChange={(event) => setMoney(Number(event.target.value))}
          />
        </div>
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-skill-points">灌技能點</label>
          <input
            id="dev-panel-skill-points"
            type="number"
            value={skillPoints}
            onChange={(event) => setSkillPoints(Number(event.target.value))}
          />
        </div>
        <button type="button" onClick={() => onGrantResources(money, skillPoints)}>
          灌資源
        </button>
      </div>

      <div className="dev-panel__section">
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-hunger">飽食度</label>
          <input
            id="dev-panel-hunger"
            type="number"
            min="0"
            max="100"
            value={hunger}
            onChange={(event) => setHunger(Number(event.target.value))}
          />
        </div>
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-cleanliness">潔淨度</label>
          <input
            id="dev-panel-cleanliness"
            type="number"
            min="0"
            max="100"
            value={cleanliness}
            onChange={(event) => setCleanliness(Number(event.target.value))}
          />
        </div>
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-health">健康度</label>
          <input
            id="dev-panel-health"
            type="number"
            min="0"
            max="100"
            value={health}
            onChange={(event) => setHealth(Number(event.target.value))}
          />
        </div>
        <div className="dev-panel__field">
          <label htmlFor="dev-panel-affection">好感度</label>
          <input
            id="dev-panel-affection"
            type="number"
            min="0"
            max="100"
            value={affection}
            onChange={(event) => setAffection(Number(event.target.value))}
          />
        </div>
        <button
          type="button"
          onClick={() => onSetPetNeeds({ hunger, cleanliness, health, affection })}
        >
          設定需求數值
        </button>
      </div>

      <div className="dev-panel__section dev-panel__section--stages">
        <span className="dev-panel__section-label">跳到成長階段</span>
        <div className="dev-panel__stage-buttons">
          {GROWTH_STAGE_DEFS.map((def) => (
            <button
              key={def.stageKey}
              type="button"
              onClick={() => onSetGrowthProgress(def.minPomodoros)}
            >
              {getPetGrowthStage(def.minPomodoros, speciesId).label}
            </button>
          ))}
        </div>
      </div>

      <div className="dev-panel__section dev-panel__section--footer">
        <button type="button" onClick={() => onSimulatePreviousDay()}>
          模擬跨夜
        </button>
        <button type="button" className="dev-panel__danger" onClick={handleResetOwner}>
          清空存檔
        </button>
      </div>
    </section>
  )
}
