import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusSummaryCards from './FocusSummaryCards'

describe('FocusSummaryCards', () => {
  it('shows this year\'s total minutes, current streak, and average minutes per recorded day within the given year', () => {
    const history = {
      version: 1,
      days: {
        '2026-08-23': { count: 1, minutes: 25, growthMilestoneStageKey: null },
        '2026-08-24': { count: 2, minutes: 75, growthMilestoneStageKey: null },
      },
    }
    const streak = { currentStreak: 3, lastCompletedDate: '2026-08-24', milestonesReached: [] }

    render(<FocusSummaryCards history={history} streak={streak} year={2026} lifetimeFocusMinutes={999} />)

    expect(screen.getByText('100')).toBeInTheDocument() // this year's total minutes: 25+75
    expect(screen.getByText('3')).toBeInTheDocument() // current streak
    expect(screen.getByText('50')).toBeInTheDocument() // average: 100/2 days
  })

  it('shows 0 average when there is no recorded history yet', () => {
    render(
      <FocusSummaryCards
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
        year={2026}
        lifetimeFocusMinutes={0}
      />,
    )
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(3) // this year's total, average, and lifetime total all 0
  })

  it('only counts days within the selected year toward this year\'s total, ignoring other years', () => {
    const history = {
      version: 1,
      days: {
        '2025-12-31': { count: 1, minutes: 400, growthMilestoneStageKey: null },
        '2026-01-01': { count: 1, minutes: 25, growthMilestoneStageKey: null },
      },
    }
    const streak = { currentStreak: 5, lastCompletedDate: '2026-01-01', milestonesReached: [] }

    render(<FocusSummaryCards history={history} streak={streak} year={2026} lifetimeFocusMinutes={425} />)

    // only the 2026 day counts toward this year's total/average - both happen to equal 25 here
    expect(screen.getAllByText('25')).toHaveLength(2)
    expect(screen.getByText('5')).toBeInTheDocument() // current streak is unaffected by the year filter
    // lifetime total (425 = 400 + 25) is unaffected by the year filter, unlike this year's total
    expect(screen.getByText('425')).toBeInTheDocument()
  })

  it('shows the true lifetime total, not this year\'s total, in the "總累計分鐘" card', () => {
    const history = { version: 1, days: { '2026-01-01': { count: 1, minutes: 25, growthMilestoneStageKey: null } } }
    const streak = { currentStreak: 1, lastCompletedDate: '2026-01-01', milestonesReached: [] }

    render(<FocusSummaryCards history={history} streak={streak} year={2026} lifetimeFocusMinutes={5000} />)

    expect(screen.getByText('5000')).toBeInTheDocument()
  })
})
