import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PetNeedsBars from './PetNeedsBars'

function makePet(overrides = {}) {
  return { hunger: 60, cleanliness: 55, health: 70, affection: 82, ...overrides }
}

describe('PetNeedsBars', () => {
  it('shows all four needs as labeled percentage bars', () => {
    render(<PetNeedsBars pet={makePet()} />)
    expect(screen.getByText('飽食度')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('潔淨度')).toBeInTheDocument()
    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByText('健康度')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('好感度')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('sets each bar fill width to match its percentage value', () => {
    render(<PetNeedsBars pet={makePet({ hunger: 33 })} />)
    const hungerRow = screen.getByText('飽食度').closest('.pet-needs__row')
    const fill = hungerRow.querySelector('.pet-needs__fill')
    expect(fill).toHaveStyle({ width: '33%' })
  })
})
