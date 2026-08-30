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

  it('paginates further back in time when the "previous" pager button is clicked', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '上一頁' }))
    expect(screen.getAllByTestId('focus-trend-bar').length).toBe(12)
  })

  it('shows a range label describing the visible bars\' month span', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    expect(screen.getByTestId('focus-trend-range-label').textContent).toMatch(/^\d{1,2}月( - \d{1,2}月)?$/)
  })

  it('disables the "next" pager button on the first (most recent) page', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    expect(screen.getByRole('button', { name: '下一頁' })).toBeDisabled()
  })

  it('re-enables the "next" pager button after paging back', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '上一頁' }))
    expect(screen.getByRole('button', { name: '下一頁' })).not.toBeDisabled()
  })

  it('shows no tooltip until a bar is hovered', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows minutes and count in a tooltip on hover, matching the heatmap\'s hover-to-reveal mechanism', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const history = { version: 1, days: { [`${y}-${m}-${d}`]: { count: 2, minutes: 40, growthMilestoneStageKey: null } } }
    render(<FocusTrendChart history={history} />)
    const columns = screen.getAllByTestId('focus-trend-bar-column')
    const thisWeekColumn = columns[columns.length - 1]
    fireEvent.mouseEnter(thisWeekColumn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('40 分鐘')
    expect(screen.getByRole('tooltip')).toHaveTextContent('2 次')
    fireEvent.mouseLeave(thisWeekColumn)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on keyboard focus, and toggles it on a touch tap, matching the heatmap', () => {
    render(<FocusTrendChart history={{ version: 1, days: {} }} />)
    const column = screen.getAllByTestId('focus-trend-bar-column')[0]

    fireEvent.focus(column)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.blur(column)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.pointerUp(column, { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.pointerUp(column, { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
