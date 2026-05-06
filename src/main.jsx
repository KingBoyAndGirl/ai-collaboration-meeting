import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import SceneEditor from './SceneEditor'
import MeetingMonitor from './MeetingMonitor'

function App() {
  const [view, setView] = useState('home')

  return (
    <div style={{ fontFamily: 'system-ui', maxWidth: 800, margin: '0 auto' }}>
      <header style={{ background: '#007bff', color: 'white', padding: 16 }}>
        <h1>🤖 AI 协作会议平台</h1>
        <nav style={{ marginTop: 8 }}>
          <button onClick={() => setView('home')} style={{ marginRight: 8 }}>首页</button>
          <button onClick={() => setView('editor')} style={{ marginRight: 8 }}>场景编辑</button>
          <button onClick={() => setView('monitor')}>会议监控</button>
        </nav>
      </header>

      <main style={{ padding: 16 }}>
        {view === 'home' && (
          <div>
            <h2>欢迎使用 AI 协作会议平台</h2>
            <p>人类当导演，AI当演员，通过会议协作完成任务。</p>
            <ul>
              <li><a href="/api/health">API 健康检查</a></li>
            </ul>
          </div>
        )}
        {view === 'editor' && <SceneEditor />}
        {view === 'monitor' && <MeetingMonitor meetingId="demo-001" />}
      </main>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)