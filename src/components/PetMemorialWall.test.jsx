import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import PetMemorialWall from './PetMemorialWall'

describe('PetMemorialWall', () => {
  it('shows a friendly empty state when there are no memorials yet', () => {
    render(<PetMemorialWall memorials={[]} />)
    expect(screen.getByText(/還沒有寵物離開/)).toBeInTheDocument()
  })

  it('lists each memorial with name, days with owner, and a departure-reason label', () => {
    render(
      <PetMemorialWall
        memorials={[
          {
            name: '小豆',
            breedLabel: '柴犬',
            daysWithOwner: 12,
            highestGrowthStageLabel: '稱職夥伴',
            departureReason: 'health',
          },
          {
            name: '可樂',
            breedLabel: '美短',
            daysWithOwner: 3,
            highestGrowthStageLabel: '幼貓階段',
            departureReason: 'affection',
          },
        ]}
      />,
    )
    expect(screen.getByText('小豆')).toBeInTheDocument()
    expect(screen.getByText('病逝')).toBeInTheDocument()
    expect(screen.getByText('可樂')).toBeInTheDocument()
    expect(screen.getByText('離家出走')).toBeInTheDocument()
  })
})
