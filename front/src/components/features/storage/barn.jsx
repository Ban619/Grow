import React, { useState } from 'react'
import { getStoragePercentage, isStorageFull, getUpgradeInfo, canUpgrade, performUpgrade } from './storageService'
import StorageUpgrade from './StorageUpgrade'

export default function Barn({ barn, playerResources, onUpgrade, onResourceChange }) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeError, setUpgradeError] = useState(null)

  const percentage = getStoragePercentage(barn)
  const isFull = isStorageFull(barn)
  const upgradeable = canUpgrade(barn, playerResources)
  const nextUpgrade = getUpgradeInfo('barn', barn.level)

  const handleUpgrade = () => {
    if (!upgradeable) {
      setUpgradeError('Missing requirements for upgrade')
      return
    }

    const success = performUpgrade(barn, playerResources)
    if (success) {
      // Create new objects to ensure React detects state changes
      const updatedBarn = { ...barn, purchased: true }
      const updatedResources = { ...playerResources }
      onUpgrade?.(updatedBarn)
      onResourceChange?.(updatedResources)
      setShowUpgradeModal(false)
      setUpgradeError(null)
    } else {
      setUpgradeError('Upgrade failed')
    }
  }

  return (
    <div className="storage-barn">
      <div className="storage-header">
        <h3>🏛️ Barn (Production Storage)</h3>
        <div className="storage-level">Level {barn.level}</div>
      </div>

      <div className="storage-image">
        <img 
          src={`/assets/storage/barn/barn${barn.level}.png`} 
          alt={`Barn Level ${barn.level}`}
          onError={(e) => e.target.src = '/barn.png'}
        />
      </div>

      <div className="storage-capacity">
        <div className="capacity-label">
          Capacity: <strong>{barn.totalStored} / {barn.capacity}</strong>
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
        <div className="items-label">Stored Items:</div>
        {barn.items.length === 0 ? (
          <div className="no-items">No items stored</div>
        ) : (
          <div className="items-list">
            {barn.items.map(item => (
              <div key={item.id} className="storage-item">
                <span className="item-name">{item.name}</span>
                <span className="item-quantity">x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {nextUpgrade && barn.level < 4 && (
        <button 
          className={`upgrade-btn ${upgradeable ? '' : 'disabled'}`}
          onClick={() => setShowUpgradeModal(true)}
        >
          Upgrade to Level {barn.level + 1}
        </button>
      )}

      {barn.level === 4 && (
        <div className="max-level">✨ Max Level Reached</div>
      )}

      {upgradeError && (
        <div className="upgrade-error">{upgradeError}</div>
      )}

      {showUpgradeModal && nextUpgrade && (
        <StorageUpgrade
          storage={barn}
          upgradeInfo={nextUpgrade}
          playerResources={playerResources}
          onConfirm={handleUpgrade}
          onCancel={() => setShowUpgradeModal(false)}
        />
      )}
    </div>
  )
}
