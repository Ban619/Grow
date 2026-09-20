import React, { useState } from 'react'
import '../styles/auth.css'

const REMEMBER_KEY = 'grow:lastPlayer'

export default function Login({ onLogin, screenImage }) {
  // Fix #17: Pre-fill from last session
  const [playerName, setPlayerName] = useState(() => {
    try { return localStorage.getItem(REMEMBER_KEY) || '' } catch { return '' }
  })
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const name = playerName.trim()
    if (!name) {
      setError('Please enter your name')
      return
    }
    if (name.length > 32) {
      setError('Name too long (max 32 characters)')
      return
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
      setError('Name can only contain letters, numbers, dashes, and underscores')
      return
    }
    setError('')
    // Fix #17: persist the name so next visit pre-fills it
    try { localStorage.setItem(REMEMBER_KEY, name) } catch { /* ignore */ }
    onLogin(name)
  }

  return (
    <div className="login-container">
      <div
        className="login-bg"
        style={{
          backgroundImage: `url(${screenImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="login-overlay" />
      <div className="login-panel">
        <div className="login-content">
          <h1 className="login-title">🌱 GROW LIFE</h1>
          <p className="login-subtitle">Start Your Farming Adventure</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="playerName">Player Name</label>
              <input
                id="playerName"
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value)
                  setError('')
                }}
                maxLength={32}
                autoFocus
              />
              {error && <div className="error-message">{error}</div>}
            </div>

            <button type="submit" className="login-btn">
              {playerName.trim() ? 'Continue Farming 🌾' : 'Enter Farm'}
            </button>
          </form>

          <p className="login-footer">
            © 2026 Grow. Build your legacy, one crop at a time.
          </p>
        </div>
      </div>
    </div>
  )
}
