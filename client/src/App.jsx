import React, { useEffect, useState, useRef, useCallback } from 'react'
import GameCanvas from './components/GameCanvas'
import GameCanvasBoundary from './components/GameCanvasBoundary'
import Shop from './components/features/shop/Shop'
import Experience from './components/features/experience/Level'
import Chat from './components/features/chat/Chat'
import Inbox from './components/features/inbox/Inbox'
import Settings from './components/features/settings/Settings'
import DirectMessages from './components/features/chat/DirectMessages'
import Tutorial from './components/features/tutorial/Tutorial'
import { dispatchTutorialEvent } from './components/features/tutorial/tutorialEvents'
import IntermediateTutorial from './components/features/tutorial/IntermediateTutorial'
import Login from './components/Login'
import LoadingScreen from './components/LoadingScreen'
import StorageModal from './components/features/storage/StorageModal'
import StorageTracker from './components/features/storage/StorageTracker'
import StorageCapacityButton from './components/features/storage/StorageCapacityButton'
import ZoneUnlockDialog from './components/ZoneUnlockDialog'
import ZoneMinimap from './components/ZoneMinimap'

// Custom hooks
import { useAudio } from './hooks/useAudio'
import { useGameState } from './hooks/useGameState'
import { useStorage } from './hooks/useStorage'
import { useSave } from './hooks/useSave'
import { useZones } from './hooks/useZones'

import './styles/features.css'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isBuildingPlaced = (farm, buildingType) => {
  if (!farm || !Array.isArray(farm)) return false
  return farm.some(row =>
    Array.isArray(row) && row.some(tile => tile.placedItem?.id === buildingType)
  )
}

// ─── Toast queue hook ─────────────────────────────────────────────────────────
function useToastQueue() {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const showToast = useCallback((msg, ms = 1800) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, msg }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ms)
  }, [])

  // Allow window events to push toasts without prop access
  useEffect(() => {
    const handler = (e) => {
      const { message, duration = 2500 } = e.detail || {}
      if (message) showToast(message, duration)
    }
    window.addEventListener('grow:toast', handler)
    return () => window.removeEventListener('grow:toast', handler)
  }, [showToast])

  return { toasts, showToast }
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Auth
  const [authState, setAuthState] = useState('login')   // 'login' | 'loading' | 'game'
  const [currentPlayer, setCurrentPlayer] = useState(null)

  // UI panels
  const [chatOpen, setChatOpen] = useState(false)
  const [inboxOpen, setInboxOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [directMessagesOpen, setDirectMessagesOpen] = useState(false)
  const [showShop, setShowShop] = useState(false)
  const [placingBuilding, setPlacingBuilding] = useState(null)
  const [purchaseMode, setPurchaseMode] = useState('reserve')
  const [tutorialComplete, setTutorialComplete] = useState(false)

  // ─── Inbox (persisted read-state) ─────────────────────────────────────────
  const STATIC_INBOX = [
    { id: 1, title: 'Update 1.02', body: 'New balance UI and bug fixes', read: false },
    { id: 2, title: 'Welcome', body: 'Thanks for playing!', read: false },
  ]
  const [inboxMessages, setInboxMessages] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('grow:inbox') || '[]')
      if (saved.length) {
        return STATIC_INBOX.map(m => ({ ...m, read: saved.find(s => s.id === m.id)?.read ?? false }))
      }
    } catch (_) {}
    return STATIC_INBOX
  })

  // Bug #5: derive alert count from actual unread messages (was hardcoded 3)
  const [diamondAlerts, setDiamondAlerts] = useState(() =>
    STATIC_INBOX.filter(m => !m.read).length
  )

  // Persist inbox reads
  useEffect(() => {
    localStorage.setItem('grow:inbox', JSON.stringify(inboxMessages.map(m => ({ id: m.id, read: m.read }))))
    setDiamondAlerts(inboxMessages.filter(m => !m.read).length)
  }, [inboxMessages])

  // ─── Toast queue ──────────────────────────────────────────────────────────
  const { toasts, showToast } = useToastQueue()

  // ─── Audio ────────────────────────────────────────────────────────────────
  const audio = useAudio()

  // ─── Game state ─────────────────────────────────────────────────────────────
  const game = useGameState({ playExp: audio.playExp, playBuy: audio.playBuy })

  // ─── Multi-zone world state ───────────────────────────────────────────────
  const zones = useZones()
  const [unlockDialogZone, setUnlockDialogZone] = useState(null)  // zoneId or null

  // Handle zone unlock: deduct coins, unlock zone, close dialog
  const handleUnlockConfirm = useCallback((zoneId, cost) => {
    if (game.coins < cost) { showToast('Not enough coins!'); return }
    game.setCoins(c => c - cost)
    zones.unlockZone(zoneId)
    setUnlockDialogZone(null)
    showToast(`🎉 ${zoneId} unlocked!`)
    // Jump camera to newly unlocked zone
    window.dispatchEvent(new CustomEvent('grow:jumpZone', { detail: { zoneId } }))
  }, [game, zones, showToast])

  // ─── Farm ref — still used by isBuildingPlaced for storage button visibility ──
  const farmRef = useRef(null)

  // ─── Storage ──────────────────────────────────────────────────────────────
  const storage = useStorage()

  // Keep playerResources.coins in sync with game.coins
  useEffect(() => {
    storage.syncCoins(game.coins)
  }, [game.coins])

  // ─── Save / Load ─────────────────────────────────────────────────────────────
  const save = useSave({
    currentPlayer,
    getZones: zones.serializeZones,
    getCoins: () => game.coins,
    getLevel: () => game.level,
    getXp: () => game.xp,
    getSeeds: () => game.seeds,
    getStorage: storage.serializeStorage,
    setCoins: game.setCoins,
    setLevel: game.setLevel,
    setXp: game.setXp,
    setSeeds: game.setSeeds,
    restoreStorage: storage.restoreStorage,
    restoreZones: zones.restoreZones,
    showToast,
  })

  // ─── Auth flow ────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleLogout = () => {
      setAuthState('login')
      setCurrentPlayer(null)
      setSettingsOpen(false)
    }
    window.addEventListener('grow:logout', handleLogout)
    return () => window.removeEventListener('grow:logout', handleLogout)
  }, [])

  // Load player data when entering 'loading' state
  useEffect(() => {
    if (authState !== 'loading' || !currentPlayer) return
    let mounted = true
    save.loadOnLogin().then(() => {
      if (mounted) setAuthState('game')
    })
    return () => { mounted = false }
  }, [authState, currentPlayer])

  // ─── Background music ─────────────────────────────────────────────────────
  useEffect(() => {
    if (authState === 'game') {
      audio.startMusic()
    } else {
      audio.stopMusic()
    }
  }, [authState])

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const SEED_KEYS = { '1': 'rice', '2': 'corn', '3': 'berry', '4': 'pumpkin' }
    const onKey = (e) => {
      if (SEED_KEYS[e.key]) game.setSelectedSeed(SEED_KEYS[e.key])
      if ((e.key === 'b' || e.key === 'B') && authState === 'game') {
        game.buySeed(game.selectedSeed, { showToast })
        dispatchTutorialEvent('seedsPurchased', { seedType: game.selectedSeed })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [game.selectedSeed, game.coins, game.seeds, authState])

  // ESC cancels placement; grow:openShop opens shop
  useEffect(() => {
    const onEsc = (e) => {
      if ((e.key === 'Escape' || e.key === 'Esc') && placingBuilding) {
        if (typeof placingBuilding === 'object' && placingBuilding.reserved) {
          game.setCoins(c => c + (placingBuilding.cost || 0))
        }
        setPlacingBuilding(null)
        showToast('Placement canceled')
        window.dispatchEvent(new Event('grow:cancelPlacement'))
      }
    }
    const onOpenShop = () => {
      setShowShop(true)
      window.dispatchEvent(new CustomEvent('shopOpened', {}))
    }
    window.addEventListener('keydown', onEsc)
    window.addEventListener('grow:openShop', onOpenShop)
    return () => {
      window.removeEventListener('keydown', onEsc)
      window.removeEventListener('grow:openShop', onOpenShop)
    }
  }, [placingBuilding])

  // ─── Farm change handler: update active zone grid + debounced save ────────────
  const handleFarmChange = useCallback((grid) => {
    farmRef.current = grid
    zones.setZoneGrid(zones.activeZoneId, grid)
    save.saveLocal()      // reads getZones() directly — no stale ref
    save.debouncedSave()  // debounced server sync
  }, [save, zones])

  // Fix #8: listen for harvest events from GameCanvas and add crop to silo
  useEffect(() => {
    const handler = (e) => {
      const { crop } = e.detail || {}
      if (crop) storage.addHarvestedCrop(crop, showToast)
    }
    window.addEventListener('tutorial:cropHarvested', handler)
    return () => window.removeEventListener('tutorial:cropHarvested', handler)
  }, [storage, showToast])

  // ─── Shop buy ─────────────────────────────────────────────────────────────
  // Building specs that GameCanvas actually understands
  const KNOWN_BUILDING_SPECS = new Set(['soil', 'barn', 'silo'])

  const handleShopBuy = (item) => {
    if (!item) return

    if (item.category === 'seeds') {
      // Fix #2: pass currentPlayer so buySeed calls the server
      const bought = game.buySeed(item.id, { showToast, currentPlayer })
      if (bought) dispatchTutorialEvent('seedsPurchased', { seedType: item.id })
      return
    }

    if (item.id === 'soil') {
      if (game.coins < item.cost) { showToast('Not enough coins'); return }
      game.setCoins(c => c - item.cost)
      setPlacingBuilding({ type: 'soil', cost: item.cost, reserved: true })
      setShowShop(false)
      dispatchTutorialEvent('soilPurchased', { itemId: 'soil' })
      audio.playBuy()
      showToast('Click on your farm to place the soil')
      return
    }

    // Unknown / unimplemented building or decoration → coming soon
    if (!KNOWN_BUILDING_SPECS.has(item.id)) {
      showToast(`${item.name} coming soon! 🚧`)
      return
    }

    if (purchaseMode === 'reserve') {
      if (game.coins < item.cost) { showToast('Not enough coins'); return }
      game.setCoins(c => c - item.cost)
      setPlacingBuilding({ type: item.id, cost: item.cost, reserved: true })
      setShowShop(false)
      dispatchTutorialEvent('buildingPurchased', { buildingType: item.id })
      audio.playBuy()
    } else {
      setPlacingBuilding({ type: item.id, cost: item.cost, reserved: false, pending: true })
      setShowShop(false)
      dispatchTutorialEvent('buildingPurchased', { buildingType: item.id })
    }
  }

  // ─── Building placement confirmation ──────────────────────────────────────
  const confirmPlacement = (type, cost) => {
    if (placingBuilding && typeof placingBuilding === 'object' && placingBuilding.type === type) {
      if (placingBuilding.reserved) {
        audio.playBuy()
        setPlacingBuilding(null)
        if (type === 'soil') dispatchTutorialEvent('soilPlaced', { type })
        else dispatchTutorialEvent('tutorial:buildingPlaced', { type })
        return
      }
      if (game.coins < cost) {
        showToast('Not enough coins to finalize placement')
        setPlacingBuilding(null)
        return
      }
      game.setCoins(c => c - cost)
      setPlacingBuilding(null)
      audio.playBuy()
      if (type === 'soil') dispatchTutorialEvent('soilPlaced', { type })
      else window.dispatchEvent(new CustomEvent('tutorial:buildingPlaced', { detail: { type } }))
      return
    }
    // Fallback
    if (game.coins >= cost) {
      game.setCoins(c => c - cost)
      audio.playBuy()
    }
    showToast(`${type} placed`)
    if (type === 'soil') dispatchTutorialEvent('soilPlaced', { type })
    else window.dispatchEvent(new CustomEvent('tutorial:buildingPlaced', { detail: { type } }))
  }

  // ─── Inbox ────────────────────────────────────────────────────────────────
  const handleMarkRead = (id) => {
    setInboxMessages(m => m.map(msg => msg.id === id ? { ...msg, read: true } : msg))
  }

  // ─── Settings ─────────────────────────────────────────────────────────────
  const handleSettingsChange = (vals) => {
    localStorage.setItem('grow:settings', JSON.stringify(vals))
    showToast('Settings saved')
  }

  // ─── Auth screens ─────────────────────────────────────────────────────────
  if (authState === 'login') {
    return <Login onLogin={(name) => { setCurrentPlayer(name); setAuthState('loading') }} screenImage="/screen.png" />
  }
  if (authState === 'loading') {
    return <LoadingScreen loadingImage="/loadingscreen.png" onLoadingComplete={() => setAuthState('game')} playerName={currentPlayer} />
  }

  return (
    <div>
      <main className="container-fluid p-0">
        {/* Bug fix: GameCanvas wrapped in error boundary */}
        <GameCanvasBoundary>
          <GameCanvas
            onStateChange={handleFarmChange}
            setCoins={game.setCoins}
            addXP={game.addXP}
            seeds={game.seeds}
            setSeeds={game.setSeeds}
            selectedSeed={game.selectedSeed}
            showToast={showToast}
            placingBuilding={placingBuilding}
            setPlacingBuilding={setPlacingBuilding}
            onConfirmBuilding={confirmPlacement}
            onOpenStorage={storage.handleOpenStorage}
            barn={storage.barn}
            silo={storage.silo}
            zonesData={zones.zones}
            activeZoneId={zones.activeZoneId}
            onSwitchZone={zones.switchZone}
            onUnlockZone={(zoneId) => setUnlockDialogZone(zoneId)}
          />
        </GameCanvasBoundary>
      </main>

      {/* Bug #2 fix: xpGoal is now level * 100 from the hook, not 190000 */}
      <Experience level={game.level} xp={game.xp} goal={game.xpGoal} />

      {/* Top-right HUD */}
      <div className="top-right-hud" aria-hidden>
        <div className="hud-stack currency-stack">
          <div className="currency-card coins-card">
            <div className="currency-left"><div className="currency-icon">💰</div></div>
            <div className="currency-center">
              <div className="currency-label">Coins</div>
              <div className="currency-amount">{game.formatNumber(game.coins)}</div>
            </div>
            <div className="currency-right">
              <button className="currency-plus" title="Buy coins" onClick={() => showToast('Store coming soon!')}>+</button>
            </div>
          </div>

          <div style={{ height: 8 }} />

          <div className="currency-card diamonds-card">
            <div className="currency-left"><div className="currency-icon">💎</div></div>
            <div className="currency-center">
              <div className="currency-label">Gems</div>
              <div className="currency-amount small">{game.diamonds}</div>
            </div>
            <div className="currency-right">
              <button className="currency-plus" title="Buy gems" onClick={() => showToast('Gem store coming soon!')}>+</button>
            </div>
            {diamondAlerts > 0 && <div className="notify-badge">{diamondAlerts}</div>}
          </div>

          {placingBuilding && (
            <div style={{ marginTop: 8 }}>
              <div className="placing-indicator">
                <div className="dot" aria-hidden />
                <div style={{ fontSize: 13 }}>
                  Placing: {typeof placingBuilding === 'string' ? placingBuilding : placingBuilding.type}
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {typeof placingBuilding === 'object'
                      ? (placingBuilding.reserved ? 'reserved' : (placingBuilding.pending ? 'pending' : 'placing'))
                      : ''}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Left toolbar */}
      <div className="left-toolbar position-fixed">
        <button
          className={`shop-btn${showShop ? ' shop-open' : ''}`}
          title="Shop"
          onClick={() => {
            setShowShop(prev => {
              if (!prev) window.dispatchEvent(new CustomEvent('shopOpened', {}))
              return !prev
            })
          }}
          aria-label="Toggle Shop"
        >
          <img src="/icons/shop.png" alt="Shop" draggable="false" />
        </button>
      </div>

      {/* Side toolbar */}
      <div className="side-toolbar position-fixed">
        {/* Fix #10: opening chat closes DM and vice versa */}
        <button className="side-btn chat" title="Messages" onClick={() => { setDirectMessagesOpen(true); setChatOpen(false) }}>
          <div className="icon">💬</div>
        </button>
        <button className="side-btn mail" title="Inbox" onClick={() => setInboxOpen(true)}>
          <div className="icon">✉️</div>
          {diamondAlerts > 0 && <div className="side-badge">{diamondAlerts}</div>}
        </button>
        <button className="side-btn settings" title="Settings" onClick={() => setSettingsOpen(true)}>
          <div className="icon">⚙️</div>
        </button>
      </div>

      {/* Fix #10: chat panel uses its own toggle; DM closes chat */}
      <Chat open={chatOpen} onClose={() => setChatOpen(false)} onToggle={() => { setChatOpen(s => !s); setDirectMessagesOpen(false) }} playerName={currentPlayer} />
      <DirectMessages open={directMessagesOpen} onClose={() => setDirectMessagesOpen(false)} playerName={currentPlayer} />
      <Inbox open={inboxOpen} onClose={() => setInboxOpen(false)} messages={inboxMessages} onMarkRead={handleMarkRead} />
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        values={JSON.parse(localStorage.getItem('grow:settings') || '{}')}
        onChange={handleSettingsChange}
        onMusicToggle={audio.handleMusicToggle}
        onSoundsToggle={audio.handleSoundsToggle}
        purchaseMode={purchaseMode}
        onPurchaseModeChange={setPurchaseMode}
      />

      {/* Tutorial system */}
      {authState === 'game' && currentPlayer && (
        <>
          <Tutorial playerName={currentPlayer} onStepComplete={(step) => {
            if (step === 'firstPlant') showToast('🎉 Planted your first seed!')
            if (step === 'firstHarvest') showToast('💰 Harvested your first crop!')
            if (step === 'firstBuilding') showToast('🏠 Built your first building!')
            if (step === 'tutorialComplete') {
              setTutorialComplete(true)
              showToast('🎊 Tutorial Complete! Enjoy exploring!')
            }
          }} />
          <IntermediateTutorial playerName={currentPlayer} tutorialComplete={tutorialComplete} />
        </>
      )}

      {/* Shop */}
      <Shop
        open={showShop}
        onClose={() => setShowShop(false)}
        onBuy={handleShopBuy}
        coins={game.coins}
        inventory={game.seeds}
      />

      {/* Storage Modal — Fix #16: pass initialTab so it opens on the tapped building */}
      <StorageModal
        isOpen={storage.storageModalOpen}
        onClose={storage.handleCloseStorageModal}
        initialTab={storage.selectedStorage}
        silo={storage.silo}
        barn={storage.barn}
        playerResources={storage.playerResources}
        onSiloUpgrade={storage.handleSiloUpgrade}
        onBarnUpgrade={storage.handleBarnUpgrade}
        onResourceChange={(r) => storage.handleResourceChange(r, { setCoins: game.setCoins })}
      />

      {/* Storage Tracker */}
      {authState === 'game' && (!storage.barn.purchased || !storage.silo.purchased) && (
        <StorageTracker
          barn={storage.barn}
          silo={storage.silo}
          onOpenStorage={storage.handleOpenStorage}
        />
      )}

      {/* Storage Capacity Button */}
      {authState === 'game' &&
        storage.barn.purchased && storage.silo.purchased &&
        isBuildingPlaced(farmRef.current, 'barn') && isBuildingPlaced(farmRef.current, 'silo') && (
        <StorageCapacityButton
          barn={storage.barn}
          silo={storage.silo}
          onOpenStorage={storage.handleOpenStorage}
        />
      )}

      {/* Zone Unlock Dialog */}
      {unlockDialogZone && (
        <ZoneUnlockDialog
          zoneId={unlockDialogZone}
          coins={game.coins}
          level={game.level}
          onConfirm={handleUnlockConfirm}
          onCancel={() => setUnlockDialogZone(null)}
        />
      )}

      {/* World Minimap */}
      {authState === 'game' && (
        <ZoneMinimap
          zones={zones.zones}
          activeZoneId={zones.activeZoneId}
          onJumpToZone={(zoneId) => {
            zones.switchZone(zoneId)
            window.dispatchEvent(new CustomEvent('grow:jumpZone', { detail: { zoneId } }))
          }}
        />
      )}

      {/* Fix #14: Offline indicator — shown when last server call failed */}
      {save.isOffline && (
        <div style={{
          position: 'fixed', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(200,60,30,0.92)', color: '#fff', padding: '6px 16px',
          borderRadius: 20, fontSize: 13, fontWeight: 700, zIndex: 2000,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>⚠️</span> Offline — progress saved locally
        </div>
      )}

      {/* Toast queue — stacked, centered at top */}
      <div style={{
        position: 'fixed',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
        minWidth: 260,
        maxWidth: '80vw',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="app-toast"
            style={{
              background: 'rgba(20, 20, 20, 0.92)',
              color: '#fff',
              padding: '10px 22px',
              borderRadius: 12,
              boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: 0.2,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              animation: 'fadeInToast 180ms ease',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInToast {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
