import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FocusStatsPage from './FocusStatsPage'

describe('FocusStatsPage', () => {
  it('renders the summary cards, heatmap, and trend chart together', () => {
    render(
      <FocusStatsPage
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        currentPet={null}
        petMemorials={[]}
        onClose={() => {}}
        lifetimePomodoros={0}
        lifetimeFocusMinutes={0}
        lifetimeFocusMinutesStartedAt="2026-08-25"
      />,
    )
    expect(screen.getByText('本年度累計分鐘')).toBeInTheDocument()
    expect(screen.getByText('總累計分鐘')).toBeInTheDocument()
    expect(document.querySelector('.focus-heatmap')).toBeInTheDocument()
    expect(document.querySelector('.focus-trend')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(
      <FocusStatsPage
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        currentPet={null}
        petMemorials={[]}
        onClose={onClose}
        lifetimePomodoros={0}
        lifetimeFocusMinutes={0}
        lifetimeFocusMinutesStartedAt="2026-08-25"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '關閉統計' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('switching the shared year control updates both the summary cards and the heatmap', () => {
    const history = {
      version: 1,
      days: {
        '2025-06-01': { count: 1, minutes: 400, growthMilestoneStageKey: null },
      },
    }
    const currentYear = new Date().getFullYear()
    render(
      <FocusStatsPage
        history={history}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        currentPet={null}
        petMemorials={[]}
        onClose={() => {}}
        lifetimePomodoros={0}
        lifetimeFocusMinutes={0}
        lifetimeFocusMinutesStartedAt="2026-08-25"
      />,
    )

    // Defaults to the current year: the 2025-06-01 entry shouldn't count yet.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('focus-heatmap-cell-2025-06-01')).not.toBeInTheDocument()

    for (let i = 0; i < currentYear - 2025; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: '上一年' }))
    }

    expect(screen.getByText('2025')).toBeInTheDocument()
    expect(screen.getAllByText('400').length).toBeGreaterThan(0) // summary card now reflects 2025's total
    expect(screen.getByTestId('focus-heatmap-cell-2025-06-01')).toBeInTheDocument() // heatmap switched too
  })

  it('keeps the lifetime total card unaffected by the year switcher', () => {
    const history = { version: 1, days: { '2025-06-01': { count: 1, minutes: 400, growthMilestoneStageKey: null } } }
    render(
      <FocusStatsPage
        history={history}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        currentPet={null}
        petMemorials={[]}
        onClose={() => {}}
        lifetimePomodoros={0}
        lifetimeFocusMinutes={12345}
        lifetimeFocusMinutesStartedAt="2026-08-25"
      />,
    )

    expect(screen.getByText('12345')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '上一年' }))
    expect(screen.getByText('12345')).toBeInTheDocument() // still the same lifetime total after switching years
  })

  it('opens the share card modal when the share button is clicked', () => {
    render(
      <FocusStatsPage
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        currentPet={null}
        petMemorials={[]}
        onClose={() => {}}
        lifetimePomodoros={10}
        lifetimeFocusMinutes={250}
        lifetimeFocusMinutesStartedAt="2026-08-25"
      />,
    )
    expect(document.querySelector('.share-card-modal__overlay')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '產生分享圖卡' }))
    expect(document.querySelector('.share-card-modal__overlay')).toBeInTheDocument()
  })
})
