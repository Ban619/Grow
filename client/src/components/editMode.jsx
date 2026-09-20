import React, { useEffect, useState } from 'react'

const ICON_STORE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 8h14l-1.5 10a2 2 0 0 1-2 1.5H8.5a2 2 0 0 1-2-1.5L5 8Z" fill="#7a4820" fillOpacity="0.15" stroke="#7a4820" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M3 8h18" stroke="#7a4820" strokeWidth="1.7" strokeLinecap="round"/>
    <path d="M9 8V5a3 3 0 0 1 6 0v3" stroke="#7a4820" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ICON_ROTATE = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M20.5 12A8.5 8.5 0 1 1 14 4.07" stroke="#2a6e2a" strokeWidth="1.9" strokeLinecap="round"/>
    <path d="M14 2v5h5" stroke="#2a6e2a" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const ICON_CANCEL = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M6 6l12 12M18 6L6 18" stroke="#c0392b" strokeWidth="2.1" strokeLinecap="round"/>
  </svg>
)

export default function EditMode({
  visible = false,
  x = 0, y = 0,
  type = '',
  sprite = null,
  initialRotation = 0,
  onRotate   = () => {},
  onStore    = () => {},
  onCancel   = () => {},
  onRequestPlace = () => {},
}) {
  const [rot, setRot] = useState(initialRotation || 0)

  useEffect(() => { setRot(initialRotation || 0) }, [initialRotation, visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (e) => {
      if (e.key === 'r' || e.key === 'R') handleRotate()
      if (e.key === 'Escape')             handleCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, rot])

  const handleRotate  = () => { const n = (rot + 1) % 4; setRot(n); try { onRotate(n) } catch (_) {} }
  const handleStore   = () => { try { onStore()        } catch (_) {} }
  const handleCancel  = () => { try { onCancel()       } catch (_) {} }
  const handlePlace   = () => { try { onRequestPlace() } catch (_) {} }

  if (!visible) return null

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      transform: 'translate(-50%, -115%)',
      zIndex: 2000,
      pointerEvents: 'auto',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      filter: 'drop-shadow(0 8px 22px rgba(0,0,0,0.32))',
    }}>

      {/* ── Preview tile ── */}
      <div
        onClick={handlePlace}
        title={`Tap to place ${type}`}
        style={{
          width: 96, height: 96,
          borderRadius: 18,
          background: 'linear-gradient(145deg, #f8e8c8 0%, #e8c888 50%, #d4a855 100%)',
          border: '3.5px solid #b8802a',
          boxShadow: '0 6px 18px rgba(0,0,0,0.28), inset 0 2px 6px rgba(255,230,150,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 120ms ease, box-shadow 120ms ease',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {/* wooden grain overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 14,
          background: 'repeating-linear-gradient(170deg, transparent 0px, transparent 6px, rgba(180,100,20,0.07) 6px, rgba(180,100,20,0.07) 7px)',
          pointerEvents: 'none',
        }} />
        {sprite ? (
          <img
            src={typeof sprite === 'string' ? sprite : (sprite.src || '')}
            alt={type}
            style={{ maxWidth: '82%', maxHeight: '82%', transform: `rotate(${rot * 90}deg)`, transition: 'transform 200ms ease', position: 'relative' }}
          />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(180,120,50,0.3)', border: '2px solid rgba(180,120,50,0.4)' }} />
        )}

        {/* "tap to place" hint */}
        <div style={{
          position: 'absolute', bottom: 5,
          fontSize: 9, fontWeight: 800, color: 'rgba(120,60,10,0.65)',
          letterSpacing: '0.4px', textTransform: 'uppercase',
        }}>Place</div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Store */}
        <button onClick={handleStore} title="Store" aria-label="Store" style={{
          width: 54, height: 54, borderRadius: 27,
          background: 'linear-gradient(145deg, #fef3dc, #f5d58a)',
          border: '2.5px solid #c8902a',
          boxShadow: '0 5px 14px rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,230,120,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 110ms ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e  => e.currentTarget.style.transform = 'scale(0.94)'}
        >
          {ICON_STORE}
        </button>

        {/* Rotate */}
        <button onClick={handleRotate} title="Rotate (R)" aria-label="Rotate" style={{
          width: 54, height: 54, borderRadius: 27,
          background: 'linear-gradient(145deg, #d8f5d8, #90d890)',
          border: '2.5px solid #3a9a3a',
          boxShadow: '0 5px 14px rgba(0,0,0,0.22), inset 0 2px 4px rgba(150,255,150,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 110ms ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e  => e.currentTarget.style.transform = 'scale(0.94)'}
        >
          {ICON_ROTATE}
        </button>

        {/* Cancel */}
        <button onClick={handleCancel} title="Cancel (Esc)" aria-label="Cancel" style={{
          width: 54, height: 54, borderRadius: 27,
          background: 'linear-gradient(145deg, #ffecec, #ffb8b8)',
          border: '2.5px solid #d44',
          boxShadow: '0 5px 14px rgba(0,0,0,0.22), inset 0 2px 4px rgba(255,180,180,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          transition: 'transform 110ms ease',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12) translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          onMouseDown={e  => e.currentTarget.style.transform = 'scale(0.94)'}
        >
          {ICON_CANCEL}
        </button>

      </div>
    </div>
  )
}
