import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Timer from './Timer'

describe('Timer', () => {
  it.each([
    ['work', '工作時間'],
    ['shortBreak', '短休息'],
    ['longBreak', '長休息'],
  ])('shows the correct label for phase=%s', (phase, label) => {
    render(<Timer phase={phase} secondsLeft={0} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it.each([
    [1500, '25:00'],
    [65, '01:05'],
    [5, '00:05'],
    [0, '00:00'],
  ])('formats %i seconds as %s', (secondsLeft, formatted) => {
    render(<Timer phase="work" secondsLeft={secondsLeft} />)
    expect(screen.getByText(formatted)).toBeInTheDocument()
  })
})

describe('round display', () => {
  it('shows the round count when both currentRound and totalRounds are given', () => {
    render(<Timer phase="work" secondsLeft={100} totalSeconds={1500} currentRound={2} totalRounds={4} />)
    expect(screen.getByText('第 2 / 4 輪')).toBeInTheDocument()
  })

  it('renders no round text when currentRound/totalRounds are omitted', () => {
    render(<Timer phase="work" secondsLeft={0} />)
    expect(screen.queryByText(/第 .* 輪/)).not.toBeInTheDocument()
  })
})

describe('progress ring', () => {
  it('sets the ring to 0% progress at the very start of a phase', () => {
    render(<Timer phase="work" secondsLeft={1500} totalSeconds={1500} />)
    const ring = screen.getByTestId('timer-ring-progress')
    expect(ring).toHaveStyle({ '--timer-progress': '0%' })
  })

  it('sets the ring further along as secondsLeft decreases', () => {
    render(<Timer phase="work" secondsLeft={750} totalSeconds={1500} />)
    const ring = screen.getByTestId('timer-ring-progress')
    expect(ring).toHaveStyle({ '--timer-progress': '50%' })
  })

  it('does not divide by zero when totalSeconds is 0', () => {
    render(<Timer phase="work" secondsLeft={0} totalSeconds={0} />)
    const ring = screen.getByTestId('timer-ring-progress')
    expect(ring).toHaveStyle({ '--timer-progress': '0%' })
  })
})
