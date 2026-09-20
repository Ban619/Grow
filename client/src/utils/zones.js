/**
 * ZONE DEFINITIONS
 * ─────────────────
 * Each zone is an independent isometric grid positioned in a shared
 * world-coordinate space.  The world origin (0, 0) is the top corner
 * of the Home Farm.  All zones share the same TILE_W / TILE_H and the
 * standard gridToScreen() math — just with different (worldCol, worldRow)
 * offsets applied before converting to screen pixels.
 *
 * Unlock rules:
 *   unlockCost  — coins required
 *   unlockLevel — minimum player level required
 *
 * Visual identity:
 *   groundColor — colour used for grass tiles in this zone
 *   soilColor   — colour used for soil tiles in this zone
 *   fogColor    — locked fog overlay rgba string
 */

export const ZONE_DEFS = [
  // ─── Always-available home farm ───────────────────────────────────────────
  {
    id: 'home',
    name: 'Home Farm',
    emoji: '🏡',
    description: 'Your starting farm — the heart of your growing empire.',
    rows: 30,
    cols: 30,
    worldCol: 0,
    worldRow: 0,
    unlockCost: 0,
    unlockLevel: 1,
    type: 'land',
    groundColor: '#7ec850',
    soilColor: '#b57a39',
    fogColor: 'rgba(10,20,10,0.0)',  // no fog — always open
  },

  // ─── East Fields ──────────────────────────────────────────────────────────
  {
    id: 'east',
    name: 'East Fields',
    emoji: '🌾',
    description: 'Fertile golden plains stretching to the east.',
    rows: 25,
    cols: 25,
    worldCol: 37,   // 7-tile gap after home's right edge (cols=30 → last worldCol=29)
    worldRow: 2,
    unlockCost: 800,
    unlockLevel: 5,
    type: 'land',
    groundColor: '#a3d96e',
    soilColor: '#c4913f',
    fogColor: 'rgba(10,30,0,0.65)',
  },

  // ─── West Grove ───────────────────────────────────────────────────────────
  {
    id: 'west',
    name: 'West Grove',
    emoji: '🌿',
    description: 'A cool, shady forest clearing — perfect for rare crops.',
    rows: 25,
    cols: 25,
    worldCol: -32,  // 7-tile gap before home's left edge (worldCol starts at 0)
    worldRow: 2,
    unlockCost: 1200,
    unlockLevel: 8,
    type: 'land',
    groundColor: '#4a9e4a',
    soilColor: '#7a5230',
    fogColor: 'rgba(0,20,0,0.65)',
  },

  // ─── North Isle ───────────────────────────────────────────────────────────
  {
    id: 'north',
    name: 'Frostpeak Isle',
    emoji: '❄️',
    description: 'A cold tundra island where frost-resistant crops thrive.',
    rows: 22,
    cols: 22,
    worldCol: 3,
    worldRow: -29,  // 7-tile gap above home's top (worldRow 0)
    unlockCost: 2000,
    unlockLevel: 12,
    type: 'island',
    groundColor: '#cce8f0',
    soilColor: '#a0c8d8',
    fogColor: 'rgba(0,10,30,0.7)',
  },

  // ─── South Island ─────────────────────────────────────────────────────────
  {
    id: 'south',
    name: 'Tropic Cove',
    emoji: '🌴',
    description: 'A sun-drenched tropical island — exotic fruits grow here.',
    rows: 20,
    cols: 20,
    worldCol: 5,
    worldRow: 38,   // 8-tile gap below home's bottom (worldRow 29 → last row)
    unlockCost: 2500,
    unlockLevel: 15,
    type: 'island',
    groundColor: '#e8d87a',   // sandy
    soilColor: '#c8a855',
    fogColor: 'rgba(30,20,0,0.7)',
  },

  // ─── Paradise Isle ────────────────────────────────────────────────────────
  {
    id: 'paradise',
    name: 'Paradise Isle',
    emoji: '🏝️',
    description: 'A legendary island said to hold the rarest crops in the world.',
    rows: 35,
    cols: 35,
    worldCol: 42,
    worldRow: 42,
    unlockCost: 6000,
    unlockLevel: 25,
    type: 'island',
    groundColor: '#5ecf7a',   // lush tropical green
    soilColor: '#8b6530',
    fogColor: 'rgba(20,0,40,0.75)',
  },

  // ─── Secret Valley ────────────────────────────────────────────────────────
  {
    id: 'valley',
    name: 'Verdant Valley',
    emoji: '🏔️',
    description: 'A hidden valley nestled between mountains — rich dark soil.',
    rows: 28,
    cols: 28,
    worldCol: -38,
    worldRow: 38,
    unlockCost: 4500,
    unlockLevel: 20,
    type: 'land',
    groundColor: '#3a8e3a',
    soilColor: '#5a3a1a',
    fogColor: 'rgba(0,0,20,0.72)',
  },
]

/** Quick lookup map: zoneId → zoneDef */
export const ZONE_MAP = Object.fromEntries(ZONE_DEFS.map(z => [z.id, z]))

/** The starting / always-unlocked zone. */
export const HOME_ZONE_ID = 'home'

/**
 * Make an empty grid for a given zone definition.
 * @param {object} zoneDef
 * @param {string} [overrideType] - tile type; defaults to zone's groundColor name
 */
export function makeZoneGrid(zoneDef, overrideType = 'grass') {
  const g = []
  for (let r = 0; r < zoneDef.rows; r++) {
    const row = []
    for (let c = 0; c < zoneDef.cols; c++) {
      row.push({ type: overrideType, placedItem: null, isAnchor: false })
    }
    g.push(row)
  }
  return g
}

/**
 * Returns the initial zones state object:
 * { home: { unlocked: true, grid: [...] }, east: { unlocked: false, grid: null }, ... }
 */
export function makeInitialZonesState() {
  return Object.fromEntries(
    ZONE_DEFS.map(z => [
      z.id,
      {
        unlocked: z.unlockCost === 0,
        grid: z.unlockCost === 0 ? makeZoneGrid(z) : null,
      },
    ])
  )
}

/**
 * Given world-grid coordinates, find which zone def contains them (or null).
 */
export function findZoneAtWorld(worldCol, worldRow) {
  return ZONE_DEFS.find(z =>
    worldCol >= z.worldCol &&
    worldCol < z.worldCol + z.cols &&
    worldRow >= z.worldRow &&
    worldRow < z.worldRow + z.rows
  ) || null
}

/**
 * Compute the overall world bounding box (in grid units) of all zones.
 * Used for camera clamping.
 */
export function worldBounds() {
  let minC = Infinity, maxC = -Infinity, minR = Infinity, maxR = -Infinity
  for (const z of ZONE_DEFS) {
    minC = Math.min(minC, z.worldCol)
    maxC = Math.max(maxC, z.worldCol + z.cols - 1)
    minR = Math.min(minR, z.worldRow)
    maxR = Math.max(maxR, z.worldRow + z.rows - 1)
  }
  return { minC, maxC, minR, maxR }
}
