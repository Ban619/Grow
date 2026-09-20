import React from 'react'

export default function SoilActions({ x=0, y=0, onMove, onStore, onClose }){
  const style = {
    position: 'absolute',
    left: x + 8,
    top: y + 8,
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(0,0,0,0.08)',
    padding: 8,
    borderRadius: 6,
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)'
  }
  return (
    <div style={style}>
      <div style={{fontSize:12, marginBottom:6}}>Soil</div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={onMove} style={{padding:'6px 8px'}}>Move</button>
        <button onClick={onStore} style={{padding:'6px 8px'}}>Store</button>
      </div>
      <div style={{textAlign:'right', marginTop:6}}>
        <button onClick={onClose} style={{padding:'4px 6px'}}>Close</button>
      </div>
    </div>
  )
}
