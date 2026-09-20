import React, { useEffect, useState } from 'react'
import axios from 'axios'

/* emoji fallbacks for seed types */
const SEED_META = {
  rice:    { emoji: '🍚', color: '#f5deb3', border: '#d4a574', label: 'Rice'     },
  pechay:  { emoji: '🥬', color: '#7cb342', border: '#558b2f', label: 'Pechay'   },
  corn:    { emoji: '🌽', color: '#f0c030', border: '#c89820', label: 'Corn'     },
  berry:   { emoji: '🍓', color: '#e84060', border: '#b82040', label: 'Berry'    },
  // Seasonal crops
  snowwheat: { emoji: '❄️', color: '#c8e8ff', border: '#6a9acc', label: 'Snow Wheat', seasonal: true },
  icepumpkin: { emoji: '🧊', color: '#b0e0ff', border: '#4a8acc', label: 'Ice Pumpkin', seasonal: true },
  tulip: { emoji: '🌷', color: '#f0a0c8', border: '#d06099', label: 'Tulip', seasonal: true },
  springcorn: { emoji: '🌽', color: '#d0f030', border: '#a0c820', label: 'Spring Corn', seasonal: true },
  sunflower: { emoji: '🌻', color: '#ffde30', border: '#d0a820', label: 'Sunflower', seasonal: true },
  honeydew: { emoji: '🍈', color: '#b0f060', border: '#78a830', label: 'Honeydew', seasonal: true },
  pumpkinpatch: { emoji: '🎃', color: '#ff8820', border: '#cc5010', label: 'Pumpkin Patch', seasonal: true },
  harvestwheat: { emoji: '🌾', color: '#f0c840', border: '#c0a020', label: 'Harvest Wheat', seasonal: true },
}

function SeedCard({ seedKey, count, onPick, isSeasonal }) {
  const meta = SEED_META[seedKey] || { emoji: '🌱', color: '#78c850', border: '#4a9830', label: seedKey }
  const hasSeeds = count > 0

  return (
    <button
      onClick={() => hasSeeds && onPick(seedKey)}
      title={hasSeeds ? `Plant ${meta.label}` : 'No seeds'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        width: 72,
        padding: '10px 6px 8px',
        borderRadius: 16,
        border: `2.5px solid ${hasSeeds ? meta.border : '#c0a070'}`,
        background: hasSeeds
          ? `linear-gradient(160deg, ${meta.color}22 0%, ${meta.color}44 100%)`
          : 'linear-gradient(160deg, #d8b87022 0%, #c8a06033 100%)',
        cursor: hasSeeds ? 'pointer' : 'not-allowed',
        opacity: hasSeeds ? 1 : 0.5,
        transition: 'transform 120ms ease, box-shadow 120ms ease',
        boxShadow: hasSeeds
          ? `0 4px 12px ${meta.color}55, inset 0 1px 3px rgba(255,255,255,0.5)`
          : '0 2px 6px rgba(0,0,0,0.1)',
        position: 'relative',
        outline: 'none',
      }}
      onMouseEnter={e => { if (hasSeeds) e.currentTarget.style.transform = 'translateY(-4px) scale(1.06)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
      onMouseDown={e  => { if (hasSeeds) e.currentTarget.style.transform = 'scale(0.95)' }}
    >
      {/* icon */}
      <span style={{ fontSize: 30, lineHeight: 1, filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.25))' }}>
        {meta.emoji}
      </span>

      {/* name */}
      <span style={{
        fontSize: 10, fontWeight: 800,
        color: hasSeeds ? '#5a3010' : '#8a6840',
        letterSpacing: '0.3px', textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        {meta.label}
      </span>

      {/* count badge */}
      <div style={{
        position: 'absolute',
        top: 6, right: 6,
        minWidth: 18, height: 18,
        borderRadius: 9,
        background: hasSeeds ? meta.border : '#b09060',
        color: '#fff',
        fontSize: 10,
        fontWeight: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.25)',
      }}>
        {count}
      </div>

      {/* Seasonal badge */}
      {isSeasonal && (
        <div style={{
          position: 'absolute',
          top: 1, left: 1,
          width: 12, height: 12,
          borderRadius: 6,
          background: '#ffde30',
          border: '1px solid #d0a820',
          fontSize: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}>
          ★
        </div>
      )}
    </button>
  )
}

export default function SeedPicker({ x = 0, y = 0, seeds = {}, onPick, onClose }) {
  const [seasonalCrops, setSeasonalCrops] = useState(null)
  const [seasonName, setSeasonName] = useState('')

  useEffect(() => {
    fetchSeasonalCrops()
  }, [])

  const fetchSeasonalCrops = async () => {
    try {
      const response = await axios.get('/api/crops/seasonal')
      setSeasonalCrops(response.data.crops || {})
      setSeasonName(response.data.seasonName || '')
    } catch (e) {
      console.warn('Failed to load seasonal crops:', e)
      setSeasonalCrops({})
    }
  }

  const seedKeys = Object.keys(seeds || {})

  return (
    <div style={{
      position: 'absolute',
      left: x + 8,
      top: y + 8,
      zIndex: 2100,
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 12px 36px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.20)',
      border: '3px solid #b8802a',
      minWidth: 260,
      animation: 'seedPickerIn 180ms cubic-bezier(0.22, 0.9, 0.37, 1)',
    }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(180deg, #d4903a 0%, #b87020 100%)',
        padding: '10px 14px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 1px 4px rgba(0,0,0,0.4)',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          fontFamily: 'Georgia, serif',
        }}>
          🌱 Plant a Seed
        </div>
        <button
          onClick={onClose}
          style={{
            width: 26, height: 26,
            borderRadius: 13,
            background: 'rgba(0,0,0,0.25)',
            border: 'none',
            color: '#fff',
            fontSize: 13,
            fontWeight: 900,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >✕</button>
      </div>

      {/* ── Season indicator ── */}
      {seasonName && (
        <div style={{
          background: 'linear-gradient(180deg, #f5e8c0 0%, #efdab0 100%)',
          padding: '6px 14px',
          fontSize: 12,
          fontWeight: 700,
          color: '#7a5020',
          textAlign: 'center',
          borderBottom: '1px solid #dcc8a0',
        }}>
          {seasonName} Season ★
        </div>
      )}

      {/* ── Seed cards ── */}
      <div style={{
        background: 'linear-gradient(160deg, #fdf4e0 0%, #f5e8c0 100%)',
        padding: '14px 14px 14px',
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        justifyContent: seedKeys.length ? 'center' : 'center',
      }}>
        {seedKeys.length === 0 ? (
          <div style={{
            color: '#9a7040',
            fontSize: 13,
            fontWeight: 700,
            padding: '12px 24px',
            textAlign: 'center',
          }}>
            No seeds — visit the Shop!
          </div>
        ) : (
          seedKeys.map(k => (
            <SeedCard
              key={k}
              seedKey={k}
              count={seeds[k] || 0}
              onPick={onPick}
              isSeasonal={seasonalCrops?.[k]?.seasonal === true}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes seedPickerIn {
          from { opacity: 0; transform: scale(0.88) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
