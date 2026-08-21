import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Controls from './Controls'

describe('Controls', () => {
  it('shows 開始 and calls onStart when not running', async () => {
    const user = userEvent.setup()
    const onStart = vi.fn()
    render(<Controls isRunning={false} onStart={onStart} onPause={vi.fn()} onReset={vi.fn()} />)

    expect(screen.getByText('開始')).toBeInTheDocument()
    expect(screen.queryByText('暫停')).not.toBeInTheDocument()

    await user.click(screen.getByText('開始'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('shows 暫停 and calls onPause when running', async () => {
    const user = userEvent.setup()
    const onPause = vi.fn()
    render(<Controls isRunning={true} onStart={vi.fn()} onPause={onPause} onReset={vi.fn()} />)

    expect(screen.getByText('暫停')).toBeInTheDocument()
    expect(screen.queryByText('開始')).not.toBeInTheDocument()

    await user.click(screen.getByText('暫停'))
    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('always renders 重置 and calls onReset', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()
    render(<Controls isRunning={false} onStart={vi.fn()} onPause={vi.fn()} onReset={onReset} />)

    await user.click(screen.getByText('重置'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })
})
