import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PetCreation from './PetCreation'

// Mirrors src/utils/pet.js's private tables for the 'shiba' breed used in the reroll test below.
// Kept here rather than exported from pet.js so production code stays untouched.
const SHIBA_BASE_STATS = { learning: 12, obedience: 5, friendliness: 17, energy: 26 }
const PERSONALITY_STAT_MODIFIERS = {
  黏人: { learning: 3, obedience: 6, friendliness: 12, energy: 4 },
  獨立: { learning: 6, obedience: 3, friendliness: 4, energy: 12 },
  愛玩: { learning: 3, obedience: 3, friendliness: 9, energy: 10 },
  穩重: { learning: 5, obedience: 12, friendliness: 4, energy: 4 },
  機靈: { learning: 12, obedience: 5, friendliness: 4, energy: 4 },
  溫柔: { learning: 4, obedience: 9, friendliness: 8, energy: 4 },
}
const STAT_LABELS = { learning: '學習力', obedience: '服從度', friendliness: '友善度', energy: '活力' }

function readPreviewStats() {
  const stats = {}
  Object.entries(STAT_LABELS).forEach(([key, label]) => {
    const node = screen.getByText(new RegExp(`^${label} \\d+$`))
    stats[key] = Number(node.textContent.replace(label, '').trim())
  })
  return stats
}

function assertStatsWithinBounds(stats, personalityLabel) {
  const modifier = PERSONALITY_STAT_MODIFIERS[personalityLabel]
  let sum = 0
  Object.keys(STAT_LABELS).forEach((key) => {
    const min = SHIBA_BASE_STATS[key] + modifier[key]
    const max = min + 15
    expect(stats[key]).toBeGreaterThanOrEqual(min)
    expect(stats[key]).toBeLessThanOrEqual(max)
    sum += stats[key]
  })
  expect(sum).toBe(100)
}

describe('PetCreation', () => {
  it('renders a button for every species, and no breeds until one is picked', () => {
    render(<PetCreation onCreatePet={vi.fn()} />)
    expect(screen.getByText('狗')).toBeInTheDocument()
    expect(screen.getByText('貓')).toBeInTheDocument()
    expect(screen.queryByText('柴犬')).not.toBeInTheDocument()
  })

  it('reveals the selected species breeds after clicking it', async () => {
    const user = userEvent.setup()
    render(<PetCreation onCreatePet={vi.fn()} />)

    await user.click(screen.getByText('狗'))

    expect(screen.getByText('貴賓犬')).toBeInTheDocument()
    expect(screen.getByText('柴犬')).toBeInTheDocument()
    expect(screen.getByText('黃金獵犬')).toBeInTheDocument()
    expect(screen.queryByText('美短')).not.toBeInTheDocument()
  })

  it('switches the breed list when a different species is selected', async () => {
    const user = userEvent.setup()
    render(<PetCreation onCreatePet={vi.fn()} />)

    await user.click(screen.getByText('狗'))
    expect(screen.getByText('柴犬')).toBeInTheDocument()

    await user.click(screen.getByText('貓'))
    expect(screen.queryByText('柴犬')).not.toBeInTheDocument()
    expect(screen.getByText('美短')).toBeInTheDocument()
  })

  it('shows a stats preview after picking a breed, without calling onCreatePet yet', async () => {
    const user = userEvent.setup()
    const onCreatePet = vi.fn()
    render(<PetCreation onCreatePet={onCreatePet} />)

    await user.click(screen.getByText('貓'))
    await user.click(screen.getByText('布偶貓'))

    expect(screen.getByText('就是這隻！')).toBeInTheDocument()
    expect(onCreatePet).not.toHaveBeenCalled()
  })

  it('calls onCreatePet with species, breed, personality, and stats summing to 100 on confirm', async () => {
    const user = userEvent.setup()
    const onCreatePet = vi.fn()
    render(<PetCreation onCreatePet={onCreatePet} />)

    await user.click(screen.getByText('貓'))
    await user.click(screen.getByText('布偶貓'))
    await user.click(screen.getByText('就是這隻！'))

    expect(onCreatePet).toHaveBeenCalledTimes(1)
    const [speciesId, breedId, personalityLabel, stats] = onCreatePet.mock.calls[0]
    expect(speciesId).toBe('cat')
    expect(breedId).toBe('ragdoll')
    expect(typeof personalityLabel).toBe('string')
    expect(stats.learning + stats.obedience + stats.friendliness + stats.energy).toBe(100)
  })

  it('rerolling changes the stats but keeps species/breed/personality fixed, up to 3 times', async () => {
    const user = userEvent.setup()
    render(<PetCreation onCreatePet={vi.fn()} />)

    await user.click(screen.getByText('狗'))
    await user.click(screen.getByText('柴犬'))

    const infoBefore = screen.getByText(/柴犬 ·/).textContent
    const personalityLabel = infoBefore.split(' · ')[1]
    const rerollButton = () => screen.getByRole('button', { name: /重骰能力值/ })

    const statsSeen = [readPreviewStats()]
    assertStatsWithinBounds(statsSeen[0], personalityLabel)

    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(rerollButton())
      expect(screen.getByText(/柴犬 ·/).textContent).toBe(infoBefore)
      const stats = readPreviewStats()
      assertStatsWithinBounds(stats, personalityLabel)
      statsSeen.push(stats)
    }

    expect(rerollButton()).toBeDisabled()
    // At least one reroll should have produced a different stat spread than the initial roll.
    const allIdentical = statsSeen.every((stats) => JSON.stringify(stats) === JSON.stringify(statsSeen[0]))
    expect(allIdentical).toBe(false)
  })

  it('going back to the species/breed picker resets the preview', async () => {
    const user = userEvent.setup()
    render(<PetCreation onCreatePet={vi.fn()} />)

    await user.click(screen.getByText('狗'))
    await user.click(screen.getByText('柴犬'))
    await user.click(screen.getByText('重新選擇'))

    expect(screen.getByText('選擇你的第一隻寵物')).toBeInTheDocument()
  })
})
