import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PetHomeCard from './PetHomeCard'
import { getPetImageUrl } from '../utils/petImages'

vi.mock('../utils/petImages', () => ({
  getPetImageUrl: vi.fn(),
}))

const basePet = {
  speciesId: 'dog',
  breedId: 'shiba',
  breedLabel: '柴犬',
  personalityLabel: '穩重',
  pomodorosSinceBorn: 0,
  name: '小橘',
  stats: { learning: 12, obedience: 5, friendliness: 17, energy: 26 },
  hunger: 82,
  cleanliness: 68,
  health: 90,
  affection: 91,
}

describe('PetHomeCard', () => {
  it('shows the pet name, stat chips, and need percentages', () => {
    render(<PetHomeCard pet={basePet} />)
    expect(screen.getByText('小橘')).toBeInTheDocument()
    expect(screen.getByText('學習力 12')).toBeInTheDocument()
    expect(screen.getByText('服從度 5')).toBeInTheDocument()
    expect(screen.getByText('友善度 17')).toBeInTheDocument()
    expect(screen.getByText('活力 26')).toBeInTheDocument()
    expect(screen.getByText('82%')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
    expect(screen.getByText('91%')).toBeInTheDocument()
  })

  it('labels the affection need bar as 好感度, not 心情', () => {
    render(<PetHomeCard pet={basePet} />)
    expect(screen.getByText('好感度')).toBeInTheDocument()
    expect(screen.queryByText('心情')).not.toBeInTheDocument()
  })

  it('shows the happy mood chip for a healthy, well-fed, clean pet', () => {
    render(<PetHomeCard pet={basePet} />)
    expect(screen.getByText('開心', { exact: false })).toBeInTheDocument()
  })

  it('plays the pat animation and shows hearts briefly when the avatar is clicked, without calling any pet-mutating callback', () => {
    vi.useFakeTimers()
    render(<PetHomeCard pet={basePet} />)

    const avatarButton = screen.getByRole('button', { name: /摸摸/ })
    expect(screen.queryByTestId('pet-home-card-hearts')).not.toBeInTheDocument()

    fireEvent.click(avatarButton)
    expect(screen.getByTestId('pet-home-card-hearts')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.queryByTestId('pet-home-card-hearts')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('falls back to the growth-stage emoji when the pet image fails to load', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-young.png')
    render(<PetHomeCard pet={basePet} />)
    const img = screen.getByAltText('柴犬')
    act(() => {
      img.dispatchEvent(new Event('error'))
    })
    expect(screen.queryByAltText('柴犬')).not.toBeInTheDocument()
  })

  it('wraps the avatar, name, and chips in a tiltable cluster', () => {
    render(<PetHomeCard pet={basePet} />)
    const avatarButton = screen.getByRole('button', { name: /摸摸/ })
    expect(avatarButton.closest('.pet-home-card__avatar-cluster')).toBeInTheDocument()
  })
})
