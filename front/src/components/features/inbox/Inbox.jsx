import React, { useEffect, useState } from 'react'

export default function Inbox({ open, onClose, messages = [], onMarkRead }){
  const [local, setLocal] = useState(messages)
  const [tab, setTab] = useState('news')

  useEffect(()=> setLocal(messages),[messages])

  if(!open) return null
  return (
    <div className="inbox-backdrop" onMouseDown={(e)=>{ if(e.target === e.currentTarget) onClose && onClose() }}>
      <div className="inbox-panel inbox-iso" onMouseDown={(e)=> e.stopPropagation()}>
        <div className="inbox-header">
          <strong>Inbox</strong>
          <button className="close-btn" onClick={()=> onClose && onClose()}>×</button>
        </div>
        <div className="inbox-tabs">
          <button className={`tab ${tab==='news'?'active':''}`} onClick={()=>setTab('news')}>News</button>
          <button className={`tab ${tab==='videos'?'active':''}`} onClick={()=>setTab('videos')}>Videos</button>
          <button className={`tab ${tab==='community'?'active':''}`} onClick={()=>setTab('community')}>Community</button>
        </div>
        <div className="inbox-content">
          {tab === 'news' && (
            <div className="inbox-grid">
              <div className="news-large">
                <div className="news-media">{/* poster */}</div>
                <div className="news-cta">Watch!</div>
              </div>
              <div className="news-list">
                {local.map(m=> (
                  <div key={m.id} className={`news-item ${m.read ? 'read' : 'unread'}`}>
                    <div className="news-thumb" />
                    <div>
                      <div className="news-title">{m.title || 'Update'}</div>
                      <div className="news-body">{m.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'videos' && (
            <div className="inbox-placeholder">Video content coming soon</div>
          )}
          {tab === 'community' && (
            <div className="inbox-placeholder">Community posts</div>
          )}
        </div>
      </div>
    </div>
  )
}
