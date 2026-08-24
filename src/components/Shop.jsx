import { useState } from 'react'
import { SHOP_ITEMS } from '../utils/shopItems'
import { getShopPrice } from '../utils/storage'

export default function Shop({ money, ownedCollectibles, consumablePurchases, ownerSkillTree, onPurchase }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <section className="shop">
      <button
        type="button"
        className="shop__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        商店 {expanded ? '▾' : '▸'}
      </button>
      {expanded && (
      <ul className="shop__list">
        {SHOP_ITEMS.map((item) => {
          const isCollectible = item.category === 'collectible'
          const owned = isCollectible && ownedCollectibles.includes(item.id)
          const purchaseCount = consumablePurchases[item.id] || 0
          const price = getShopPrice(item.id, ownerSkillTree)
          const affordable = money >= price
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
                {owned ? (
                  '已擁有'
                ) : price < item.cost ? (
                  <>
                    <s className="shop__item-original-price">{item.cost}</s> {price} 💰
                  </>
                ) : (
                  `${price} 💰`
                )}
              </button>
            </li>
          )
        })}
      </ul>
      )}
    </section>
  )
}
