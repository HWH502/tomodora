import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Settings from './Settings'

const settings = { workMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15 }

describe('Settings', () => {
  it('initializes inputs from the settings prop', () => {
    render(<Settings settings={settings} onSave={vi.fn()} />)
    expect(screen.getByLabelText('工作時長（分鐘）')).toHaveValue(25)
    expect(screen.getByLabelText('短休息時長（分鐘）')).toHaveValue(5)
    expect(screen.getByLabelText('長休息時長（分鐘）')).toHaveValue(15)
  })

  it('submits the full updated form, including untouched fields', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Settings settings={settings} onSave={onSave} />)

    const workInput = screen.getByLabelText('工作時長（分鐘）')
    await user.clear(workInput)
    await user.type(workInput, '50')

    await user.click(screen.getByText('儲存設定'))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 50,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    })
  })

  it('saves 1 instead of 0 when a duration field is cleared to empty before submit', () => {
    // Some browsers' number-input constraint validation is inconsistent about
    // blocking a click-triggered submit here, so this exercises the submit
    // handler's own sanitization directly rather than relying on that.
    const onSave = vi.fn()
    const { container } = render(<Settings settings={settings} onSave={onSave} />)

    const workInput = screen.getByLabelText('工作時長（分鐘）')
    fireEvent.change(workInput, { target: { value: '' } })
    fireEvent.submit(container.querySelector('form'))

    expect(onSave).toHaveBeenCalledWith({
      workMinutes: 1,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
    })
  })
})
