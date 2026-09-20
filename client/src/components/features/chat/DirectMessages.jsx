import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'

const API_BASE = '/api'
const MERCURE_URL = '/.well-known/mercure'

export default function DirectMessages({ open, onClose, playerName = 'player1' }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const eventSourceRef = useRef(null)
  const panelRef = useRef(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Load conversations on open
  useEffect(() => {
    if (!open) return
    loadConversations()
  }, [open])

  // Load conversation messages when selected
  useEffect(() => {
    if (!selectedConversation || !open) return
    loadConversation()
    subscribeToMessages()
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
    }
  }, [selectedConversation, open])

  const loadConversations = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE}/dm/conversations`, {
        params: { player: playerName }
      })
      setConversations(response.data.conversations || [])
      setError(null)
    } catch (e) {
      console.error('Failed to load conversations:', e)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadConversation = async () => {
    if (!selectedConversation) return
    try {
      const response = await axios.get(
        `${API_BASE}/dm/${playerName}/messages`,
        { params: { with: selectedConversation } }
      )
      setMessages(response.data.messages || [])
      setError(null)
    } catch (e) {
      console.error('Failed to load conversation:', e)
      setError('Failed to load messages')
    }
  }

  const subscribeToMessages = () => {
    if (!selectedConversation) return

    const url = new URL(MERCURE_URL, window.location.origin)
    url.searchParams.append('topic', `dm/${playerName}`)

    try {
      eventSourceRef.current = new EventSource(url.toString())

      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.from === selectedConversation || data.to === selectedConversation) {
            setMessages(prev => [...prev, {
              id: data.id,
              from: data.from,
              to: data.to,
              message: data.message,
              createdAt: data.createdAt,
              isRead: data.isRead,
            }])
          }
        } catch (e) {
          console.error('Failed to parse DM:', e)
        }
      }

      eventSourceRef.current.onerror = () => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
      }
    } catch (e) {
      console.error('Failed to subscribe to messages:', e)
    }
  }

  const handleSend = async () => {
    if (!text.trim() || !selectedConversation) return

    const messageText = text.trim()
    setText('')

    try {
      await axios.post(`${API_BASE}/dm/send`, {
        from: playerName,
        to: selectedConversation,
        message: messageText,
      })
      // Message will come back via Mercure subscription
    } catch (e) {
      console.error('Failed to send message:', e)
      setText(messageText) // Restore text if send failed
      setError('Failed to send message')
    }
  }

  const formatTime = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'now'
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm'
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h'
    return d.toLocaleDateString()
  }

  if (!open) return null

  return (
    <div className="dm-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="dm-panel dm-iso" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dm-header">
          <strong>Direct Messages</strong>
          <button className="close-btn" onClick={() => onClose?.()}>×</button>
        </div>

        <div className="dm-container">
          {/* Conversations List */}
          <div className="dm-list">
            <div className="dm-list-title">Chats</div>
            {loading ? (
              <div className="dm-loading">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="dm-empty">No conversations yet</div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.playerName}
                  className={`dm-item ${selectedConversation === conv.playerName ? 'active' : ''}`}
                  onClick={() => setSelectedConversation(conv.playerName)}
                >
                  <div className="dm-item-name">{conv.playerName}</div>
                  <div className="dm-item-preview">{conv.lastMessage}</div>
                  {conv.unreadCount > 0 && (
                    <div className="dm-item-badge">{conv.unreadCount}</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Messages View */}
          <div className="dm-view">
            {selectedConversation ? (
              <>
                <div className="dm-view-header">
                  <strong>{selectedConversation}</strong>
                </div>
                <div className="dm-messages">
                  {messages.length === 0 ? (
                    <div className="dm-no-messages">No messages yet. Start a conversation!</div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`dm-message ${msg.from === playerName ? 'sent' : 'received'}`}
                      >
                        <div className="dm-message-content">{msg.message}</div>
                        <div className="dm-message-time">{formatTime(msg.createdAt)}</div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="dm-input-area">
                  <input
                    type="text"
                    className="dm-input"
                    placeholder="Type a message..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <button className="dm-send-btn" onClick={handleSend}>Send</button>
                </div>
              </>
            ) : (
              <div className="dm-placeholder">Select a conversation to start messaging</div>
            )}
          </div>
        </div>

        {error && <div className="dm-error">{error}</div>}
      </div>
    </div>
  )
}
