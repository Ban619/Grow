import React, { useEffect, useState } from 'react'
import { onTutorialEvent, TutorialEvents } from './tutorialEvents'

/**
 * Intermediate tutorial - teaches advanced features after basics
 * Topics: Shop features, Chat, Seasonal crops, Buildings
 */
export default function IntermediateTutorial({ playerName = 'player1', tutorialComplete = false }) {
  const [intermediate, setIntermediate] = useState({
    shopTutorial: false,
    chatTutorial: false,
    seasonalCropsTutorial: false,
  })
  const [activeHint, setActiveHint] = useState(null)
  const [hintSeen, setHintSeen] = useState(new Set())

  useEffect(() => {
    if (!tutorialComplete || !playerName) return

    // Show shop hint first time player opens shop
    const handleShopOpen = () => {
      if (!intermediate.shopTutorial && !hintSeen.has('shop')) {
        setActiveHint('shop')
        setHintSeen(prev => new Set([...prev, 'shop']))
      }
    }

    // Show chat hint first time player opens chat
    const handleChatOpen = () => {
      if (!intermediate.chatTutorial && !hintSeen.has('chat')) {
        setActiveHint('chat')
        setHintSeen(prev => new Set([...prev, 'chat']))
      }
    }

    window.addEventListener('grow:openShop', handleShopOpen)
    window.addEventListener('grow:openChat', handleChatOpen)

    return () => {
      window.removeEventListener('grow:openShop', handleShopOpen)
      window.removeEventListener('grow:openChat', handleChatOpen)
    }
  }, [tutorialComplete, intermediate, hintSeen, playerName])

  if (!tutorialComplete || !activeHint) {
    return null
  }

  const hints = {
    shop: {
      title: '🛒 Shop Tips',
      content: [
        '💰 Different crops cost different amounts',
        '🌾 Rare seeds give more coins when harvested',
        '⭐ Seasonal crops are only available in certain seasons',
        '🏠 Buildings help you store and process crops',
      ],
      action: 'Got It!',
    },
    chat: {
      title: '💬 Chat Tips',
      content: [
        '👥 Connect with other farmers in Global Chat',
        '💌 Send private messages to friends',
        '🎯 Share your farming progress and tips',
        '🏆 Get help from experienced farmers',
      ],
      action: 'Understand!',
    },
  }

  const hint = hints[activeHint]
  if (!hint) return null

  return (
    <div className="intermediate-tutorial-overlay">
      <div className="intermediate-tutorial-hint">
        <div className="hint-header">
          <h3>{hint.title}</h3>
          <button
            className="hint-close"
            onClick={() => setActiveHint(null)}
            aria-label="Close hint"
          >
            ✕
          </button>
        </div>

        <div className="hint-content">
          {hint.content.map((item, i) => (
            <div key={i} className="hint-item">
              {item}
            </div>
          ))}
        </div>

        <button
          className="hint-action-btn"
          onClick={() => setActiveHint(null)}
        >
          {hint.action}
        </button>
      </div>
    </div>
  )
}
