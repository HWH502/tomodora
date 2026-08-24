import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusHeatmap from './FocusHeatmap'

function emptyHistory() {
  return { version: 1, days: {} }
}

describe('FocusHeatmap', () => {
  it('renders the current year label and a full grid of day cells', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(String(currentYear))).toBeInTheDocument()
    // Most years need 53 week-columns, but some (e.g. leap years starting on
    // a Sunday) legitimately need 54 to show every real day. Assert the
    // shape (a whole number of week-columns) instead of hardcoding 53.
    // Scoped to the day-grid itself: the legend's level-0 swatch intentionally
    // reuses the .focus-heatmap__cell class for its background (see the
    // legend test below), so an unscoped query would also pick those up.
    const cellCount = document.querySelectorAll('.focus-heatmap__grid .focus-heatmap__cell').length
    expect(cellCount % 7).toBe(0)
    expect(cellCount).toBeGreaterThanOrEqual(53 * 7)
  })

  it('moves to the previous year when the back arrow is clicked', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    const currentYear = new Date().getFullYear()
    fireEvent.click(screen.getByRole('button', { name: '上一年' }))
    expect(screen.getByText(String(currentYear - 1))).toBeInTheDocument()
  })

  it('shows date, count, and minutes in a tooltip on hover', () => {
    const year = new Date().getFullYear()
    const dateString = `${year}-03-01`
    const history = { version: 1, days: { [dateString]: { count: 2, minutes: 50, growthMilestoneStageKey: null } } }
    render(<FocusHeatmap history={history} currentPet={null} petMemorials={[]} />)
    const cell = screen.getByTestId(`focus-heatmap-cell-${dateString}`)
    fireEvent.mouseEnter(cell)
    expect(screen.getByRole('tooltip')).toHaveTextContent('3/1')
    expect(screen.getByRole('tooltip')).not.toHaveTextContent(dateString)
    expect(screen.getByRole('tooltip')).toHaveTextContent('2')
    expect(screen.getByRole('tooltip')).toHaveTextContent('50')
  })

  it('shows a growth milestone note in the tooltip on the transition day', () => {
    const year = new Date().getFullYear()
    const dateString = `${year}-03-01`
    const history = { version: 1, days: { [dateString]: { count: 1, minutes: 25, growthMilestoneStageKey: 'growing' } } }
    render(<FocusHeatmap history={history} currentPet={null} petMemorials={[]} />)
    const cell = screen.getByTestId(`focus-heatmap-cell-${dateString}`)
    fireEvent.mouseEnter(cell)
    expect(screen.getByRole('tooltip')).toHaveTextContent('長大到')
  })

  it('renders a month label for the current month somewhere in the grid', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    const currentMonth = new Date().getMonth() + 1
    const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    expect(screen.getByText(MONTH_ABBR[currentMonth])).toBeInTheDocument()
  })

  it('shows sparse weekday labels for Mon/Wed/Fri only', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    expect(screen.getAllByText('Mon').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Wed').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fri').length).toBeGreaterThan(0)
    // The other 4 weekday rows render no stray day-name text.
    expect(screen.queryByText('Tue')).not.toBeInTheDocument()
    expect(screen.queryByText('Thu')).not.toBeInTheDocument()
    expect(screen.queryByText('Sat')).not.toBeInTheDocument()
    expect(screen.queryByText('Sun')).not.toBeInTheDocument()
  })

  it('positions a month label on the week-column containing that month\'s 1st even when the 1st falls on a Sunday', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    // Feb 1, 2026 is a Sunday (the last row of a Monday-first week) — the
    // exact case that previously caused the "2月" label to land one
    // week-column late, on the week AFTER the one containing Feb 1.
    const targetYear = 2026
    const currentYear = new Date().getFullYear()
    const diff = targetYear - currentYear
    const navButton = screen.getByRole('button', { name: diff < 0 ? '上一年' : '下一年' })
    for (let i = 0; i < Math.abs(diff); i += 1) {
      fireEvent.click(navButton)
    }
    expect(screen.getByText(String(targetYear))).toBeInTheDocument()

    expect(screen.getByText('Feb')).toBeInTheDocument()

    const febFirstCell = screen.getByTestId('focus-heatmap-cell-2026-02-01')
    const weekColumns = Array.from(document.querySelectorAll('.focus-heatmap__week'))
    const weekIndex = weekColumns.findIndex((week) => week.contains(febFirstCell))
    expect(weekIndex).toBeGreaterThanOrEqual(0)

    const monthLabels = Array.from(document.querySelectorAll('.focus-heatmap__month-label'))
    expect(monthLabels[weekIndex]).toHaveTextContent('Feb')
  })

  it('renders a legend with Less/More labels and 5 color-level swatches', () => {
    render(<FocusHeatmap history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    expect(screen.getByText('Less')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
    const swatches = screen.getAllByTestId('focus-heatmap-legend-swatch')
    expect(swatches).toHaveLength(5)
    // Level 0 must reuse the real .focus-heatmap__cell base class (the same
    // class every actual level-0 day cell gets) rather than a hardcoded
    // color duplicate, so it can never drift out of sync with real cells.
    expect(swatches[0].className).toContain('focus-heatmap__cell')
    expect(swatches[0].className).not.toContain('focus-heatmap__cell--level-0')
    for (let level = 1; level <= 4; level += 1) {
      expect(swatches[level].className).toContain(`focus-heatmap__cell--level-${level}`)
    }
  })
})
