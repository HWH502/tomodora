import { describe, expect, it } from 'vitest'
import { SHOP_ITEMS, getShopItem } from './shopItems'

describe('SHOP_ITEMS', () => {
  it('has exactly 8 items with the documented ids/costs/categories/effects', () => {
    expect(SHOP_ITEMS).toEqual([
      {
        id: 'ball',
        name: '玩具球',
        emoji: '🎾',
        cost: 20,
        category: 'collectible',
        effect: { stat: 'friendliness', amount: 3, label: '友善度 +3' },
      },
      {
        id: 'bowl',
        name: '水盆',
        emoji: '🥣',
        cost: 15,
        category: 'collectible',
        effect: { stat: 'hungerDecayReduction', amount: 1, label: '飽食度衰退 −1' },
      },
      {
        id: 'collar',
        name: '項圈',
        emoji: '🎀',
        cost: 30,
        category: 'collectible',
        effect: { stat: 'affectionPerPomodoro', amount: 1, label: '好感度成長 +1' },
      },
      {
        id: 'leash',
        name: '牽繩',
        emoji: '🪢',
        cost: 25,
        category: 'collectible',
        effect: { stat: 'obedience', amount: 3, label: '服從度 +3' },
      },
      {
        id: 'outfit',
        name: '衣服',
        emoji: '👕',
        cost: 40,
        category: 'collectible',
        effect: { stat: 'cleanlinessDecayReduction', amount: 1, label: '潔淨度衰退 −1' },
      },
      { id: 'kibble', name: '飼料', emoji: '🍖', cost: 4, category: 'consumable' },
      { id: 'supplement', name: '營養品', emoji: '💊', cost: 8, category: 'consumable' },
      { id: 'grooming', name: '盥洗用品', emoji: '🧴', cost: 6, category: 'consumable' },
    ])
  })
})

describe('SHOP_ITEMS grooming item', () => {
  it('includes a grooming consumable priced like other consumables', () => {
    const grooming = getShopItem('grooming')
    expect(grooming).toEqual({ id: 'grooming', name: '盥洗用品', emoji: '🧴', cost: 6, category: 'consumable' })
  })

  it('keeps grooming inside SHOP_ITEMS', () => {
    expect(SHOP_ITEMS.some((item) => item.id === 'grooming')).toBe(true)
  })
})


describe('getShopItem', () => {
  it('returns the matching item for a known id', () => {
    expect(getShopItem('bowl')).toEqual({
      id: 'bowl',
      name: '水盆',
      emoji: '🥣',
      cost: 15,
      category: 'collectible',
      effect: { stat: 'hungerDecayReduction', amount: 1, label: '飽食度衰退 −1' },
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(getShopItem('nope')).toBeUndefined()
  })
})
