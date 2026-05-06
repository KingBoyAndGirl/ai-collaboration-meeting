import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'

const styles = {
  container: { fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif", maxWidth: 900, margin: '0 auto', padding: 20 },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px 16px', marginBottom: 24, borderRadius: 8 },
  nav: { display: 'flex', gap: 12, marginTop: 16 },
  button: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' },
  card: { background: '#f8fafc', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: '8px 0 0', opacity: 0.9, fontSize: 14 }
}

function App() {
  const [view, setView] = useState('home')

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>🤖 AI 协作会议平台</h1>
        <p style={styles.subtitle}>人类当导演，AI当演员</p>
        <nav style={styles.nav}>
          <button style={styles.button} onClick={() => setView('home')}>首页</button>
          <button style={styles.button} onClick={() => setView('editor')}>场景编辑</button>
          <button style={styles.button} onClick={() => setView('monitor')}>会议监控</button>
        </nav>
      </header>

      <main>
        {view === 'home' && (
          <div style={styles.card}>
            <h2>欢迎使用</h2>
            <p>通过多 Agent 协作完成任务。请选择开始。</p>
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

// Inline components for simplicity
function SceneEditor() {
  return (
    <div style={styles.card}>
      <h3>📝 场景编辑器</h3>
      <p>开发中...</p>
    </div>
  )
}

function MeetingMonitor({ meetingId }) {
  return (
    <div style={styles.card}>
      <h3>📊 会议监控 - {meetingId}</h3>
      <p>开发中...</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)