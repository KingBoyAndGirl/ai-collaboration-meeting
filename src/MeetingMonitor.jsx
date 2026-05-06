import React, { useEffect, useState } from 'react'

export default function MeetingMonitor({ meetingId }) {
  const [status, setStatus] = useState({ stage: '初始化', rounds: 0 })
  const [messages, setMessages] = useState([])

  // WebSocket 模拟 (实际用 WS)
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(s => ({ ...s, rounds: s.rounds + 1 }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h2>📊 会议监控 - {meetingId}</h2>
      
      <div style={{ background: '#e8f4fd', padding: 12, borderRadius: 4, marginBottom: 12 }}>
        <strong>当前阶段:</strong> {status.stage}
        <br />
        <strong>轮次:</strong> {status.rounds}
      </div>

      <div>
        <h3>📨 消息流</h3>
        {messages.length === 0 ? (
          <p style={{ color: '#666' }}>等待消息...</p>
        ) : (
          <ul>
            {messages.map((m, i) => (
              <li key={i} style={{ marginBottom: 8 }}>
                <strong>{m.role}:</strong> {m.content}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}