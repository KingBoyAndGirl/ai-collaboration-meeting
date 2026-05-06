"""WebSocket 钩子"""
import { useEffect, useState } from 'react'

export function useMeetingWebSocket(meetingId: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!meetingId) return

    const ws = new WebSocket(`ws://localhost:18602/ws/meetings/${meetingId}`)
    
    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
    }
    
    ws.onclose = () => {
      setConnected(false)
    }

    return () => {
      ws.close()
    }
  }, [meetingId])

  return { messages, connected }
}