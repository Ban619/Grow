import { useState, useCallback } from 'react'
import { createEmptyStorage } from '../components/features/storage/storageService'

/**
 * useStorage — owns silo, barn, storage modal, and playerResources.
 *
 * Fix #8: adds addHarvestedCrop(cropName) which puts the crop into the silo.
 * Fix #16: handleOpenStorage(storageType) records which building was tapped
 *          so StorageModal can open on the right tab.
 */
export function useStorage({ coins } = {}) {
  const [silo, setSilo] = useState(() => createEmptyStorage('silo'))
  const [barn, setBarn] = useState(() => createEmptyStorage('barn'))
  const [storageModalOpen, setStorageModalOpen] = useState(false)
  // Fix #16: track which tab to open (null = default)
  const [selectedStorage, setSelectedStorage] = useState('silo')
  const [playerResources, setPlayerResources] = useState({ coins: 1000, wood: 0, stone: 0, iron: 0, copper: 0 })

  // Fix #16: pass 'barn' or 'silo' to open on the correct tab
  const handleOpenStorage = useCallback((storageType) => {
    setSelectedStorage(storageType || 'silo')
    setStorageModalOpen(true)
  }, [])

  const handleCloseStorageModal = useCallback(() => {
    setStorageModalOpen(false)
  }, [])

  const handleSiloUpgrade = useCallback((updatedSilo) => setSilo(updatedSilo), [])
  const handleBarnUpgrade = useCallback((updatedBarn) => setBarn(updatedBarn), [])

  const handleResourceChange = useCallback((updatedResources, { setCoins } = {}) => {
    setPlayerResources(updatedResources)
    if (updatedResources.coins !== undefined && setCoins) {
      setCoins(updatedResources.coins)
    }
  }, [])

  /** Call after coins change to keep playerResources in sync. */
  const syncCoins = useCallback((newCoins) => {
    setPlayerResources(r => r.coins === newCoins ? r : { ...r, coins: newCoins })
  }, [])

  /**
   * Fix #8: After a successful harvest, add the crop to the silo.
   * Shows a "Silo full!" warning if capacity is exceeded.
   * @param {string} cropName  e.g. 'rice', 'corn'
   * @param {function} showToast
   */
  const addHarvestedCrop = useCallback((cropName, showToast) => {
    setSilo(prev => {
      const items = { ...(prev.items || {}) }
      const capacity = prev.capacity || 100
      const totalStored = Object.values(items).reduce((sum, n) => sum + (n || 0), 0)
      if (totalStored >= capacity) {
        showToast?.('🌾 Silo full! Sell or upgrade to store more.')
        return prev
      }
      items[cropName] = (items[cropName] || 0) + 1
      return { ...prev, items }
    })
  }, [])

  /**
   * Restore storage from a saved state object (from server or localStorage).
   * shape: { silo: {...}, barn: {...} }
   */
  const restoreStorage = useCallback((storageData) => {
    if (!storageData) return
    if (storageData.silo) setSilo(s => ({ ...s, ...storageData.silo }))
    if (storageData.barn) setBarn(b => ({ ...b, ...storageData.barn }))
  }, [])

  /** Serialise current storage state for saving. */
  const serializeStorage = useCallback(() => ({ silo, barn }), [silo, barn])

  return {
    silo, setSilo,
    barn, setBarn,
    storageModalOpen,
    selectedStorage,
    playerResources, setPlayerResources,
    handleOpenStorage,
    handleCloseStorageModal,
    handleSiloUpgrade,
    handleBarnUpgrade,
    handleResourceChange,
    syncCoins,
    addHarvestedCrop,
    restoreStorage,
    serializeStorage,
  }
}
