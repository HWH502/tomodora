import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PetStatsCard from './PetStatsCard'

describe('PetStatsCard', () => {
  it('shows all four ability stats with their values', () => {
    render(<PetStatsCard stats={{ learning: 12, obedience: 5, friendliness: 17, energy: 26 }} />)
    expect(screen.getByText('學習力')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('服從度')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('友善度')).toBeInTheDocument()
    expect(screen.getByText('17')).toBeInTheDocument()
    expect(screen.getByText('活力')).toBeInTheDocument()
    expect(screen.getByText('26')).toBeInTheDocument()
  })
})
