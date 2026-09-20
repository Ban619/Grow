import React, { useEffect, useState } from 'react'

/**
 * TutorialGuide.jsx — Spotlight focus component
 *
 * Renders three visual layers on top of the game:
 *  1. Dark SVG overlay with a rectangular "hole" cut out around the target element
 *  2. Animated gold border around that element
 *  3. Floating hint card with message, step counter, and optional extra info
 *
 * When no target is found (or target is null), everything is centred.
 *
 * Props
 * ─────
 * stepNumber   {number}  Current major step (1-based)
 * totalSteps   {number}  Total major steps
 * phaseNumber  {number}  Current phase within the step (1-based)
 * totalPhases  {number}  Total phases in this step
 * phaseName    {string}  Human-readable phase name
 * message      {string}  Hint message shown in the floating card
 * target       {string|null}  CSS selector for the element to spotlight; null → centred
 * direction    {string}  'up' | 'down' | 'left' | 'right'  — which side the hint card appears
 * extraInfo    {string|null}  Optional extra line (used for harvest countdown)
 */
export default function TutorialGuide({
  stepNumber,
  totalSteps,
  phaseNumber,
  totalPhases,
  phaseName,
  message,
  target,
  direction = 'down',
  extraInfo = null,
  docked = false,  // when true: card anchors bottom-right instead of center (use when shop/modal is open)
}) {
  const [position, setPosition] = useState(null)
  const [elementFound, setElementFound] = useState(false)

  // ─── Track position of target element (or fallback to centred) ───────────
  useEffect(() => {
    const updatePosition = () => {
      if (!target) {
        setPosition({ centered: true })
        setElementFound(false)
        return
      }

      const el = document.querySelector(target)
      if (!el) {
        setPosition({ centered: true })
        setElementFound(false)
        return
      }

      const rect = el.getBoundingClientRect()
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        centered: false,
      })
      setElementFound(true)
    }

    updatePosition()
    // Re-check every 150 ms so the highlight follows if the element moves
    const interval = setInterval(updatePosition, 150)
    window.addEventListener('resize', updatePosition)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', updatePosition)
    }
  }, [target])

  if (!position) return null

  // ─── Arrow emoji ──────────────────────────────────────────────────────────
  const ARROWS = { up: '⬆️', down: '⬇️', left: '⬅️', right: '➡️' }
  const arrow = ARROWS[direction] || '⬇️'

  // ─── Tooltip position ─────────────────────────────────────────────────────
  const TOOLTIP_W = 300
  const TOOLTIP_H = 160
  const CARD_GAP = 56 // distance between element edge and card

  const getTooltipStyle = () => {
    // Docked mode: anchor to bottom-right so the card never covers the shop/modal
    if (docked || position.centered) {
      if (docked) {
        return {
          bottom: 88,   // above skip bar
          right: 24,
          top: 'auto',
          left: 'auto',
          transform: 'none',
        }
      }
      // Centred fallback (no target found, not docked) — also use bottom-right
      // to avoid covering shop modals that may be open
      return {
        bottom: 88,
        right: 24,
        top: 'auto',
        left: 'auto',
        transform: 'none',
      }
    }

    const vw = window.innerWidth
    const vh = window.innerHeight

    switch (direction) {
      case 'down':
        return {
          top: Math.min(position.top + position.height + CARD_GAP, vh - TOOLTIP_H - 16),
          left: Math.max(16, Math.min(position.left + position.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16)),
        }
      case 'up':
        return {
          top: Math.max(16, position.top - CARD_GAP - TOOLTIP_H),
          left: Math.max(16, Math.min(position.left + position.width / 2 - TOOLTIP_W / 2, vw - TOOLTIP_W - 16)),
        }
      case 'left':
        return {
          top: Math.max(16, position.top + position.height / 2 - TOOLTIP_H / 2),
          left: Math.max(16, position.left - CARD_GAP - TOOLTIP_W),
        }
      case 'right':
        return {
          top: Math.max(16, position.top + position.height / 2 - TOOLTIP_H / 2),
          left: Math.min(position.left + position.width + CARD_GAP, vw - TOOLTIP_W - 16),
        }
      default:
        return {
          top: vh / 2 - TOOLTIP_H / 2,
          left: vw / 2 - TOOLTIP_W / 2,
        }
    }
  }

  // ─── Arrow position (placed between element and card) ─────────────────────
  const getArrowStyle = () => {
    if (position.centered) return { display: 'none' }

    const base = {
      position: 'fixed',
      fontSize: '38px',
      zIndex: 10600,
      pointerEvents: 'none',
      animation: 'tutorialArrowBounce 1.2s ease-in-out infinite',
      filter: 'drop-shadow(0 0 6px rgba(255,215,0,0.9))',
    }

    const GAP = 18
    switch (direction) {
      case 'down':
        return { ...base, top: position.top + position.height + GAP, left: position.left + position.width / 2 - 19 }
      case 'up':
        return { ...base, top: Math.max(GAP, position.top - GAP - 38), left: position.left + position.width / 2 - 19 }
      case 'left':
        return { ...base, top: position.top + position.height / 2 - 19, left: Math.max(GAP, position.left - GAP - 38) }
      case 'right':
        return { ...base, top: position.top + position.height / 2 - 19, left: position.left + position.width + GAP }
      default:
        return { display: 'none' }
    }
  }

  const tooltipStyle = getTooltipStyle()
  const arrowStyle = getArrowStyle()
  const PAD = 10 // spotlight padding around target

  return (
    <>
      {/* ── 1. Dark overlay with spotlight hole ─── */}
      {elementFound && !position.centered && (
        <svg
          style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            height: '100%',
            zIndex: 10580,
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        >
          <defs>
            <mask id="tg-spotlight-mask">
              {/* White = visible (dark overlay shows) */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black = hole (element shows through) */}
              <rect
                x={position.left - PAD}
                y={position.top - PAD}
                width={position.width + PAD * 2}
                height={position.height + PAD * 2}
                rx={10}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.82)"
            mask="url(#tg-spotlight-mask)"
          />
        </svg>
      )}

      {/* ── 2. Gold glow border around the target element ─── */}
      {elementFound && !position.centered && (
        <>
          <div
            style={{
              position: 'fixed',
              top: position.top - PAD,
              left: position.left - PAD,
              width: position.width + PAD * 2,
              height: position.height + PAD * 2,
              border: '3px solid #FFD700',
              borderRadius: '10px',
              boxShadow: '0 0 0 2px rgba(255,215,0,0.25), 0 0 24px rgba(255,215,0,0.7)',
              zIndex: 10585,
              pointerEvents: 'none',
              animation: 'tutorialGoldGlow 2s ease-in-out infinite',
            }}
            aria-hidden="true"
          />
          {/* ── Animated directional arrow ─── */}
          <div style={arrowStyle} aria-hidden="true">{arrow}</div>
        </>
      )}

      {/* ── 3. Floating hint card ─── */}
      {message && (
        <div
          style={{
            position: 'fixed',
            ...tooltipStyle,
            width: TOOLTIP_W,
            background: 'linear-gradient(155deg, #fdf4e0 0%, #f5e8c0 100%)',
            border: '3px solid #b8802a',
            borderRadius: '18px',
            padding: '20px 20px 16px',
            zIndex: 10595,
            boxShadow: '0 20px 50px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.3)',
            pointerEvents: 'none',

            animation: 'tutorialCardPop 300ms cubic-bezier(0.22,0.9,0.37,1)',
          }}
          role="status"
          aria-live="polite"
        >
          {/* Step badge */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              right: -14,
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4CAF50, #2e7d32)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 900,
              border: '3px solid #fff',
              boxShadow: '0 4px 10px rgba(0,0,0,0.35)',
              lineHeight: 1,
              textAlign: 'center',
            }}
          >
            {stepNumber}/{totalSteps}
          </div>

          {/* Phase label */}
          {phaseName && (
            <div style={{
              fontSize: '10px',
              fontWeight: 800,
              color: '#b87020',
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: '6px',
            }}>
              {totalPhases > 1 ? `Phase ${phaseNumber}/${totalPhases}` : 'Action needed'}
            </div>
          )}

          {/* Main hint message */}
          <div style={{
            fontSize: '15px',
            fontWeight: 700,
            color: '#5a3010',
            lineHeight: 1.5,
          }}>
            {message}
          </div>

          {/* Extra info (harvest countdown) */}
          {extraInfo && (
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              background: 'rgba(212,144,58,0.15)',
              borderRadius: '8px',
              border: '1px solid rgba(212,144,58,0.4)',
              fontSize: '13px',
              fontWeight: 700,
              color: '#7a5020',
              textAlign: 'center',
            }}>
              ⏱ {extraInfo}
            </div>
          )}

          {/* Phase progress dots */}
          {totalPhases > 1 && (
            <div style={{
              display: 'flex',
              gap: '6px',
              marginTop: '14px',
              justifyContent: 'center',
            }}>
              {Array.from({ length: totalPhases }, (_, i) => (
                <div
                  key={i}
                  style={{
                    width: i < phaseNumber ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i < phaseNumber
                      ? 'linear-gradient(90deg, #d4903a, #b87020)'
                      : 'rgba(180,140,80,0.3)',
                    transition: 'all 300ms ease',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Keyframe animations injected inline ─── */}
      <style>{`
        @keyframes tutorialGoldGlow {
          0%, 100% { box-shadow: 0 0 0 2px rgba(255,215,0,0.2), 0 0 20px rgba(255,215,0,0.6); }
          50%       { box-shadow: 0 0 0 4px rgba(255,215,0,0.4), 0 0 36px rgba(255,215,0,0.9); }
        }
        @keyframes tutorialArrowBounce {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
          50%       { transform: translate(0, -8px) scale(1.15); opacity: 0.75; }
        }
        @keyframes tutorialCardPop {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </>
  )
}
