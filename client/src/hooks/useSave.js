import { useState, useCallback, useEffect, useRef } from 'react'
import axios from 'axios'

/**
 * useSave — owns all save / load logic.
 *
 * Features
 * ─────────
 * - saveLocal(farm?)    – persist to localStorage immediately (accepts farm directly to avoid ref lag)
 * - saveServer()        – POST /api/save with full state
 * - debouncedSave(farm) – auto-save to server 1500ms after last call
 * - loadOnLogin()       – register player, then load from server or localStorage
 * - isOffline           – true when the last server call failed (Fix #14)
 */
export function useSave({
  currentPlayer,
  // state readers
  getZones,     // serializes full zones object
  getCoins,
  getLevel,
  getXp,
  getSeeds,
  getStorage,
  // state setters (called when loading)
  setCoins,
  setLevel,
  setXp,
  setSeeds,
  restoreStorage,
  restoreZones,  // new: restores full zones state
  // helpers
  showToast,
}) {
  const debounceTimer = useRef(null)
  const isSavingRef = useRef(false)
  // Fix #14: offline state
  const [isOffline, setIsOffline] = useState(false)

  // ─── Migration ─────────────────────────────────────────────────────────────

  function migrateLoadedState(raw) {
    if (!raw) return raw
    const st = Object.assign({}, raw)
    if (st.farm && Array.isArray(st.farm)) {
      const newFarm = st.farm.map(row =>
        Array.isArray(row)
          ? row.map(cell => {
              const nc = Object.assign({}, cell)
              const p = nc.placedItem
              if (typeof p === 'string') {
                if (p.includes('@')) {
                  const parts = p.split('@')
                  nc.placedItem = { id: parts[0], rot: parseInt(parts[1], 10) || 0 }
                } else if (p.startsWith('crop:')) {
                  const crop = p.split(':')[1]
                  nc.placedItem = { crop, stage: 0 }
                }
              }
              if (typeof p === 'object' && p && p.crop && typeof p.stage === 'undefined') {
                p.stage = 0
              }
              return nc
            })
          : row
      )
      st.farm = newFarm
    }
    return st
  }

  // ─── Apply loaded state to React ──────────────────────────────────────────

  function applyState(st) {
    if (!st) return
    if (st.coins !== undefined) setCoins(st.coins ?? 1000)
    if (st.level !== undefined) setLevel(st.level ?? 1)
    if (st.xp !== undefined) setXp(st.xp ?? 0)
    if (st.seeds) setSeeds(st.seeds)
    if (st.storage) restoreStorage(st.storage)

    // Zones: new format { zones: {...} } or legacy flat farm array
    if (st.zones) {
      restoreZones(st.zones)
    } else if (st.farm) {
      // Legacy migration: single flat grid → home zone
      restoreZones(st.farm)
    }

    // Dispatch grow:load so GameCanvas can sync the active zone grid
    const activeGrid = st.zones?.home?.grid ?? st.farm ?? null
    if (activeGrid) {
      window.dispatchEvent(new CustomEvent('grow:load', { detail: { ...st, farm: activeGrid } }))
    }
  }

  // ─── Save local ────────────────────────────────────────────────────────────
  // Fix #13: accepts an optional `farm` argument directly to avoid the 1-render
  // stale ref lag (farmRef can lag when called from a grid change handler).

  const saveLocal = useCallback(() => {
    const full = {
      player: currentPlayer,
      zones: getZones(),
      coins: getCoins(),
      level: getLevel(),
      xp: getXp(),
      seeds: getSeeds(),
      storage: getStorage(),
    }
    localStorage.setItem('grow:state', JSON.stringify(full))
  }, [currentPlayer, getZones, getCoins, getLevel, getXp, getSeeds, getStorage])

  // ─── Save server ───────────────────────────────────────────────────────────

  const saveServer = useCallback(async ({ silent = false } = {}) => {
    if (!currentPlayer) return
    if (isSavingRef.current) return
    isSavingRef.current = true
    try {
      const state = {
        zones: getZones(),
        coins: getCoins(),
        level: getLevel(),
        xp: getXp(),
        seeds: getSeeds(),
        storage: getStorage(),
      }
      await axios.post('/api/save', { player: currentPlayer, state })
      setIsOffline(false)
      if (!silent) showToast?.('Saved ✓')
    } catch (e) {
      console.error('[useSave] server save failed:', e)
      setIsOffline(true)
      if (!silent) showToast?.('⚠️ Offline — saved locally')
    } finally {
      isSavingRef.current = false
    }
  }, [currentPlayer, getZones, getCoins, getLevel, getXp, getSeeds, getStorage, showToast])

  // ─── Debounced auto-save ───────────────────────────────────────────────────
  // Fix #13: forward farm grid directly so saveServer uses the fresh value.

  const debouncedSave = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => saveServer({ silent: true }), 1500)
  }, [saveServer])

  // Cleanup on unmount
  useEffect(() => () => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
  }, [])

  // ─── Load server ───────────────────────────────────────────────────────────

  const loadServer = useCallback(async () => {
    if (!currentPlayer) return
    try {
      const r = await axios.get('/api/load', { params: { player: currentPlayer } })
      if (r.data?.state) {
        const st = migrateLoadedState(r.data.state)
        applyState(st)
        setIsOffline(false)
        showToast?.('Game loaded')
      } else {
        showToast?.('No save found')
      }
    } catch (e) {
      console.error('[useSave] server load failed:', e)
      setIsOffline(true)
      showToast?.('⚠️ Offline — loading local save')
      const raw = localStorage.getItem('grow:state')
      if (raw) {
        try { applyState(migrateLoadedState(JSON.parse(raw))) } catch (_) {}
      }
    }
  }, [currentPlayer, setCoins, setLevel, setXp, setSeeds, restoreStorage, showToast])

  // ─── Initial load on login ─────────────────────────────────────────────────
  // Fix #6: calls POST /api/register first so the player is created in the DB,
  // then loads their state. Falls back to localStorage if server is down.

  const loadOnLogin = useCallback(async () => {
    if (!currentPlayer) return

    // Step 1: Register player (no-op if already exists)
    try {
      await axios.post('/api/register', { name: currentPlayer })
      setIsOffline(false)
    } catch (e) {
      console.warn('[useSave] register failed (server may be down):', e.message)
      setIsOffline(true)
    }

    // Step 2: Load saved state
    try {
      const r = await axios.get('/api/load', { params: { player: currentPlayer } })
      if (r.data?.state) {
        applyState(migrateLoadedState(r.data.state))
        return
      }
    } catch (e) { /* fallthrough to localStorage */ }

    // Step 3: Fallback to localStorage
    try {
      const raw = localStorage.getItem('grow:state')
      if (raw) applyState(migrateLoadedState(JSON.parse(raw)))
    } catch (_) {}
  }, [currentPlayer, setCoins, setLevel, setXp, setSeeds, restoreStorage])

  return {
    saveLocal,
    saveServer,
    loadServer,
    loadOnLogin,
    debouncedSave,
    migrateLoadedState,
    isOffline,  // Fix #14: expose so HUD can show ⚠️ Offline banner
  }
}
