import React, { useState, useEffect } from 'react'

/**
 * Contextual Tooltip - Shows helpful hints on hover over UI elements
 * Can be attached to any element with data attributes
 */
export default function ContextualTooltip() {
  const [tooltip, setTooltip] = useState(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const tooltipElements = document.querySelectorAll('[data-tooltip]')
    
    const showTooltip = (e) => {
      const element = e.target
      const tooltipText = element.getAttribute('data-tooltip')
      if (!tooltipText) return
      
      const rect = element.getBoundingClientRect()
      setTooltip(tooltipText)
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      })
    }

    const hideTooltip = () => {
      setTooltip(null)
    }

    tooltipElements.forEach(el => {
      el.addEventListener('mouseenter', showTooltip)
      el.addEventListener('mouseleave', hideTooltip)
    })

    return () => {
      tooltipElements.forEach(el => {
        el.removeEventListener('mouseenter', showTooltip)
        el.removeEventListener('mouseleave', hideTooltip)
      })
    }
  }, [])

  if (!tooltip) return null

  return (
    <div
      className="contextual-tooltip"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 2700,
        pointerEvents: 'none',
      }}
    >
      {tooltip}
    </div>
  )
}
