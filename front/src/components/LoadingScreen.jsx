import React, { useEffect, useState } from 'react'
import '../styles/loading.css'

export default function LoadingScreen({ loadingImage, onLoadingComplete, playerName }) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('Initializing farm...')

  const loadingSteps = [
    { progress: 10, status: 'Initializing farm...' },
    { progress: 25, status: 'Loading soil data...' },
    { progress: 40, status: 'Preparing seeds...' },
    { progress: 55, status: 'Growing crops...' },
    { progress: 70, status: 'Setting up buildings...' },
    { progress: 85, status: 'Connecting to server...' },
    { progress: 100, status: 'Welcome to your farm!' }
  ]

  useEffect(() => {
    let currentStep = 0
    const timer = setInterval(() => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep]
        setProgress(step.progress)
        setStatus(step.status)

        if (step.progress === 100) {
          clearInterval(timer)
          // Give a brief moment to show 100% before completing
          setTimeout(() => {
            onLoadingComplete && onLoadingComplete()
          }, 800)
        }
        currentStep++
      }
    }, 400) // Each step takes 400ms

    return () => clearInterval(timer)
  }, [onLoadingComplete])

  return (
    <div className="loading-screen">
      <div
        className="loading-bg"
        style={{
          backgroundImage: `url(${loadingImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      <div className="loading-overlay" />
      
      <div className="loading-bar-wrapper">
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div
              className="loading-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="loading-status-text">
          <span className="status-dot" />
          {status}
        </div>
      </div>
    </div>
  )
}
