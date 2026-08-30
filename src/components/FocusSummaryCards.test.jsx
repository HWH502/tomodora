import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FocusSummaryCards from './FocusSummaryCards'

describe('FocusSummaryCards', () => {
  it('shows today\'s minutes, this week\'s minutes, and the current streak', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const history = { version: 1, days: { [`${y}-${m}-${d}`]: { count: 1, minutes: 25, growthMilestoneStageKey: null } } }
    const streak = { currentStreak: 3, lastCompletedDate: `${y}-${m}-${d}`, milestonesReached: [] }

    render(<FocusSummaryCards history={history} streak={streak} />)

    expect(screen.getByText('今日專注')).toBeInTheDocument()
    // Today's only entry is today, so today's total and this week's total are both 25 minutes.
    expect(screen.getAllByText('25 分鐘')).toHaveLength(2)
    expect(screen.getByText('本週專注')).toBeInTheDocument()
    expect(screen.getByText('連續天數')).toBeInTheDocument()
    expect(screen.getByText('3 天')).toBeInTheDocument()
  })

  it('shows the week-over-week percent change when last week has data', () => {
    const history = {
      version: 1,
      days: {
        '2026-08-17': { count: 1, minutes: 100, growthMilestoneStageKey: null },
        '2026-08-24': { count: 1, minutes: 112, growthMilestoneStageKey: null },
      },
    }
    const streak = { currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }

    // Freeze "today" inside this week so the this-week/last-week comparison is deterministic.
    const originalDate = Date
    class FixedDate extends Date {
      constructor(...args) {
        if (args.length === 0) return new originalDate(2026, 7, 26)
        return new originalDate(...args)
      }
    }
    global.Date = FixedDate
    try {
      render(<FocusSummaryCards history={history} streak={streak} />)
      expect(screen.getByText('較上週 +12%')).toBeInTheDocument()
    } finally {
      global.Date = originalDate
    }
  })

  it('omits the week-over-week line when last week has no data', () => {
    render(
      <FocusSummaryCards
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 0, lastCompletedDate: null, milestonesReached: [] }}
      />,
    )
    expect(screen.queryByText(/較上週/)).not.toBeInTheDocument()
  })

  it('shows the streak card by default', () => {
    render(
      <FocusSummaryCards
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 2, lastCompletedDate: null, milestonesReached: [] }}
      />,
    )
    expect(screen.getByText('連續天數')).toBeInTheDocument()
  })

  it('omits the streak card when showStreakCard is false', () => {
    render(
      <FocusSummaryCards
        history={{ version: 1, days: {} }}
        streak={{ currentStreak: 2, lastCompletedDate: null, milestonesReached: [] }}
        showStreakCard={false}
      />,
    )
    expect(screen.queryByText('連續天數')).not.toBeInTheDocument()
  })
})
