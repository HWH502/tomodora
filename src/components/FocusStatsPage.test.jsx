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
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '關閉統計' }))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
