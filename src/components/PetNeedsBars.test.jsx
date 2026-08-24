import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PetNeedsBars from './PetNeedsBars'

function makePet(overrides = {}) {
  return { hunger: 60, cleanliness: 60, health: 60, affection: 60, ...overrides }
}

describe('PetNeedsBars', () => {
  it('shows all four indicator numbers', () => {
    render(<PetNeedsBars pet={makePet()} />)
    expect(screen.getByText(/🍗/)).toHaveTextContent('60')
    expect(screen.getByText(/🛁/)).toHaveTextContent('60')
    expect(screen.getByText(/💊/)).toHaveTextContent('60')
    expect(screen.getByText(/😍/)).toHaveTextContent('60')
  })

  it('shows the mood label resolved from determineMood', () => {
    render(<PetNeedsBars pet={makePet({ health: 10 })} />)
    expect(screen.getByText('生病')).toBeInTheDocument()
  })
})
