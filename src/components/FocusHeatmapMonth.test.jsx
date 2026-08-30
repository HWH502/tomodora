import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusHeatmapMonth from './FocusHeatmapMonth'

function emptyHistory() {
  return { version: 1, days: {} }
}

describe('FocusHeatmapMonth', () => {
  it('renders a 7-column calendar with a Chinese weekday header', () => {
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    ;['一', '二', '三', '四', '五', '六', '日'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument()
    })
  })

  it('shows the current year and month in the header by default', () => {
    const now = new Date()
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    expect(screen.getByText(`${now.getFullYear()} 年 ${now.getMonth() + 1} 月`)).toBeInTheDocument()
  })

  it('shows a day cell for a recorded date in the current month', () => {
    const now = new Date()
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const history = { version: 1, days: { [dateString]: { count: 1, minutes: 40, growthMilestoneStageKey: null } } }
    render(<FocusHeatmapMonth history={history} currentPet={null} petMemorials={[]} />)
    expect(screen.getByTestId(`focus-heatmap-month-cell-${dateString}`)).toBeInTheDocument()
  })

  it('navigates to the previous month when the left arrow is clicked', () => {
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    const now = new Date()
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    fireEvent.click(screen.getByRole('button', { name: '上一月' }))
    expect(screen.getByText(`${prevMonthDate.getFullYear()} 年 ${prevMonthDate.getMonth() + 1} 月`)).toBeInTheDocument()
  })

  it('navigates forward again with the right arrow', () => {
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    const now = new Date()
    fireEvent.click(screen.getByRole('button', { name: '上一月' }))
    fireEvent.click(screen.getByRole('button', { name: '下一月' }))
    expect(screen.getByText(`${now.getFullYear()} 年 ${now.getMonth() + 1} 月`)).toBeInTheDocument()
  })

  it('shows a growth milestone dot and shows date/count/minutes in a tooltip on hover', () => {
    const now = new Date()
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const history = { version: 1, days: { [dateString]: { count: 2, minutes: 50, growthMilestoneStageKey: 'growing' } } }
    render(<FocusHeatmapMonth history={history} currentPet={null} petMemorials={[]} />)
    const cell = screen.getByTestId(`focus-heatmap-month-cell-${dateString}`)
    expect(cell.querySelector('.focus-heatmap-month__milestone-dot')).toBeInTheDocument()
    fireEvent.mouseEnter(cell)
    expect(screen.getByRole('tooltip')).toHaveTextContent('2')
    expect(screen.getByRole('tooltip')).toHaveTextContent('50')
    expect(screen.getByRole('tooltip')).toHaveTextContent('長大到')
  })

  it('shifts the tooltip alignment away from center when the cell is near the right edge of the viewport', () => {
    const originalInnerWidth = window.innerWidth
    const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect
    try {
      window.innerWidth = 390
      HTMLElement.prototype.getBoundingClientRect = function () {
        // Simulate the Sunday (rightmost) column of the mobile calendar grid,
        // flush against the right edge of a 390px-wide screen.
        return { left: 350, right: 388, top: 200, bottom: 232, width: 38, height: 32 }
      }

      const now = new Date()
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
      const cell = screen.getByTestId(`focus-heatmap-month-cell-${dateString}`)
      fireEvent.mouseEnter(cell)

      const tooltip = screen.getByRole('tooltip')
      expect(tooltip.className).toContain('focus-heatmap-month__tooltip--align-end')
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect
      window.innerWidth = originalInnerWidth
    }
  })

  it('shows a generation-tint class on a cell within the current pet\'s companionship', () => {
    const currentPet = { generation: 1, bornAt: '2020-01-01T00:00:00.000Z' }
    const now = new Date()
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={currentPet} petMemorials={[]} />)
    const cell = screen.getByTestId(`focus-heatmap-month-cell-${dateString}`)
    expect(cell.className).toContain('focus-heatmap-month__cell--gen-1')
  })

  it('shows a legend with Less/More labels and 5 color-level swatches', () => {
    render(<FocusHeatmapMonth history={emptyHistory()} currentPet={null} petMemorials={[]} />)
    expect(screen.getByText('少')).toBeInTheDocument()
    expect(screen.getByText('多')).toBeInTheDocument()
    expect(screen.getAllByTestId('focus-heatmap-month-legend-swatch')).toHaveLength(5)
  })
})
