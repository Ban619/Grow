import React from 'react'
import { getStoragePercentage, isStorageFull } from './storageService'
import '../../../styles/storageTracker.css'

export default function StorageTracker({ barn, silo, onOpenStorage }) {
  if (!barn || !silo) return null

  const barnPercentage = getStoragePercentage(barn)
  const siloPercentage = getStoragePercentage(silo)
  const barnFull = isStorageFull(barn)
  const siloFull = isStorageFull(silo)

  const handleClick = (storageType) => {
    onOpenStorage?.(storageType)
  }

  return (
    <div className="storage-tracker">
      <div className="tracker-title">📦 Storage</div>

      {/* Barn Storage */}
      <div 
        className="tracker-item barn-tracker"
        onClick={() => handleClick('barn')}
        title="Click to manage barn"
      >
        <div className="tracker-label">
          <span className="tracker-emoji">🏛️</span>
          <span className="tracker-name">Barn L{barn.level}</span>
        </div>
        <div className="tracker-bar">
          <div 
            className={`tracker-fill barn-fill ${barnFull ? 'full' : barnPercentage > 75 ? 'warning' : ''}`}
            style={{ width: `${Math.min(barnPercentage, 100)}%` }}
          />
        </div>
        <div className="tracker-text">
          <span className="tracker-amount">{barn.totalStored}/{barn.capacity}</span>
          <span className="tracker-percent">{barnPercentage}%</span>
        </div>
      </div>

      {/* Silo Storage */}
      <div 
        className="tracker-item silo-tracker"
        onClick={() => handleClick('silo')}
        title="Click to manage silo"
      >
        <div className="tracker-label">
          <span className="tracker-emoji">🌾</span>
          <span className="tracker-name">Silo L{silo.level}</span>
        </div>
        <div className="tracker-bar">
          <div 
            className={`tracker-fill silo-fill ${siloFull ? 'full' : siloPercentage > 75 ? 'warning' : ''}`}
            style={{ width: `${Math.min(siloPercentage, 100)}%` }}
          />
        </div>
        <div className="tracker-text">
          <span className="tracker-amount">{silo.totalStored}/{silo.capacity}</span>
          <span className="tracker-percent">{siloPercentage}%</span>
        </div>
      </div>
    </div>
  )
}
