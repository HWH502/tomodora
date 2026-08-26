import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ShareCard from './ShareCard'

describe('ShareCard', () => {
  it('renders the noPet variant with only pomodoro stats', () => {
    render(
      <ShareCard
        data={{
          variant: 'noPet',
          stats: { lifetimePomodoros: 128, focusMinutesLabel: '53 小時 20 分', startedAtLabel: '2026/08/25' },
          pet: null,
          memorial: null,
        }}
      />,
    )
    expect(screen.getByText('128')).toBeInTheDocument()
    expect(screen.getByText('個蕃茄鐘')).toBeInTheDocument()
    expect(screen.getByText(/53 小時 20 分/)).toBeInTheDocument()
    expect(document.querySelector('.share-card--stats')).toBeInTheDocument()
  })

  it('renders the hasPet variant with pet details and a legacy line when present', () => {
    render(
      <ShareCard
        data={{
          variant: 'hasPet',
          stats: { lifetimePomodoros: 50, focusMinutesLabel: '20 小時 50 分', startedAtLabel: '2026/08/25' },
          pet: {
            name: '豆豆', breedLabel: '柴犬', stageLabel: '活潑成長期', emoji: '🐶',
            speciesId: 'dog', breedId: 'shiba', stageKey: 'growing',
            generation: 3, legacyLine: '歷代最高紀錄：長大成資深老友',
          },
          memorial: null,
        }}
      />,
    )
    expect(screen.getByText('豆豆')).toBeInTheDocument()
    expect(screen.getByText(/柴犬/)).toBeInTheDocument()
    expect(screen.getByText(/第 3 代/)).toBeInTheDocument()
    expect(screen.getByText('歷代最高紀錄：長大成資深老友')).toBeInTheDocument()
    expect(document.querySelector('.share-card--pet')).toBeInTheDocument()
  })

  it('does not render a legacy line when the pet has none', () => {
    render(
      <ShareCard
        data={{
          variant: 'hasPet',
          stats: { lifetimePomodoros: 5, focusMinutesLabel: '2 小時 5 分', startedAtLabel: '2026/08/25' },
          pet: {
            name: '豆豆', breedLabel: '柴犬', stageLabel: '幼犬階段', emoji: '🐶',
            speciesId: 'dog', breedId: 'shiba', stageKey: 'young',
            generation: 1, legacyLine: null,
          },
          memorial: null,
        }}
      />,
    )
    expect(screen.queryByText(/歷代最高紀錄/)).not.toBeInTheDocument()
  })

  it('renders the memorial variant with the warm note text', () => {
    render(
      <ShareCard
        data={{
          variant: 'memorial',
          stats: { lifetimePomodoros: 50, focusMinutesLabel: '20 小時 50 分', startedAtLabel: '2026/08/25' },
          pet: null,
          memorial: {
            name: '小雪', breedLabel: '柴犬', daysWithOwner: 87, generation: 2,
            noteText: '陪你度過 87 天，一起長大到「資深老友」，後來開始照顧新的家人了。',
          },
        }}
      />,
    )
    expect(screen.getByText('小雪')).toBeInTheDocument()
    expect(screen.getByText(/陪你度過 87 天/)).toBeInTheDocument()
    expect(document.querySelector('.share-card--memorial')).toBeInTheDocument()
  })
})
