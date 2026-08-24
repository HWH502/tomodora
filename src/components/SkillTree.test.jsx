import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SkillTree from './SkillTree'
import { defaultOwnerSkillTree } from '../utils/ownerSkillTree'

const pet = { speciesId: 'dog', breedId: 'shiba' }
const emptyProgress = { size: { small: 0, medium: 0, large: 0 }, species: { dog: 0, cat: 0, rodent: 0 } }

describe('SkillTree', () => {
  it('is collapsed by default and expands on click', () => {
    render(
      <SkillTree
        ownerSkillTree={defaultOwnerSkillTree()}
        skillPoints={0}
        pet={pet}
        petProgressCounts={emptyProgress}
        onUpgradeLinear={() => {}}
        onUpgradeSpecialization={() => {}}
        onUnlockSingle={() => {}}
      />,
    )
    expect(screen.queryByText('訓練技巧')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('技能樹 ▸'))
    expect(screen.getByText('訓練技巧')).toBeInTheDocument()
  })

  it('disables the upgrade button when skill points are insufficient', () => {
    render(
      <SkillTree
        ownerSkillTree={defaultOwnerSkillTree()}
        skillPoints={0}
        pet={pet}
        petProgressCounts={emptyProgress}
        onUpgradeLinear={() => {}}
        onUpgradeSpecialization={() => {}}
        onUnlockSingle={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('技能樹 ▸'))
    expect(screen.getAllByText('升級（30 點）')[0]).toBeDisabled()
  })

  it('calls onUpgradeLinear with the track id when affordable and clicked', () => {
    const onUpgradeLinear = vi.fn()
    render(
      <SkillTree
        ownerSkillTree={defaultOwnerSkillTree()}
        skillPoints={30}
        pet={pet}
        petProgressCounts={emptyProgress}
        onUpgradeLinear={onUpgradeLinear}
        onUpgradeSpecialization={() => {}}
        onUnlockSingle={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('技能樹 ▸'))
    fireEvent.click(screen.getAllByText('升級（30 點）')[0])
    expect(onUpgradeLinear).toHaveBeenCalledWith('trainingTechnique')
  })

  it('shows a pet-count requirement instead of a price when a specialization track is not yet eligible', () => {
    render(
      <SkillTree
        ownerSkillTree={defaultOwnerSkillTree()}
        skillPoints={30}
        pet={pet}
        petProgressCounts={emptyProgress}
        onUpgradeLinear={() => {}}
        onUpgradeSpecialization={() => {}}
        onUnlockSingle={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('技能樹 ▸'))
    expect(screen.getAllByText('需養過 1 隻（目前 0）').length).toBeGreaterThan(0)
  })

  it('marks the rodent species track as having no data yet, with no upgrade button', () => {
    render(
      <SkillTree
        ownerSkillTree={defaultOwnerSkillTree()}
        skillPoints={999}
        pet={pet}
        petProgressCounts={{ size: { small: 0, medium: 0, large: 0 }, species: { dog: 0, cat: 0, rodent: 5 } }}
        onUpgradeLinear={() => {}}
        onUpgradeSpecialization={() => {}}
        onUnlockSingle={() => {}}
      />,
    )
    fireEvent.click(screen.getByText('技能樹 ▸'))
    expect(screen.getByText(/尚無資料/)).toBeInTheDocument()
  })
})
