import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Settings from './Settings'

const settings = { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 }

describe('Settings', () => {
  it('shows the current duration values', () => {
    render(<Settings settings={settings} onSave={vi.fn()} />)
    expect(screen.getByLabelText('工作時間（分鐘）')).toHaveValue(25)
    expect(screen.getByLabelText('短休息（分鐘）')).toHaveValue(5)
    expect(screen.getByLabelText('長休息（分鐘）')).toHaveValue(15)
  })

  it('saves immediately when a step button is clicked, with no separate save step', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    await user.click(screen.getByLabelText('增加工作時間'))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 26,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    })
  })

  it('clamps to 1 minute when stepping down from 2', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={{ ...settings, shortBreakMinutes: 2 }} onSave={onSave} />)

    await user.click(screen.getByLabelText('減少短休息'))

    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 25,
      shortBreakMinutes: 1,
      longBreakMinutes: 15,
    })
  })

  it('does not save when stepping below 1 minute while already at the minimum', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={{ ...settings, shortBreakMinutes: 1 }} onSave={onSave} />)

    await user.click(screen.getByLabelText('減少短休息'))

    expect(onSave).not.toHaveBeenCalled()
  })

  it('does not save when a field loses focus without its value changing', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    const workInput = screen.getByLabelText('工作時間（分鐘）')
    await user.click(workInput)
    await user.tab()

    expect(onSave).not.toHaveBeenCalled()
    expect(workInput).toHaveValue(25)
  })

  it('saves a typed value once the field loses focus', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    const workInput = screen.getByLabelText('工作時間（分鐘）')
    await user.clear(workInput)
    await user.type(workInput, '50')
    expect(onSave).not.toHaveBeenCalled()

    await user.tab()

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 50,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    })
  })

  it('saves a typed value when Enter is pressed', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    const longInput = screen.getByLabelText('長休息（分鐘）')
    await user.clear(longInput)
    await user.type(longInput, '20{Enter}')

    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 20,
    })
  })

  it('saves 1 instead of 0 when a duration field is cleared to empty before losing focus', () => {
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    const workInput = screen.getByLabelText('工作時間（分鐘）')
    fireEvent.change(workInput, { target: { value: '' } })
    fireEvent.blur(workInput)

    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 1,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    })
  })

  it('re-syncs the displayed value when the settings prop changes externally', () => {
    const { rerender } = render(<Settings settings={settings} onSave={vi.fn()} />)
    rerender(<Settings settings={{ ...settings, workMinutes: 45 }} onSave={vi.fn()} />)

    expect(screen.getByLabelText('工作時間（分鐘）')).toHaveValue(45)
  })

  it('shows the time-length card title and hint text', () => {
    render(<Settings settings={settings} onSave={vi.fn()} />)
    expect(screen.getByText('番茄鐘時長')).toBeInTheDocument()
    expect(screen.getByText('新的時長會在下一次進入該階段時套用')).toBeInTheDocument()
  })
})
