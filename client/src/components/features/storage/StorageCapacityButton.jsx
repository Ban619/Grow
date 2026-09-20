import React from 'react'
import { getStoragePercentage, isStorageFull } from './storageService'
import '../../../styles/storageCapacityButton.css'

export default function StorageCapacityButton({ barn, silo, onOpenStorage }) {
  if (!barn || !silo) return null

  // Only show button if both silo and barn have been purchased (upgraded)
  if (!barn.purchased || !silo.purchased) return null

  const barnPercentage = getStoragePercentage(barn)
  const siloPercentage = getStoragePercentage(silo)
  const barnFull = isStorageFull(barn)
  const siloFull = isStorageFull(silo)
  
  // Determine overall storage status for button styling
  const anyFull = barnFull || siloFull
  const anyWarning = (barnPercentage > 75) || (siloPercentage > 75)
  const avgPercentage = Math.round((barnPercentage + siloPercentage) / 2)

  const handleClick = () => {
    // Open storage modal with a default view
    onOpenStorage?.('all')
  }

  return (
    <div 
      className={`storage-capacity-button ${anyFull ? 'capacity-full' : anyWarning ? 'capacity-warning' : 'capacity-normal'}`}
      onClick={handleClick}
      title="Click to manage storage"
      aria-label="Storage Capacity Status"
    >
      <div className="capacity-icon">📦</div>
      <div className="capacity-content">
        <div className="capacity-label">Storage</div>
        <div className="capacity-display">
          <div className="capacity-stat">
            <span className="stat-icon">🌾</span>
            <span className="stat-value">{siloPercentage}%</span>
          </div>
          <div className="capacity-stat">
            <span className="stat-icon">🏛️</span>
            <span className="stat-value">{barnPercentage}%</span>
          </div>
        </div>
        <div className="capacity-bar-container">
          <div className="capacity-bar-main">
            <div 
              className={`capacity-bar-fill ${anyFull ? 'bar-full' : anyWarning ? 'bar-warning' : 'bar-normal'}`}
              style={{ width: `${Math.min(avgPercentage, 100)}%` }}
            />
          </div>
        </div>
        <div className="capacity-average">{avgPercentage}% avg</div>
      </div>
      {anyFull && <div className="capacity-alert-dot">⚠️</div>}
    </div>
  )
}
