import React, { useState, useEffect } from 'react'
import Silo from './silo'
import Barn from './barn'

export default function StorageModal({ isOpen, onClose, silo, barn, playerResources, onSiloUpgrade, onBarnUpgrade, onResourceChange, initialTab }) {
  // Fix #16: respect which building the player tapped
  const [activeTab, setActiveTab] = useState(initialTab || 'silo')

  // Update tab when initialTab prop changes (e.g. opening barn vs silo)
  useEffect(() => {
    if (isOpen && initialTab) setActiveTab(initialTab)
  }, [isOpen, initialTab])

  if (!isOpen) return null

  return (
    <div className="storage-modal-overlay" onClick={onClose}>
      <div className="storage-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="storage-modal-header">
          <h2>📦 Storage Management</h2>
          <button className="storage-modal-close" onClick={onClose} aria-label="Close storage">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="storage-tabs">
          <button
            className={`storage-tab ${activeTab === 'silo' ? 'active' : ''}`}
            onClick={() => setActiveTab('silo')}
          >
            🌾 Silo (Crops)
          </button>
          <button
            className={`storage-tab ${activeTab === 'barn' ? 'active' : ''}`}
            onClick={() => setActiveTab('barn')}
          >
            🏛️ Barn (Production)
          </button>
        </div>

        {/* Tab Content */}
        <div className="storage-modal-content">
          {activeTab === 'silo' && silo && (
            <Silo
              silo={silo}
              playerResources={playerResources}
              onUpgrade={onSiloUpgrade}
              onResourceChange={onResourceChange}
            />
          )}
          {activeTab === 'barn' && barn && (
            <Barn
              barn={barn}
              playerResources={playerResources}
              onUpgrade={onBarnUpgrade}
              onResourceChange={onResourceChange}
            />
          )}
        </div>
      </div>
    </div>
  )
}
