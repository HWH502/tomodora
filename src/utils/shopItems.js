export const SHOP_ITEMS = [
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
]

export function getShopItem(itemId) {
  return SHOP_ITEMS.find((item) => item.id === itemId)
}
