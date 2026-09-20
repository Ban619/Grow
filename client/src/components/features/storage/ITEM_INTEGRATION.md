# Item Integration Guide

This document explains how items are integrated with the storage system using the `itemService.js`.

## Overview

The item integration system provides:
- Centralized metadata for all items (crops, production items, resources)
- Visual representations (emojis, colors)
- Item validation and categorization
- Storage-compatible item creation

## Item Categories

### 1. **Crops** (Silo Storage)
- wheat, corn, berry, pumpkin
- snowwheat, icepumpkin, tulip, springcorn
- sunflower, honeydew, pumpkinpatch, harvestwheat

### 2. **Production Items** (Barn Storage)
- flour, cornmeal, juice, pumpkin_pie
- Created when crops are processed

### 3. **Resources** (Barn Storage)
- wood, stone, iron, copper
- Used for building and upgrades

## Using the Item Service

### Get Item Metadata
```javascript
import { getItemMeta } from './features/storage/itemService'

const wheat = getItemMeta('wheat')
// Returns: { emoji: '🌾', color: '#e8b840', border: '#c89020', label: 'Wheat', category: 'crop', size: 1 }

console.log(wheat.emoji)  // '🌾'
console.log(wheat.label)  // 'Wheat'
```

### Create Storage Item
```javascript
import { createStorageItem } from './features/storage/itemService'

const item = createStorageItem('wheat', 5)
// Returns: { id: 'wheat', name: 'Wheat', quantity: 5, size: 1, category: 'crop', emoji: '🌾', color: '#e8b840' }
```

### Validate Item for Storage Type
```javascript
import { isItemValidForStorage } from './features/storage/itemService'

isItemValidForStorage('wheat', 'silo')       // true ✓
isItemValidForStorage('wheat', 'barn')       // false ✗
isItemValidForStorage('flour', 'barn')       // true ✓
isItemValidForStorage('wood', 'barn')        // true ✓
```

### Add Item to Storage
```javascript
import { addItemToStorage, createStorageItem } from './features/storage'

const item = createStorageItem('wheat', 5)
addItemToStorage(silo, item)  // Adds 5 wheat to silo
```

## Item Metadata Structure

Each item has the following metadata:
```javascript
{
  emoji: string,          // Visual representation (e.g., '🌾')
  color: string,          // Background color (hex)
  border: string,         // Border color (hex)
  label: string,          // Display name
  category: string,       // 'crop' | 'production' | 'resource'
  size: number,           // Storage space used (0.5 or 1)
  seasonal?: boolean      // Optional: seasonal crop flag
}
```

## Visual Display

In storage components, items are displayed with:
1. **Emoji icon** - Large visual representation
2. **Item name** - Label from metadata
3. **Quantity** - Number stored
4. **Border color** - Dynamic border based on item type

Example rendered item:
```
🌾 Wheat    x5
[Green border for crop items]
```

## Storage Item Display Integration

### In Silo Component
- Shows all crop items with emoji and name
- Each item displays with color-coded border
- Quantity shown in green badge

### In Barn Component
- Shows production items and resources with emoji
- Same display format as silo
- Different item types visible with distinct colors

## Adding New Items

To add a new item to the system:

1. Add entry to `ITEM_META` in `itemService.js`:
```javascript
ITEM_META = {
  // ... existing items
  newcrop: { 
    emoji: '🆕', 
    color: '#ff0000', 
    border: '#cc0000', 
    label: 'New Crop',
    category: 'crop',
    size: 1
  }
}
```

2. Use in code:
```javascript
createStorageItem('newcrop', quantity)
```

## Storage Validation

The system prevents invalid item-storage combinations:
- Silo only accepts `category: 'crop'` items
- Barn accepts `category: 'production'` and `category: 'resource'` items
- `isItemValidForStorage()` enforces this validation

## Resource Sizes

- **Crops**: 1 unit each
- **Production items**: 1 unit each
- **Resources (wood, stone, iron, copper)**: 0.5 units each

This means 2 units of wood take the same space as 1 wheat.

## Integration with Harvest

When crops are harvested:
1. Crop object from grid: `{ crop: 'wheat', plantedAt: ..., growthDuration: ... }`
2. Convert to storage item: `createStorageItem('wheat', 1)`
3. Add to silo: `addItemToStorage(silo, item)`
4. Check capacity: `canStoreItem(silo, item)` before adding

## Integration with Processing

When crops are processed (future):
1. Remove from silo: `removeItemFromStorage(silo, 'wheat', 1)`
2. Create production item: `createStorageItem('flour', 1)`
3. Add to barn: `addItemToStorage(barn, item)`

## Color Coding System

- **Crops** (Silo): Golden/harvest colors (yellows, oranges)
- **Production** (Barn): Warm food colors (browns, golds, reds)
- **Resources** (Barn): Neutral/industrial colors (grays, silvers, oranges)

This helps players visually identify item types at a glance.
