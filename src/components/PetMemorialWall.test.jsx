import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PetMemorialWall from './PetMemorialWall'
import { getPetImageUrl } from '../utils/petImages'

vi.mock('../utils/petImages', () => ({
  getPetImageUrl: vi.fn(),
}))

function makeMemorial(overrides = {}) {
  return {
    name: '小豆',
    speciesId: 'dog',
    breedId: 'shiba',
    daysWithOwner: 128,
    highestGrowthStageLabel: '資深老友',
    departureReason: 'replaced',
    ...overrides,
  }
}

describe('PetMemorialWall', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a friendly empty state when there are no memorials yet', () => {
    render(<PetMemorialWall memorials={[]} />)
    expect(screen.getByText(/還沒有寵物離開/)).toBeInTheDocument()
  })

  it('shows each memorial with name, a combined days/stage chip, and the warm departure note', () => {
    render(
      <PetMemorialWall
        memorials={[
          makeMemorial({ name: '小豆', departureReason: 'health', daysWithOwner: 22, highestGrowthStageLabel: '稱職夥伴' }),
          makeMemorial({ name: '可樂', speciesId: 'cat', breedId: 'american-shorthair', departureReason: 'affection', daysWithOwner: 5, highestGrowthStageLabel: '幼貓階段' }),
        ]}
      />,
    )
    expect(screen.getByText('小豆')).toBeInTheDocument()
    expect(screen.getByText('陪伴 22 天 · 稱職夥伴')).toBeInTheDocument()
    expect(screen.getByText('後來生病離開了。')).toBeInTheDocument()

    expect(screen.getByText('可樂')).toBeInTheDocument()
    expect(screen.getByText('陪伴 5 天 · 幼貓階段')).toBeInTheDocument()
    expect(screen.getByText('後來離開去別的地方了。')).toBeInTheDocument()
  })

  it('falls back to a generic note ending for an unrecognized departure reason', () => {
    render(<PetMemorialWall memorials={[makeMemorial({ departureReason: 'unknown' })]} />)
    expect(screen.getByText('後來離開了。')).toBeInTheDocument()
  })

  it('shows the real pet image at the exact stage it reached, when available', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-senior.png')
    render(<PetMemorialWall memorials={[makeMemorial()]} />)

    expect(getPetImageUrl).toHaveBeenCalledWith('dog', 'shiba', 'senior')
    const image = screen.getByRole('img', { name: '小豆' })
    expect(image).toHaveAttribute('src', '/assets/dog-shiba-senior.png')
  })

  it('falls back to the stage emoji when there is no image', () => {
    getPetImageUrl.mockReturnValue(null)
    render(<PetMemorialWall memorials={[makeMemorial()]} />)
    expect(screen.queryByRole('img', { name: '小豆' })).not.toBeInTheDocument()
    expect(screen.getByText('🐩')).toBeInTheDocument()
  })

  it('falls back to the stage emoji when the image fails to load', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-senior.png')
    render(<PetMemorialWall memorials={[makeMemorial({ name: '旺財' })]} />)
    fireEvent.error(screen.getByRole('img', { name: '旺財' }))
    expect(screen.queryByRole('img', { name: '旺財' })).not.toBeInTheDocument()
    expect(screen.getByText('🐩')).toBeInTheDocument()
  })

  it('falls back to a generic paw emoji when the stage label cannot be resolved', () => {
    render(<PetMemorialWall memorials={[makeMemorial({ highestGrowthStageLabel: '未知階段' })]} />)
    expect(screen.getByText('🐾')).toBeInTheDocument()
  })
})
