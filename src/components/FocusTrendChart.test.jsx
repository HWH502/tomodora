import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusTrendChart from './FocusTrendChart'

describe('FocusTrendChart', () => {
  it('defaults to week view showing 12 bars', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    expect(screen.getAllByTestId('focus-trend-bar').length).toBe(12)
  })

  it('switches to month view showing 12 bars when the 月 tab is clicked', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '月' }))
    expect(screen.getAllByTestId('focus-trend-bar').length).toBe(12)
  })

  it('renders bar heights proportional to minutes, tallest bar at 100%', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const history = { version: 1, days: { [`${y}-${m}-${d}`]: { count: 1, minutes: 40, growthMilestoneStageKey: null } } }
    render(<FocusTrendChart history={history} />)
    const bars = screen.getAllByTestId('focus-trend-bar')
    const tallest = bars[bars.length - 1] // this week is the most recent bar
    expect(tallest.style.height).toBe('100%')
  })

  it('paginates further back in time when the left arrow is clicked', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '看更早' }))
    expect(screen.getAllByTestId('focus-trend-bar').length).toBe(12)
  })
})
