import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PetPortrait from './PetPortrait'
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
  name: '小白',
  hunger: 82,
  cleanliness: 68,
  health: 90,
  affection: 91,
}

describe('PetPortrait', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in editing mode when the pet has no name yet', () => {
    render(<PetPortrait pet={{ ...basePet, name: '' }} onRenamePet={vi.fn()} />)
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })

  it('confirms a typed name, calling onRenamePet and switching to display mode', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<PetPortrait pet={{ ...basePet, name: '' }} onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '小豆')
    await user.click(screen.getByText('確認'))

    expect(onRenamePet).toHaveBeenCalledWith('小豆')
    expect(screen.queryByPlaceholderText('幫寵物取個名字')).not.toBeInTheDocument()
  })

  it('does not confirm a blank/whitespace-only name', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<PetPortrait pet={{ ...basePet, name: '' }} onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '   ')
    await user.click(screen.getByText('確認'))

    expect(onRenamePet).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toBeInTheDocument()
  })

  it('fills the input with one of the suggested names when the dice button is clicked', async () => {
    const user = userEvent.setup()
    render(<PetPortrait pet={{ ...basePet, name: '' }} onRenamePet={vi.fn()} />)

    await user.click(screen.getByTitle('隨機取名'))
    const input = screen.getByPlaceholderText('幫寵物取個名字')
    expect(SUGGESTED_PET_NAMES).toContain(input.value)
  })

  it('shows the name with an edit button once a name is set, and re-enters editing mode on click', async () => {
    const user = userEvent.setup()
    render(<PetPortrait pet={basePet} onRenamePet={vi.fn()} />)

    expect(screen.getByText('小白')).toBeInTheDocument()
    await user.click(screen.getByTitle('修改名字'))
    expect(screen.getByPlaceholderText('幫寵物取個名字')).toHaveValue('小白')
  })

  it('shows growth stage, breed, and personality in one chip', () => {
    render(
      <PetPortrait
        pet={{ ...basePet, speciesId: 'cat', breedLabel: '布偶貓', pomodorosSinceBorn: 0 }}
        onRenamePet={vi.fn()}
      />,
    )
    expect(screen.getByText(/幼貓階段/)).toBeInTheDocument()
    expect(screen.getByText(/布偶貓/)).toBeInTheDocument()
  })

  it('shows the mood chip resolved from determineMood', () => {
    render(<PetPortrait pet={{ ...basePet, health: 10 }} onRenamePet={vi.fn()} />)
    expect(screen.getByText('生病', { exact: false })).toBeInTheDocument()
  })

  it('plays the pat animation and shows hearts briefly when the avatar is clicked, without calling any callback', () => {
    vi.useFakeTimers()
    render(<PetPortrait pet={basePet} onRenamePet={vi.fn()} />)

    const avatarButton = screen.getByRole('button', { name: /摸摸/ })
    expect(screen.queryByTestId('pet-portrait-hearts')).not.toBeInTheDocument()

    act(() => {
      fireEvent.click(avatarButton)
    })
    expect(screen.getByTestId('pet-portrait-hearts')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.queryByTestId('pet-portrait-hearts')).not.toBeInTheDocument()

    vi.useRealTimers()
  })


  it(
    'renders the pet image when getPetImageUrl returns a URL, and falls back to the emoji on load error',
    () => {
      getPetImageUrl.mockReturnValue('/assets/dog-shiba-young.png')
      render(<PetPortrait pet={basePet} onRenamePet={vi.fn()} />)

      const image = screen.getByRole('img', { name: '柴犬' })
      expect(image).toHaveAttribute('src', '/assets/dog-shiba-young.png')

      fireEvent.error(image)
      expect(screen.queryByRole('img', { name: '柴犬' })).not.toBeInTheDocument()
    },
    10000,
  )

  it('recovers the image once a new (valid) image URL comes in after an earlier failure, instead of staying stuck on the emoji', () => {
    getPetImageUrl.mockReturnValue('/assets/dog-shiba-young.png')
    const { rerender } = render(<PetPortrait pet={basePet} onRenamePet={vi.fn()} />)
    fireEvent.error(screen.getByRole('img', { name: '柴犬' }))
    expect(screen.getByText('🐶')).toBeInTheDocument()

    getPetImageUrl.mockReturnValue('/assets/dog-shiba-growing.png')
    rerender(<PetPortrait pet={{ ...basePet, pomodorosSinceBorn: 10 }} onRenamePet={vi.fn()} />)

    const image = screen.getByRole('img', { name: '柴犬' })
    expect(image).toHaveAttribute('src', '/assets/dog-shiba-growing.png')
  })

  it('confirms on Enter key press', async () => {
    const user = userEvent.setup()
    const onRenamePet = vi.fn()
    render(<PetPortrait pet={{ ...basePet, name: '' }} onRenamePet={onRenamePet} />)

    await user.type(screen.getByPlaceholderText('幫寵物取個名字'), '旺財{Enter}')
    expect(onRenamePet).toHaveBeenCalledWith('旺財')
  })

})
