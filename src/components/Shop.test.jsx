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

function buttonFor(itemName) {
  return screen.getByText(itemName).closest('li').querySelector('button')
}

describe('Shop', () => {
  it('renders both section headings and all 8 items directly, with no expand step', () => {
    render(<Shop {...defaultProps} />)
    expect(screen.getByText('一次性道具')).toBeInTheDocument()
    expect(screen.getByText('消耗品（每天自動用掉一份補狀態）')).toBeInTheDocument()
    expect(screen.getByText('玩具球')).toBeInTheDocument()
    expect(screen.getByText('水盆')).toBeInTheDocument()
    expect(screen.getByText('項圈')).toBeInTheDocument()
    expect(screen.getByText('牽繩')).toBeInTheDocument()
    expect(screen.getByText('衣服')).toBeInTheDocument()
    expect(screen.getByText('飼料')).toBeInTheDocument()
    expect(screen.getByText('營養品')).toBeInTheDocument()
    expect(screen.getByText('盥洗用品')).toBeInTheDocument()
    expect(screen.getByText('20 💰')).toBeInTheDocument()
  })

  describe('Shop collectible effect labels', () => {
    it('shows the functional effect under each collectible item name', () => {
      render(<Shop {...defaultProps} />)
      expect(screen.getByText('飽食度衰退 −1')).toBeInTheDocument() // 水盆
      expect(screen.getByText('服從度 +3')).toBeInTheDocument() // 牽繩
      expect(screen.getByText('友善度 +3')).toBeInTheDocument() // 玩具球
      expect(screen.getByText('好感度成長 +1')).toBeInTheDocument() // 項圈
      expect(screen.getByText('潔淨度衰退 −1')).toBeInTheDocument() // 衣服
    })

    it('does not render an effect line for consumables', () => {
      render(<Shop {...defaultProps} />)
      const kibbleCard = screen.getByText('飼料').closest('li')
      expect(kibbleCard.querySelector('.shop-item__effect')).toBeNull()
    })
  })

  it('shows the current money total in the header chip', () => {
    render(<Shop {...defaultProps} money={150} />)
    expect(screen.getByText('💰 金錢：150')).toBeInTheDocument()
  })

  it('disables every buy button when money is 0', () => {
    render(<Shop {...defaultProps} />)
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled()
    }
  })

  it('enables only affordable items when money is 20, each showing the 購買 label', () => {
    render(<Shop {...defaultProps} money={20} />)
    expect(buttonFor('水盆')).not.toBeDisabled() // 15
    expect(buttonFor('玩具球')).not.toBeDisabled() // 20
    expect(buttonFor('飼料')).not.toBeDisabled() // 4
    expect(buttonFor('營養品')).not.toBeDisabled() // 8
    expect(buttonFor('盥洗用品')).not.toBeDisabled() // 6
    expect(buttonFor('項圈')).toBeDisabled() // 30
    expect(buttonFor('牽繩')).toBeDisabled() // 25
    expect(buttonFor('衣服')).toBeDisabled() // 40
    expect(buttonFor('水盆')).toHaveTextContent('購買')
    expect(buttonFor('項圈')).toHaveTextContent('金額不足')
  })

  it('calls onPurchase with the item id when an enabled button is clicked', async () => {
    const onPurchase = vi.fn()
    const user = userEvent.setup()
    render(<Shop {...defaultProps} money={20} onPurchase={onPurchase} />)
    await user.click(buttonFor('水盆'))
    expect(onPurchase).toHaveBeenCalledWith('bowl')
  })

  it('shows 已擁有 and stays disabled for an already-owned collectible regardless of money', () => {
    render(<Shop {...defaultProps} money={1000} ownedCollectibles={['bowl']} />)
    const button = buttonFor('水盆')
    expect(button).toHaveTextContent('已擁有')
    expect(button).toBeDisabled()
  })

  it('shows a 庫存 stock badge for each consumable reflecting consumablePurchases, and none for collectibles', () => {
    render(<Shop {...defaultProps} consumablePurchases={{ kibble: 2 }} />)
    expect(screen.getByText('庫存 2')).toBeInTheDocument() // kibble
    expect(screen.getAllByText('庫存 0')).toHaveLength(2) // supplement, grooming
    expect(screen.getByText('玩具球').closest('li').textContent).not.toContain('庫存')
  })

  it('shows only the plain price when no discount is unlocked', () => {
    render(<Shop {...defaultProps} money={100} />)
    expect(screen.getByText('4 💰 / 份')).toBeInTheDocument()
  })

  it('shows the struck-through original price next to the discounted price once bargainHunter is unlocked', () => {
    render(
      <Shop {...defaultProps} money={100} ownerSkillTree={{ ...defaultOwnerSkillTree(), bargainHunter: 3 }} />,
    )
    expect(screen.getByText('20')).toBeInTheDocument() // 玩具球原價，被劃掉
    expect(screen.getByText('17 💰')).toBeInTheDocument() // 20 打 85 折 = 17
  })

  it('does not show a strikethrough for a cheap item when rounding erases the discount', () => {
    render(
      <Shop {...defaultProps} money={100} ownerSkillTree={{ ...defaultOwnerSkillTree(), bargainHunter: 1 }} />,
    )
    // kibble costs 4, bargainHunter level 1 is a 5% discount: round(4 * 0.95) = 4,
    // so the displayed price is unchanged and no strikethrough should render.
    const priceEl = screen.getByText('飼料').closest('li').querySelector('.shop-item__price')
    expect(priceEl.querySelector('s')).not.toBeInTheDocument()
  })
})
