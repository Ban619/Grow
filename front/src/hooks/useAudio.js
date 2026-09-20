import { useEffect, useRef } from 'react'

/**
 * useAudio — owns all game audio references (BGM + SFX).
 * Returns stable play helpers and toggle handlers.
 */
export function useAudio() {
  const buySoundRef = useRef(null)
  const expSoundRef = useRef(null)
  const backgroundMusicRef = useRef(null)

  // Initialise audio objects once on mount
  useEffect(() => {
    try {
      buySoundRef.current = new Audio('/sfx/buy.mp3')
      buySoundRef.current.volume = 0.75
    } catch (e) { buySoundRef.current = null }

    try {
      expSoundRef.current = new Audio('/sfx/exp.mp3')
      expSoundRef.current.volume = 0.85
    } catch (e) { expSoundRef.current = null }

    try {
      backgroundMusicRef.current = new Audio('/sfx/goodtaste.mp3')
      backgroundMusicRef.current.volume = 0.5
      backgroundMusicRef.current.loop = true
      backgroundMusicRef.current.addEventListener('ended', function () {
        this.currentTime = 0
        this.play().catch(() => {})
      })
    } catch (e) { backgroundMusicRef.current = null }
  }, [])

  const playBuy = () => {
    try {
      buySoundRef.current?.play?.().catch(() => {})
    } catch (e) {}
  }

  const playExp = () => {
    try {
      expSoundRef.current?.play?.().catch(() => {})
    } catch (e) {}
  }

  const startMusic = () => {
    backgroundMusicRef.current?.play?.().catch(() => {})
  }

  const stopMusic = () => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.pause()
      backgroundMusicRef.current.currentTime = 0
    }
  }

  const handleMusicToggle = (volume) => {
    if (backgroundMusicRef.current) {
      backgroundMusicRef.current.volume = volume > 0 ? 0.5 : 0
    }
    const current = JSON.parse(localStorage.getItem('grow:settings') || '{}')
    localStorage.setItem('grow:settings', JSON.stringify({ ...current, music: volume }))
  }

  const handleSoundsToggle = (volume) => {
    if (buySoundRef.current) buySoundRef.current.volume = volume > 0 ? 0.75 : 0
    if (expSoundRef.current) expSoundRef.current.volume = volume > 0 ? 0.85 : 0
    const current = JSON.parse(localStorage.getItem('grow:settings') || '{}')
    localStorage.setItem('grow:settings', JSON.stringify({ ...current, effects: volume }))
  }

  return {
    buySoundRef,
    expSoundRef,
    backgroundMusicRef,
    playBuy,
    playExp,
    startMusic,
    stopMusic,
    handleMusicToggle,
    handleSoundsToggle,
  }
}
