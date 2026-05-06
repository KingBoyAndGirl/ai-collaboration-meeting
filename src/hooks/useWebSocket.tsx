// WebSocket hooks for meeting real-time updates
import { useEffect, useRef, useState } from 'react'

export function useMeetingWebSocket(meetingId: string) {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [stage, setStage] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!meetingId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const ws = new WebSocket(`${protocol}//${host}/ws/${meetingId}`)
    
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages(prev => [...prev, data])
      
      if (data.type === 'stage_update') {
        setStage(data.data?.stage_id)
      }
    }

    ws.onclose = () => {
      setConnected(false)
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [meetingId])

  const send = (data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }

  return { connected, messages, stage, send }
}