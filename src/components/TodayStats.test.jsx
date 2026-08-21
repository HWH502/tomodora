import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import TodayStats from './TodayStats'

describe('TodayStats', () => {
  it('renders the completed count inside the surrounding text', () => {
    render(<TodayStats completedToday={4} />)
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(
      screen.getByText(
        (_, element) => element.tagName === 'P' && element.textContent === '今天已完成 4 個番茄鐘',
      ),
    ).toBeInTheDocument()
  })
})
