import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const fixedNow = new Date(2026, 2, 15, 10, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(fixedNow)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('App', () => {
  it('shows the initial work phase, full duration, and zero completed count', () => {
    const { container } = render(<App />)
    expect(screen.getByText('工作時間')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(container.textContent).toContain('今天已完成 0 個番茄鐘')
  })

  it('counts down after clicking 開始, and stops after 暫停', () => {
    render(<App />)

    fireEvent.click(screen.getByText('開始'))
    expect(screen.getByText('暫停')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByText('24:57')).toBeInTheDocument()

    fireEvent.click(screen.getByText('暫停'))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText('24:57')).toBeInTheDocument()
  })

  it('resets the display back to the full duration', () => {
    render(<App />)

    fireEvent.click(screen.getByText('開始'))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.click(screen.getByText('重置'))

    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('updates today count, pet currency, and phase after a full work session completes', () => {
    const { container } = render(<App />)

    // new-install onboarding: pick a species then a breed, then confirm the stat preview
    fireEvent.click(screen.getByText('狗'))
    fireEvent.click(screen.getByText('柴犬'))
    fireEvent.click(screen.getByText('就是這隻！'))

    fireEvent.click(screen.getByText('開始'))
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(container.textContent).toContain('今天已完成 1 個番茄鐘')
    expect(container.textContent).toContain('💰 50')
    expect(container.textContent).toContain('⭐ 5')
    expect(screen.getByText('短休息')).toBeInTheDocument()
    expect(screen.getByText('開始')).toBeInTheDocument()
  })

  it('shows the species/breed picker for a brand-new install, and the pet panel after choosing', () => {
    render(<App />)

    expect(screen.getByText('選擇你的第一隻寵物')).toBeInTheDocument()

    fireEvent.click(screen.getByText('貓'))
    fireEvent.click(screen.getByText('布偶貓'))

    expect(screen.getByText('確認你的寵物')).toBeInTheDocument()

    fireEvent.click(screen.getByText('就是這隻！'))

    expect(screen.queryByText('選擇你的第一隻寵物')).not.toBeInTheDocument()
    expect(screen.queryByText('確認你的寵物')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })
})
