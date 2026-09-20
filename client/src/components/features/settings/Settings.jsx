import React, { useEffect, useState } from 'react'
import ConfirmModal from '../../ConfirmModal'

export default function Settings({
  open,
  onClose,
  values = {},
  onChange,
  onMusicToggle,
  onSoundsToggle,
  purchaseMode = 'reserve',
  onPurchaseModeChange,
}) {
  const [master, setMaster] = useState(values.master || 80)
  const [music, setMusic] = useState(values.music !== undefined ? values.music : 70)
  const [effects, setEffects] = useState(values.effects !== undefined ? values.effects : 85)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showCredits, setShowCredits] = useState(false)
  const [farmName, setFarmName] = useState(values.farmName || 'My Farm')

  useEffect(() => {
    if (open) {
      setMaster(values.master || 80)
      setMusic(values.music !== undefined ? values.music : 70)
      setEffects(values.effects !== undefined ? values.effects : 85)
      setFarmName(values.farmName || 'My Farm')
    }
  }, [open, values])

  const apply = () => {
    onChange && onChange({ master, music, effects, farmName })
    onClose && onClose()
  }

  const toggleMusic = () => {
    const newMusic = music > 0 ? 0 : 70
    setMusic(newMusic)
    onMusicToggle && onMusicToggle(newMusic)
  }

  const toggleSounds = () => {
    const newEffects = effects > 0 ? 0 : 85
    setEffects(newEffects)
    onSoundsToggle && onSoundsToggle(newEffects)
  }

  const togglePurchaseMode = () => {
    const next = purchaseMode === 'reserve' ? 'confirm' : 'reserve'
    onPurchaseModeChange?.(next)
  }

  if (!open) return null
  return (
    <>
      <div className="settings-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose() }}>
        <div className="settings-panel settings-iso" onMouseDown={(e) => e.stopPropagation()}>
          <div className="settings-header">
            <strong>Settings</strong>
            <button className="close-btn" onClick={() => onClose && onClose()}>×</button>
          </div>
          <div className="settings-body">
            <div className="settings-grid">
              <button className="big-btn" onClick={toggleMusic}>
                Music<br /><span className="small">{music > 0 ? 'ON' : 'OFF'}</span>
              </button>
              <button className="big-btn" onClick={toggleSounds}>
                Sounds<br /><span className="small">{effects > 0 ? 'ON' : 'OFF'}</span>
              </button>
              <button className="big-btn">
                Language<br /><span className="small">English</span>
              </button>
              <button className="big-btn" onClick={() => setShowCredits(true)}>Credits</button>
              <button
                className="big-btn"
                title="Reserve: coins deducted on purchase. Confirm: deducted only when placed."
                onClick={togglePurchaseMode}
              >
                Buy Mode<br />
                <span className="small">{purchaseMode === 'reserve' ? 'Reserve' : 'Confirm'}</span>
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <button className="btn-logout" onClick={() => { setShowLogoutConfirm(true) }}>Switch / Logout</button>
            </div>
          </div>

          <div className="settings-footer">
            <button className="btn-apply" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>

      {/* Credits Modal */}
      <ConfirmModal
        open={showCredits}
        title="🎮 Credits"
        message="GROW LIFE"
        confirmText="Close"
        cancelText={undefined}
        onConfirm={() => setShowCredits(false)}
        onCancel={() => setShowCredits(false)}
      />

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        open={showLogoutConfirm}
        title="🌾 Switch Account?"
        message="Are you sure you want to log out? Your progress will be saved automatically."
        confirmText="Yes, Logout"
        cancelText="Stay"
        isDangerous={false}
        onConfirm={() => {
          setShowLogoutConfirm(false)
          onClose && onClose()
          window.dispatchEvent(new Event('grow:logout'))
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  )
}
