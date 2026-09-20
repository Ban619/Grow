
import React from 'react'

function fmt(n){
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

export default function Experience({ level = 1, xp = 0, goal = null, icon = null, onClick = null }){
	const computedGoal = goal || Math.max(100, level * 100)  // must match useGameState.xpGoal = level * 100
	const percent = Math.max(0, Math.min(100, Math.round((xp / computedGoal) * 100)))

	return (
		<div className="experience-hud" role="status" onClick={(e)=>{ if(onClick) onClick(e) }}>
			<div className="level-badge" aria-label={`Level ${level}`}>
				{icon ? (
					<img src={icon} alt={`level-${level}`} className="level-icon" />
				) : (
					<div className="level-num">{level}</div>
				)}
			</div>

			<div className="exp-pill" title={`${xp}/${computedGoal} XP`}>
				<div className="exp-track">
					<div className="exp-fill" style={{width: `${percent}%`}} />
				</div>

				<div className="exp-text">
					<div className="exp-left">{fmt(xp)}</div>
					<div className="exp-right">/ {fmt(computedGoal)}</div>
				</div>
			</div>
		</div>
	)
}
