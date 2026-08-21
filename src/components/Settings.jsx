import { useState } from 'react'

export default function Settings({ settings, onSave }) {
  const [form, setForm] = useState(settings)

  const handleChange = (field) => (event) => {
    setForm({ ...form, [field]: Number(event.target.value) })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <form className="settings" onSubmit={handleSubmit}>
      <label>
        工作時長（分鐘）
        <input
          type="number"
          min="1"
          value={form.workMinutes}
          onChange={handleChange('workMinutes')}
        />
      </label>
      <label>
        短休息時長（分鐘）
        <input
          type="number"
          min="1"
          value={form.shortBreakMinutes}
          onChange={handleChange('shortBreakMinutes')}
        />
      </label>
      <label>
        長休息時長（分鐘）
        <input
          type="number"
          min="1"
          value={form.longBreakMinutes}
          onChange={handleChange('longBreakMinutes')}
        />
      </label>
      <button type="submit">儲存設定</button>
      <p className="settings__hint">新的時長會在下一次進入該階段時套用</p>
    </form>
  )
}
