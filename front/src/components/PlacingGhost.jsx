import React, { useEffect, useState } from 'react'

// Floating DOM ghost that follows pointer while `placingBuilding` is active.
export default function PlacingGhost({ placingBuilding }){
  const [pos, setPos] = useState({ x: -9999, y: -9999 })

  useEffect(()=>{
    // use pointer events for unified mouse/touch/pen support
    function onPointer(e){
      const x = e.clientX || 0
      const y = e.clientY || 0
      setPos({ x, y })
    }
    window.addEventListener('pointermove', onPointer)
    return ()=>{ window.removeEventListener('pointermove', onPointer) }
  }, [])

  if(!placingBuilding) return null

  const type = typeof placingBuilding === 'string' ? placingBuilding : placingBuilding.type
  // use SVG assets for silo and barn
  const src = (type === 'silo' || type === 'barn') ? `/assets/${type}.svg` : `/${type}.png`

  // style: low opacity while dragging, pointer-events none so it doesn't block UI
  const style = {
    position: 'fixed',
    left: pos.x,
    top: pos.y,
    transform: 'translate(-50%,-50%) scale(1.05)',
    opacity: 0.42,
    pointerEvents: 'none',
    zIndex: 1600,
    width: 128,
    height: 128
  }

  return (
    <div className="placing-ghost-dom" style={style} aria-hidden>
      <img src={src} alt={type} style={{width:'100%',height:'100%',objectFit:'contain',display:'block'}} onError={(e)=>{ e.currentTarget.style.display='none' }} />
    </div>
  )
}
