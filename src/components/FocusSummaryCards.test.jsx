import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusSummaryCards from './FocusSummaryCards'

describe('FocusSummaryCards', () => {
  it('shows total minutes, current streak, and average minutes per recorded day', () => {
    const history = {
      version: 1,
      days: {
        '2026-08-23': { count: 1, minutes: 25, growthMilestoneStageKey: null },
        '2026-08-24': { count: 2, minutes: 75, growthMilestoneStageKey: null },
      },
    }
    const streak = { currentStreak: 3, lastCompletedDate: '2026-08-24', milestonesReached: [] }

    render(<FocusSummaryCards history={history} streak={streak} />)

    expect(screen.getByText('100')).toBeInTheDocument() // total minutes: 25+75
    expect(screen.getByText('3')).toBeInTheDocument() // current streak
    expect(screen.getByText('50')).toBeInTheDocument() // average: 100/2 days
  })

  it('shows 0 average when there is no recorded history yet', () => {
    render(<FocusSummaryCards history={{ version: 1, days: {} }} streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }} />)
    expect(screen.getAllByText('0').length).toBeGreaterThanOrEqual(2) // total minutes and average both 0
  })
})
