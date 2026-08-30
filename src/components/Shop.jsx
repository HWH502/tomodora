import PageBlobs from './PageBlobs'
import { SHOP_ITEMS } from '../utils/shopItems'
import { getShopPrice } from '../utils/storage'

export default function Shop({ money, ownedCollectibles, consumablePurchases, ownerSkillTree, onPurchase }) {
  const collectibles = SHOP_ITEMS.filter((item) => item.category === 'collectible')
  const consumables = SHOP_ITEMS.filter((item) => item.category === 'consumable')

  function renderItem(item) {
    const isCollectible = item.category === 'collectible'
    const owned = isCollectible && ownedCollectibles.includes(item.id)
    const stock = consumablePurchases[item.id] || 0
    const price = getShopPrice(item.id, ownerSkillTree)
    const affordable = money >= price
    const disabled = owned || !affordable

    return (
      <li key={item.id} className={`shop-item${owned ? ' shop-item--owned' : ''}`}>
        <div className={`shop-item__icon shop-item__icon--${item.category}`} aria-hidden="true">
          {item.emoji}
        </div>
        <p className="shop-item__name">{item.name}</p>
        {!isCollectible && <span className="shop-item__stock-badge">庫存 {stock}</span>}
        <p className="shop-item__price">
          {price < item.cost && <s className="shop-item__original-price">{item.cost}</s>}{' '}
          {isCollectible ? `${price} 💰` : `${price} 💰 / 份`}
        </p>
        <button
          type="button"
          className={`shop-item__buy-btn${
            owned ? ' shop-item__buy-btn--owned' : !affordable ? ' shop-item__buy-btn--locked' : ''
          }`}
          disabled={disabled}
          onClick={() => onPurchase(item.id)}
        >
          {owned ? '已擁有' : !affordable ? '金額不足' : '購買'}
        </button>
      </li>
    )
  }

  return (
    <section className="shop-page">
      <PageBlobs />
      <div className="shop-page__header">
        <p className="display shop-page__title">小商店</p>
        <span className="chip display shop-page__money-chip">{`💰 金錢：${money}`}</span>
      </div>

      <div>
        <p className="shop-page__section-label">一次性道具</p>
        <ul className="shop-page__grid">{collectibles.map(renderItem)}</ul>
      </div>

      <div>
        <p className="shop-page__section-label">消耗品（每天自動用掉一份補狀態）</p>
        <ul className="shop-page__grid">{consumables.map(renderItem)}</ul>
      </div>
    </section>
  )
}
