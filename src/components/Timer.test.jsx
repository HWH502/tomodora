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
