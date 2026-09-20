# Tutorial System — Developer Reference

> **Version**: 3.1
> **Last updated**: June 2026
> **Status**: ✅ Production-ready

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tutorial Flow](#tutorial-flow)
4. [File Structure](#file-structure)
5. [Event System](#event-system)
6. [Component API](#component-api)
7. [CSS Naming Convention](#css-naming-convention)
8. [Z-Index Layers](#z-index-layers)
9. [Fast Crop Growth (Tutorial Mode)](#fast-crop-growth-tutorial-mode)
10. [30-Second Timeout Nudge](#30-second-timeout-nudge)
11. [Adding a New Tutorial Step](#adding-a-new-tutorial-step)
12. [Known Bugs Fixed in v3](#known-bugs-fixed-in-v3)
13. [Testing Checklist](#testing-checklist)

---

## Overview

The tutorial system guides new players through the core game loop of **Grow**:

1. Buying soil & seeds from the Shop  
2. Placing soil on the farm  
3. Planting a seed on the soil  
4. Harvesting a ripe crop with the sickle  
5. Buying and placing a building (Barn or Silo)  

On completion, a **summary screen** is shown with lessons learned, next steps, and pro tips.

---

## Architecture

```
App.jsx
 └─ <Tutorial playerName={...} onStepComplete={...} />
     ├─ <TutorialGuide />        ← spotlight + floating hint card
     └─ <TutorialSummary />      ← completion screen

(post-tutorial)
 └─ <IntermediateTutorial />     ← contextual hints after onboarding
```

### State management pattern

`Tutorial.jsx` uses **two parallel stores** to avoid stale-closure bugs:

| Store | Type | Purpose |
|-------|------|---------|
| `tutorialSteps` | `useState` | Drives React re-renders |
| `progressRef` | `useRef` | Accessed inside event listeners (always current) |

Event listener callbacks read from `advancePhaseRef.current` (another ref) so they always call the latest function even after re-renders.

### Persistence

Progress is saved in two places:

| Storage | Key | Fallback |
|---------|-----|----------|
| `localStorage` | `grow:tutorial:{playerName}` | Primary |
| Server (`/api/tutorial/mark-step`) | POST body | Best-effort |

On load, the server is tried first; if it fails (network, 404, etc.), localStorage is used transparently.

---

## Tutorial Flow

```
mount
  │
  ▼
loadProgress()           ← runs once; no deps loop
  │
  ▼
determineNextStep()      ← triggered when tutorialSteps changes
  │
  ├─ nextStep found?
  │     │
  │     ▼
  │   setCurrentStep(nextStep)
  │   setCurrentPhaseIndex(0)
  │   showIntroModal = true
  │     │
  │     ▼  player clicks "Let's Go!"
  │   showIntroModal = false
  │   showSpotlight = true       ← after 220ms fade delay
  │     │
  │     ▼  game fires event matching phase.action
  │   advancePhase()
  │     ├─ more phases? → currentPhaseIndex++
  │     └─ last phase?  → completeStep(currentStep)
  │                            → setTutorialSteps(updated)
  │                            → progressRef.current = updated
  │                            → localStorage.setItem(...)
  │                            → axios.post('/api/tutorial/mark-step')
  │     ▲  ── back to determineNextStep() ──
  │
  └─ all steps done?
        ▼
      showSummary = true
        │
        ▼  player clicks "Start Farming!"
      completeStep('tutorialComplete')
      showSummary = false
        │
        ▼  tutorialSteps.tutorialComplete === true
      render null  ← tutorial never shows again
```

---

## File Structure

```
client/src/components/features/tutorial/
├── Tutorial.jsx           Main controller — step/phase logic, event subscriptions
├── TutorialGuide.jsx      Spotlight overlay + floating hint card
├── TutorialSummary.jsx    Completion screen (lessons, next steps, tips)
├── IntermediateTutorial   Post-onboarding contextual hints (shop, chat tips)
├── ContextualTooltip.jsx  Hover tooltip system (data-tooltip attribute)
└── tutorialEvents.js      Event name constants + dispatch/subscribe helpers

client/src/styles/features.css
   └── Tutorial section starts at "TUTORIAL SYSTEM — Complete CSS (v3)"
```

---

## Event System

All tutorial-relevant game actions are communicated through **native browser CustomEvents** on `window`. This decouples GameCanvas, App, and Tutorial without prop-drilling.

### Canonical event names

| Constant | String value | Fired by | When |
|----------|-------------|----------|------|
| `TutorialEvents.SHOP_OPENED` | `'shopOpened'` | `App.jsx` | Shop modal opens |
| `TutorialEvents.SOIL_PURCHASED` | `'soilPurchased'` | `App.jsx` | Soil item bought |
| `TutorialEvents.SEEDS_PURCHASED` | `'seedsPurchased'` | `App.jsx` | Any seed bought |
| `TutorialEvents.BUILDING_PURCHASED` | `'buildingPurchased'` | `App.jsx` | Building bought |
| `TutorialEvents.BUILDING_PLACED` | `'tutorial:buildingPlaced'` | `App.jsx` | Building placed on grid |
| `TutorialEvents.SOIL_PLACED` | `'soilPlaced'` | `GameCanvas.jsx` / `App.jsx` | Soil tile placed |
| `TutorialEvents.SEED_SELECTED` | `'seedSelected'` | `GameCanvas.jsx` | Seed chosen in picker |
| `TutorialEvents.SEED_PLANTED` | `'tutorial:seedPlanted'` | `GameCanvas.jsx` | Seed confirmed in soil |
| `TutorialEvents.CROP_HARVESTED` | `'tutorial:cropHarvested'` | `GameCanvas.jsx` | Crop sickle-harvested |
| `TutorialEvents.SEED_PICKER_OPEN` | `'seedPickerOpen'` | `GameCanvas.jsx` | Seed picker opened |

> ⚠️ **Always use the constants, never raw strings.** If you rename an event, update `TutorialEvents` in `tutorialEvents.js` and all call sites.

### Dispatching an event

```js
import { dispatchTutorialEvent, TutorialEvents } from './tutorialEvents'

// From GameCanvas after a crop is harvested:
dispatchTutorialEvent(TutorialEvents.CROP_HARVESTED, {
  crop: cropObj.crop,
  row,
  col,
})
```

### Subscribing to an event

```js
import { onTutorialEvent, TutorialEvents } from './tutorialEvents'

useEffect(() => {
  const unsub = onTutorialEvent(TutorialEvents.SEED_PLANTED, (event) => {
    console.log('Planted:', event.detail)
  })
  return unsub // automatically removes listener on cleanup
}, [])
```

---

## Component API

### `<Tutorial />`

```jsx
<Tutorial
  playerName="alice"       // {string} required — used for localStorage key + API calls
  onStepComplete={fn}      // {function(stepKey)} called after each step completes
/>
```

Rendered by `App.jsx` when `authState === 'game'`.

### `<TutorialGuide />`

```jsx
<TutorialGuide
  stepNumber={2}           // {number} 1-based current step
  totalSteps={5}           // {number} total steps
  phaseNumber={1}          // {number} 1-based phase within step
  totalPhases={4}          // {number} total phases in this step
  phaseName="Open Shop"    // {string} human-readable phase name
  message="👈 Click Shop" // {string} hint text shown in floating card
  target=".shop-btn"       // {string|null} CSS selector for spotlight target
  direction="right"        // {string} 'up'|'down'|'left'|'right'
  extraInfo={countdown}    // {string|null} extra line (harvest countdown)
/>
```

Internal-only — rendered by `Tutorial.jsx`.

### `<TutorialSummary />`

```jsx
<TutorialSummary
  playerName="alice"       // {string} shown in subtitle
  onDismiss={fn}           // {function} called when player clicks "Start Farming!"
/>
```

### `<IntermediateTutorial />`

```jsx
<IntermediateTutorial
  playerName="alice"
  tutorialComplete={true}  // {boolean} only activates after main tutorial is done
/>
```

Shows contextual hints (shop tips, chat tips) the first time each feature is opened after onboarding.

---

## CSS Naming Convention

| Namespace | Used by | Description |
|-----------|---------|-------------|
| `.tutorial-intro-*` | `Tutorial.jsx` | Intro modal overlay and card |
| `.intro-*` | `Tutorial.jsx` | Elements inside the intro modal |
| `.tutorial-skip-*` | `Tutorial.jsx` | Skip link and skip bar |
| `.tut-ext-*` | `Tutorial.jsx` — `ExtendedHintCard` | 30s timeout nudge card |
| `.ts-*` | `TutorialSummary.jsx` | Summary screen |
| `.intermediate-tutorial-*` | `IntermediateTutorial.jsx` | Post-onboarding hint panel |
| `.hint-*` | `IntermediateTutorial.jsx` | Elements inside hint panel |
| `.tutorial-overlay` | Legacy | Kept as empty stub; do not use |
| `.tutorial-modal` | Legacy | Kept as empty stub; do not use |
| `.contextual-tooltip` | `ContextualTooltip.jsx` | `data-tooltip` hover popups |

---

## Z-Index Layers

| Layer | z-index | Component |
|-------|---------|-----------|
| Game canvas | 0 | `GameCanvas.jsx` |
| HUD / toolbars | 100–500 | `App.jsx` |
| Shop / chat modals | 2000–2400 | Feature components |
| Intermediate hints | 2400 | `IntermediateTutorial.jsx` |
| Spotlight overlay | 10580 | `TutorialGuide.jsx` — dark SVG |
| Gold glow border | 10585 | `TutorialGuide.jsx` — target highlight |
| Hint card | 10595 | `TutorialGuide.jsx` — floating tooltip |
| Skip bar | 10700 | `Tutorial.jsx` |
| Extended hint card | 10720 | `Tutorial.jsx` — `ExtendedHintCard` (30s nudge) |
| Summary screen | 10800 | `TutorialSummary.jsx` |
| Intro modal | 10900 | `Tutorial.jsx` |

> **Rule**: New modals that must appear above the tutorial should use z-index ≥ 11000. Modals that must appear below should use ≤ 2400.

---

## Fast Crop Growth (Tutorial Mode)

**Problem solved**: The harvest step is the biggest player drop-off point. Players plant a crop that takes minutes or hours to grow, get bored, and never come back to complete the tutorial.

**Solution**: While `Tutorial.jsx` is active with an unfinished step, `window.__growTutorialActive` is set to `true`. `GameCanvas.jsx` reads this flag in `onSeedPick` and uses **15 seconds** instead of the normal growth duration.

### How it works

```
Tutorial.jsx                     GameCanvas.jsx (onSeedPick)
─────────────                    ───────────────────────────
setTutorialActive(true)          const inTutorial = isTutorialActive()
  → window.__growTutorialActive  const grow = inTutorial ? 15_000 : normalDuration
    = true                       if (inTutorial && !toastShown) toast('crops grow in 15s!')
```

### Key files

| File | Change |
|------|--------|
| `tutorialEvents.js` | Added `setTutorialActive(bool)` and `isTutorialActive()` helpers |
| `Tutorial.jsx` | Calls `setTutorialActive(true)` while a step is active, `false` on completion/unmount |
| `GameCanvas.jsx` | Reads `isTutorialActive()` in `onSeedPick`; added `tutorialFastGrowToastShownRef` |

### Behaviour

- Crops planted **during tutorial** grow in 15 seconds
- Crops planted **after tutorial completion** use normal timers
- A one-time toast fires on the first tutorial plant: *"🌱 Tutorial: crops grow in 15 seconds!"*
- If the player somehow refreshes mid-tutorial, `window.__growTutorialActive` is restored as soon as `Tutorial.jsx` re-mounts (within one render cycle)

---

## 30-Second Timeout Nudge

**Problem solved**: When a player doesn't know how to complete a phase action (e.g. can't find the Shop button), the main hint card repeats the same short instruction forever. Players quit rather than ask for help.

**Solution**: A `setTimeout(30_000)` starts each time a new spotlight phase begins. If the phase event still hasn't fired after 30 seconds, an **`ExtendedHintCard`** slides in from the bottom-right with numbered step-by-step instructions specific to that phase.

### Component: `ExtendedHintCard`

Defined inline at the bottom of `Tutorial.jsx`. Props:

```jsx
<ExtendedHintCard
  title="Can't find the Shop?"        // {string} card heading
  steps={[                             // {string[]} ordered instruction list
    "Look for the 🛒 icon on the left...",
    "Tap it once to open the Shop...",
  ]}
  onDismiss={fn}                       // {function} called when "Got it! 👍" is clicked
  onSkip={fn | null}                   // {function|null} if set, shows "Skip step →"
/>
```

### Phase-level configuration

Each phase in `STEP_DEFINITIONS` can have an optional `extendedHint` field:

```js
{
  name: 'Open the Shop',
  hint: '👈 Click the Shop button on the left side',
  action: 'shopOpened',
  skipable: true,
  extendedHint: {                    // ← optional; shown after 30s
    title: "Can't find the Shop?",
    steps: [
      "Look for a 🛒 basket icon on the LEFT side of the screen.",
      "It's usually in the bottom-left corner or the left toolbar.",
      "Tap it once to open the Shop panel.",
    ],
  },
}
```

Phases **without** `extendedHint` never trigger the card (the timeout still runs but `setShowExtendedHint(true)` is gated on `currentPhase?.extendedHint`).

### Timer reset behaviour

The timeout resets (starts fresh from 30s) whenever:
- `currentStep` changes (new major step started)
- `currentPhaseIndex` changes (moved to next phase)
- `showIntroModal` becomes true (intro modal appeared)
- `showSpotlight` becomes false (spotlight hidden)

### Styling

CSS namespace: `.tut-ext-*`. The card uses a **dark glassmorphic theme** (near-black with gold border) to contrast with the light game UI and the amber tutorial overlay. Z-index `10720` — above the skip bar (10700) but below the intro modal (10900).

---

## Adding a New Tutorial Step

1. **Add a step key** to `EMPTY_PROGRESS` in `Tutorial.jsx`:

   ```js
   const EMPTY_PROGRESS = {
     welcomeShown: false,
     buySoil: false,
     firstPlant: false,
     firstHarvest: false,
     firstBuilding: false,
     myNewStep: false,      // ← add here
     tutorialComplete: false,
   }
   ```

2. **Add to `STEP_ORDER`**:

   ```js
   const STEP_ORDER = [
     'welcomeShown', 'buySoil', 'firstPlant', 'firstHarvest',
     'firstBuilding',
     'myNewStep',    // ← add in desired order
   ]
   ```

3. **Add to `STEP_DEFINITIONS`**:

   ```js
   myNewStep: {
     intro: '🎯',
     title: '🎯 My New Step',
     description: 'Explain what the player is about to do...',
     phases: [
       {
         name: 'Do the thing',
         hint: '👆 Click on X to do the thing',
         target: '.css-selector-of-element',
         direction: 'up',
         action: TutorialEvents.MY_NEW_EVENT,  // event that fires on completion
         skipable: true,
       },
     ],
   }
   ```

4. **Add the event constant** to `tutorialEvents.js`:

   ```js
   export const TutorialEvents = {
     // ...existing events...
     MY_NEW_EVENT: 'tutorial:myNewEvent',
   }
   ```

5. **Dispatch the event** from the relevant game component:

   ```js
   import { dispatchTutorialEvent, TutorialEvents } from '../features/tutorial/tutorialEvents'

   // Inside the handler where the action happens:
   dispatchTutorialEvent(TutorialEvents.MY_NEW_EVENT, { detail: 'payload' })
   ```

6. **Update server schema** (optional) if you want the step persisted server-side — add a migration and update the `Tutorial` entity.

---

## Known Bugs Fixed in v3

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Tutorial reloads infinitely on start | `loadTutorialProgress` had `tutorialSteps` in its `useCallback` deps, causing infinite setState → re-render loop | Removed `tutorialSteps` from deps; effect runs once on `playerName` change only |
| Events never advance tutorial phases | `completeStep` captured stale `tutorialSteps` in closure; event listener added with old reference | Moved advance logic to `advancePhaseRef.current`; listeners call the ref, not a closure |
| Player stuck on harvest step forever | `firstHarvest` step waited for `CROP_READY` event which is never dispatched | Removed "Wait" phase; step now directly listens for `CROP_HARVESTED` |
| Step counter shows "Step 6 of 5" | `Object.keys(stepDefinitions).length - 1` included `tutorialComplete` | Changed to `STEP_ORDER.length` which excludes `tutorialComplete` |
| No way to skip a stuck phase | No skip button existed | Added "Skip this step →" bar during spotlight, "Skip tutorial ✕" on intro modal |
| Old CSS had duplicate keyframes | Multiple `@keyframes bounce`, `@keyframes fadeIn` across 600+ lines | Consolidated all tutorial CSS into one clean block with shared keyframes at top |
| `soilPlaced` event inconsistency | `App.jsx` used `dispatchTutorialEvent('soilPlaced')` but also sometimes fired via `GameCanvas`; both paths now trigger same event name | Both paths verified to emit `'soilPlaced'` consistently |

---

## Testing Checklist

Run through this checklist manually after any changes to the tutorial system:

### Fast crop growth

- [ ] Plant a seed during tutorial → toast shows "Tutorial: crops grow in 15 seconds!"
- [ ] Crop becomes READY within ~15s (not the normal minutes-long timer)
- [ ] Plant a seed after tutorial complete → uses normal growth duration, no toast
- [ ] The fast-grow toast only fires once (not on every subsequent planting)

### 30-second timeout nudge

- [ ] Stay on any phase for 30+ seconds without completing → `ExtendedHintCard` slides in from bottom-right
- [ ] Card shows the correct `extendedHint.title` and numbered `steps` for that exact phase
- [ ] "Got it! 👍" dismisses the card without advancing the phase
- [ ] "Skip step →" dismisses the card AND completes the step
- [ ] Moving to the next phase resets the 30s timer (card doesn't re-appear immediately)
- [ ] Phases without `extendedHint` defined never show the card
- [ ] The `Confirm Planting` phase (no `extendedHint`) never shows a card

### Fresh player (no localStorage)

- [ ] Welcome modal appears immediately after login
- [ ] Step counter shows "Step 1 of 5"  
- [ ] Progress bar is at 20%
- [ ] Clicking "Let's Go!" dismisses modal and shows spotlight on Shop button
- [ ] Opening Shop advances to "Buy Soil" phase
- [ ] Buying soil advances to "Buy Seeds" phase
- [ ] Buying seeds advances to "Place Soil" phase
- [ ] Placing soil on farm completes `buySoil` step → "Plant" intro appears
- [ ] Clicking soil tile shows seed picker → advances phase
- [ ] Picking a seed advances to "Confirm Planting" phase
- [ ] Seed planted → advances to `firstHarvest` step
- [ ] Harvest countdown shows correct time
- [ ] Harvesting crop completes `firstHarvest` → "Build" intro appears
- [ ] Building purchase + placement completes `firstBuilding`
- [ ] Summary screen appears with all 3 sections populated
- [ ] "Start Farming!" closes summary and tutorial is gone permanently

### Skip buttons

- [ ] "Skip tutorial ✕" on intro modal marks ALL steps complete immediately
- [ ] "Skip this step →" during spotlight completes current step and advances
- [ ] After skip, the next step's intro modal appears correctly

### Persistence

- [ ] Refresh mid-tutorial → resumes from last completed step
- [ ] `grow:tutorial:{name}` key exists in localStorage
- [ ] Player who completed tutorial sees no tutorial on next login

### Edge cases

- [ ] Player with no seeds clicks soil → "No seeds — visit the Shop!" message
- [ ] Two different player names have separate tutorial progress
- [ ] Backend 404/500 doesn't crash tutorial — falls back to localStorage gracefully
