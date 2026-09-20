import { useState, useRef, useEffect, useCallback } from 'react'
import axios from 'axios'

const SEED_PRICES = { rice: 10, pechay: 15, corn: 20, berry: 15, wheat: 20, pumpkin: 100 }

/**
 * useGameState — owns coins, diamonds, level, xp, seeds, selectedSeed.
 * Accepts playExp and playBuy callbacks from useAudio.
 *
 * XP formula: level up when xp (within-level) >= level * 100.
 * This MUST match ProgressionService.xpRequiredForNextLevel on the server.
 *
 * buySeed() calls POST /api/seeds/buy and uses the server's returned coins +
 * seeds as source of truth, falling back to local deduction on network failure.
 */
export function useGameState({ playExp = null, playBuy = null } = {}) {
  const [coins, setCoins] = useState(1000)
  const [diamonds, setDiamonds] = useState(0)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [seeds, setSeeds] = useState({ wheat: 0, corn: 0, berry: 0, pumpkin: 0 })
  const [selectedSeed, setSelectedSeed] = useState('wheat')

  // play XP sound only on level-up (not on first render)
  const prevLevelRef = useRef(level)
  const isMountRef = useRef(true)
  useEffect(() => {
    if (isMountRef.current) { isMountRef.current = false; return }
    if (level > prevLevelRef.current) {
      playExp?.()
    }
    prevLevelRef.current = level
  }, [level])

  /**
   * addXP — adds XP locally and handles level-up.
   * Formula: xp within the current level bucket. Level-up fires when
   * accumulated XP in that bucket >= level * 100.
   * This is the CLIENT-SIDE formula. The server uses the same via
   * ProgressionService.xpRequiredForNextLevel.
   */
  const addXP = useCallback((amount) => {
    if (!amount || amount <= 0) return
    setXp(prevXp => {
      let xpTotal = prevXp + amount
      let lvl = level
      // consume full level buckets
      while (xpTotal >= lvl * 100) {
        xpTotal -= lvl * 100
        lvl++
      }
      if (lvl !== level) setLevel(lvl)
      return xpTotal
    })
  }, [level])

  /**
   * syncFromServer — applies server-authoritative level + xp values.
   * Called after any server response that returns { coins, xp, level }.
   * Computes the within-level XP remainder so the bar shows correctly.
   */
  const syncFromServer = useCallback((serverState) => {
    if (!serverState) return
    if (typeof serverState.coins === 'number') setCoins(serverState.coins)
    if (typeof serverState.level === 'number') setLevel(serverState.level)
    if (typeof serverState.xp === 'number') {
      // Server stores TOTAL XP accumulated; our bar shows within-level XP.
      // Re-derive within-level XP using the same formula as ProgressionService.
      const totalXp = serverState.xp
      const serverLevel = serverState.level ?? 1
      let spent = 0
      for (let l = 1; l < serverLevel; l++) spent += l * 100
      const withinLevel = Math.max(0, totalXp - spent)
      setXp(withinLevel)
    }
    if (serverState.seeds) setSeeds(serverState.seeds)
  }, [])

  /** XP needed for the next level-up (matches addXP formula). */
  const xpGoal = level * 100

  /**
   * buySeed — deducts coins and adds seed count.
   * Calls POST /api/seeds/buy first (server-authoritative), falls back to
   * local deduction if the server is unreachable.
   */
  const buySeed = useCallback((type, { showToast, currentPlayer } = {}) => {
    const price = SEED_PRICES[type] || 10
    if (coins < price) { showToast?.('Not enough coins'); return false }

    // Optimistic local update
    setCoins(c => c - price)
    setSeeds(s => ({ ...s, [type]: (s[type] || 0) + 1 }))
    playBuy?.()

    // Sync to server (best-effort)
    if (currentPlayer) {
      axios.post('/api/seeds/buy', { player: currentPlayer, cropType: type, quantity: 1 })
        .then(r => {
          if (r.data?.ok) {
            // Use server's canonical values
            if (typeof r.data.coins === 'number') setCoins(r.data.coins)
            if (r.data.seeds) setSeeds(r.data.seeds)
          }
        })
        .catch(() => {
          // Already applied local fallback — nothing more to do
        })
    }

    return true
  }, [coins, playBuy])

  const formatNumber = (n) => {
    try { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') } catch (e) { return n }
  }

  return {
    coins, setCoins,
    diamonds, setDiamonds,
    level, setLevel,
    xp, setXp,
    seeds, setSeeds,
    selectedSeed, setSelectedSeed,
    xpGoal,
    addXP,
    buySeed,
    syncFromServer,
    formatNumber,
    SEED_PRICES,
  }
}
