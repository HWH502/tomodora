import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import DailyTickSummaryModal from './DailyTickSummaryModal'

describe('DailyTickSummaryModal', () => {
  it('renders nothing when there is no summary', () => {
    const { container } = render(<DailyTickSummaryModal summary={null} onClose={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows non-zero need deltas with a sign, consumed items, and event labels for a tick summary', () => {
    render(
      <DailyTickSummaryModal
        summary={{
          type: 'tick',
          deltas: { hunger: -15, cleanliness: 0, health: 3, affection: 0 },
          consumed: [{ itemId: 'kibble', count: 2 }],
          events: ['obedienceIncident'],
        }}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText(/飽食度/)).toHaveTextContent('飽食度 -15')
    expect(screen.getByText(/健康度/)).toHaveTextContent('健康度 +3')
    expect(screen.queryByText(/潔淨度/)).not.toBeInTheDocument()
    expect(screen.queryByText(/好感度/)).not.toBeInTheDocument()
    expect(screen.getByText(/飼料 x2/)).toBeInTheDocument()
    expect(screen.getByText(/寵物惹了點小麻煩/)).toBeInTheDocument()
  })

  it('shows a fallback message when nothing changed', () => {
    render(
      <DailyTickSummaryModal
        summary={{ type: 'tick', deltas: { hunger: 0, cleanliness: 0, health: 0, affection: 0 }, consumed: [], events: [] }}
        onClose={() => {}}
      />,
    )
    expect(screen.getByText('沒有明顯變化')).toBeInTheDocument()
  })

  it('shows a departure message instead of deltas when the pet left due to low affection', () => {
    render(<DailyTickSummaryModal summary={{ type: 'departed', reason: 'affection' }} onClose={() => {}} />)
    expect(screen.getByText(/離家出走/)).toBeInTheDocument()
  })

  it('shows a departure message when the pet died from poor health', () => {
    render(<DailyTickSummaryModal summary={{ type: 'departed', reason: 'health' }} onClose={() => {}} />)
    expect(screen.getByText(/健康狀況惡化/)).toBeInTheDocument()
  })

  it('calls onClose when the confirm button is clicked', () => {
    const onClose = vi.fn()
    render(
      <DailyTickSummaryModal
        summary={{ type: 'tick', deltas: { hunger: 0, cleanliness: 0, health: 0, affection: 0 }, consumed: [], events: [] }}
        onClose={onClose}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: '知道了' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
