# Storage System Documentation

## Overview
The storage system provides silo and barn functionality with upgrade mechanics for the Grow game.

- **Silo**: Stores crops. When full, harvesting is blocked until items are sold.
- **Barn**: Stores production items and resources. Provides additional storage for crafting materials.

## Components

### Silo Component (`silo.jsx`)
Displays and manages the silo storage.

**Props:**
- `silo` (Object): Storage object with items, capacity, level
- `playerResources` (Object): Player's coins and materials
- `onUpgrade` (Function): Callback when upgrade completes
- `onResourceChange` (Function): Callback to update player resources

**Features:**
- Real-time capacity visualization
- Level progression (1-4)
- Visual upgrade warning
- Stored crops display
- Upgrade modal trigger

### Barn Component (`barn.jsx`)
Displays and manages the barn storage.

**Props:**
Same as Silo component.

**Features:**
- Production item storage
- 4-level upgrade system
- Material requirements display
- Full capacity warning

### StorageUpgrade Component (`StorageUpgrade.jsx`)
Modal for managing storage upgrades.

**Props:**
- `storage` (Object): Current storage being upgraded
- `upgradeInfo` (Object): Next level upgrade requirements
- `playerResources` (Object): Player resources
- `onConfirm` (Function): Called when upgrade confirmed
- `onCancel` (Function): Called when modal closed

**Features:**
- Requirement checklist
- Missing resources display
- Cost breakdown (coins + materials)
- Upgrade confirmation

## Storage Service

### Constants

```javascript
STORAGE_TYPES = {
  SILO: 'silo',
  BARN: 'barn'
}

UPGRADE_LEVELS = {
  silo: [
    // Level 1-4 configs with capacity, image path, cost, materials
  ],
  barn: [
    // Level 1-4 configs
  ]
}
```

### Key Functions

#### `createEmptyStorage(type)`
Creates a new storage object.
```javascript
const silo = createEmptyStorage('silo')
```

#### `canStoreItem(storage, item, quantity)`
Checks if item can be stored.
```javascript
if (canStoreItem(silo, grain, 10)) {
  // Can store 10 units of grain
}
```

#### `addItemToStorage(storage, item, quantity)`
Adds item to storage.
```javascript
addItemToStorage(silo, { id: 'wheat', name: 'Wheat', size: 1 }, 50)
```

#### `removeItemFromStorage(storage, itemId, quantity)`
Removes item from storage.
```javascript
removeItemFromStorage(silo, 'wheat', 20)
```

#### `getStoragePercentage(storage)`
Returns capacity percentage (0-100).
```javascript
const percent = getStoragePercentage(silo) // 75
```

#### `isStorageFull(storage)`
Checks if storage is at capacity.
```javascript
if (isStorageFull(silo)) {
  // Cannot harvest more crops
}
```

#### `getUpgradeInfo(type, currentLevel)`
Gets next upgrade requirements.
```javascript
const next = getUpgradeInfo('silo', 1) // Get level 2 requirements
```

#### `canUpgrade(storage, playerResources)`
Checks if player can upgrade.
```javascript
if (canUpgrade(silo, player)) {
  // Can upgrade now
}
```

#### `performUpgrade(storage, playerResources)`
Performs the upgrade.
```javascript
if (performUpgrade(silo, player)) {
  // Upgrade successful, silo now level 2
}
```

## Upgrade Levels

### Silo Upgrades
| Level | Capacity | Cost | Wood | Stone | Iron | Copper |
|-------|----------|------|------|-------|------|--------|
| 1 | 50 | 0 | - | - | - | - |
| 2 | 100 | 500 | 50 | 30 | - | - |
| 3 | 150 | 1000 | 100 | 60 | 20 | - |
| 4 | 200 | 2000 | 150 | 100 | 50 | 30 |
| 5 | 250 | 3500 | 200 | 150 | 100 | 50 |
| 6 | 300 | 5000 | 250 | 200 | 150 | 80 |

### Barn Upgrades
| Level | Capacity | Cost | Wood | Stone | Iron | Copper |
|-------|----------|------|------|-------|------|--------|
| 1 | 50 | 0 | - | - | - | - |
| 2 | 100 | 5 | 40 | 20 | - | - |
| 3 | 150 | 15 | 80 | 50 | 15 | - |
| 4 | 200 | 25 | 120 | 80 | 40 | 25 |
| 5 | 250 | 2500 | 160 | 120 | 80 | 40 |
| 6 | 300 | 4000 | 200 | 150 | 120 | 60 |

## Integration Example

```jsx
import { Silo, Barn, createEmptyStorage } from './features/storage'

export default function App() {
  const [silo, setSilo] = useState(() => createEmptyStorage('silo'))
  const [barn, setBarn] = useState(() => createEmptyStorage('barn'))
  const [playerResources, setPlayerResources] = useState({
    coins: 1000,
    wood: 100,
    stone: 50,
    iron: 20,
    copper: 10
  })

  return (
    <div>
      <Silo 
        silo={silo}
        playerResources={playerResources}
        onUpgrade={(updatedSilo) => setSilo(updatedSilo)}
        onResourceChange={(resources) => setPlayerResources(resources)}
      />
      <Barn 
        barn={barn}
        playerResources={playerResources}
        onUpgrade={(updatedBarn) => setBarn(updatedBarn)}
        onResourceChange={(resources) => setPlayerResources(resources)}
      />
    </div>
  )
}
```

## Styling

All storage components are styled in `storage.css` with:
- Responsive grid layouts
- Gradient backgrounds
- Smooth transitions
- Capacity bar animations
- Modal styling
- Color-coded resource indicators (green for available, red for missing)

## Images

Storage images are located in:
- `/assets/storage/silo/silo1.png`, `silo2.png`, etc.
- `/assets/storage/barn/barn1.png`, `barn2.png`, `barn3.png`, `barn4.png`

Fallback images:
- `/silo.png` (for level 1 if specific level not found)
- `/barn.png` (for level 1 if specific level not found)

## State Management

Each storage object contains:
```javascript
{
  type: 'silo' | 'barn',
  level: 1-4,
  capacity: number,
  items: Array<{id, name, quantity, size}>,
  totalStored: number,
  createdAt: timestamp,
  upgradedAt: timestamp | null
}
```

## Harvest Blocking Logic

In your harvest function, check:
```javascript
import { isStorageFull } from './features/storage'

function attemptHarvest(crop) {
  if (isStorageFull(silo)) {
    showToast('Silo is full! Sell some crops to harvest more.')
    return false
  }
  // Proceed with harvest
}
```
