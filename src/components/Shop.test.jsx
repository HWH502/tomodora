import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Shop from './Shop'
import { defaultOwnerSkillTree } from '../utils/ownerSkillTree'

const defaultProps = {
  money: 0,
  ownedCollectibles: [],
  consumablePurchases: {},
  ownerSkillTree: defaultOwnerSkillTree(),
  onPurchase: vi.fn(),
}

async function renderExpanded(props = {}) {
  const user = userEvent.setup()
  render(<Shop {...defaultProps} {...props} />)
  await user.click(screen.getByRole('button', { name: /商店/ }))
  return user
}

describe('Shop', () => {
  it('renders all 7 items with their name and cost', async () => {
    await renderExpanded()
    expect(screen.getByText('玩具球')).toBeInTheDocument()
    expect(screen.getByText('水盆')).toBeInTheDocument()
    expect(screen.getByText('項圈')).toBeInTheDocument()
    expect(screen.getByText('牽繩')).toBeInTheDocument()
    expect(screen.getByText('衣服')).toBeInTheDocument()
    expect(screen.getByText('飼料')).toBeInTheDocument()
    expect(screen.getByText('營養品')).toBeInTheDocument()
    expect(screen.getByText('20 💰')).toBeInTheDocument()
  })

  it('disables every buy button when money is 0', async () => {
    await renderExpanded()
    const toggle = screen.getByRole('button', { name: /商店/ })
    for (const button of screen.getAllByRole('button')) {
      if (button === toggle) continue
      expect(button).toBeDisabled()
    }
  })

  it('enables only affordable items when money is 20', async () => {
    await renderExpanded({ money: 20 })
    expect(screen.getByText('15 💰')).not.toBeDisabled() // bowl
    expect(screen.getByText('20 💰')).not.toBeDisabled() // ball
    expect(screen.getByText('4 💰')).not.toBeDisabled() // kibble
    expect(screen.getByText('8 💰')).not.toBeDisabled() // supplement
    expect(screen.getByText('30 💰')).toBeDisabled() // collar
    expect(screen.getByText('25 💰')).toBeDisabled() // leash
    expect(screen.getByText('40 💰')).toBeDisabled() // outfit
  })

  it('calls onPurchase with the item id when an enabled button is clicked', async () => {
    const onPurchase = vi.fn()
    const user = await renderExpanded({ money: 20, onPurchase })

    await user.click(screen.getByText('15 💰')) // bowl
    expect(onPurchase).toHaveBeenCalledWith('bowl')
  })

  it('shows 已擁有 and stays disabled for an already-owned collectible regardless of money', async () => {
    await renderExpanded({ money: 1000, ownedCollectibles: ['bowl'] })
    const ownedButton = screen.getByText('已擁有')
    expect(ownedButton).toBeInTheDocument()
    expect(ownedButton).toBeDisabled()
  })

  it('shows a purchase count suffix for a repeated consumable, and none for an untouched one', async () => {
    await renderExpanded({ money: 100, consumablePurchases: { kibble: 2 } })
    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.queryByText('×0')).not.toBeInTheDocument()
  })

  it('shows only the plain price when no discount is unlocked', async () => {
    await renderExpanded({ money: 100 })
    expect(screen.getByText('4 💰')).toBeInTheDocument()
  })

  it('shows the struck-through original price next to the discounted price once bargainHunter is unlocked', async () => {
    await renderExpanded({
      money: 100,
      ownerSkillTree: { ...defaultOwnerSkillTree(), bargainHunter: 3 },
    })
    expect(screen.getByText('20')).toBeInTheDocument() // 玩具球原價
    expect(screen.getByText('17 💰')).toBeInTheDocument() // 20 打 85 折 = 17
  })

  it('does not show a strikethrough for a cheap item when rounding erases the discount', async () => {
    await renderExpanded({
      money: 100,
      ownerSkillTree: { ...defaultOwnerSkillTree(), bargainHunter: 1 },
    })
    // kibble costs 4, bargainHunter level 1 is a 5% discount: round(4 * 0.95) = 4,
    // so the displayed price is unchanged and no strikethrough should render.
    const kibblePriceButton = screen.getByText('4 💰').closest('button')
    expect(kibblePriceButton.querySelector('s')).not.toBeInTheDocument()
  })
})
