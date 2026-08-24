import { describe, expect, it } from 'vitest'
import { SHOP_ITEMS, getShopItem } from './shopItems'

describe('SHOP_ITEMS', () => {
  it('has exactly 8 items with the documented ids/costs/categories', () => {
    expect(SHOP_ITEMS).toEqual([
      { id: 'ball', name: '玩具球', emoji: '🎾', cost: 20, category: 'collectible' },
      { id: 'bowl', name: '水盆', emoji: '🥣', cost: 15, category: 'collectible' },
      { id: 'collar', name: '項圈', emoji: '🎀', cost: 30, category: 'collectible' },
      { id: 'leash', name: '牽繩', emoji: '🪢', cost: 25, category: 'collectible' },
      { id: 'outfit', name: '衣服', emoji: '👕', cost: 40, category: 'collectible' },
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
    })
  })

  it('returns undefined for an unknown id', () => {
    expect(getShopItem('nope')).toBeUndefined()
  })
})
