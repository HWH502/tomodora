import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import DevPanel from './DevPanel'

describe('DevPanel', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('simulates completing pomodoros with the entered count', async () => {
    const user = userEvent.setup()
    const onCompletePomodoros = vi.fn()
    render(<DevPanel onCompletePomodoros={onCompletePomodoros} />)

    const input = screen.getByLabelText('模擬完成番茄鐘數量')
    expect(input).toHaveValue(1)
    await user.clear(input)
    await user.type(input, '5')
    await user.click(screen.getByText('模擬完成'))

    expect(onCompletePomodoros).toHaveBeenCalledWith(5)
  })

  it('grants money and skill points with the entered amounts', async () => {
    const user = userEvent.setup()
    const onGrantResources = vi.fn()
    render(<DevPanel onGrantResources={onGrantResources} />)

    await user.type(screen.getByLabelText('灌金錢'), '100')
    await user.type(screen.getByLabelText('灌技能點'), '7')
    await user.click(screen.getByText('灌資源'))

    expect(onGrantResources).toHaveBeenCalledWith(100, 7)
  })

  it('renders a button per growth stage that sets that stage on click', async () => {
    const user = userEvent.setup()
    const onSetGrowthProgress = vi.fn()
    render(<DevPanel onSetGrowthProgress={onSetGrowthProgress} />)

    await user.click(screen.getByText('傳奇老狗'))
    expect(onSetGrowthProgress).toHaveBeenCalledWith(100)

    await user.click(screen.getByText('幼犬階段'))
    expect(onSetGrowthProgress).toHaveBeenCalledWith(0)
  })

  it('resets the save only after the user confirms', async () => {
    const user = userEvent.setup()
    const onResetOwner = vi.fn()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<DevPanel onResetOwner={onResetOwner} />)

    await user.click(screen.getByText('清空存檔'))
    expect(onResetOwner).not.toHaveBeenCalled()

    window.confirm.mockReturnValue(true)
    await user.click(screen.getByText('清空存檔'))
    expect(onResetOwner).toHaveBeenCalledTimes(1)
  })

  it('simulates the previous day on click', async () => {
    const user = userEvent.setup()
    const onSimulatePreviousDay = vi.fn()
    render(<DevPanel onSimulatePreviousDay={onSimulatePreviousDay} />)

    await user.click(screen.getByText('模擬跨夜'))
    expect(onSimulatePreviousDay).toHaveBeenCalledTimes(1)
  })
})
