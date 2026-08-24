export const SHOP_ITEMS = [
  { id: 'ball', name: '玩具球', emoji: '🎾', cost: 20, category: 'collectible' },
  { id: 'bowl', name: '水盆', emoji: '🥣', cost: 15, category: 'collectible' },
  { id: 'collar', name: '項圈', emoji: '🎀', cost: 30, category: 'collectible' },
  { id: 'leash', name: '牽繩', emoji: '🪢', cost: 25, category: 'collectible' },
  { id: 'outfit', name: '衣服', emoji: '👕', cost: 40, category: 'collectible' },
  { id: 'kibble', name: '飼料', emoji: '🍖', cost: 4, category: 'consumable' },
  { id: 'supplement', name: '營養品', emoji: '💊', cost: 8, category: 'consumable' },
  { id: 'grooming', name: '盥洗用品', emoji: '🧴', cost: 6, category: 'consumable' },
]

export function getShopItem(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}
