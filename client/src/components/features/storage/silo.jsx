import React, { useState } from 'react'
import { getStoragePercentage, isStorageFull, getUpgradeInfo, canUpgrade, performUpgrade } from './storageService'
import { getItemMeta } from './itemService'
import StorageUpgrade from './StorageUpgrade'

export default function Silo({ silo, playerResources, onUpgrade, onResourceChange }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)

  const percentage = getStoragePercentage(silo)
  const isFull = isStorageFull(silo)
  const upgradeable = canUpgrade(silo, playerResources)
  const nextUpgrade = getUpgradeInfo('silo', silo.level)

  const handleUpgrade = () => {
    if (!upgradeable) {
      setUpgradeError('Missing requirements for upgrade')
      return
    }

    const success = performUpgrade(silo, playerResources)
    if (success) {
      // Create new objects to ensure React detects state changes
      const updatedSilo = { ...silo, purchased: true }
      const updatedResources = { ...playerResources }
      onUpgrade?.(updatedSilo)
      onResourceChange?.(updatedResources)
      setShowUpgradeModal(false)
      setUpgradeError(null)
    } else {
      setUpgradeError('Upgrade failed')
    }
  }

  return (
    <div className="storage-silo">
      <div className="storage-header">
        <h3>🌾 Silo (Crop Storage)</h3>
        <div className="storage-level">Level {silo.level}</div>
      </div>

      <div className="storage-image">
        <img 
          src={`/assets/storage/silo/silo${silo.level}.png`} 
          alt={`Silo Level ${silo.level}`}
          onError={(e) => e.target.src = '/assets/silo.svg'}
        />
      </div>

      <div className="storage-capacity">
        <div className="capacity-label">
          Capacity: <strong>{silo.totalStored} / {silo.capacity}</strong>
          {isFull && <span className="full-warning"> ⚠️ FULL</span>}
        </div>
        <div className="capacity-bar">
          <div 
            className={`capacity-fill ${isFull ? 'full' : percentage > 75 ? 'warning' : ''}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="capacity-percent">{percentage}%</div>
      </div>

      <div className="storage-items">
        <div className="items-label">Stored Crops:</div>
        {silo.items.length === 0 ? (
          <div className="no-items">No crops stored</div>
        ) : (
          <div className="items-list">
            {silo.items.map(item => {
              const meta = getItemMeta(item.id)
              return (
                <div key={item.id} className="storage-item" style={{ borderColor: meta.border }}>
                  <span className="item-emoji" style={{ fontSize: '24px', marginRight: '6px' }}>{meta.emoji}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">x{item.quantity}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {nextUpgrade && silo.level < 6 && (
        <button 
          className={`upgrade-btn ${upgradeable ? '' : 'disabled'}`}
          onClick={() => setShowUpgradeModal(true)}
        >
          Upgrade to Level {silo.level + 1}
        </button>
      )}

      {silo.level === 6 && (
        <div className="max-level">✨ Max Level Reached</div>
      )}

      {upgradeError && (
        <div className="upgrade-error">{upgradeError}</div>
      )}

      {showUpgradeModal && nextUpgrade && (
        <StorageUpgrade
          storage={silo}
          upgradeInfo={nextUpgrade}
          playerResources={playerResources}
          onConfirm={handleUpgrade}
          onCancel={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}
