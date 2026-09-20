import React, { useState, useEffect } from 'react'

/**
 * TutorialSummary.jsx — Onboarding completion screen
 *
 * Shown after the player completes all 5 tutorial steps.
 * Displays:
 *   • A celebratory header with animated star burst
 *   • 4 "Lessons Learned" cards (what was taught)
 *   • 5 "What's Next" action cards (clickable to explore features)
 *   • 3 Pro Tips
 *   • Primary "Start Farming!" button + "Review later" link
 *
 * Props
 * ─────
 * playerName  {string}   Player's display name
 * onDismiss   {function} Called when the player closes the summary
 */
export default function TutorialSummary({ playerName = 'farmer', onDismiss }) {
  const [visible, setVisible] = useState(false)

  // Stagger-in animation after mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const lessons = [
    { icon: '🌱', title: 'Planting', desc: 'Buy soil & seeds from the Shop, place soil on your farm, then tap to plant.' },
    { icon: '🌾', title: 'Harvesting', desc: 'Watch the crop timer. When READY appears, tap the crop and swipe with the sickle.' },
    { icon: '🏠', title: 'Buildings', desc: 'Barns & Silos store your crops and unlock processing. Buy them in the Shop.' },
    { icon: '💰', title: 'Economy', desc: 'Sell harvested crops for coins. Use coins to buy more seeds, soil, and buildings.' },
  ]

  const nextSteps = [
    { icon: '🛒', label: 'Explore the Shop', desc: 'New crop varieties unlock as you level up' },
    { icon: '💬', label: 'Join Global Chat', desc: 'Get tips from experienced farmers' },
    { icon: '📈', label: 'Earn XP & Level Up', desc: 'Unlock rare seeds and seasonal crops' },
    { icon: '🏆', label: 'Expand Your Farm', desc: 'Place more buildings and decorations' },
    { icon: '🌍', label: 'Trade with Players', desc: 'Exchange crops and resources' },
  ]

  const tips = [
    '⏰ Different crops grow at different speeds — rice is fast, berry takes longer but pays more!',
    '🏠 A Barn boosts your coin storage limit. A Silo lets you store raw crops for later.',
    '🌸 Seasonal crops appear in the Shop only during their season — grab them while you can!',
  ]

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => onDismiss?.(), 320)
  }

  return (
    <div
      className={`ts-overlay${visible ? ' ts-overlay--in' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial Complete"
    >
      <div className={`ts-modal${visible ? ' ts-modal--in' : ''}`}>

        {/* ── Header ─── */}
        <div className="ts-header">
          <div className="ts-burst" aria-hidden="true">
            {'✦✦✦✦✦✦✦✦'.split('').map((s, i) => (
              <span key={i} className="ts-burst-star" style={{ '--i': i }}>{s}</span>
            ))}
          </div>
          <div className="ts-trophy" role="img" aria-label="Trophy">🏆</div>
          <h2 className="ts-title">Tutorial Complete!</h2>
          <p className="ts-subtitle">
            Great work, <strong>{playerName}</strong>! You're ready to build an amazing farm.
          </p>
        </div>

        {/* ── Scrollable content ─── */}
        <div className="ts-body">

          {/* Lessons */}
          <section className="ts-section">
            <h3 className="ts-section-title">📚 What You Learned</h3>
            <div className="ts-lessons-grid">
              {lessons.map((l) => (
                <div key={l.title} className="ts-lesson-card">
                  <div className="ts-lesson-icon">{l.icon}</div>
                  <h4 className="ts-lesson-title">{l.title}</h4>
                  <p className="ts-lesson-desc">{l.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Next steps */}
          <section className="ts-section">
            <h3 className="ts-section-title">🚀 What's Next</h3>
            <div className="ts-next-list">
              {nextSteps.map((ns) => (
                <div key={ns.label} className="ts-next-item">
                  <span className="ts-next-icon">{ns.icon}</span>
                  <div className="ts-next-text">
                    <div className="ts-next-label">{ns.label}</div>
                    <div className="ts-next-desc">{ns.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pro tips */}
          <section className="ts-section">
            <h3 className="ts-section-title">💡 Pro Tips</h3>
            <div className="ts-tips-list">
              {tips.map((tip, i) => (
                <div key={i} className="ts-tip">{tip}</div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Footer actions ─── */}
        <div className="ts-footer">
          <button
            className="ts-btn-primary"
            onClick={handleDismiss}
            id="tutorial-start-farming-btn"
          >
            Start Farming! 🌾
          </button>
          <button
            className="ts-btn-secondary"
            onClick={handleDismiss}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
