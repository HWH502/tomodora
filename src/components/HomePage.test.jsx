import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from './HomePage'

const basePet = {
  speciesId: 'dog',
  breedId: 'shiba',
  breedLabel: '柴犬',
  personalityLabel: '穩重',
  pomodorosSinceBorn: 0,
  name: '小橘',
  stats: { learning: 12, obedience: 5, friendliness: 17, energy: 26 },
  hunger: 82,
  cleanliness: 68,
  health: 90,
  affection: 91,
}

const baseProps = {
  phase: 'work',
  secondsLeft: 1500,
  totalSeconds: 1500,
  currentRound: 1,
  totalRounds: 4,
  isRunning: false,
  onStart: vi.fn(),
  onPause: vi.fn(),
  onReset: vi.fn(),
  todayCount: 0,
  pet: basePet,
  streak: 5,
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 2, 15, 10, 0, 0)) // 10am -> 早安
})

afterEach(() => {
  vi.useRealTimers()
})

describe('HomePage', () => {
  it('shows a morning greeting, the streak, the timer, and today count', () => {
    render(<HomePage {...baseProps} />)
    expect(screen.getByText('早安', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('已連續專注 5 天')).toBeInTheDocument()
    expect(screen.getByText('工作時間')).toBeInTheDocument()
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByText((_, element) => element?.classList.contains('today-stats') && element.textContent === '今天已完成 0 個番茄鐘')).toBeInTheDocument()
  })

  it('shows the pet card when a pet is given', () => {
    render(<HomePage {...baseProps} />)
    expect(screen.getByText('小橘')).toBeInTheDocument()
  })

  it('omits the pet card when there is no pet yet', () => {
    render(<HomePage {...baseProps} pet={null} />)
    expect(screen.queryByText('小橘')).not.toBeInTheDocument()
    expect(screen.getByText('工作時間')).toBeInTheDocument()
  })

  it('wires Controls callbacks through', () => {
    const onStart = vi.fn()
    render(<HomePage {...baseProps} onStart={onStart} />)
    fireEvent.click(screen.getByText('開始'))
    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('renders decorative background blobs and paw trail as hidden from assistive tech', () => {
    const { container } = render(<HomePage {...baseProps} />)
    expect(container.querySelectorAll('.page-blob')).toHaveLength(2)
    const blobLayer = container.querySelector('.page-blob-layer')
    expect(blobLayer).toHaveAttribute('aria-hidden', 'true')
    const pawTrail = container.querySelector('.home-page__paw-trail')
    expect(pawTrail).toHaveAttribute('aria-hidden', 'true')
  })
})
