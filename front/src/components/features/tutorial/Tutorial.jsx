import React, { useEffect, useRef, useState, useCallback } from 'react'
import axios from 'axios'
import TutorialGuide from './TutorialGuide'
import TutorialSummary from './TutorialSummary'
import { TutorialEvents, onTutorialEvent, setTutorialActive } from './tutorialEvents'

const API_BASE = '/api'

/**
 * Tutorial.jsx — Step-by-step onboarding controller
 *
 * Architecture
 * ────────────
 * Progress is stored in a React ref (progressRef) AND in state (tutorialSteps).
 * The ref lets event-listener callbacks always read the *latest* value without
 * stale-closure bugs; state drives re-renders.
 *
 * Flow per step
 * ─────────────
 * 1. Show intro modal  →  player clicks "Let's Go!"
 * 2. Show spotlight + hint for the first phase of this step
 * 3. Wait for the game event matching that phase  →  auto-advance to next phase
 * 4. When all phases complete  →  mark step done  →  load next step
 * 5. After all steps done  →  show TutorialSummary
 *
 * Bugs fixed vs previous version
 * ───────────────────────────────
 * ✅ Infinite re-render loop (loadTutorialProgress had tutorialSteps in its deps)
 * ✅ Stale-closure bug in event listeners (now use refs)
 * ✅ CROP_READY event that was never dispatched (phase removed; harvest fires CROP_HARVESTED directly)
 * ✅ Step counter showed "Step 6 of 5" (excluded tutorialComplete from count)
 * ✅ No escape hatch (added "Skip Step" and "Skip Tutorial" buttons)
 * ✅ buySoil phase simplified — all 4 sub-events collapsed to soilPlaced
 */

// ─── Step definitions ────────────────────────────────────────────────────────
// Each step has an intro card and zero or more phases.
// A phase waits for a specific window event before advancing.
// `action` is the exact event name dispatched by the game code.
// `skipable` means the player can manually skip this phase if stuck.

const STEP_DEFINITIONS = {
  welcomeShown: {
    intro: '🌾',
    title: '🌱 Welcome to Grow!',
    description:
      "Welcome, farmer! I'll walk you through the basics of growing crops, harvesting them, and building structures on your farm.",
    phases: [], // intro-only, no gameplay phases
  },

  buySoil: {
    intro: '🛒',
    title: '🛒 Get Your First Soil',
    description:
      "Before you can plant anything, you need soil! Open the Shop (🛒 button on the left), buy some Soil, then place it on your farm.",
    phases: [
      {
        name: 'Open the Shop',
        hint: '👈 Click the Shop button on the left side',
        target: '.shop-btn, .left-toolbar button',
        direction: 'right',
        action: 'shopOpened',
        skipable: true,
        extendedHint: {
          title: "Can't find the Shop?",
          steps: [
            "Look for a 🛒 basket icon on the LEFT side of the screen.",
            "It's usually in the bottom-left corner or the left toolbar.",
            "Tap it once to open the Shop panel.",
          ],
        },
      },
      {
        name: 'Buy Soil',
        hint: '👇 Find Soil in the Shop and click it',
        target: null,
        direction: 'down',
        action: 'soilPurchased',
        skipable: true,
        docked: true,  // card goes bottom-right so it doesn't cover the shop panel
        extendedHint: {
          title: "Finding Soil in the Shop",
          steps: [
            "Inside the Shop, look for the 'Farm' or 'Buildings' tab at the top.",
            "Scroll down to find the item labeled 'Soil'.",
            "Make sure you have enough coins 💰, then tap it to buy.",
          ],
        },
      },
      {
        name: 'Buy Seeds',
        hint: '🌱 Now buy some Seeds from the Shop',
        target: null,
        direction: 'down',
        action: 'seedsPurchased',
        skipable: true,
        docked: true,       // card goes bottom-right so it doesn't cover the shop panel
        closeEscape: true,  // if player closes shop here, nudge + auto-advance
        extendedHint: {
          title: "Finding Seeds in the Shop",
          steps: [
            "In the Shop, tap the 'Seeds' tab.",
            "Any seed works — Rice 🍚 is the cheapest and fastest to grow.",
            "Tap the seed to buy at least one.",
          ],
        },
      },
      {
        name: 'Place Soil on Your Farm',
        hint: '👆 Close the Shop and click a green tile to place the soil',
        target: null,
        direction: 'up',
        action: 'soilPlaced',
        skipable: true,
        docked: true,  // shop may still be open; anchor card bottom-right
        extendedHint: {
          title: "How to Place Soil",
          steps: [
            "First close the Shop (tap ✕ or tap anywhere outside the shop).",
            "Your cursor should show a soil preview. If not, tap 'Soil' in your inventory.",
            "Click any BRIGHT GREEN tile on your farm to place the soil there.",
          ],
        },
      },

    ],
  },

  firstPlant: {
    intro: '🌱',
    title: '🌱 Plant Your First Seed',
    description:
      'Great work! Now click on the soil tile you placed, then choose a seed to plant. Your crop will start growing right away!',
    phases: [
      {
        name: 'Click the Soil',
        hint: '👆 Tap the brown soil tile on your farm',
        target: 'canvas',
        direction: 'up',
        action: 'seedPickerOpen',
        skipable: true,
        extendedHint: {
          title: "How to Open the Seed Picker",
          steps: [
            "Look for the brown SOIL tile you placed on your farm.",
            "Tap directly on the center of that brown square.",
            "A seed selection popup should appear above it.",
          ],
        },
      },
      {
        name: 'Choose a Seed',
        hint: '🌾 Pick a seed from the popup',
        target: null,
        direction: 'down',
        action: 'seedSelected',
        skipable: true,
        docked: true,
        extendedHint: {
          title: "Picking a Seed",
          steps: [
            "The popup shows seed cards — each has a count badge (e.g. ×2).",
            "Tap any seed card that shows a number greater than 0.",
            "If all counts are 0, visit the Shop first to buy seeds.",
          ],
        },
      },
      // NOTE: 'Confirm Planting' phase was removed. SEED_PLANTED fires synchronously
      // right after seedSelected inside onSeedPick(), so the React listener misses it.
      // seedSelected is now the last phase; completing it transitions to firstHarvest.
    ],
  },

  firstHarvest: {
    intro: '🌾',
    title: '🎉 Time to Harvest!',
    description:
      "Your seed is in the ground! In tutorial mode your crop grows in just 15 seconds. Watch the label above it — when it says READY we’ll tell you exactly how to harvest!",
    phases: [
      {
        name: 'Wait for READY, then Harvest',
        // hint is overridden dynamically in the render based on cropIsReady state
        hint: '⏳ Watch your crop — it’ll be READY in 15 seconds!',
        target: null,
        direction: 'up',
        action: TutorialEvents.CROP_HARVESTED,
        skipable: true,
        docked: true,
        extendedHint: {
          title: '🌾 How to Harvest',
          steps: [
            "Tap once on the READY crop tile to select it.",
            "A sickle ⚔️ icon will appear above the tile.",
            "Click & drag (or swipe on mobile) across the crop to cut it.",
            "Your harvested crop will go straight into your inventory!",
          ],
        },
      },
    ],
  },

  firstBuilding: {
    intro: '🏠',
    title: '🏠 Build Your First Building',
    description:
      "Let's expand your farm! Open the Shop, buy a Barn or Silo, then place it on your farm. Buildings help you store and process your crops.",
    phases: [
      {
        name: 'Open the Shop',
        hint: '👈 Click the Shop button on the left',
        target: '.shop-btn, .left-toolbar button',
        direction: 'right',
        action: 'shopOpened',
        skipable: true,
        extendedHint: {
          title: "Opening the Shop",
          steps: [
            "Look for the 🛒 basket icon on the LEFT side of the screen.",
            "Tap it once to open the Shop panel.",
          ],
        },
      },
      {
        name: 'Buy a Building',
        hint: '🏠 Find Barn or Silo and click it',
        target: null,
        direction: 'down',
        action: 'buildingPurchased',
        skipable: true,
        docked: true,  // shop is open; anchor card bottom-right
        extendedHint: {
          title: "Buying a Building",
          steps: [
            "In the Shop, switch to the 'Buildings' tab.",
            "Find 'Barn' 🏚️ or 'Silo' 🏗️ and tap it to purchase.",
            "Make sure you have enough coins — sell some crops if needed!",
          ],
        },
      },
      {
        name: 'Place Your Building',
        hint: '🏠 Click a spot on your farm to place the building',
        target: null,
        direction: 'up',
        action: 'tutorial:buildingPlaced',
        skipable: true,
        docked: true,  // shop may still be closing; anchor card bottom-right
        extendedHint: {
          title: "Placing the Building",
          steps: [
            "Close the Shop first (tap ✕ or tap outside it). A building ghost follows your cursor.",
            "Click any EMPTY area on your farm (green or grass tiles work).",
            "Avoid placing on top of existing soil tiles or other buildings.",
          ],
        },
      },

    ],
  },
}

// Ordered step keys (tutorialComplete is handled separately)
const STEP_ORDER = ['welcomeShown', 'buySoil', 'firstPlant', 'firstHarvest', 'firstBuilding']

// Default empty progress
const EMPTY_PROGRESS = {
  welcomeShown: false,
  buySoil: false,
  firstPlant: false,
  firstHarvest: false,
  firstBuilding: false,
  tutorialComplete: false,
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Tutorial({ playerName = 'player1', onStepComplete }) {
  // Progress state — drives re-renders
  const [tutorialSteps, setTutorialSteps] = useState(EMPTY_PROGRESS)
  // Progress ref — always holds latest value; used inside event listeners
  const progressRef = useRef(EMPTY_PROGRESS)

  const [loading, setLoading] = useState(true)

  // Which step we're on right now
  const [currentStep, setCurrentStep] = useState(null)
  // Which phase within that step (0-based index)
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0)

  // UI visibility flags
  const [showIntroModal, setShowIntroModal] = useState(false)
  const [showSpotlight, setShowSpotlight] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // Harvest step: show live countdown so the player knows to wait
  const [harvestCountdown, setHarvestCountdown] = useState(null)
  const [cropIsReady,       setCropIsReady      ] = useState(false)
  const cropReadyNotifiedRef = useRef(false)

  // Extended hint: shown after 30s if a phase hasn't been completed
  const [showExtendedHint, setShowExtendedHint] = useState(false)

  // ─── Load progress (runs once on mount, no stale dep loop) ───────────────
  useEffect(() => {
    let mounted = true

    const applyProgress = (data) => {
      if (!mounted) return
      const merged = { ...EMPTY_PROGRESS, ...data }
      progressRef.current = merged
      setTutorialSteps(merged)
      setLoading(false)
    }

    ;(async () => {
      // Fix #11: Check localStorage first (fast path, works offline)
      let localData = null
      try {
        const raw = localStorage.getItem(`grow:tutorial:${playerName}`)
        if (raw) localData = JSON.parse(raw)
      } catch { /* ignore */ }

      // If localStorage has a complete record, apply it immediately without blocking
      if (localData && localData.tutorialComplete) {
        applyProgress(localData)
        return
      }

      // Partial local data — apply it immediately so UI doesn't stall
      if (localData) applyProgress(localData)

      // Then try to sync from server in the background
      try {
        const res = await axios.get(`${API_BASE}/tutorial/status?player=${playerName}`, { timeout: 4000 })
        if (mounted) applyProgress(res.data?.progress || localData || {})
      } catch {
        // Server unavailable — already applied local data above; just ensure loading clears
        if (mounted && !localData) applyProgress({})
        else if (mounted) setLoading(false)
      }
    })()

    return () => { mounted = false }
  }, [playerName]) // ← only playerName, no tutorialSteps dependency → no infinite loop

  // ─── Determine next step whenever progress changes ────────────────────────
  useEffect(() => {
    if (loading) return

    const steps = tutorialSteps

    // If already fully complete, don't show anything
    if (steps.tutorialComplete) {
      setCurrentStep(null)
      setShowIntroModal(false)
      setShowSpotlight(false)
      setShowSummary(false)
      return
    }

    // Find the first incomplete step
    const nextStep = STEP_ORDER.find(key => !steps[key]) || null

    if (!nextStep) {
      // All main steps done → show summary
      setShowSummary(true)
      setShowIntroModal(false)
      setShowSpotlight(false)
      setCurrentStep(null)
      return
    }

    if (nextStep !== currentStep) {
      // Moving to a new step — reset phase and show intro
      setCurrentStep(nextStep)
      setCurrentPhaseIndex(0)
      setShowIntroModal(true)
      setShowSpotlight(false)
    }
  }, [tutorialSteps, loading]) // ← currentStep intentionally excluded to avoid loop

  // ─── Mark a step complete (called by event listeners and skip buttons) ────
  const completeStep = useCallback((step) => {
    const updated = { ...progressRef.current, [step]: true }
    progressRef.current = updated
    setTutorialSteps({ ...updated })

    // Persist locally
    try {
      localStorage.setItem(`grow:tutorial:${playerName}`, JSON.stringify(updated))
    } catch { /* ignore */ }

    // Sync to server (best-effort)
    axios.post(`${API_BASE}/tutorial/mark-step`, {
      player: playerName,
      step,
    }).catch(() => { })

    onStepComplete?.(step)
  }, [playerName, onStepComplete])

  // ─── Advance to next phase, or complete the step if last phase ───────────
  //     Uses a ref so event listeners always call the latest version.
  const advancePhaseRef = useRef(null)
  advancePhaseRef.current = (step, phaseIndex) => {
    const def = STEP_DEFINITIONS[step]
    const phases = def?.phases || []
    if (phaseIndex >= phases.length - 1) {
      // Last phase done → complete the step
      setShowSpotlight(false)
      completeStep(step)
    } else {
      setCurrentPhaseIndex(phaseIndex + 1)
    }
  }

  // ─── Subscribe to game event for the current phase ──────────────────────────────────
  useEffect(() => {
    if (!currentStep || showIntroModal || !showSpotlight) return

    const def = STEP_DEFINITIONS[currentStep]
    const phases = def?.phases || []
    if (phases.length === 0) return

    const phase = phases[currentPhaseIndex]
    if (!phase) return

    const eventName = phase.action

    const handler = () => {
      // Use the ref to get the latest advancePhase function — no stale closure
      advancePhaseRef.current(currentStep, currentPhaseIndex)
    }

    const unsub = onTutorialEvent(eventName, handler)

    // ── "Don't forget your seeds!" escape hatch ──────────────────────────────────
    // When the player closes the shop on a phase with closeEscape:true
    // (the Buy Seeds phase), show a gentle reminder toast and auto-advance.
    let unsubClose
    if (phase.closeEscape) {
      unsubClose = onTutorialEvent('shopClosed', () => {
        // Small delay so the shop close animation plays first
        setTimeout(() => {
          // Show toast via the game's existing toast mechanism
          const toastEvent = new CustomEvent('grow:toast', {
            detail: { message: "🌱 Don't forget your seeds! Visit the Shop to buy some.", duration: 3500 }
          })
          window.dispatchEvent(toastEvent)
          // Auto-advance past this phase
          advancePhaseRef.current(currentStep, currentPhaseIndex)
        }, 400)
      })
    }

    return () => {
      unsub()
      unsubClose?.()
    }
  }, [currentStep, currentPhaseIndex, showIntroModal, showSpotlight])

  // ─── Window flag: tell GameCanvas the tutorial is active ────────────────
  //     GameCanvas reads window.__growTutorialActive to enable fast-grow mode.
  useEffect(() => {
    const isActive = !loading && !!currentStep && !tutorialSteps.tutorialComplete
    setTutorialActive(isActive)
    return () => setTutorialActive(false) // clear on unmount
  }, [loading, currentStep, tutorialSteps.tutorialComplete])

  // ─── 30-second timeout nudge ──────────────────────────────────────────────
  //     If a phase event hasn't fired after 30s, reveal the extendedHint card.
  useEffect(() => {
    // Only run during active spotlight phases that have extended hints
    if (!showSpotlight || showIntroModal || !currentPhase?.extendedHint) {
      setShowExtendedHint(false)
      return
    }

    // Reset whenever the phase changes so the timer always starts fresh
    setShowExtendedHint(false)
    const timer = setTimeout(() => setShowExtendedHint(true), 30_000)
    return () => clearTimeout(timer)
  }, [currentStep, currentPhaseIndex, showSpotlight, showIntroModal])

  // ─── Reset crop-ready notification when step changes ───────────────────────────
  useEffect(() => {
    cropReadyNotifiedRef.current = false
    setCropIsReady(false)
  }, [currentStep])

  // ─── Harvest countdown timer ───────────────────────────────────────────────
  //     Shows the player how long until their crop is ready.
  useEffect(() => {
    if (currentStep !== 'firstHarvest' || !showSpotlight) {
      setHarvestCountdown(null)
      return
    }

    // Look for the earliest growing crop in the farm grid
    const updateCountdown = () => {
      try {
        const raw = localStorage.getItem('grow:grid')
        if (!raw) { setHarvestCountdown(null); return }
        const grid = JSON.parse(raw)
        let minRemaining = null

        grid.forEach(row => {
          row.forEach(cell => {
            const item = cell?.placedItem
            if (item?.crop && item?.plantedAt && item?.growthDuration) {
              const readyAt = item.plantedAt + item.growthDuration
              const remaining = readyAt - Date.now()
              if (minRemaining === null || remaining < minRemaining) {
                minRemaining = remaining
              }
            }
          })
        })

        if (minRemaining !== null) {
          if (minRemaining <= 0) {
            setHarvestCountdown('Your crop is READY! 🌾 Tap it then swipe to harvest!')
            // First time we detect READY: toast + auto-show harvest instructions
            if (!cropReadyNotifiedRef.current) {
              cropReadyNotifiedRef.current = true
              setCropIsReady(true)
              // Fire the "It's time!" toast
              window.dispatchEvent(new CustomEvent('grow:toast', {
                detail: {
                  message: '🌾 Your crop is READY! Time to harvest!',
                  duration: 4000,
                },
              }))
              // Immediately show the how-to-harvest extended hint (skip the 30s wait)
              setShowExtendedHint(true)
            }
          } else {
            setCropIsReady(false)
            const secs = Math.ceil(minRemaining / 1000)
            const mm = Math.floor(secs / 60)
            const ss = secs % 60
            if (mm > 0) {
              setHarvestCountdown(`Ready in ${mm}m ${ss.toString().padStart(2, '0')}s — almost there!`)
            } else {
              setHarvestCountdown(`Ready in ${secs}s ⏳ — watch for READY!`)
            }
          }
        } else {
          setHarvestCountdown('Go back and plant a crop first!')
        }
      } catch {
        setHarvestCountdown(null)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [currentStep, showSpotlight])

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleIntroClose = () => {
    const def = STEP_DEFINITIONS[currentStep]
    if (!def?.phases?.length) {
      // No gameplay phases — just complete this step
      setShowIntroModal(false)
      completeStep(currentStep)
      return
    }
    setShowIntroModal(false)
    setCurrentPhaseIndex(0)
    // Small delay to let intro modal fade out before spotlight appears
    setTimeout(() => setShowSpotlight(true), 220)
  }

  const handleSkipStep = () => {
    setShowExtendedHint(false)
    setShowSpotlight(false)
    completeStep(currentStep)
  }

  const handleDismissExtendedHint = () => setShowExtendedHint(false)

  const handleSkipTutorial = () => {
    // Mark everything complete
    const allDone = Object.keys(EMPTY_PROGRESS).reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {}
    )
    progressRef.current = allDone
    setTutorialSteps(allDone)
    setShowIntroModal(false)
    setShowSpotlight(false)
    setShowSummary(false)
    try {
      localStorage.setItem(`grow:tutorial:${playerName}`, JSON.stringify(allDone))
    } catch { /* ignore */ }
    axios.post(`${API_BASE}/tutorial/mark-step`, {
      player: playerName,
      step: 'tutorialComplete',
    }).catch(() => { })
    onStepComplete?.('tutorialComplete')
  }

  const handleSummaryDismiss = () => {
    completeStep('tutorialComplete')
    setShowSummary(false)
  }

  // ─── Derived values ────────────────────────────────────────────────────────
  if (loading) return null

  // Nothing to show
  if (!currentStep && !showSummary) return null
  if (tutorialSteps.tutorialComplete) return null

  const stepDef = currentStep ? STEP_DEFINITIONS[currentStep] : null
  const phases = stepDef?.phases || []
  const currentPhase = phases[currentPhaseIndex]
  const totalPhases = phases.length

  // Step number for display (1-based, excludes tutorialComplete)
  const stepNumber = currentStep ? STEP_ORDER.indexOf(currentStep) + 1 : 0
  const totalSteps = STEP_ORDER.length

  // Can this specific phase be skipped?
  const canSkipPhase = currentPhase?.skipable === true

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── INTRO MODAL ─── shown at the start of each major step ─── */}
      {showIntroModal && stepDef && (
        <div className="tutorial-intro-overlay" role="dialog" aria-modal="true" aria-label={stepDef.title}>
          <div className="tutorial-intro-modal">

            {/* Skip tutorial link (top-right) */}
            <button
              className="tutorial-skip-link"
              onClick={handleSkipTutorial}
              title="Skip the entire tutorial"
              aria-label="Skip tutorial"
            >
              Skip tutorial ✕
            </button>

            {/* Step emoji */}
            <div className="intro-icon" role="img" aria-label="Step icon">
              {stepDef.intro}
            </div>

            {/* Title */}
            <h2 className="intro-title">{stepDef.title}</h2>

            {/* Description */}
            <p className="intro-description">{stepDef.description}</p>

            {/* Step counter pill */}
            <div className="intro-progress">
              Step {stepNumber} of {totalSteps}
            </div>

            {/* Progress bar */}
            <div className="intro-progress-bar" role="progressbar"
              aria-valuenow={stepNumber} aria-valuemin={1} aria-valuemax={totalSteps}>
              <div
                className="intro-progress-fill"
                style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
              />
            </div>

            {/* CTA button */}
            <button className="intro-btn" onClick={handleIntroClose} id="tutorial-lets-go-btn">
              Let's Go! 🚀
            </button>
          </div>
        </div>
      )}

      {/* ── SPOTLIGHT + PHASE HINT ─── shown during active gameplay phases ─── */}
      {showSpotlight && currentPhase && !showIntroModal && (
        <>
          <TutorialGuide
            stepNumber={stepNumber}
            totalSteps={totalSteps}
            phaseNumber={currentPhaseIndex + 1}
            totalPhases={totalPhases}
            phaseName={currentPhase.name}
            message={
              // When crop is READY, override the generic waiting hint with an action hint
              currentStep === 'firstHarvest' && cropIsReady
                ? '🌾 READY! Tap the crop, then swipe across it to harvest!'
                : currentPhase.hint
            }
            target={currentPhase.target}
            direction={currentPhase.direction}
            extraInfo={currentStep === 'firstHarvest' ? harvestCountdown : null}
            docked={!!currentPhase.docked}
          />

          {/* 30s timeout — extended hint card with step-by-step guidance */}
          {showExtendedHint && currentPhase.extendedHint && (
            <ExtendedHintCard
              title={currentPhase.extendedHint.title}
              steps={currentPhase.extendedHint.steps}
              onDismiss={handleDismissExtendedHint}
              onSkip={canSkipPhase ? handleSkipStep : null}
            />
          )}

          {/* Skip step button — only shown for skipable phases */}
          {canSkipPhase && (
            <div className="tutorial-skip-bar">
              <button
                className="tutorial-skip-phase-btn"
                onClick={handleSkipStep}
                id="tutorial-skip-step-btn"
              >
                Skip this step →
              </button>
            </div>
          )}
        </>
      )}

      {/* ── SUMMARY SCREEN ─── shown after all steps complete ─── */}
      {showSummary && (
        <TutorialSummary
          playerName={playerName}
          onDismiss={handleSummaryDismiss}
        />
      )}
    </>
  )
}

// ─── ExtendedHintCard ─────────────────────────────────────────────────────────
// Appears after 30 seconds on a stuck phase. Shows step-by-step instructions
// in a bottom-right anchored panel, above the skip bar.

function ExtendedHintCard({ title, steps, onDismiss, onSkip }) {
  return (
    <div className="tut-ext-overlay" role="alertdialog" aria-label={title}>
      <div className="tut-ext-card">
        {/* Header */}
        <div className="tut-ext-header">
          <span className="tut-ext-icon">💡</span>
          <span className="tut-ext-title">{title}</span>
          <button
            className="tut-ext-close"
            onClick={onDismiss}
            aria-label="Close hint"
          >
            ✕
          </button>
        </div>

        {/* Numbered steps */}
        <ol className="tut-ext-steps">
          {steps.map((step, i) => (
            <li key={i} className="tut-ext-step">
              <span className="tut-ext-num">{i + 1}</span>
              <span className="tut-ext-text">{step}</span>
            </li>
          ))}
        </ol>

        {/* Action row */}
        <div className="tut-ext-actions">
          <button className="tut-ext-btn-got-it" onClick={onDismiss}>
            Got it! 👍
          </button>
          {onSkip && (
            <button className="tut-ext-btn-skip" onClick={onSkip}>
              Skip step →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
