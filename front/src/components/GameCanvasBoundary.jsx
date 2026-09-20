import React from 'react'

/**
 * GameCanvasBoundary — catches any render/runtime error inside GameCanvas
 * and shows a friendly fallback instead of blanking the whole screen.
 */
export default class GameCanvasBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[GameCanvasBoundary] Caught error:', error, info)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'fixed', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(20,10,5,0.96)',
          color: '#fff', fontFamily: 'sans-serif', gap: 16,
          zIndex: 9999,
        }}>
          <div style={{ fontSize: 48 }}>🌾</div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#aaa', maxWidth: 340, textAlign: 'center' }}>
            {this.state.error?.message || 'An unexpected error occurred in the game canvas.'}
          </div>
          <button
            onClick={this.handleReload}
            style={{
              marginTop: 8, padding: '10px 28px', fontSize: 15,
              background: '#4ea630', color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700,
            }}
          >
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
