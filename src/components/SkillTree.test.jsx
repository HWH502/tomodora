import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SkillTree from './SkillTree'
import { defaultOwnerSkillTree } from '../utils/ownerSkillTree'

const pet = { speciesId: 'dog', breedId: 'shiba' }
const emptyProgress = { size: { small: 0, medium: 0, large: 0 }, species: { dog: 0, cat: 0 } }

function renderSkillTree(overrides = {}) {
  return render(
    <SkillTree
      ownerSkillTree={defaultOwnerSkillTree()}
      skillPoints={0}
      pet={pet}
      petProgressCounts={emptyProgress}
      onUpgradeLinear={() => {}}
      onUpgradeSpecialization={() => {}}
      onUnlockSingle={() => {}}
      {...overrides}
    />,
  )
}

describe('SkillTree', () => {
  it('shows a page title next to the skill-points chip', () => {
    renderSkillTree()
    expect(screen.getByText('技能樹')).toBeInTheDocument()
    expect(screen.getByText('可用技能點：0', { exact: false })).toBeInTheDocument()
  })

  it('shows skill points and skill tracks immediately, without needing to expand anything', () => {
    renderSkillTree()
    expect(screen.getByText('訓練技巧')).toBeInTheDocument()
    expect(screen.getByText('可用技能點：0', { exact: false })).toBeInTheDocument()
  })

  it('disables the upgrade button when skill points are insufficient', () => {
    renderSkillTree()
    expect(screen.getAllByText('升級（30 點）')[0]).toBeDisabled()
  })

  it('calls onUpgradeLinear with the track id when affordable and clicked', () => {
    const onUpgradeLinear = vi.fn()
    renderSkillTree({ skillPoints: 30, onUpgradeLinear })
    fireEvent.click(screen.getAllByText('升級（30 點）')[0])
    expect(onUpgradeLinear).toHaveBeenCalledWith('trainingTechnique')
  })

  it('shows a pet-count requirement instead of a price when a specialization track is not yet eligible', () => {
    renderSkillTree({ skillPoints: 30 })
    expect(screen.getAllByText('需養過 1 隻（目前 0）').length).toBeGreaterThan(0)
  })

  it('shows no tooltip until a skill label is hovered', () => {
    renderSkillTree()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows a plain-language benefit description in a tooltip on hover, and hides it on mouse-leave', () => {
    renderSkillTree()

    const trainingLabel = screen.getByText('訓練技巧')
    fireEvent.mouseEnter(trainingLabel)
    expect(screen.getByRole('tooltip')).toHaveTextContent('訓練技巧：讓寵物惹麻煩的機率再降低一點')

    fireEvent.mouseLeave(trainingLabel)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the tooltip on keyboard focus, and toggles it on a touch tap', () => {
    renderSkillTree()

    const trainingLabel = screen.getByText('訓練技巧')
    fireEvent.focus(trainingLabel)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.blur(trainingLabel)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    fireEvent.pointerUp(trainingLabel, { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
    fireEvent.pointerUp(trainingLabel, { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('mentions the pet-condition limitation for specialization tracks, not just for linear tracks', () => {
    renderSkillTree()

    fireEvent.mouseEnter(screen.getByText('體型專精（小型）'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('只')
  })
})
