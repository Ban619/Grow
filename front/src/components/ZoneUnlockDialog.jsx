import React, { useEffect } from 'react'
import { ZONE_MAP } from '../utils/zones'
import './ZoneUnlockDialog.css'

/**
 * ZoneUnlockDialog — shown when a player taps a locked zone.
 * Displays zone details, unlock cost, level requirement, and confirm/cancel.
 */
export default function ZoneUnlockDialog({
  zoneId,
  coins,
  level,
  onConfirm,
  onCancel,
}) {
  const def = ZONE_MAP[zoneId]
  if (!def) return null

  const canAfford = coins >= def.unlockCost
  const meetsLevel = level >= def.unlockLevel
  const canUnlock = canAfford && meetsLevel

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onCancel?.() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  return (
    <div className="zone-dialog-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.() }}>
      <div className="zone-dialog" role="dialog" aria-modal="true" aria-label={`Unlock ${def.name}`}>

        {/* Header */}
        <div className="zone-dialog-header">
          <span className="zone-dialog-emoji">{def.emoji}</span>
          <div>
            <div className="zone-dialog-title">{def.name}</div>
            <div className="zone-dialog-type">{def.type === 'island' ? '🏝️ Island' : '🌿 Land'}</div>
          </div>
          <button className="zone-dialog-close" onClick={onCancel} aria-label="Close">✕</button>
        </div>

        {/* Description */}
        <p className="zone-dialog-desc">{def.description}</p>

        {/* Requirements */}
        <div className="zone-dialog-reqs">
          <div className={`zone-req ${canAfford ? 'met' : 'unmet'}`}>
            <span className="req-icon">{canAfford ? '✅' : '❌'}</span>
            <span className="req-label">
              {canAfford
                ? `${def.unlockCost.toLocaleString()} coins`
                : `Need ${(def.unlockCost - coins).toLocaleString()} more coins`}
            </span>
            <span className="req-value">💰 {def.unlockCost.toLocaleString()}</span>
          </div>
          <div className={`zone-req ${meetsLevel ? 'met' : 'unmet'}`}>
            <span className="req-icon">{meetsLevel ? '✅' : '❌'}</span>
            <span className="req-label">
              {meetsLevel
                ? `Level ${def.unlockLevel} reached`
                : `Need Level ${def.unlockLevel} (you're ${level})`}
            </span>
            <span className="req-value">⭐ Lv. {def.unlockLevel}</span>
          </div>
        </div>

        {/* Zone size preview */}
        <div className="zone-dialog-size">
          <span>📐 {def.cols}×{def.rows} tiles</span>
          <span className="zone-size-dot">•</span>
          <span>{def.cols * def.rows} total plots</span>
        </div>

        {/* Actions */}
        <div className="zone-dialog-actions">
          <button className="zone-btn-cancel" onClick={onCancel}>
            Maybe Later
          </button>
          <button
            className={`zone-btn-unlock ${canUnlock ? '' : 'disabled'}`}
            disabled={!canUnlock}
            onClick={() => canUnlock && onConfirm?.(zoneId, def.unlockCost)}
          >
            {canUnlock
              ? `🔓 Unlock for ${def.unlockCost.toLocaleString()} coins`
              : '🔒 Requirements not met'}
          </button>
        </div>
      </div>
    </div>
  )
}
