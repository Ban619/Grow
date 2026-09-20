/**
 * GLOBAL CHAT COMPONENT
 * 
 * Purpose: Public server-wide chat visible to all online players
 * 
 * Features:
 *   - Broadcasts to all players (public topic: chat/global)
 *   - Real-time updates via Mercure
 *   - No player-to-player filtering
 *   - Single message stream for entire server
 * 
 * Related:
 *   - DirectMessages.jsx handles private player-to-player messaging
 *   - ChatController.php handles backend logic
 *   - ChatMessage entity for database persistence
 */

import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'
const MERCURE_URL = '/.well-known/mercure'

export default function Chat({ open, onClose, onToggle, playerName = 'player1' }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const panelRef = useRef(null)
  const eventSourceRef = useRef(null)
  const messagesEndRef = useRef(null)

  // ============================================================================
  // GLOBAL CHAT: Auto-scroll to latest message
  // ============================================================================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ============================================================================
  // GLOBAL CHAT: Set up Mercure subscription to public chat/global topic
  // ============================================================================
  useEffect(() => {
    if (!open) return

    let isMounted = true
    let retryCount = 0
    const MAX_RETRIES = 3
    let retryTimeout = null

    const setupChat = async () => {
      try {
        setError(null)
        setLoading(true)

        // Test health check first
        try {
          await axios.get(`${API_BASE}/chat/health`, { timeout: 5000 })
        } catch (e) {
          console.warn('Chat service health check failed:', e.message)
        }

        if (!isMounted) return

        // GLOBAL CHAT: Subscribe to PUBLIC Mercure topic 'chat/global'
        // (ALL players see these messages - not private)
        const url = new URL(MERCURE_URL, window.location.origin)
        url.searchParams.append('topic', 'chat/global')

        console.log('Connecting to Mercure at:', url.toString())

        eventSourceRef.current = new EventSource(url.toString())

        let connected = false

        eventSourceRef.current.onopen = () => {
          if (!isMounted) return
          console.log('✅ Mercure connected')
          connected = true
          setLoading(false)
          setError(null)
          retryCount = 0
        }

        eventSourceRef.current.onmessage = (event) => {
          if (!isMounted) return
          try {
            const data = JSON.parse(event.data)
            const msg = {
              id: data.id || Date.now(),
              who: data.playerName === playerName ? 'me' : 'other',
              name: data.playerName,
              text: data.message,
              time: formatTime(new Date(data.createdAt || new Date()))
            }
            setMessages(prev => [...prev, msg])
          } catch (e) {
            console.error('Failed to parse chat message:', e)
          }
        }

        eventSourceRef.current.onerror = (err) => {
          if (!isMounted) return
          console.error('🔴 Mercure connection error:', {
            error: err?.message || err,
            readyState: eventSourceRef.current?.readyState,
            url: url.toString(),
            timestamp: new Date().toISOString()
          })
          
          if (eventSourceRef.current) {
            eventSourceRef.current.close()
            eventSourceRef.current = null
          }

          if (connected || retryCount < MAX_RETRIES) {
            retryCount++
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
            console.log(`🔄 Retrying chat connection (${retryCount}/${MAX_RETRIES}) in ${delay}ms...`)
            setError(null)
            setLoading(true)
            
            retryTimeout = setTimeout(() => {
              if (isMounted) setupChat()
            }, delay)
          } else {
            setError('Chat connection failed. Please refresh to retry.')
            setLoading(false)
          }
        }
      } catch (e) {
        if (isMounted) {
          console.error('Chat setup failed:', e)
          setError('Failed to connect to chat')
          setLoading(false)
        }
      }
    }

    setupChat()

    return () => {
      isMounted = false
      if (retryTimeout) clearTimeout(retryTimeout)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [open, playerName])

  // ============================================================================
  // GLOBAL CHAT: Focus input when chat opens
  // ============================================================================
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => {
        const input = panelRef.current?.querySelector('input')
        input?.focus()
      }, 240)
      return () => clearTimeout(t)
    }
  }, [open])

  const formatTime = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)

    if (minutes < 1) return 'now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  // ============================================================================
  // GLOBAL CHAT: Send message to public global chat channel
  // Endpoint: POST /api/chat/send (broadcasts to all players)
  // ============================================================================
  const send = async () => {
    if (!text.trim() || loading) return

    const messageText = text.trim()
    setText('')

    try {
      // POST to GLOBAL CHAT endpoint (public broadcast to all)
      await axios.post(`${API_BASE}/chat/send`, {
        playerName,
        message: messageText
      })
    } catch (e) {
      console.error('Failed to send message:', e)
      setError('Failed to send message')
      setText(messageText) // Restore text if send fails
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    // Trigger reconnection by toggling open state or re-triggering useEffect
    setMessages([])
  }

  return (
    <div
      className={`chat-backdrop ${open ? 'open' : 'closed'}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      {/* Chat handle button */}
      <button
        className={`chat-handle ${open ? 'open' : 'closed'}`}
        onClick={() => onToggle?.()}
        aria-label="Toggle chat"
      >
        <svg viewBox="0 0 24 24" aria-hidden focusable="false">
          <polygon points="6,4 18,12 6,20" />
        </svg>
      </button>

      {/* Chat panel */}
      <div
        className={`chat-panel chat-panel-iso ${open ? 'open' : 'closed'}`}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-title">Global Chat</div>
          <button className="close-btn" onClick={() => onClose?.()}
            >×</button>
        </div>

        {/* Messages body */}
        <div className="chat-body">
          {loading && <div className="chat-loading">🔄 Connecting...</div>}
          {error && (
            <div className="chat-error">
              <div>{error}</div>
              <button 
                onClick={handleRetry} 
                className="retry-btn"
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  background: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}
          {messages.length === 0 && !loading && !error && (
            <div className="chat-empty">No messages yet. Start the conversation!</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`chat-row ${m.who === 'me' ? 'me' : 'other'}`}>
              <div className="chat-avatar" aria-hidden></div>
              <div className="chat-bubble-wrap">
                <div
                  className={`chat-bubble ${
                    m.who === 'other' ? 'bubble-other' : 'bubble-me'
                  }`}
                >
                  <div className="bubble-name">{m.name}</div>
                  <div className="bubble-text">{m.text}</div>
                </div>
                <div className="bubble-time">{m.time}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input row */}
        <div className="chat-input-row chat-input-iso">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !loading) send()
            }}
            placeholder={error ? 'Connection error...' : 'Type...'}
            disabled={loading}
          />
          <button className="btn-send" onClick={send} disabled={loading}>
            🙂
          </button>
        </div>
      </div>
    </div>
  )
}
