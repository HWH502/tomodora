import { SHOP_ITEMS } from '../utils/shopItems'

export default function Shop({ money, ownedCollectibles, consumablePurchases, onPurchase }) {
  return (
    <section className="shop">
      <h2 className="shop__title">商店</h2>
      <ul className="shop__list">
        {SHOP_ITEMS.map((item) => {
          const isCollectible = item.category === 'collectible'
          const owned = isCollectible && ownedCollectibles.includes(item.id)
          const purchaseCount = consumablePurchases[item.id] || 0
          const affordable = money >= item.cost
          const disabled = owned || !affordable

          return (
            <li key={item.id} className={`shop__item${owned ? ' shop__item--owned' : ''}`}>
              <span className="shop__item-emoji" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="shop__item-name">
                {item.name}
                {!isCollectible && purchaseCount > 0 && (
                  <span className="shop__item-count"> ×{purchaseCount}</span>
                )}
              </span>
              <button type="button" disabled={disabled} onClick={() => onPurchase(item.id)}>
                {owned ? '已擁有' : `${item.cost} 💰`}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
