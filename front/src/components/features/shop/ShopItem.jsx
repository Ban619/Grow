import React from 'react'

export default function ShopItem({item, onBuy = ()=>{}, coins = 0, owned = 0}){
  const canAfford = coins >= item.cost
  // prefer public-root silo image if present, otherwise use icons folder
  const thumb = item.id === 'silo' ? '/silo.png' : `/icons/${item.id}.png`

  return (
    <div className="shop-item">
      <div style={{display:'flex',alignItems:'center',gap:12}}>
        <div className={`shop-item-thumb ${item.category === 'Buildings' ? 'building' : ''}`}>
          <img src={thumb} alt={item.name} onError={(e)=>{ e.currentTarget.style.display='none' }} />
        </div>
        <div className="shop-item-info">
          <div className="shop-item-name">{item.name}</div>
          <div className="shop-item-meta">Inventory: {owned}</div>
        </div>
      </div>

      <div className="shop-item-actions">
        <button
          className={`buy-btn ${canAfford ? '' : 'disabled'}`}
          onClick={() => canAfford && onBuy(item)}
        >
          <span className="buy-label">Buy</span>
          <span className="buy-cost">{item.cost}</span>
        </button>
      </div>
    </div>
  )
}
