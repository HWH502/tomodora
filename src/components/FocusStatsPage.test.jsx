import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import FocusStatsPage from './FocusStatsPage'

function baseProps(overrides = {}) {
  return {
    history: { version: 1, days: {} },
    streak: { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] },
    currentPet: null,
    petMemorials: [],
    lifetimePomodoros: 0,
    lifetimeFocusMinutes: 0,
    lifetimeFocusMinutesStartedAt: '2026-08-25',
    ...overrides,
  }
}

describe('FocusStatsPage', () => {
  const originalInnerWidth = window.innerWidth

  afterEach(() => {
    window.innerWidth = originalInnerWidth
  })

  it('renders the summary cards, desktop heatmap, and desktop trend chart on a wide viewport', () => {
    window.innerWidth = 1200
    render(<FocusStatsPage {...baseProps()} />)
    expect(document.querySelector('.focus-summary')).toBeInTheDocument()
    expect(document.querySelector('.focus-heatmap')).toBeInTheDocument()
    expect(document.querySelector('.focus-trend')).toBeInTheDocument()
    expect(document.querySelector('.focus-heatmap-month')).not.toBeInTheDocument()
    expect(document.querySelector('.focus-trend-mobile')).not.toBeInTheDocument()
    // Desktop keeps all three summary cards, including streak.
    expect(screen.getByText('連續天數')).toBeInTheDocument()
  })

  it('renders the mobile month heatmap and mobile trend chart on a narrow viewport, without the desktop year switcher, and drops the streak card', () => {
    window.innerWidth = 375
    render(<FocusStatsPage {...baseProps()} />)
    expect(document.querySelector('.focus-heatmap-month')).toBeInTheDocument()
    expect(document.querySelector('.focus-trend-mobile')).toBeInTheDocument()
    expect(document.querySelector('.focus-heatmap')).not.toBeInTheDocument()
    expect(document.querySelector('.focus-trend')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '上一年' })).not.toBeInTheDocument()
    // Mobile only keeps 今日專注/本週專注 — the streak card is dropped.
    expect(screen.queryByText('連續天數')).not.toBeInTheDocument()
  })

  it('does not render a close button — navigation happens via the bottom nav dock', () => {
    window.innerWidth = 1200
    render(<FocusStatsPage {...baseProps()} />)
    expect(screen.queryByRole('button', { name: '關閉統計' })).not.toBeInTheDocument()
  })

  it('switching the desktop year control updates the heatmap', () => {
    window.innerWidth = 1200
    const history = {
      version: 1,
      days: { '2025-06-01': { count: 1, minutes: 400, growthMilestoneStageKey: null } },
    }
    const currentYear = new Date().getFullYear()
    render(<FocusStatsPage {...baseProps({ history })} />)

    expect(screen.queryByTestId('focus-heatmap-cell-2025-06-01')).not.toBeInTheDocument()

    for (let i = 0; i < currentYear - 2025; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: '上一年' }))
    }

    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.getByTestId('focus-heatmap-cell-2025-06-01')).toBeInTheDocument()
  })

  it('opens the share card modal when the share button is clicked', () => {
    window.innerWidth = 1200
    render(<FocusStatsPage {...baseProps({ lifetimePomodoros: 10, lifetimeFocusMinutes: 250 })} />)
    expect(document.querySelector('.share-card-modal__overlay')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '產生分享圖卡' }))
    expect(document.querySelector('.share-card-modal__overlay')).toBeInTheDocument()
  })
})
