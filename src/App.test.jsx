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

  it('opens the dev panel and instantly completes a simulated pomodoro without waiting', () => {
    const { container } = render(<App />)

    fireEvent.click(screen.getByText('狗'))
    fireEvent.click(screen.getByText('柴犬'))
    fireEvent.click(screen.getByText('就是這隻！'))

    fireEvent.click(screen.getByText('工程模式'))
    fireEvent.click(screen.getByText('模擬完成'))

    expect(container.textContent).toContain('今天已完成 1 個番茄鐘')
    expect(container.textContent).toContain('💰 50')
    expect(container.textContent).toContain('⭐ 5')
    expect(screen.getByText('工作時間')).toBeInTheDocument()
  })

  it('reveals skill track content after a single click on the skill tree toggle', () => {
    render(<App />)

    expect(screen.queryByText('訓練技巧')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('技能樹 ▸'))

    expect(screen.getByText('訓練技巧')).toBeInTheDocument()
  })

  it('toggles between the main layout and the focus stats page', () => {
    render(<App />)
    expect(screen.getByText('今天已完成', { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '查看統計' }))
    expect(screen.getByText('專注成效統計')).toBeInTheDocument()
    expect(screen.queryByText('今天已完成', { exact: false })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '關閉統計' }))
    expect(screen.getByText('今天已完成', { exact: false })).toBeInTheDocument()
  })

  it('shows a trim notice banner after a pomodoro completion trims old focus history, and can dismiss it', () => {
    const seeded = { version: 1, days: {} }
    let cursor = new Date(2026, 0, 1)
    for (let i = 0; i < 91; i += 1) {
      const y = cursor.getFullYear()
      const m = String(cursor.getMonth() + 1).padStart(2, '0')
      const d = String(cursor.getDate()).padStart(2, '0')
      seeded.days[`${y}-${m}-${d}`] = { count: 1, minutes: 10, growthMilestoneStageKey: null }
      cursor.setDate(cursor.getDate() + 1)
    }
    localStorage.setItem('pomodoro.focusHistory', JSON.stringify(seeded))

    const originalSetItem = Storage.prototype.setItem
    let focusHistoryCalls = 0
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function mocked(key, value) {
      if (key === 'pomodoro.focusHistory') {
        focusHistoryCalls += 1
        if (focusHistoryCalls === 1) {
          throw new DOMException('quota exceeded', 'QuotaExceededError')
        }
      }
      return originalSetItem.call(this, key, value)
    })

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '開始' }))
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(screen.getByText('儲存空間不足', { exact: false })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '知道了' }))
    expect(screen.queryByText('儲存空間不足', { exact: false })).not.toBeInTheDocument()

    setItemSpy.mockRestore()
  })
})

describe('App - 備份與還原', () => {
  it('shows the backup/restore section inside the settings panel', () => {
    render(<App />)

    fireEvent.click(screen.getByText('設定'))

    expect(screen.getByText('備份與還原')).toBeInTheDocument()
    expect(screen.getByText('匯出存檔')).toBeInTheDocument()
    expect(screen.getByText('匯入存檔')).toBeInTheDocument()
  })
})
