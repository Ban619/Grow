import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { dispatchTutorialEvent } from '../tutorial/tutorialEvents'
import './shop.css'

// Set of item IDs that are fully implemented (others show "Coming soon")
const IMPLEMENTED_IDS = new Set(['soil', 'barn', 'silo', 'rice', 'pechay', 'ahos', 'batong', 'bombay',
  'corn', 'wheat', 'berry', 'pumpkin', 'kalabasa', 'broccoli', 'kamatis'])

/* ── Category definitions ─────────────────────────────── */
const CATEGORIES = [
  { id: 'seeds',   emoji: '🌾', name: 'Seeds'       },
  { id: 'builds',  emoji: '🏚', name: 'Buildings'   },
  { id: 'decor',   emoji: '🌸', name: 'Decorations' },
  { id: 'special', emoji: '⭐', name: 'Special'     },
]

/* ── All shop items ───────────────────────────────────── */
const ALL_ITEMS = [
  // ===== SEEDS (30+ items) =====
  { id: 'rice',     name: 'Rice',      cost: 10,  category: 'seeds', emoji: '🍚', img: '/assets/crops/rice.png'      },
  { id: 'pechay',   name: 'Pechay',    cost: 15,  category: 'seeds', emoji: '🥬', img: '/assets/crops/pechay.png'     },
  { id: 'ahos',     name: 'Ahos',      cost: 5,  category: 'seeds', emoji: '🌽', img: '/icons/corn.svg'      },
  { id: 'batong',   name: 'Batong',    cost: 10,  category: 'seeds', emoji: '🍓', img: '/icons/berry.svg'     },
  { id: 'bombay',   name: 'Bombay',    cost: 10,  category: 'seeds', emoji: '🎃', img: '/icons/pumpkin.svg'   },
  { id: 'kalabasa', name: 'Kalabasa',  cost: 25, category: 'seeds', emoji: '🌻', img: null },
  { id: 'broccoli', name: 'Broccoli',  cost: 20,  category: 'seeds', emoji: '🥦', img: null },
  { id: 'kamatis',  name: 'Kamatis',  cost: 5,  category: 'seeds', emoji: '🥕', img: null },
  { id: 'kamunggay',name: 'Kamunggay',cost: 12,  category: 'seeds', emoji: '🥬', img: null },
  { id: 'karrot',  name:  'Karrot',   cost: 16,  category: 'seeds', emoji: '🥬', img: null },
  { id: 'cauliflower', name: 'Cauliflower',  cost: 28,  category: 'seeds', emoji: '🥦', img: null },
  { id: 'letsugas',   name: 'Letsugas',    cost: 24,  category: 'seeds', emoji: '🫑', img: null },
  { id: 'okra',   name: 'Okra',    cost: 19,  category: 'seeds', emoji: '🍅', img: null },
  { id: 'patola', name: 'Patola',  cost: 26,  category: 'seeds', emoji: '🍆', img: null },
  { id: 'pipino',     name: 'Pipino',      cost: 14,  category: 'seeds', emoji: '🫛', img: null },
  { id: 'repolyo',    name: 'Repolyo',     cost: 17,  category: 'seeds', emoji: '🫘', img: null },
  { id: 'sayote',   name: 'Sayote',    cost: 21,  category: 'seeds', emoji: '🧄', img: null },
  { id: 'singkamas',    name: 'Singkamas',     cost: 13,  category: 'seeds', emoji: '🧅', img: null },
  { id: 'talong',   name: 'Talong',    cost: 16,  category: 'seeds', emoji: '🥔', img: null },
  { id: 'upo',  name: 'Upo',   cost: 11,  category: 'seeds', emoji: '🥬', img: null },
  { id: 'ampalaya',     name: 'Ampalaya',      cost: 27,  category: 'seeds', emoji: '🥬', img: null },
  { id: 'gabi', name: 'Gabi',  cost: 35,  category: 'seeds', emoji: '🍄', img: null },
  { id: 'tanglad',   name: 'Tanglad',    cost: 9,   category: 'seeds', emoji: '🌶️', img: null },
  { id: 'cucumber', name: 'Cucumber',  cost: 20,  category: 'seeds', emoji: '🥒', img: null },
  { id: 'zucchini', name: 'Zucchini',  cost: 23,  category: 'seeds', emoji: '🍈', img: null },
  { id: 'avocado',  name: 'Avocado',   cost: 45,  category: 'seeds', emoji: '🥑', img: null },
  { id: 'melon',    name: 'Melon',     cost: 40,  category: 'seeds', emoji: '🍈', img: null },
  { id: 'strawberry', name: 'Strawberry', cost: 32, category: 'seeds', emoji: '🍓', img: null },
  { id: 'blueberry', name: 'Blueberry', cost: 31, category: 'seeds', emoji: '🫐', img: null },
  { id: 'grape',    name: 'Grape',     cost: 38,  category: 'seeds', emoji: '🍇', img: null },
  { id: 'watermelon', name: 'Watermelon', cost: 55, category: 'seeds', emoji: '🍉', img: null },
  { id: 'apple-tree', name: 'Apple Tree', cost: 60, category: 'seeds', emoji: '🍎', img: null },
  { id: 'banana-tree', name: 'Banana Tree', cost: 50, category: 'seeds', emoji: '🍌', img: null },
  { id: 'lemon-tree', name: 'Lemon Tree', cost: 48, category: 'seeds', emoji: '🍋', img: null },

  // ===== BUILDINGS (30+ items) =====
  { id: 'soil',      name: 'Soil',         cost: 5,   category: 'builds', emoji: '🟫', img: null },
  { id: 'barn',      name: 'Barn',         cost: 50,  category: 'builds', emoji: '🏚', img: '/assets/storage/barn/barn1.png' },
  { id: 'silo',      name: 'Silo',         cost: 120, category: 'builds', emoji: '🏛', img: '/assets/storage/silo/silo1.png' },
  { id: 'greenhouse', name: 'Greenhouse',  cost: 180, category: 'builds', emoji: '🌿', img: null },
  { id: 'chicken-coop', name: 'Chicken Coop', cost: 75, category: 'builds', emoji: '🐔', img: null },
  { id: 'pigpen',    name: 'Pigpen',       cost: 95,  category: 'builds', emoji: '🐷', img: null },
  { id: 'shed',      name: 'Shed',         cost: 65,  category: 'builds', emoji: '🏠', img: null },
  { id: 'windmill',  name: 'Windmill',     cost: 200, category: 'builds', emoji: '🌪️', img: null },
  { id: 'mill',      name: 'Mill',         cost: 150, category: 'builds', emoji: '⚙️', img: null },
  { id: 'well',      name: 'Well',         cost: 85,  category: 'builds', emoji: '🪣', img: null },
  { id: 'bridge',    name: 'Bridge',       cost: 110, category: 'builds', emoji: '🌉', img: null },
  { id: 'fence',     name: 'Fence',        cost: 30,  category: 'builds', emoji: '🪵', img: null },
  { id: 'gate',      name: 'Gate',         cost: 45,  category: 'builds', emoji: '🚪', img: null },
  { id: 'storehouse', name: 'Storehouse', cost: 160, category: 'builds', emoji: '📦', img: null },
  { id: 'watchtower', name: 'Watchtower', cost: 175, category: 'builds', emoji: '🗼', img: null },
  { id: 'bell-tower', name: 'Bell Tower', cost: 190, category: 'builds', emoji: '🔔', img: null },
  { id: 'stable',    name: 'Stable',       cost: 130, category: 'builds', emoji: '🐴', img: null },
  { id: 'beehive',   name: 'Beehive',      cost: 55,  category: 'builds', emoji: '🐝', img: null },
  { id: 'fishpond',  name: 'Fish Pond',    cost: 140, category: 'builds', emoji: '🐟', img: null },
  { id: 'orchard',   name: 'Orchard',      cost: 225, category: 'builds', emoji: '🌳', img: null },
  { id: 'vineyard',  name: 'Vineyard',     cost: 215, category: 'builds', emoji: '🍇', img: null },
  { id: 'cottage',   name: 'Cottage',      cost: 185, category: 'builds', emoji: '🏡', img: null },
  { id: 'bakery',    name: 'Bakery',       cost: 170, category: 'builds', emoji: '🥖', img: null },
  { id: 'dairy',     name: 'Dairy',        cost: 155, category: 'builds', emoji: '🥛', img: null },
  { id: 'smokehouse', name: 'Smokehouse', cost: 145, category: 'builds', emoji: '🔥', img: null },
  { id: 'cellar',    name: 'Cellar',       cost: 125, category: 'builds', emoji: '🏺', img: null },
  { id: 'granary',   name: 'Granary',      cost: 135, category: 'builds', emoji: '🌾', img: null },
  { id: 'quarry',    name: 'Quarry',       cost: 210, category: 'builds', emoji: '⛏️', img: null },
  { id: 'sawmill',   name: 'Sawmill',      cost: 165, category: 'builds', emoji: '🪚', img: null },
  { id: 'forge',     name: 'Forge',        cost: 220, category: 'builds', emoji: '🔨', img: null },
  { id: 'market',    name: 'Market',       cost: 250, category: 'builds', emoji: '🏪', img: null },

  // ===== DECORATIONS (30+ items) =====
  { id: 'grass-patch', name: 'Grass Patch', cost: 8, category: 'decor', emoji: '🌱', img: null },
  { id: 'flowers-red', name: 'Red Flowers', cost: 12, category: 'decor', emoji: '🌹', img: null },
  { id: 'flowers-white', name: 'White Flowers', cost: 11, category: 'decor', emoji: '🌼', img: null },
  { id: 'flowers-purple', name: 'Purple Flowers', cost: 13, category: 'decor', emoji: '🌷', img: null },
  { id: 'flowers-yellow', name: 'Sunflowers', cost: 14, category: 'decor', emoji: '🌻', img: null },
  { id: 'rock-small', name: 'Small Rock', cost: 5, category: 'decor', emoji: '🪨', img: null },
  { id: 'rock-large', name: 'Large Rock', cost: 15, category: 'decor', emoji: '🗻', img: null },
  { id: 'tree-oak', name: 'Oak Tree', cost: 35, category: 'decor', emoji: '🌳', img: null },
  { id: 'tree-pine', name: 'Pine Tree', cost: 32, category: 'decor', emoji: '🌲', img: null },
  { id: 'tree-willow', name: 'Willow Tree', cost: 38, category: 'decor', emoji: '🌿', img: null },
  { id: 'palm-tree', name: 'Palm Tree', cost: 45, category: 'decor', emoji: '🌴', img: null },
  { id: 'bush', name: 'Bush', cost: 10, category: 'decor', emoji: '🌾', img: null },
  { id: 'path-stone', name: 'Stone Path', cost: 7, category: 'decor', emoji: '🪨', img: null },
  { id: 'path-wood', name: 'Wooden Path', cost: 9, category: 'decor', emoji: '🪵', img: null },
  { id: 'bench', name: 'Bench', cost: 20, category: 'decor', emoji: '🪑', img: null },
  { id: 'table', name: 'Table', cost: 25, category: 'decor', emoji: '🛏️', img: null },
  { id: 'lantern', name: 'Lantern', cost: 18, category: 'decor', emoji: '🏮', img: null },
  { id: 'fountain', name: 'Fountain', cost: 80, category: 'decor', emoji: '⛲', img: null },
  { id: 'statue', name: 'Statue', cost: 90, category: 'decor', emoji: '🗿', img: null },
  { id: 'pond', name: 'Pond', cost: 100, category: 'decor', emoji: '💧', img: null },
  { id: 'bridge-stone', name: 'Stone Bridge', cost: 60, category: 'decor', emoji: '🌉', img: null },
  { id: 'archway', name: 'Archway', cost: 70, category: 'decor', emoji: '🏛️', img: null },
  { id: 'signpost', name: 'Signpost', cost: 15, category: 'decor', emoji: '🧭', img: null },
  { id: 'scarecrow', name: 'Scarecrow', cost: 22, category: 'decor', emoji: '🌾', img: null },
  { id: 'mailbox', name: 'Mailbox', cost: 16, category: 'decor', emoji: '📫', img: null },
  { id: 'fence-white', name: 'White Fence', cost: 12, category: 'decor', emoji: '🚧', img: null },
  { id: 'fence-brown', name: 'Brown Fence', cost: 14, category: 'decor', emoji: '🪵', img: null },
  { id: 'gate-wooden', name: 'Wooden Gate', cost: 19, category: 'decor', emoji: '🚪', img: null },
  { id: 'hay-pile', name: 'Hay Pile', cost: 11, category: 'decor', emoji: '🌾', img: null },
  { id: 'pumpkin-patch', name: 'Pumpkin Patch', cost: 40, category: 'decor', emoji: '🎃', img: null },
  { id: 'mushroom-ring', name: 'Mushroom Ring', cost: 35, category: 'decor', emoji: '🍄', img: null },
  { id: 'butterfly-garden', name: 'Butterfly Garden', cost: 50, category: 'decor', emoji: '🦋', img: null },
]

const SLOT_COUNT = 9 // 3 × 3 minimum

export default function Shop({
  open      = false,
  onClose   = () => {},
  onBuy     = () => {},
  coins     = 0,
  inventory = {},
}) {
  const [mounted,        setMounted       ] = useState(false) // keeps DOM alive during exit
  const [closing,        setClosing       ] = useState(false) // triggers exit animation
  const [activeCategory, setActiveCategory] = useState('seeds')
  const [seasonalItems,  setSeasonalItems ] = useState([])
  const [seasonName,     setSeasonName    ] = useState('')
  const frameRef = useRef(null)

  // Fetch seasonal crops from server when shop opens
  useEffect(() => {
    if (!open) return
    axios.get('/api/crops/seasonal')
      .then(r => {
        if (!r.data?.crops) return
        const season = r.data.seasonName || ''
        setSeasonName(season)
        // Convert server crop definitions into shop items
        const serverSeeds = Object.entries(r.data.crops)
          .filter(([id, def]) => def.seasonal) // only seasonal extras
          .map(([id, def]) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            cost: def.cost,
            category: 'seeds',
            emoji: '🌟',
            img: null,
            seasonal: true,
            description: def.description || '',
          }))
        setSeasonalItems(serverSeeds)
      })
      .catch(() => { /* fallback: no seasonal items shown */ })
  }, [open])

  /* ── Mount / unmount with animation ─────────────────── */
  useEffect(() => {
    if (open) {
      setClosing(false)
      setMounted(true)          // mount first …
    } else if (mounted) {
      setClosing(true)          // … start exit animation while still mounted
    }
  }, [open])

  /* After exit animation finishes, actually unmount */
  const handleAnimationEnd = (e) => {
    if (closing && e.target === frameRef.current) {
      setMounted(false)
      setClosing(false)
    }
  }

  if (!mounted) return null

  /* Items for the active category, merged with live seasonal items for seeds */
  const baseFiltered = ALL_ITEMS.filter(i => i.category === activeCategory)
  const allFiltered = activeCategory === 'seeds'
    ? [...baseFiltered, ...seasonalItems.filter(s => !baseFiltered.find(b => b.id === s.id))]
    : baseFiltered
  const slots = allFiltered.length < SLOT_COUNT
    ? [...allFiltered, ...Array(SLOT_COUNT - allFiltered.length).fill(null)]
    : allFiltered

  const title = CATEGORIES.find(c => c.id === activeCategory)?.name ?? 'Shop'

  return (
    <div
      className={`hd-shop-overlay${closing ? ' hd-closing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => {
        dispatchTutorialEvent('shopClosed', {})
        onClose()
      }}
    >
      <div
        ref={frameRef}
        className={`hd-shop-frame${closing ? ' hd-slide-out' : ''}`}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={handleAnimationEnd}
      >
        {/* ── Inner cream panel ── */}
        <div className="hd-shop-inner">

          {/* ── Header ── */}
          <div className="hd-shop-header">
            <div className="hd-shop-handle" />
            <div className="hd-shop-title">{title}</div>
            <button 
              className="hd-shop-close" 
              onClick={() => {
                dispatchTutorialEvent('shopClosed', {})
                onClose()
              }} 
              aria-label="Close shop"
            >
              ✕
            </button>
          </div>

          {/* ── Scrollable grid ── */}
          <div className="hd-shop-scroll">
            <div className="hd-shop-grid">
              {slots.map((item, i) => {
                if (!item) return <div key={i} className="hd-slot hd-slot-empty" />

                const isImplemented = IMPLEMENTED_IDS.has(item.id) || item.seasonal
                const canAfford = coins >= item.cost
                const slotClass = [
                  'hd-slot hd-slot-filled',
                  !isImplemented ? 'hd-slot-soon' : '',
                  item.seasonal ? 'hd-slot-seasonal' : '',
                ].join(' ').trim()

                return (
                  <div
                    key={item.id}
                    className={slotClass}
                    title={!isImplemented ? `${item.name} — Coming soon!` : `${item.name} — ${item.cost} coins${item.description ? '\n' + item.description : ''}`}
                    onClick={() => {
                      if (!isImplemented) {
                        window.dispatchEvent(new CustomEvent('grow:toast', { detail: { message: `${item.name} coming soon! 🚧`, duration: 1800 } }))
                        return
                      }
                      if (canAfford) onBuy(item)
                    }}
                  >
                    {/* seasonal badge */}
                    {item.seasonal && (
                      <div className="hd-slot-season-badge" title={seasonName}>🌟</div>
                    )}

                    {/* coming soon overlay */}
                    {!isImplemented && (
                      <div className="hd-slot-soon-overlay">🚧</div>
                    )}

                    {/* owned badge */}
                    {(inventory[item.id] || 0) > 0 && (
                      <div className="hd-slot-owned">×{inventory[item.id]}</div>
                    )}

                    {/* icon */}
                    <div className="hd-slot-icon">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt={item.name}
                          onError={e => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextSibling.style.display = 'block'
                          }}
                        />
                      ) : null}
                      <span
                        className="hd-slot-emoji"
                        style={{ display: item.img ? 'none' : 'block' }}
                      >
                        {item.emoji}
                      </span>
                    </div>

                    {/* name */}
                    <div className="hd-slot-label">{item.name}</div>

                    {/* price */}
                    <div className={`hd-slot-cost ${canAfford ? '' : 'cant-afford'}`}>
                      <span className="hd-coin-icon">💰</span>
                      {item.cost}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>{/* end .hd-shop-inner */}

        {/* ── Right-side category tabs ── */}
        <div className="hd-shop-cats">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`hd-cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
              title={cat.name}
              onClick={() => {
                setActiveCategory(cat.id)
                // Dispatch tutorial event for category change
                if (cat.id === 'builds') {
                  dispatchTutorialEvent('shopCategoryChanged', { category: 'builds' })
                }
              }}
            >
              {cat.emoji}
            </button>
          ))}
        </div>

        {/* ── Bottom bookmark ── */}
        <div className="hd-shop-bookmark" aria-hidden="true" />

      </div>{/* end .hd-shop-frame */}
    </div>
  )
}
