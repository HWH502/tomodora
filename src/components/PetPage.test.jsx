import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PetPage from './PetPage'

function makePet(overrides = {}) {
  return {
    speciesId: 'dog',
    breedId: 'shiba',
    breedLabel: '柴犬',
    personalityLabel: '穩重',
    name: '小豆',
    bornAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    pomodorosSinceBorn: 0,
    stats: { learning: 10, obedience: 10, friendliness: 10, energy: 10 },
    hunger: 60,
    cleanliness: 60,
    health: 60,
    affection: 60,
    recentEvents: [],
    ...overrides,
  }
}

const baseProps = {
  money: 0,
  onRenamePet: vi.fn(),
  onVisitVet: vi.fn(),
  onCreatePet: vi.fn(),
  petMemorials: [],
}

describe('PetPage', () => {
  it('shows the pet-creation onboarding when there is no pet yet', () => {
    render(<PetPage {...baseProps} pet={null} />)
    expect(screen.getByText('選擇你的第一隻寵物')).toBeInTheDocument()
  })

  it('shows the days-with-owner count computed from bornAt', () => {
    render(<PetPage {...baseProps} pet={makePet()} />)
    expect(screen.getByText('陪伴 3 天')).toBeInTheDocument()
  })

  it('shows portrait, stats, needs bars, and skills on the 總覽 tab by default', () => {
    render(<PetPage {...baseProps} pet={makePet()} />)
    expect(screen.getByText('小豆')).toBeInTheDocument()
    expect(screen.getByText('學習力')).toBeInTheDocument()
    expect(screen.getByText('飽食度')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '寵物技能' })).toBeInTheDocument()
  })

  it('calls onVisitVet when the vet button is clicked and eligible', () => {
    const onVisitVet = vi.fn()
    render(<PetPage {...baseProps} pet={makePet({ health: 30 })} money={100} onVisitVet={onVisitVet} />)
    fireEvent.click(screen.getByRole('button', { name: /就醫/ }))
    expect(onVisitVet).toHaveBeenCalled()
  })

  it('disables the vet button when health is at or above the eligibility threshold, even with enough money', () => {
    render(<PetPage {...baseProps} pet={makePet({ health: 40 })} money={1000} />)
    expect(screen.getByRole('button', { name: /就醫/ })).toBeDisabled()
  })

  it('disables the vet button when health is low but money is short', () => {
    render(<PetPage {...baseProps} pet={makePet({ health: 30 })} money={10} />)
    expect(screen.getByRole('button', { name: /就醫/ })).toBeDisabled()
  })

  it('shows a low-health hint when health is below 20', () => {
    render(<PetPage {...baseProps} pet={makePet({ health: 10 })} />)
    expect(screen.getByText('需要就醫')).toBeInTheDocument()
  })

  it('switches to the 紀念牆 tab: header becomes 紀念牆, memorial content shows, 總覽 content hides', () => {
    render(
      <PetPage
        {...baseProps}
        pet={makePet()}
        petMemorials={[
          {
            name: '旺財',
            speciesId: 'dog',
            breedId: 'shiba',
            daysWithOwner: 40,
            highestGrowthStageLabel: '訓練有成',
            departureReason: 'health',
          },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('tab', { name: '紀念牆' }))

    // Both the header title and the tab button read "紀念牆" once this tab is active.
    expect(screen.getAllByText('紀念牆')).toHaveLength(2)
    expect(screen.getByText('曾經陪伴過 1 段旅程')).toBeInTheDocument()
    expect(screen.getByText('旺財')).toBeInTheDocument()
    expect(screen.queryByText('飽食度')).not.toBeInTheDocument()
  })

  it('shows the 我的寵物 header again after switching back to 總覽', () => {
    render(<PetPage {...baseProps} pet={makePet()} />)

    fireEvent.click(screen.getByRole('tab', { name: '紀念牆' }))
    fireEvent.click(screen.getByRole('tab', { name: '總覽' }))

    expect(screen.getByText('我的寵物')).toBeInTheDocument()
    expect(screen.getByText('陪伴 3 天')).toBeInTheDocument()
  })
})
