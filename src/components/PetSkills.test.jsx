import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PetSkills from './PetSkills'
import { getPetSkillIconUrl } from '../utils/petSkillIcons'

vi.mock('../utils/petSkillIcons', () => ({
  getPetSkillIconUrl: vi.fn(),
}))

function makePet(overrides = {}) {
  return {
    speciesId: 'dog',
    pomodorosSinceBorn: 0,
    stats: { learning: 0, obedience: 0, friendliness: 0, energy: 0 },
    ...overrides,
  }
}

describe('PetSkills', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the skill badges directly, with no expand/collapse step', () => {
    render(<PetSkills pet={makePet()} />)
    expect(screen.getByRole('heading', { name: '寵物技能' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '乖乖坐下' })).toBeInTheDocument()
  })

  it('shows species-specific skill badges before common skill badges', () => {
    render(<PetSkills pet={makePet()} />)

    const names = screen.getAllByTestId('pet-skill-badge').map((el) => el.getAttribute('aria-label'))
    // 狗的 5 個技能（依門檻由低到高）在前，接著才是共通的 4 個技能
    expect(names).toEqual([
      '乖乖坐下',
      '上廁所',
      '自得其樂',
      '看家',
      '討好賣萌',
      '健壯體質',
      '節省飲食',
      '老手',
      '幸運星',
    ])
  })

  it('does not render group headings — skills are listed in one flat row', () => {
    render(<PetSkills pet={makePet()} />)

    expect(screen.queryByText('品種專屬技能')).not.toBeInTheDocument()
    expect(screen.queryByText('共通技能')).not.toBeInTheDocument()
  })

  it('renders the cat skill pool for a cat', () => {
    render(<PetSkills pet={makePet({ speciesId: 'cat' })} />)
    expect(screen.getByRole('button', { name: '磨爪不搗蛋' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '乖乖坐下' })).not.toBeInTheDocument()
  })

  it('marks an unlocked skill badge as not locked, and a locked one as locked', () => {
    // learning 0、pomodorosSinceBorn 10 → progress = 10，達到門檻 8 的「乖乖坐下」，但不到門檻 20 的「上廁所」
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    expect(screen.getByRole('button', { name: '乖乖坐下' })).not.toHaveClass('pet-skills__badge--locked')
    expect(screen.getByRole('button', { name: '上廁所' })).toHaveClass('pet-skills__badge--locked')
  })

  it('shows no tooltip text until the badge is hovered, focused, or clicked', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the skill name and effect description in a tooltip on hover for an unlocked skill, and hides it again on mouse-leave', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.mouseEnter(sitBadge)
    expect(screen.getByRole('tooltip')).toHaveTextContent('乖乖坐下：讓寵物惹麻煩的機率再降低一點')

    fireEvent.mouseLeave(sitBadge)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('shows the skill name and threshold (not the effect) in a tooltip on hover for a locked skill', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 0 })} />)

    const pottyBadge = screen.getByRole('button', { name: '上廁所' })
    fireEvent.mouseEnter(pottyBadge)
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('上廁所：門檻：20')
    expect(tooltip).not.toHaveTextContent('讓潔淨度掉得比較慢')
  })

  it('shows the tooltip on focus (keyboard) as well as on hover', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.focus(sitBadge)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.blur(sitBadge)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('toggles the tooltip open and closed on a touch tap (pointerType touch), for devices without hover', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.pointerUp(sitBadge, { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toBeInTheDocument()

    fireEvent.pointerUp(sitBadge, { pointerType: 'touch' })
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('switches the open tooltip when a different badge is tapped', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    fireEvent.pointerUp(screen.getByRole('button', { name: '乖乖坐下' }), { pointerType: 'touch' })
    expect(screen.getByRole('tooltip')).toHaveTextContent('乖乖坐下：讓寵物惹麻煩的機率再降低一點')

    fireEvent.pointerUp(screen.getByRole('button', { name: '上廁所' }), { pointerType: 'touch' })
    expect(screen.getAllByRole('tooltip')).toHaveLength(1)
    expect(screen.getByRole('tooltip')).toHaveTextContent('上廁所：門檻：20')
  })

  it('does not close the tooltip on a mouse click right after hover opened it (real browsers fire mouseenter before click)', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.mouseEnter(sitBadge)
    fireEvent.pointerUp(sitBadge, { pointerType: 'mouse' })
    fireEvent.click(sitBadge)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('does not close the tooltip on keyboard activation right after focus opened it', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.focus(sitBadge)
    fireEvent.click(sitBadge)
    expect(screen.getByRole('tooltip')).toBeInTheDocument()
  })

  it('ignores a mouseenter that fires immediately after a touch tap closed the tooltip (guards against a browser replaying a synthetic mouseenter after a tap)', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    fireEvent.pointerUp(sitBadge, { pointerType: 'touch' }) // opens
    fireEvent.pointerUp(sitBadge, { pointerType: 'touch' }) // closes
    fireEvent.mouseEnter(sitBadge) // a browser-replayed synthetic hover, right after the tap
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('associates the open tooltip with the badge via aria-describedby for assistive tech', () => {
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    expect(sitBadge).not.toHaveAttribute('aria-describedby')

    fireEvent.focus(sitBadge)
    const tooltip = screen.getByRole('tooltip')
    expect(sitBadge).toHaveAttribute('aria-describedby', tooltip.id)
  })

  it('renders the per-skill icon image when one exists', () => {
    getPetSkillIconUrl.mockImplementation((skillId) => (skillId === 'sit' ? '/assets/skills/sit.png' : null))
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    const icon = sitBadge.querySelector('img.pet-skills__badge-icon')
    expect(icon).toHaveAttribute('src', '/assets/skills/sit.png')
  })

  it('falls back to a placeholder icon when no per-skill icon exists', () => {
    getPetSkillIconUrl.mockReturnValue(null)
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 10 })} />)

    const sitBadge = screen.getByRole('button', { name: '乖乖坐下' })
    expect(sitBadge.querySelector('img.pet-skills__badge-icon')).not.toBeInTheDocument()
    expect(sitBadge.querySelector('.pet-skills__badge-icon--placeholder')).toBeInTheDocument()
  })

  it('renders a realistic mixed-state pet: some skills unlocked in each group, some still locked', () => {
    // learning 0 → progress === pomodorosSinceBorn === 25
    // 狗技能門檻 8/20/35/50/75 → sit、potty 解鎖，selfEntertain/houseWatch/charm 未解鎖
    // 共通技能門檻 20/35/50/75 → sturdy 解鎖，thrifty/veteran/luckyStar 未解鎖
    render(<PetSkills pet={makePet({ pomodorosSinceBorn: 25 })} />)

    const unlockedNames = ['乖乖坐下', '上廁所', '健壯體質']
    unlockedNames.forEach((name) => {
      expect(screen.getByRole('button', { name })).not.toHaveClass('pet-skills__badge--locked')
    })

    const lockedNames = ['自得其樂', '看家', '討好賣萌', '節省飲食', '老手', '幸運星']
    lockedNames.forEach((name) => {
      expect(screen.getByRole('button', { name })).toHaveClass('pet-skills__badge--locked')
    })
  })
})
