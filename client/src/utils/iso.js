export const MAP_SIZE = 30   // kept for legacy single-grid references
export const TILE_W = 128
export const TILE_H = 64

// Convert grid (col, row) to screen pixel coordinates (top vertex of the diamond)
export const gridToScreen = (col, row) => {
  const x = (col - row) * (TILE_W / 2)
  const y = (col + row) * (TILE_H / 2)
  return { x, y }
}

// Convert screen (x, y) (relative to canvas origin) to WORLD grid (col, row)
export const screenToGrid = (screenX, screenY) => {
  const col = Math.floor((screenX / (TILE_W / 2) + screenY / (TILE_H / 2)) / 2)
  const row = Math.floor((screenY / (TILE_H / 2) - screenX / (TILE_W / 2)) / 2)
  return { col, row }
}

/**
 * Convert a zone-local (col, row) to screen coordinates, applying the zone's
 * world offset so all zones share one coordinate system.
 *
 * @param {number} localCol  – col within the zone (0-based)
 * @param {number} localRow  – row within the zone (0-based)
 * @param {object} zoneDef   – the zone definition object from zones.js
 */
export const gridToScreenZone = (localCol, localRow, zoneDef) =>
  gridToScreen(
    (zoneDef?.worldCol ?? 0) + localCol,
    (zoneDef?.worldRow ?? 0) + localRow
  )

/**
 * Return the four extreme screen-space corner points of a zone's footprint.
 * Used for clipping / drawing the diamond-shaped zone outline.
 *
 * Points (clockwise from top):  top, right, bottom, left
 */
export const zoneScreenCorners = (zoneDef) => {
  const { worldCol: wc, worldRow: wr, cols, rows } = zoneDef
  const top    = gridToScreen(wc,          wr)
  const right  = gridToScreen(wc + cols - 1, wr)
  const bottom = gridToScreen(wc + cols - 1, wr + rows - 1)
  const left   = gridToScreen(wc,          wr + rows - 1)
  return {
    top:    { x: top.x,                   y: top.y },
    right:  { x: right.x  + TILE_W / 2,  y: right.y  + TILE_H / 2 },
    bottom: { x: bottom.x,                y: bottom.y + TILE_H },
    left:   { x: left.x   - TILE_W / 2,  y: left.y   + TILE_H / 2 },
  }
}
