/**
 * tutorialEvents.js — Tutorial event bus
 *
 * All tutorial-relevant game actions are communicated through the native
 * browser CustomEvent system (window.dispatchEvent / window.addEventListener).
 *
 * Using native events means:
 *   • No React prop-drilling between GameCanvas ↔ Tutorial
 *   • Listeners survive component re-renders without stale-closure issues
 *     (as long as the handler itself reads from a ref — see Tutorial.jsx)
 *
 * ─── Event map ───────────────────────────────────────────────────────────────
 *
 * DISPATCHER            EVENT NAME                  FIRED WHEN
 * ─────────────────────────────────────────────────────────────────────────────
 * App.jsx               'shopOpened'                Shop modal opens
 * App.jsx               'soilPurchased'             Soil item bought from Shop
 * App.jsx               'seedsPurchased'            Any seed bought from Shop
 * App.jsx               'buildingPurchased'         Building bought from Shop
 * App.jsx               'tutorial:buildingPlaced'   Building confirmed on grid
 * GameCanvas.jsx        'seedPickerOpen'            Seed picker popup shown
 * GameCanvas.jsx        'seedSelected'              Seed chosen in picker
 * GameCanvas.jsx        'tutorial:seedPlanted'      Seed confirmed in soil
 * GameCanvas.jsx        'tutorial:cropHarvested'    Crop successfully harvested
 * GameCanvas.jsx        'soilPlaced'                Soil tile placed on grid
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Usage
 * ─────
 * // Dispatch (from any component):
 * import { dispatchTutorialEvent, TutorialEvents } from './tutorialEvents'
 * dispatchTutorialEvent(TutorialEvents.SEED_PLANTED, { crop: 'rice', row: 3, col: 5 })
 *
 * // Listen (unsubscribes on cleanup):
 * import { onTutorialEvent, TutorialEvents } from './tutorialEvents'
 * const unsub = onTutorialEvent(TutorialEvents.CROP_HARVESTED, (e) => { ... })
 * return unsub // inside useEffect cleanup
 */

/** Canonical event name constants. Always use these; never hard-code strings. */
export const TutorialEvents = {
  // ── Planting flow ──────────────────────────────────────────────────────────
  /** Player chose a seed in the SeedPicker popup */
  SEED_SELECTED: 'seedSelected',
  /** Seed was planted into a soil tile */
  SEED_PLANTED: 'tutorial:seedPlanted',

  // ── Harvest flow ──────────────────────────────────────────────────────────
  /** A planted crop has reached 100% growth (optional; not dispatched by default) */
  CROP_READY: 'tutorial:cropReady',
  /** Player swiped the sickle and harvested at least one ripe crop */
  CROP_HARVESTED: 'tutorial:cropHarvested',

  // ── Shop / purchase flow ──────────────────────────────────────────────────
  /** Shop modal was opened */
  SHOP_OPENED: 'shopOpened',
  /** Soil item was purchased in the Shop */
  SOIL_PURCHASED: 'soilPurchased',
  /** Any seed was purchased in the Shop */
  SEEDS_PURCHASED: 'seedsPurchased',
  /** A building (barn / silo) was purchased in the Shop */
  BUILDING_PURCHASED: 'buildingPurchased',

  // ── Placement flow ────────────────────────────────────────────────────────
  /** Soil tile was placed on the game grid */
  SOIL_PLACED: 'soilPlaced',
  /** Building was placed and confirmed on the game grid */
  BUILDING_PLACED: 'tutorial:buildingPlaced',

  // ── Social ────────────────────────────────────────────────────────────────
  /** Player opened the Chat panel */
  CHAT_OPENED: 'tutorial:chatOpened',
  /** Player sent a Chat message */
  CHAT_MESSAGE_SENT: 'tutorial:messageSent',
}

/**
 * Dispatch a tutorial event on the window.
 * @param {string} eventName  One of the TutorialEvents values
 * @param {object} [detail]   Optional payload attached to CustomEvent.detail
 */
export function dispatchTutorialEvent(eventName, detail = {}) {
  const event = new CustomEvent(eventName, { detail })
  window.dispatchEvent(event)
  if (import.meta.env?.DEV) {
    console.debug(`[Tutorial] ↑ ${eventName}`, detail)
  }
}

/**
 * Subscribe to a tutorial event.
 * Returns an unsubscribe function — use as useEffect cleanup.
 *
 * @param {string}   eventName  One of the TutorialEvents values
 * @param {function} callback   Called when the event fires; receives the CustomEvent
 * @returns {function}          Unsubscribe function
 */
export function onTutorialEvent(eventName, callback) {
  window.addEventListener(eventName, callback)
  return () => window.removeEventListener(eventName, callback)
}

/**
 * Signal that the tutorial is currently active.
 * Called by Tutorial.jsx on mount/step change and cleared on completion.
 * GameCanvas reads this to enable fast-growth mode during the tutorial.
 *
 * @param {boolean} active
 */
export function setTutorialActive(active) {
  window.__growTutorialActive = !!active
}

/**
 * Returns true while the tutorial is running.
 * Safe to call from any component — returns false if window is unavailable (SSR).
 *
 * @returns {boolean}
 */
export function isTutorialActive() {
  return typeof window !== 'undefined' && !!window.__growTutorialActive
}
