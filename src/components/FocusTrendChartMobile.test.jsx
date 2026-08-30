import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusTrendChartMobile from './FocusTrendChartMobile'

describe('FocusTrendChartMobile', () => {
  it('defaults to week view showing 6 bars', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    expect(screen.getAllByTestId('focus-trend-mobile-bar').length).toBe(6)
  })

  it('switches to month view showing 6 bars when the 月 tab is clicked', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '月' }))
    expect(screen.getAllByTestId('focus-trend-mobile-bar').length).toBe(6)
  })

  it('renders bar heights proportional to minutes, tallest bar at 100%', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const history = { version: 1, days: { [`${y}-${m}-${d}`]: { count: 1, minutes: 40, growthMilestoneStageKey: null } } }
    render(<FocusTrendChartMobile history={history} />)
    const bars = screen.getAllByTestId('focus-trend-mobile-bar')
    const tallest = bars[bars.length - 1]
    expect(tallest.style.height).toBe('100%')
  })

  it('shows a range label describing the visible bars\' month span', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    expect(screen.getByTestId('focus-trend-mobile-range-label').textContent).toMatch(/^\d{1,2}月( - \d{1,2}月)?$/)
  })

  it('disables the "next" pager button on the first (most recent) page', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    expect(screen.getByRole('button', { name: '下一頁' })).toBeDisabled()
  })

  it('paginates further back in time when the "previous" pager button is clicked, and re-enables "next"', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '上一頁' }))
    expect(screen.getAllByTestId('focus-trend-mobile-bar').length).toBe(6)
    expect(screen.getByRole('button', { name: '下一頁' })).not.toBeDisabled()
  })

  it('resets pagination to the first page when switching granularity', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '上一頁' }))
    fireEvent.click(screen.getByRole('button', { name: '月' }))
    expect(screen.getByRole('button', { name: '下一頁' })).toBeDisabled()
  })

  it('shows a visible label under each bar in week view', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    const labels = screen.getAllByTestId('focus-trend-mobile-bar-label')
    expect(labels.length).toBe(6)
    expect(labels[0].textContent).toMatch(/^\d{2}-\d{2}$/)
  })

  it('shows a visible label under each bar in month view', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    fireEvent.click(screen.getByRole('button', { name: '月' }))
    const labels = screen.getAllByTestId('focus-trend-mobile-bar-label')
    expect(labels.length).toBe(6)
    expect(labels[0].textContent).toMatch(/^\d{2}$/)
  })

  it('shows no tooltip until a bar is tapped or hovered', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows minutes and count in a tooltip on hover, matching the heatmap\'s mechanism', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const history = { version: 1, days: { [`${y}-${m}-${d}`]: { count: 2, minutes: 40, growthMilestoneStageKey: null } } }
    render(<FocusTrendChartMobile history={history} />)
    const columns = screen.getAllByTestId('focus-trend-mobile-bar-column')
    const thisWeekColumn = columns[columns.length - 1]
    fireEvent.mouseEnter(thisWeekColumn)
    expect(screen.getByRole('tooltip')).toHaveTextContent('40 分鐘')
    expect(screen.getByRole('tooltip')).toHaveTextContent('2 次')
  })

  it('toggles the tooltip on a touch tap, so mobile users can see bar values without hovering', () => {
    render(<FocusTrendChartMobile history={{ version: 1, days: {} }} />)
    const column = screen.getAllByTestId('focus-trend-mobile-bar-column')[0]

    fireEvent.pointerUp(column, { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.pointerUp(column, { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})
