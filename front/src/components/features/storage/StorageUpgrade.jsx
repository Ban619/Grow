import React from 'react'
import { canUpgrade } from './storageService'

export default function StorageUpgrade({ storage, upgradeInfo, playerResources, onConfirm, onCancel }) {
  const canUpgradeNow = canUpgrade(storage, playerResources)
  
  const getMissingResources = () => {
    const missing = {}
    
    if (playerResources.coins < upgradeInfo.cost) {
      missing.coins = upgradeInfo.cost - playerResources.coins
    }
    
    for (const [material, needed] of Object.entries(upgradeInfo.materials)) {
      const have = playerResources[material] || 0
      if (have < needed) {
        missing[material] = needed - have
      }
    }
    
    return missing
  }
  
  const missingResources = getMissingResources()

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⬆️ Upgrade {storage.type === 'silo' ? 'Silo' : 'Barn'}</h2>
          <button className="close-btn" onClick={onCancel}>✕</button>
        </div>

        <div className="upgrade-content">
          <div className="upgrade-stats">
            <div className="stat-row">
              <span>Current Level:</span>
              <strong>{storage.level}</strong>
            </div>
            <div className="stat-row">
              <span>New Level:</span>
              <strong>{storage.level + 1}</strong>
            </div>
            <div className="stat-row capacity-upgrade">
              <span>Capacity:</span>
              <strong>
                {storage.capacity} → {upgradeInfo.capacity}
                <span className="increase"> (+{upgradeInfo.capacity - storage.capacity})</span>
              </strong>
            </div>
          </div>

          <div className="upgrade-requirements">
            <h3>Requirements:</h3>
            
            <div className="requirement-item">
              <span className="resource-label">💰 Coins:</span>
              <span className={`resource-amount ${playerResources.coins >= upgradeInfo.cost ? 'ok' : 'missing'}`}>
                {playerResources.coins} / {upgradeInfo.cost}
                {playerResources.coins < upgradeInfo.cost && 
                  <span className="needed"> (need {upgradeInfo.cost - playerResources.coins} more)</span>
                }
              </span>
            </div>

            {Object.entries(upgradeInfo.materials).length > 0 ? (
              <>
                <h4>Materials:</h4>
                {Object.entries(upgradeInfo.materials).map(([material, needed]) => {
                  const have = playerResources[material] || 0
                  const isOk = have >= needed
                  return (
                    <div key={material} className="requirement-item">
                      <span className="resource-label">
                        {material === 'wood' && '🪵'}
                        {material === 'stone' && '🪨'}
                        {material === 'iron' && '⚙️'}
                        {material === 'copper' && '🟠'}
                        {' ' + material.charAt(0).toUpperCase() + material.slice(1)}:
                      </span>
                      <span className={`resource-amount ${isOk ? 'ok' : 'missing'}`}>
                        {have} / {needed}
                        {!isOk && <span className="needed"> (need {needed - have} more)</span>}
                      </span>
                    </div>
                  )
                })}
              </>
            ) : (
              <div className="no-materials">No materials required</div>
            )}
          </div>

          {Object.keys(missingResources).length > 0 && (
            <div className="missing-alert">
              ⚠️ You are missing resources to upgrade. Complete the requirements first!
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button 
            className="upgrade-confirm-btn"
            onClick={onConfirm}
            disabled={!canUpgradeNow}
          >
            {canUpgradeNow ? '✅ Confirm Upgrade' : '❌ Cannot Upgrade'}
          </button>
          <button className="upgrade-cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
