import React, { useRef, useEffect, useCallback } from 'react'
import { ZONE_DEFS, worldBounds } from '../utils/zones'
import './ZoneMinimap.css'

const PADDING = 8   // px inside the minimap canvas

/**
 * ZoneMinimap — compact world-overview widget in the bottom-right corner.
 *
 * Shows all zone rectangles with:
 *  - Green fill  → unlocked
 *  - Grey fill   → locked
 *  - Blue rect   → current viewport position
 *  - Tap a zone  → onJumpToZone(zoneId)
 */
export default function ZoneMinimap({
  zones,          // { home: { unlocked, grid }, east: {...}, ... }
  activeZoneId,
  onJumpToZone,
}) {
  const canvasRef = useRef(null)
  const boundsRef = useRef(worldBounds())

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    const wb = boundsRef.current
    const spanC = wb.maxC - wb.minC + 1
    const spanR = wb.maxR - wb.minR + 1

    // scale: fit world into minimap canvas minus padding
    const scaleC = (W - PADDING * 2) / spanC
    const scaleR = (H - PADDING * 2) / spanR

    // helper: grid world col/row → minimap pixel
    const toMX = (wc) => PADDING + (wc - wb.minC) * scaleC
    const toMY = (wr) => PADDING + (wr - wb.minR) * scaleR

    ctx.clearRect(0, 0, W, H)

    // Ocean background
    ctx.fillStyle = '#0e3a5c'
    ctx.fillRect(0, 0, W, H)

    for (const z of ZONE_DEFS) {
      const mx = toMX(z.worldCol)
      const my = toMY(z.worldRow)
      const mw = z.cols * scaleC
      const mh = z.rows * scaleR
      const unlocked = zones?.[z.id]?.unlocked

      // Zone fill
      ctx.fillStyle = unlocked ? (z.groundColor || '#5a9e3a') : '#2a3a2a'
      ctx.globalAlpha = unlocked ? 0.9 : 0.5
      ctx.beginPath()
      ctx.roundRect?.(mx, my, mw, mh, 2) ?? ctx.rect(mx, my, mw, mh)
      ctx.fill()
      ctx.globalAlpha = 1

      // Border
      ctx.strokeStyle = z.id === activeZoneId
        ? '#ffe040'
        : (unlocked ? 'rgba(100,200,80,0.6)' : 'rgba(80,100,80,0.35)')
      ctx.lineWidth = z.id === activeZoneId ? 2 : 1
      ctx.beginPath()
      ctx.roundRect?.(mx, my, mw, mh, 2) ?? ctx.rect(mx, my, mw, mh)
      ctx.stroke()

      // Lock icon for locked zones
      if (!unlocked) {
        ctx.fillStyle = 'rgba(200,200,200,0.5)'
        ctx.font = `${Math.max(8, Math.min(mw, mh) * 0.45)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('🔒', mx + mw / 2, my + mh / 2)
      }

      // Zone emoji label (only if big enough)
      if (mw > 18 && mh > 14) {
        ctx.fillStyle = unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(160,160,160,0.5)'
        ctx.font = `bold ${Math.max(7, Math.min(mw, mh) * 0.35)}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const label = unlocked ? z.emoji : '?'
        ctx.fillText(label, mx + mw / 2, my + mh / 2)
      }
    }

    // Active zone highlight pulse ring
    const activeZone = ZONE_DEFS.find(z => z.id === activeZoneId)
    if (activeZone) {
      const mx = toMX(activeZone.worldCol)
      const my = toMY(activeZone.worldRow)
      const mw = activeZone.cols * scaleC
      const mh = activeZone.rows * scaleR
      ctx.strokeStyle = '#ffe040'
      ctx.lineWidth = 2
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.roundRect?.(mx - 1, my - 1, mw + 2, mh + 2, 3) ?? ctx.rect(mx - 1, my - 1, mw + 2, mh + 2)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }, [zones, activeZoneId])

  useEffect(() => { draw() }, [draw])

  // Handle click: find which zone was tapped
  const handleClick = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const px = (e.clientX - rect.left) * (canvas.width  / rect.width)
    const py = (e.clientY - rect.top)  * (canvas.height / rect.height)

    const wb = boundsRef.current
    const spanC = wb.maxC - wb.minC + 1
    const spanR = wb.maxR - wb.minR + 1
    const W = canvas.width
    const H = canvas.height
    const scaleC = (W - PADDING * 2) / spanC
    const scaleR = (H - PADDING * 2) / spanR

    for (const z of ZONE_DEFS) {
      const mx = PADDING + (z.worldCol - wb.minC) * scaleC
      const my = PADDING + (z.worldRow - wb.minR) * scaleR
      const mw = z.cols * scaleC
      const mh = z.rows * scaleR
      if (px >= mx && px <= mx + mw && py >= my && py <= my + mh) {
        onJumpToZone?.(z.id)
        return
      }
    }
  }, [onJumpToZone])

  return (
    <div className="zone-minimap-wrap" title="World Map — click a zone to jump to it">
      <div className="zone-minimap-label">🗺 World Map</div>
      <canvas
        ref={canvasRef}
        className="zone-minimap-canvas"
        width={180}
        height={150}
        onClick={handleClick}
      />
      <div className="zone-minimap-legend">
        <span className="legend-dot unlocked" /> Active
        <span className="legend-dot locked" style={{ marginLeft: 8 }} /> Locked
      </div>
    </div>
  )
}
