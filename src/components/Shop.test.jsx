import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Shop from './Shop'

const defaultProps = {
  money: 0,
  ownedCollectibles: [],
  consumablePurchases: {},
  onPurchase: vi.fn(),
}

describe('Shop', () => {
  it('renders all 7 items with their name and cost', () => {
    render(<Shop {...defaultProps} />)
    expect(screen.getByText('玩具球')).toBeInTheDocument()
    expect(screen.getByText('水盆')).toBeInTheDocument()
    expect(screen.getByText('項圈')).toBeInTheDocument()
    expect(screen.getByText('牽繩')).toBeInTheDocument()
    expect(screen.getByText('衣服')).toBeInTheDocument()
    expect(screen.getByText('飼料')).toBeInTheDocument()
    expect(screen.getByText('營養品')).toBeInTheDocument()
    expect(screen.getByText('20 💰')).toBeInTheDocument()
  })

  it('disables every buy button when money is 0', () => {
    render(<Shop {...defaultProps} />)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('enables only affordable items when money is 20', () => {
    render(<Shop {...defaultProps} money={20} />)
    expect(screen.getByText('15 💰')).not.toBeDisabled() // bowl
    expect(screen.getByText('20 💰')).not.toBeDisabled() // ball
    expect(screen.getByText('4 💰')).not.toBeDisabled() // kibble
    expect(screen.getByText('8 💰')).not.toBeDisabled() // supplement
    expect(screen.getByText('30 💰')).toBeDisabled() // collar
    expect(screen.getByText('25 💰')).toBeDisabled() // leash
    expect(screen.getByText('40 💰')).toBeDisabled() // outfit
  })

  it('calls onPurchase with the item id when an enabled button is clicked', async () => {
    const user = userEvent.setup()
    const onPurchase = vi.fn()
    render(<Shop {...defaultProps} money={20} onPurchase={onPurchase} />)

    await user.click(screen.getByText('15 💰')) // bowl
    expect(onPurchase).toHaveBeenCalledWith('bowl')
  })

  it('shows 已擁有 and stays disabled for an already-owned collectible regardless of money', () => {
    render(<Shop {...defaultProps} money={1000} ownedCollectibles={['bowl']} />)
    const ownedButton = screen.getByText('已擁有')
    expect(ownedButton).toBeInTheDocument()
    expect(ownedButton).toBeDisabled()
  })

  it('shows a purchase count suffix for a repeated consumable, and none for an untouched one', () => {
    render(<Shop {...defaultProps} money={100} consumablePurchases={{ kibble: 2 }} />)
    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.queryByText('×0')).not.toBeInTheDocument()
  })
})
