import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PetStatus from './PetStatus'
import { SUGGESTED_PET_NAMES } from '../utils/pet'
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
  stats: { learning: 12, obedience: 5, friendliness: 17, energy: 26 },
}

const baseProps = {
  money: 0,
  skillPoints: 0,
}

function ControlledPetStatus({ onRenamePet, pet: petOverrides, ...props }) {
  const [name, setName] = useState('')
  const handleRename = (newName) => {
    setName(newName)
    onRenamePet?.(newName)
  }
  return (
    <PetStatus
      {...baseProps}
      {...props}
      pet={{ ...basePet, ...petOverrides, name }}
      onRenamePet={handleRename}
    />
  )
}

describe('PetStatus', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in editing mode when the pet has no name yet', () => {
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '' }} onRenamePet={vi.fn()} />)
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })

  it('confirms a typed name, calling onRenamePet and switching to display mode', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<ControlledPetStatus onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '小豆')
    await user.click(screen.getByText('確認'))

    expect(onRenamePet).toHaveBeenCalledWith('小豆')
    expect(screen.getByText('小豆')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('幫寵物取個名字')).not.toBeInTheDocument()
  })

  it('does not confirm a blank/whitespace-only name', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '' }} onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '   ')
    await user.click(screen.getByText('確認'))

    expect(onRenamePet).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })

  it('confirms on Enter key press', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '' }} onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '旺財{Enter}')
    expect(onRenamePet).toHaveBeenCalledWith('旺財')
  })

  it('fills the input with one of the suggested names when the dice button is clicked', async () => {
    const user = userEvent.setup()
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '' }} onRenamePet={vi.fn()} />)

    await user.click(screen.getByTitle('隨機取名'))
    const input = screen.getByPlaceholderText('幫寵物取個名字')
    expect(SUGGESTED_PET_NAMES).toContain(input.value)
  })

  it('shows the name and an edit button once a name is set, and re-enters editing mode on click', async () => {
    const user = userEvent.setup()
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '小白' }} onRenamePet={vi.fn()} />)

    expect(screen.getByText('小白')).toBeInTheDocument()
    await user.click(screen.getByTitle('修改名字'))

    expect(screen.getByPlaceholderText('幫寵物取個名字')).toHaveValue('小白')
  })

  it('shows growth stage emoji/label matching the pet species', () => {
    render(
      <PetStatus
        {...baseProps}
        pet={{ ...basePet, name: '咪咪', speciesId: 'cat', breedLabel: '布偶貓', pomodorosSinceBorn: 0 }}
        onRenamePet={vi.fn()}
      />,
    )
    expect(screen.getByText('🐱')).toBeInTheDocument()
    expect(screen.getByText('幼貓階段')).toBeInTheDocument()
  })

  it('shows all four ability stats with their values', () => {
    render(<PetStatus {...baseProps} pet={{ ...basePet, name: '小白' }} onRenamePet={vi.fn()} />)
    expect(screen.getByText(/學習力/)).toBeInTheDocument()
    expect(screen.getByText(/12/)).toBeInTheDocument()
    expect(screen.getByText(/服從度/)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument()
    expect(screen.getByText(/友善度/)).toBeInTheDocument()
    expect(screen.getByText(/17/)).toBeInTheDocument()
    expect(screen.getByText(/活力/)).toBeInTheDocument()
    expect(screen.getByText(/26/)).toBeInTheDocument()
  })

  it('renders the pet image when getPetImageUrl returns a URL', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-young.png')
    render(<ControlledPetStatus />)
    const image = screen.getByRole('img', { name: /柴犬/ })
    expect(image).toHaveAttribute('src', '/assets/dog-shiba-young.png')
  })

  it('falls back to the emoji when getPetImageUrl returns null', () => {
    getPetImageUrl.mockReturnValue(null)
    render(<ControlledPetStatus />)
    expect(screen.queryByRole('img', { name: /柴犬/ })).not.toBeInTheDocument()
    expect(screen.getByText('🐶')).toBeInTheDocument()
  })

  it('falls back to the emoji when the image fails to load at runtime', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-young.png')
    render(<ControlledPetStatus />)
    const image = screen.getByRole('img', { name: /柴犬/ })
    fireEvent.error(image)
    expect(screen.queryByRole('img', { name: /柴犬/ })).not.toBeInTheDocument()
    expect(screen.getByText('🐶')).toBeInTheDocument()
  })
})

function makePet(overrides = {}) {
  return {
    speciesId: 'dog',
    breedId: 'shiba',
    breedLabel: '柴犬',
    personalityLabel: '穩重',
    name: '小豆',
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

describe('PetStatus phase 4 additions', () => {
  it('renders the needs bars', () => {
    render(<PetStatus pet={makePet()} money={0} skillPoints={0} onRenamePet={() => {}} onVisitVet={() => {}} />)
    expect(screen.getByText(/🍗/)).toBeInTheDocument()
  })

  it('calls onVisitVet when the vet button is clicked', () => {
    const onVisitVet = vi.fn()
    render(
      <PetStatus
        pet={makePet({ health: 30 })}
        money={100}
        skillPoints={0}
        onRenamePet={() => {}}
        onVisitVet={onVisitVet}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: /就醫/ }))
    expect(onVisitVet).toHaveBeenCalled()
  })

  it('shows a low-health hint when health is below 20', () => {
    render(<PetStatus pet={makePet({ health: 10 })} money={0} skillPoints={0} onRenamePet={() => {}} onVisitVet={() => {}} />)
    expect(screen.getByText('需要就醫')).toBeInTheDocument()
  })

  it('disables the vet button when health is at or above the eligibility threshold, even with enough money', () => {
    render(<PetStatus pet={makePet({ health: 40 })} money={1000} skillPoints={0} onRenamePet={() => {}} onVisitVet={() => {}} />)
    expect(screen.getByRole('button', { name: /就醫/ })).toBeDisabled()
  })

  it('disables the vet button when health is low but money is short', () => {
    render(<PetStatus pet={makePet({ health: 30 })} money={10} skillPoints={0} onRenamePet={() => {}} onVisitVet={() => {}} />)
    expect(screen.getByRole('button', { name: /就醫/ })).toBeDisabled()
  })
})

describe('PetStatus phase 3C additions', () => {
  it('renders the pet skills section', () => {
    render(<PetStatus pet={makePet()} money={0} skillPoints={0} onRenamePet={() => {}} onVisitVet={() => {}} />)
    expect(screen.getByRole('heading', { name: '寵物技能' })).toBeInTheDocument()
  })
})
