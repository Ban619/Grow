import { useState, useCallback, useRef } from 'react'
import {
  ZONE_DEFS,
  HOME_ZONE_ID,
  makeInitialZonesState,
  makeZoneGrid,
  ZONE_MAP,
} from '../utils/zones'

/**
 * useZones — owns the entire multi-zone world state.
 *
 * Data shape:
 *   zones: {
 *     home:     { unlocked: true,  grid: [[...], ...] },
 *     east:     { unlocked: false, grid: null         },
 *     paradise: { unlocked: false, grid: null         },
 *     ...
 *   }
 *
 * The "active zone" is the one the player is currently interacting with.
 * All farm operations (plant, harvest, build) target the active zone's grid.
 */
export function useZones() {
  const [zones, setZones] = useState(() => makeInitialZonesState())
  const [activeZoneId, setActiveZoneId] = useState(HOME_ZONE_ID)

  // Stable ref so GameCanvas RAF loop can read without re-render dependency
  const zonesRef = useRef(zones)
  const activeZoneIdRef = useRef(activeZoneId)

  // Keep refs in sync
  const _setZones = useCallback((updater) => {
    setZones(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      zonesRef.current = next
      return next
    })
  }, [])

  const _setActiveZoneId = useCallback((id) => {
    activeZoneIdRef.current = id
    setActiveZoneId(id)
  }, [])

  // ── Active zone grid ────────────────────────────────────────────────────────

  const getActiveGrid = useCallback(() =>
    zonesRef.current[activeZoneIdRef.current]?.grid ?? null
  , [])

  const setActiveGrid = useCallback((gridOrUpdater) => {
    _setZones(prev => {
      const id = activeZoneIdRef.current
      const current = prev[id]?.grid
      const next = typeof gridOrUpdater === 'function'
        ? gridOrUpdater(current)
        : gridOrUpdater
      return { ...prev, [id]: { ...prev[id], grid: next } }
    })
  }, [_setZones])

  // ── Switch active zone ───────────────────────────────────────────────────────

  const switchZone = useCallback((zoneId) => {
    if (!zonesRef.current[zoneId]?.unlocked) return false
    _setActiveZoneId(zoneId)
    return true
  }, [_setActiveZoneId])

  // ── Unlock a zone ────────────────────────────────────────────────────────────

  /**
   * Unlock a zone after the player has paid.
   * Generates an empty grid for the zone using its zone-specific tile type.
   * @param {string} zoneId
   */
  const unlockZone = useCallback((zoneId) => {
    const def = ZONE_MAP[zoneId]
    if (!def) return false
    _setZones(prev => {
      if (prev[zoneId]?.unlocked) return prev  // already open
      return {
        ...prev,
        [zoneId]: {
          unlocked: true,
          grid: makeZoneGrid(def, 'grass'),
        },
      }
    })
    return true
  }, [_setZones])

  // ── Grid change for a specific zone (used by onStateChange) ─────────────────

  const setZoneGrid = useCallback((zoneId, gridOrUpdater) => {
    _setZones(prev => {
      const current = prev[zoneId]?.grid
      const next = typeof gridOrUpdater === 'function'
        ? gridOrUpdater(current)
        : gridOrUpdater
      return { ...prev, [zoneId]: { ...prev[zoneId], grid: next } }
    })
  }, [_setZones])

  // ── Serialization (for save) ─────────────────────────────────────────────────

  const serializeZones = useCallback(() => {
    const out = {}
    for (const [id, state] of Object.entries(zonesRef.current)) {
      out[id] = { unlocked: state.unlocked, grid: state.grid }
    }
    return out
  }, [])

  // ── Restoration (from save / server load) ────────────────────────────────────
  // Migration: if `data` is a plain 2D array (old single-grid format), treat it
  // as the home zone grid.

  const restoreZones = useCallback((data) => {
    if (!data) return

    // Legacy migration: flat array = old grow:grid
    if (Array.isArray(data)) {
      _setZones(prev => ({
        ...prev,
        home: { unlocked: true, grid: data },
      }))
      return
    }

    // New format: { home: { unlocked, grid }, east: {...}, ... }
    if (typeof data === 'object') {
      _setZones(prev => {
        const next = { ...prev }
        for (const [id, state] of Object.entries(data)) {
          if (next[id] !== undefined) {
            next[id] = {
              unlocked: state.unlocked ?? false,
              grid: state.grid ?? (state.unlocked ? makeZoneGrid(ZONE_MAP[id] || ZONE_DEFS[0]) : null),
            }
          }
        }
        return next
      })
    }
  }, [_setZones])

  // ── Can player afford to unlock a zone? ─────────────────────────────────────

  const canUnlock = useCallback((zoneId, coins, level) => {
    const def = ZONE_MAP[zoneId]
    if (!def) return false
    return coins >= def.unlockCost && level >= def.unlockLevel
  }, [])

  return {
    // State
    zones,
    zonesRef,
    activeZoneId,
    activeZoneIdRef,

    // Active zone
    getActiveGrid,
    setActiveGrid,
    switchZone,

    // Zone management
    unlockZone,
    setZoneGrid,
    canUnlock,

    // Persistence
    serializeZones,
    restoreZones,
  }
}
