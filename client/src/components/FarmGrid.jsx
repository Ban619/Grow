import React, { useEffect, useState, useRef } from 'react'

const defaultGrid = () => {
  // create 24 tiles and place a couple of decorative buildings for a HayDay-like demo
  const grid = Array.from({length:24}).map(()=>({ crop:null, plantedAt:null, growSeconds:0, decor:null }))
  // place barn and silo decorations to make the farm feel alive
  grid[2].decor = 'barn'
  grid[7].decor = 'silo'
  grid[18].decor = 'pond'
  return grid
}

export default function FarmGrid({ onStateChange, setCoins, addXP, seeds, setSeeds, selectedSeed, showToast, placingBuilding, setPlacingBuilding, onConfirmBuilding }){
  const [grid, setGrid] = useState(()=>{
    const s = localStorage.getItem('grow:farm')
    if(s) try{return JSON.parse(s)}catch(e){}
    return defaultGrid()
  })
  const [hoverIndex, setHoverIndex] = useState(null)

  // building specs for multi-tile buildings
  const buildingSpecs = {
    barn: { w: 2, h: 2, cost: 200, icon: '/assets/barn.svg' },
    silo: { w: 2, h: 2, cost: 120, icon: '/assets/silo.svg' },
    house: { w: 3, h: 2, cost: 350, icon: '/icons/buildings/house_3x2.svg' }
  }

  // handle external placement requests (dispatched from App)
  useEffect(()=>{
    const handler = (e)=>{
      const type = e.detail && e.detail.type
      if(!type || !buildingSpecs[type]){ showToast && showToast('Invalid building'); return }
      placeBuilding(type)
    }
    window.addEventListener('grow:placeBuilding', handler)
    return ()=>window.removeEventListener('grow:placeBuilding', handler)
  },[grid,seeds])

  useEffect(()=>{
    const t = setInterval(()=>{
      setGrid(g=>g.map((cell, idx)=>{
        if(!cell.crop) return cell
        const elapsed = Math.floor((Date.now()-cell.plantedAt)/1000)
        if(elapsed>=cell.growSeconds && !cell.ready){
          // mark ready
          const nc = {...cell, ready:true}
          return nc
        }
        return cell
      }))
    },1000)
    return ()=>clearInterval(t)
  },[])

  // listen for explicit cancel placement event (Escape) to clear hover preview
  useEffect(()=>{
    const handler = ()=> setHoverIndex(null)
    window.addEventListener('grow:cancelPlacement', handler)
    return ()=> window.removeEventListener('grow:cancelPlacement', handler)
  },[])

  useEffect(()=>{
    localStorage.setItem('grow:farm', JSON.stringify(grid))
    if(onStateChange) onStateChange(grid)
  },[grid])

  const [particles, setParticles] = useState({})

  const emitParticles = (tileIndex, type)=>{
    const colors = { rice:'#f5deb3', pechay:'#7cb342', corn:'#FFD54F', berry:'#E53935' }
    const shapes = { rice:'leaf', pechay:'leaf', corn:'coin', berry:'spark' }
    const count = 10
    const arr = Array.from({length:count}).map((_,k)=>({
      id: `${Date.now()}-${tileIndex}-${k}`,
      color: colors[type] || '#fff',
      shape: shapes[type] || 'spark',
      dx: Math.round((Math.random()-0.5) * 60),
      rot: Math.round(Math.random()*360),
      size: 6 + Math.round(Math.random()*12),
      delay: Math.round(Math.random()*200),
      duration: 700 + Math.round(Math.random()*700)
    }))
    setParticles(p=>({ ...p, [tileIndex]: arr }))
    setTimeout(()=>{
      setParticles(p=>{ const np = { ...p }; delete np[tileIndex]; return np })
    }, 2200)
  }

  useEffect(()=>{const handler = (e)=>{const st = e.detail; if(st && st.farm) setGrid(st.farm)}; window.addEventListener('grow:load', handler); return ()=>window.removeEventListener('grow:load', handler)},[])

  const cropTimes = { rice:10, pechay:12, corn:20, berry:12 }
  const cropYield = { rice: 15, pechay: 18, corn: 30, berry:18 }
  const cropXP = { rice: 8, pechay: 10, corn: 18, berry:12 }

  const plant = (i, type=selectedSeed || 'rice')=>{
    setGrid(g=>{
      const ng = g.slice();
      if(ng[i].crop) return ng
      // require seed in inventory
      if(!seeds || (seeds[type]||0) <= 0){ showToast && showToast(`No ${type} seeds`); return ng }
      // consume seed
      if(setSeeds) setSeeds(s=>({ ...s, [type]: (s[type]||0)-1 }))
      ng[i] = { crop:type, plantedAt:Date.now(), growSeconds: cropTimes[type] || 10, ready:false }
      return ng
    })
  }

  // attempt to place a building of given type (multi-tile) at first available spot
  const placeBuilding = (type)=>{
    const spec = buildingSpecs[type]
    if(!spec) return showToast && showToast('Unknown building')

      function canPlaceAt(index, spec){
        const cols = 6
        const row = Math.floor(index/cols)
        const col = index%cols
        if(col + spec.w > cols) return false
        if(row + spec.h > Math.ceil(grid.length/cols)) return false
        for(let r=0;r<spec.h;r++){
          for(let c=0;c<spec.w;c++){
            const idx = (row + r)*cols + (col + c)
            if(grid[idx].decor) return false
          }
        }
        return true
      }

      function handleTileMouseEnter(i){
        if(!placingBuilding) return
        setHoverIndex(i)
      }

      function handleTileMouseLeave(i){
        if(!placingBuilding) return
        setHoverIndex(null)
      }

      function handleTileClick(i){
        if(!placingBuilding) return
        const spec = buildingSpecs[placingBuilding]
        if(!spec) return
        if(canPlaceAt(i,spec)){
          // finalize placement
          placeBuildingAt(i, placingBuilding)
          if(onConfirmBuilding) onConfirmBuilding(placingBuilding, spec.cost || 0)
        } else {
          showToast('Cannot place here')
        }
      }

      function placeBuildingAt(index, type){
        const spec = buildingSpecs[type]
        const cols = 6
        const row = Math.floor(index/cols)
        const col = index%cols
        const newGrid = grid.slice()
        for(let r=0;r<spec.h;r++){
          for(let c=0;c<spec.w;c++){
            const idx = (row + r)*cols + (col + c)
            newGrid[idx] = {...newGrid[idx], decor: {type, origin: r===0 && c===0, w: spec.w, h: spec.h}}
          }
        }
        setGrid(newGrid)
        localStorage.setItem('farmGrid', JSON.stringify(newGrid))
        if(onStateChange) onStateChange(newGrid)
        setHoverIndex(null)
        setPlacingBuilding(null)
      }
    // check coins via setCoins? we don't have coins here; placement should be called after deducting coins in App
    const cols = 6
    const rows = Math.ceil(grid.length / cols)
    for(let r=0;r<rows;r++){
      for(let c=0;c<cols;c++){
        // check bounds
        if(c + spec.w > cols) continue
        if(r + spec.h > rows) continue
        // collect indices
        const indices = []
        let ok = true
        for(let yy=0; yy<spec.h; yy++){
          for(let xx=0; xx<spec.w; xx++){
            const idx = (r+yy)*cols + (c+xx)
            if(idx >= grid.length){ ok=false; break }
            if(grid[idx].crop || grid[idx].decor) { ok=false; break }
            indices.push(idx)
          }
          if(!ok) break
        }
        if(!ok) continue
        // place building: mark origin and non-origin tiles
        setGrid(g=>{
          const ng = g.slice()
          indices.forEach((idx)=>{
            ng[idx] = { ...ng[idx], decor: { type, origin: idx===indices[0], w: spec.w, h: spec.h } }
          })
          return ng
        })
        showToast && showToast(`${type} placed`)
        return
      }
    }
    showToast && showToast('No room for building')
  }

  const harvest = (i)=>{
    setGrid(g=>{
      const ng = g.slice();
      if(!ng[i].crop) return ng
      if(!ng[i].ready) return ng
      const type = ng[i].crop
      // emit particles for harvest
      emitParticles(i, type)
      // give rewards
      if(setCoins) setCoins(c=>c + (cropYield[type]||10))
      if(addXP) addXP(cropXP[type]||5)
      ng[i] = { crop:null, plantedAt:null, growSeconds:0 }
      return ng
    })
  }

  // --- ISOMETRIC RENDERING ---
  const tileW = 96 // tile width (px) - must be twice tileH for true iso
  const tileH = 48 // tile height (px)
  const cols = 6
  const rows = Math.ceil(grid.length / cols)

  // offsets to center the grid within container
  const offsetX = rows * (tileW/2) + 12
  const offsetY = 12

  // prepare render list with positions and depth
  const renderList = grid.map((cell, i)=>{
    const row = Math.floor(i/cols)
    const col = i % cols
    const screenX = (col - row) * (tileW/2) + offsetX
    const screenY = (col + row) * (tileH/2) + offsetY
    return { cell, i, row, col, screenX, screenY, depth: row + col }
  }).sort((a,b)=> a.depth - b.depth || a.row - b.row)

  const containerWidth = (cols + rows) * (tileW/2) + 24
  const containerHeight = (cols + rows) * (tileH/2) + tileH + 24

  return (
    <div className="isometric-grid" style={{width:containerWidth, height:containerHeight, position:'relative'}}>
      {renderList.map(({cell,i,row,col,screenX,screenY,depth})=>{
        const elapsed = cell.plantedAt ? Math.floor((Date.now()-cell.plantedAt)/1000) : 0
        const percent = cell.growSeconds ? Math.min(1, elapsed / cell.growSeconds) : 0
        const scale = cell.ready ? 1.05 : (0.6 + percent * 0.5)
        const classes = `tile ${cell.crop? 'planted':''} ${cell.crop||''} ${cell.ready? 'ready':''}`
        return (
          <div key={i} className="iso-tile" style={{position:'absolute', left: screenX, top: screenY, zIndex: depth*100}}>
            <div className={classes} style={{width: tileW, height: tileW, transform: `translate(-50%,-50%) rotate(45deg) scaleY(${tileH/tileW})`}} onClick={()=>{cell.crop? (cell.ready?harvest(i): (showToast? showToast('Not ready'): alert('Not ready'))):plant(i)}}>
              {cell.crop ? (
                <img className="crop-icon" src={`/icons/${cell.crop}.svg`} alt={cell.crop} style={{transform:`scale(${scale})`}} />
              ) : (
                <div className="label">+</div>
              )}
              {cell.crop && <div className="timer">{cell.ready? '✓' : Math.max(0, cell.growSeconds - elapsed)}</div>}
              {particles[i] && particles[i].map(p => (
                <span key={p.id}
                  className={`particle ${p.shape}`}
                  style={{
                    left: `calc(50% + ${p.dx}px)`,
                    width: (p.shape==='leaf'? Math.max(8,p.size*1.6): p.size) + 'px',
                    height: (p.shape==='leaf'? Math.max(6,Math.round(p.size*0.6)): p.size) + 'px',
                    transform: `rotate(${p.rot}deg)`,
                    animationDelay: p.delay + 'ms',
                    animationDuration: p.duration + 'ms'
                  }}
                />
              ))}

              {cell.decor && cell.decor.type && cell.decor.origin && (
                <img src={buildingSpecs[cell.decor.type].icon} alt={cell.decor.type} className={`decor origin ${cell.decor.type}`} style={{zIndex: (row+1)*1000, position:'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%)`}} />
              )}
              {cell.decor === 'pond' && (
                <div className="pond" />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
