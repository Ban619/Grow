import React from 'react'

export default function CropTimers({ grid, timeNow, onHarvest }){
  // collect planted tiles
  const items = []
  for(let r=0;r<grid.length;r++){
    for(let c=0;c<grid[r].length;c++){
      const cell = grid[r][c]
      if(cell && cell.placedItem && typeof cell.placedItem === 'object' && cell.placedItem.crop){
        const item = cell.placedItem
        const plantedAt = item.plantedAt || 0
        const dur = item.growthDuration || 60000
        const readyAt = plantedAt + dur
        const remainingMs = Math.max(0, readyAt - timeNow)
        const remaining = Math.max(0, Math.ceil(remainingMs/1000))
        const percent = Math.min(100, Math.max(0, Math.round((1 - remainingMs / dur) * 100)))
        items.push({ r, c, crop: item.crop, remaining, percent })
      }
    }
  }

  if(items.length === 0) return null

  const formatMs = (s)=>{
    const mm = Math.floor(s/60)
    const ss = s % 60
    return `${mm}m ${ss.toString().padStart(2,'0')}s`
  }

  return (
    <div style={{position:'absolute', right:12, top:12, width:220, background:'rgba(0,0,0,0.45)', color:'#fff', padding:8, borderRadius:8}}>
      <div style={{fontWeight:700, marginBottom:8}}>Planted</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {items.map(it=> (
          <div key={`${it.r}_${it.c}`} style={{display:'flex',flexDirection:'column',gap:6,background:'rgba(255,255,255,0.03)',padding:6,borderRadius:6}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:13,fontWeight:700,textTransform:'capitalize'}}>{it.crop}</div>
              <div style={{fontSize:12,opacity:0.95}}>{formatMs(it.remaining)}</div>
            </div>
            <div style={{height:12,background:'rgba(255,255,255,0.12)',borderRadius:6,overflow:'hidden'}}>
              <div style={{width: `${it.percent}%`, height:'100%', background: 'linear-gradient(90deg,#4ea6ff,#0b6ed1)'}} />
            </div>
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button onClick={()=>onHarvest(it.r, it.c)} style={{padding:'4px 8px'}}>Harvest</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
