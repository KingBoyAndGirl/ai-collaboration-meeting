import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'

const styles = {
  container: { fontFamily: "'-apple-system', 'BlinkMacSystemFont', 'Segoe UI', sans-serif", maxWidth: 900, margin: '0 auto', padding: 20 },
  header: { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '24px 16px', marginBottom: 24, borderRadius: 8 },
  nav: { display: 'flex', gap: 12, marginTop: 16 },
  button: { background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 16px', borderRadius: 4, cursor: 'pointer' },
  card: { background: '#f8fafc', borderRadius: 8, padding: 20, marginBottom: 16, border: '1px solid #e2e8f0' },
  title: { margin: 0, fontSize: 28 },
  subtitle: { margin: '8px 0 0', opacity: 0.9, fontSize: 14 },
  status: { fontSize: 12, padding: '4px 8px', borderRadius: 4, marginLeft: 8 },
  connected: { background: '#10b981', color: 'white' },
  disconnected: { background: '#ef4444', color: 'white' },
  messages: { maxHeight: 300, overflowY: 'auto', fontSize: 14 },
  message: { padding: '8px 0', borderBottom: '1px solid #e2e8f0' },
}

function useWebSocket(meetingId) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [stage, setStage] = useState(null)
  const wsRef = React.useRef(null)

  useEffect(() => {
    if (!meetingId) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/${meetingId}`)
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      setMessages(prev => [...prev, data])
      if (data.type === 'stage_update') setStage(data.data?.stage_id)
    }
    ws.onclose = () => setConnected(false)
    return () => ws.close()
  }, [meetingId])

  return { connected, messages, stage }
}

function App() {
  const [view, setView] = useState('home')
  const { connected, messages, stage } = useWebSocket('demo-001')

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
            <p>WebSocket状态: <span style={{...styles.status, ...(connected ? styles.connected : styles.disconnected)}}>{connected ? '已连接' : '未连接'}</span></p>
            <ul>
              <li><a href="/health">API 健康检查</a></li>
            </ul>
          </div>
        )}
        {view === 'editor' && <SceneEditor />}
        {view === 'monitor' && (
          <div style={styles.card}>
            <h3>📊 会议监控 - 当前阶段: {stage || '等待中'}</h3>
            <div style={styles.messages}>
              {messages.map((m, i) => (
                <div key={i} style={styles.message}>
                  <strong>{m.type}:</strong> {JSON.stringify(m.data)}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function SceneEditor() {
  return (
    <div style={styles.card}>
      <h3>📝 场景编辑器</h3>
      <p>开发中... 支持 YAML 配置</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)