// Storage service for managing silo and barn capacity, items, and upgrades

export const STORAGE_TYPES = {
  SILO: 'silo',
  BARN: 'barn'
}

export const UPGRADE_LEVELS = {
  silo: [
    { level: 1, capacity: 50, image: '/assets/storage/silo/silo1.png', cost: 0, materials: {} },
    { level: 2, capacity: 100, image: '/assets/storage/silo/silo1.png', cost: 500, materials: { wood: 50, stone: 30 } },
    { level: 3, capacity: 150, image: '/assets/storage/silo/silo1.png', cost: 1000, materials: { wood: 100, stone: 60, iron: 20 } },
    { level: 4, capacity: 200, image: '/assets/storage/silo/silo1.png', cost: 2000, materials: { wood: 150, stone: 100, iron: 50, copper: 30 } },
    { level: 5, capacity: 250, image: '/assets/storage/silo/silo1.png', cost: 3500, materials: { wood: 200, stone: 150, iron: 100, copper: 50 } },
    { level: 6, capacity: 300, image: '/assets/storage/silo/silo1.png', cost: 5000, materials: { wood: 250, stone: 200, iron: 150, copper: 80 } }
  ],
  barn: [
    { level: 1, capacity: 50, image: '/assets/storage/barn/barn1.png', cost: 0, materials: {} },
    { level: 2, capacity: 100, image: '/assets/storage/barn/barn2.png', cost: 5, materials: { wood: 40, stone: 20 } },
    { level: 3, capacity: 150, image: '/assets/storage/barn/barn3.png', cost: 15, materials: { wood: 80, stone: 50, iron: 15 } },
    { level: 4, capacity: 200, image: '/assets/storage/barn/barn4.png', cost: 25, materials: { wood: 120, stone: 80, iron: 40, copper: 25 } },
    { level: 5, capacity: 250, image: '/assets/storage/barn/barn4.png', cost: 2500, materials: { wood: 160, stone: 120, iron: 80, copper: 40 } },
    { level: 6, capacity: 300, image: '/assets/storage/barn/barn4.png', cost: 4000, materials: { wood: 200, stone: 150, iron: 120, copper: 60 } }
  ]
}

export const createEmptyStorage = (type) => {
  const levels = UPGRADE_LEVELS[type]
  const level1 = levels[0]
  
  return {
    type,
    level: 1,
    capacity: level1.capacity,
    items: [],
    totalStored: 0,
    createdAt: Date.now(),
    upgradedAt: null,
    purchased: false // Track if user has purchased/upgraded this storage
  }
}

export const canStoreItem = (storage, item, quantity = 1) => {
  const itemSize = item.size || 1
  const requiredSpace = itemSize * quantity
  return (storage.totalStored + requiredSpace) <= storage.capacity
}

export const addItemToStorage = (storage, item, quantity = 1) => {
  if (!canStoreItem(storage, item, quantity)) {
    return false
  }
  
  const itemSize = item.size || 1
  const requiredSpace = itemSize * quantity
  
  const existingItem = storage.items.find(i => i.id === item.id)
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    storage.items.push({
      id: item.id,
      name: item.name,
      quantity: quantity,
      size: itemSize
    })
  }
  
  storage.totalStored += requiredSpace
  return true
}

export const removeItemFromStorage = (storage, itemId, quantity = 1) => {
  const item = storage.items.find(i => i.id === itemId)
  if (!item || item.quantity < quantity) {
    return false
  }
  
  const requiredSpace = item.size * quantity
  item.quantity -= quantity
  
  if (item.quantity <= 0) {
    storage.items = storage.items.filter(i => i.id !== itemId)
  }
  
  storage.totalStored = Math.max(0, storage.totalStored - requiredSpace)
  return true
}

export const getUpgradeInfo = (type, currentLevel) => {
  const levels = UPGRADE_LEVELS[type]
  if (currentLevel >= levels.length) {
    return null // Max level
  }
  return levels[currentLevel]
}

export const canUpgrade = (storage, playerResources) => {
  const upgradeInfo = getUpgradeInfo(storage.type, storage.level)
  if (!upgradeInfo) return false
  
  // Check if player has enough coins
  if (playerResources.coins < upgradeInfo.cost) {
    return false
  }
  
  // Check if player has all required materials
  for (const [material, needed] of Object.entries(upgradeInfo.materials)) {
    if ((playerResources[material] || 0) < needed) {
      return false
    }
  }
  
  return true
}

export const performUpgrade = (storage, playerResources) => {
  if (!canUpgrade(storage, playerResources)) {
    return false
  }
  
  const upgradeInfo = getUpgradeInfo(storage.type, storage.level)
  if (!upgradeInfo) return false
  
  // Deduct costs - MUTATE playerResources (this is a reference, caller handles state)
  playerResources.coins -= upgradeInfo.cost
  
  for (const [material, amount] of Object.entries(upgradeInfo.materials)) {
    playerResources[material] = (playerResources[material] || 0) - amount
  }
  
  // Upgrade the storage - CREATE NEW OBJECT for React to detect state change
  const newStorage = {
    ...storage,
    level: storage.level + 1,
    capacity: upgradeInfo.capacity,
    upgradedAt: Date.now(),
    purchased: true // Mark as purchased when upgraded
  }
  
  // Copy items array to new object
  newStorage.items = [...storage.items]
  
  // Update the original storage reference with new values for immediate effect
  Object.assign(storage, newStorage)
  
  return true
}

export const getStoragePercentage = (storage) => {
  return Math.round((storage.totalStored / storage.capacity) * 100)
}

export const isStorageFull = (storage) => {
  return storage.totalStored >= storage.capacity
}
