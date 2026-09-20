// Item metadata and integration service for storage system

export const ITEM_META = {
  // Main crops - Silo (Crops)
  rice: { emoji: '🍚', color: '#f5deb3', border: '#d4a574', label: 'Rice', category: 'crop', size: 1 },
  pechay: { emoji: '🥬', color: '#7cb342', border: '#558b2f', label: 'Pechay', category: 'crop', size: 1 },
  corn: { emoji: '🌽', color: '#f0c030', border: '#c89820', label: 'Corn', category: 'crop', size: 1 },
  berry: { emoji: '🍓', color: '#e84060', border: '#b82040', label: 'Berry', category: 'crop', size: 1 },
  
  // Seasonal crops
  snowwheat: { emoji: '❄️', color: '#c8e8ff', border: '#6a9acc', label: 'Snow Wheat', category: 'crop', seasonal: true, size: 1 },
  icepumpkin: { emoji: '🧊', color: '#b0e0ff', border: '#4a8acc', label: 'Ice Pumpkin', category: 'crop', seasonal: true, size: 1 },
  tulip: { emoji: '🌷', color: '#f0a0c8', border: '#d06099', label: 'Tulip', category: 'crop', seasonal: true, size: 1 },
  springcorn: { emoji: '🌽', color: '#d0f030', border: '#a0c820', label: 'Spring Corn', category: 'crop', seasonal: true, size: 1 },
  sunflower: { emoji: '🌻', color: '#ffde30', border: '#d0a820', label: 'Sunflower', category: 'crop', seasonal: true, size: 1 },
  honeydew: { emoji: '🍈', color: '#b0f060', border: '#78a830', label: 'Honeydew', category: 'crop', seasonal: true, size: 1 },
  pumpkinpatch: { emoji: '🎃', color: '#ff8820', border: '#cc5010', label: 'Pumpkin Patch', category: 'crop', seasonal: true, size: 1 },
  harvestwheat: { emoji: '🌾', color: '#f0c840', border: '#c0a020', label: 'Harvest Wheat', category: 'crop', seasonal: true, size: 1 },
  
  // Barn - Production items
  flour: { emoji: '🥔', color: '#e8d8a0', border: '#b8a070', label: 'Flour', category: 'production', size: 1 },
  cornmeal: { emoji: '🌽', color: '#f0c830', border: '#c89820', label: 'Cornmeal', category: 'production', size: 1 },
  juice: { emoji: '🧃', color: '#e84060', border: '#b82040', label: 'Juice', category: 'production', size: 1 },
  pumpkin_pie: { emoji: '🥧', color: '#e87028', border: '#c05010', label: 'Pumpkin Pie', category: 'production', size: 1 },
  
  // Resources
  wood: { emoji: '🪵', color: '#8b6f47', border: '#6b4f27', label: 'Wood', category: 'resource', size: 0.5 },
  stone: { emoji: '🪨', color: '#a0a0a0', border: '#707070', label: 'Stone', category: 'resource', size: 0.5 },
  iron: { emoji: '⚙️', color: '#808080', border: '#505050', label: 'Iron', category: 'resource', size: 0.5 },
  copper: { emoji: '🟠', color: '#b85c3c', border: '#883c1c', label: 'Copper', category: 'resource', size: 0.5 },
}

/**
 * Get metadata for an item by ID
 * @param {string} itemId - The item identifier
 * @returns {object} Item metadata with emoji, color, label, etc.
 */
export const getItemMeta = (itemId) => {
  return ITEM_META[itemId] || {
    emoji: '📦',
    color: '#888888',
    border: '#666666',
    label: itemId.charAt(0).toUpperCase() + itemId.slice(1),
    category: 'unknown',
    size: 1
  }
}

/**
 * Get all items of a specific category
 * @param {string} category - 'crop', 'production', 'resource'
 * @returns {object} Filtered items by category
 */
export const getItemsByCategory = (category) => {
  return Object.entries(ITEM_META).reduce((acc, [id, meta]) => {
    if (meta.category === category) {
      acc[id] = meta
    }
    return acc
  }, {})
}

/**
 * Create an item object for storage
 * @param {string} id - Item ID
 * @param {number} quantity - Quantity to store
 * @returns {object} Storage-compatible item object
 */
export const createStorageItem = (id, quantity = 1) => {
  const meta = getItemMeta(id)
  return {
    id,
    name: meta.label,
    quantity,
    size: meta.size,
    category: meta.category,
    emoji: meta.emoji,
    color: meta.color
  }
}

/**
 * Check if an item type is valid for storage type
 * @param {string} itemId - Item ID
 * @param {string} storageType - 'silo' or 'barn'
 * @returns {boolean}
 */
export const isItemValidForStorage = (itemId, storageType) => {
  const meta = getItemMeta(itemId)
  
  if (storageType === 'silo') {
    // Silo stores only crops
    return meta.category === 'crop'
  } else if (storageType === 'barn') {
    // Barn stores production items and resources
    return meta.category === 'production' || meta.category === 'resource'
  }
  
  return false
}

/**
 * Get emoji representation for an item
 * @param {string} itemId - Item ID
 * @returns {string} Emoji character
 */
export const getItemEmoji = (itemId) => {
  return getItemMeta(itemId).emoji
}

/**
 * Get color scheme for an item
 * @param {string} itemId - Item ID
 * @returns {object} {color, border}
 */
export const getItemColor = (itemId) => {
  const meta = getItemMeta(itemId)
  return {
    color: meta.color,
    border: meta.border
  }
}
