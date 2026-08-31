import { SHOP_ITEMS } from './shopItems'

function sumCollectibleEffect(ownedCollectibles, stat) {
  const owned = ownedCollectibles ?? []
  return SHOP_ITEMS.filter((item) => item.effect?.stat === stat && owned.includes(item.id)).reduce(
    (sum, item) => sum + item.effect.amount,
    0,
  )
}

export function getCollectibleObedienceBonus(ownedCollectibles) {
  return sumCollectibleEffect(ownedCollectibles, 'obedience')
}

export function getCollectibleFriendlinessBonus(ownedCollectibles) {
  return sumCollectibleEffect(ownedCollectibles, 'friendliness')
}

export function getCollectibleAffectionBonus(ownedCollectibles) {
  return sumCollectibleEffect(ownedCollectibles, 'affectionPerPomodoro')
}

export function getCollectibleHungerDecayReduction(ownedCollectibles) {
  return sumCollectibleEffect(ownedCollectibles, 'hungerDecayReduction')
}

export function getCollectibleCleanlinessDecayReduction(ownedCollectibles) {
  return sumCollectibleEffect(ownedCollectibles, 'cleanlinessDecayReduction')
}
