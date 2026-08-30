import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { __resetForTests } from './utils/focusHistory'

const fixedNow = new Date(2026, 2, 15, 10, 0, 0)

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(fixedNow)
})

afterEach(() => {
  vi.useRealTimers()
})

function createFirstPet() {
  fireEvent.click(screen.getByText('狗'))
  fireEvent.click(screen.getByText('柴犬'))
  fireEvent.click(screen.getByText('就是這隻！'))
}

describe('App', () => {
  it('shows the pet-creation onboarding by default for a brand-new install, on the 寵物 page', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: '寵物' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('選擇你的第一隻寵物')).toBeInTheDocument()
  })

  it('shows the species/breed picker for a brand-new install, and the pet panel after choosing', () => {
    render(<App />)

    fireEvent.click(screen.getByText('貓'))
    fireEvent.click(screen.getByText('布偶貓'))
    expect(screen.getByText('確認你的寵物')).toBeInTheDocument()

    fireEvent.click(screen.getByText('就是這隻！'))

    expect(screen.queryByText('選擇你的第一隻寵物')).not.toBeInTheDocument()
    expect(screen.queryByText('確認你的寵物')).not.toBeInTheDocument()
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })

  it('navigates to 首頁 and shows the initial work phase, full duration, and zero completed count', () => {
    render(<App />)
    createFirstPet()

    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

    expect(screen.getByText('工作時間')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.classList.contains('today-stats') && element.textContent === '今天已完成 0 個番茄鐘')).toBeInTheDocument()
  })

  it('shows the pet card and round count on 首頁 once a pet exists', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

    expect(screen.getByText('第 1 / 4 輪')).toBeInTheDocument()
  })

  it('counts down after clicking 開始, and stops after 暫停', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

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
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

    fireEvent.click(screen.getByText('開始'))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    fireEvent.click(screen.getByText('重置'))

    expect(screen.getByText('25:00')).toBeInTheDocument()
  })

  it('updates today count, pet currency, and phase after a full work session completes', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

    fireEvent.click(screen.getByText('開始'))
    act(() => {
      vi.advanceTimersByTime(25 * 60 * 1000)
    })

    expect(screen.getByText((_, element) => element?.classList.contains('today-stats') && element.textContent === '今天已完成 1 個番茄鐘')).toBeInTheDocument()
    expect(screen.getByText('短休息')).toBeInTheDocument()
    expect(screen.getByText('開始')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '商店' }))
    expect(screen.getByText('金錢：50', { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '技能樹' }))
    expect(screen.getByText('可用技能點：5', { exact: false })).toBeInTheDocument()
  })

  it('opens the dev panel and instantly completes a simulated pomodoro without waiting', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))

    fireEvent.click(screen.getByText('工程模式'))
    fireEvent.click(screen.getByText('模擬完成'))

    expect(screen.getByText((_, element) => element?.classList.contains('today-stats') && element.textContent === '今天已完成 1 個番茄鐘')).toBeInTheDocument()
    expect(screen.getByText('工作時間')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '商店' }))
    expect(screen.getByText('金錢：50', { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '技能樹' }))
    expect(screen.getByText('可用技能點：5', { exact: false })).toBeInTheDocument()
  })

  it('shows the skill tree as its own page from the bottom nav, reachable even before a pet exists', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '技能樹' }))
    expect(screen.getByRole('button', { name: '技能樹' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('訓練技巧')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '寵物' }))
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '技能樹' }))
    expect(screen.getByText('訓練技巧')).toBeInTheDocument()
  })

  it('shows the 紀念牆 tab on the 寵物 page instead of a skill-tree tab', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '寵物' }))

    expect(screen.queryByRole('tab', { name: '技能樹' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: '紀念牆' }))
    expect(screen.getByText('還沒有寵物離開，這裡以後會記錄牠們的故事。')).toBeInTheDocument()
  })

  it('navigates to the 統計 page and back to 首頁', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '首頁' }))
    expect(screen.getByText('今天已完成', { exact: false })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '統計' }))
    expect(screen.getByText('專注成效統計')).toBeInTheDocument()
    expect(screen.queryByText('今天已完成', { exact: false })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '番茄鐘' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '首頁' }))
    expect(screen.getByText('今天已完成', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '首頁' })).toHaveAttribute('aria-current', 'page')
  })

  it('navigates to the 商店 page directly, with no expand step and no 番茄鐘 heading', () => {
    render(<App />)
    createFirstPet()
    fireEvent.click(screen.getByRole('button', { name: '商店' }))

    expect(screen.getByText('小商店')).toBeInTheDocument()
    expect(screen.getByText('一次性道具')).toBeInTheDocument()
    expect(screen.getByText('玩具球')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '番茄鐘' })).not.toBeInTheDocument()
  })

  it('shows a trim notice banner after a pomodoro completion trims old focus history, and can dismiss it', async () => {
    vi.stubGlobal('indexedDB', undefined)
    await __resetForTests()

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
    await __resetForTests()

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

    try {
      render(<App />)
      createFirstPet()
      fireEvent.click(screen.getByRole('button', { name: '首頁' }))

      fireEvent.click(screen.getByRole('button', { name: '開始' }))
      act(() => {
        vi.advanceTimersByTime(25 * 60 * 1000)
      })

      expect(screen.getByText('儲存空間有點緊', { exact: false })).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: '知道了' }))
      expect(screen.queryByText('儲存空間有點緊', { exact: false })).not.toBeInTheDocument()
    } finally {
      setItemSpy.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})

describe('App - 備份與還原', () => {
  it('shows the backup/restore section on the 設定 page', () => {
    render(<App />)
    createFirstPet()

    fireEvent.click(screen.getByRole('button', { name: '設定' }))

    expect(screen.getByText('備份與還原')).toBeInTheDocument()
    expect(screen.getByText('匯出存檔')).toBeInTheDocument()
    expect(screen.getByText('匯入存檔')).toBeInTheDocument()
  })

  it('shows the 設定 page title and hides the 番茄鐘 heading', () => {
    render(<App />)
    createFirstPet()

    fireEvent.click(screen.getByRole('button', { name: '設定' }))

    expect(screen.getByText('設定')).toBeInTheDocument()
    expect(screen.getByText('番茄鐘時長')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '番茄鐘' })).not.toBeInTheDocument()
  })
})
