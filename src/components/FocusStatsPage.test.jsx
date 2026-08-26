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
    expect(screen.getByText('累計專注分鐘')).toBeInTheDocument()
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
