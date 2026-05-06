/** WebSocket 客户端 */

export interface WebSocketMessage {
  type: 'message' | 'stage_start' | 'stage_update' | 'consensus' | 'output'
  data: any
}

class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private listeners: Map<string, Function[]> = new Map()

  constructor(url: string) {
    this.url = url
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return

    this.ws = new WebSocket(this.url)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
      this.emit('connect')
    }

    this.ws.onmessage = (event) => {
      try {
        const msg: WebSocketMessage = JSON.parse(event.data)
        this.emit(msg.type, msg.data)
      } catch (e) {
        console.error('Failed to parse message:', e)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.emit('disconnect')
      this.reconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.emit('error', error)
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  on(type: string, callback: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, [])
    }
    this.listeners.get(type)?.push(callback)
  }

  off(type: string, callback: Function) {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(type: string, data?: any) {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.forEach(cb => cb(data))
    }
  }
}

// 单例实例
let wsClient: WebSocketClient | null = null

export const getWebSocketClient = (url?: string): WebSocketClient => {
  if (!wsClient && url) {
    wsClient = new WebSocketClient(url)
  }
  return wsClient!
}

export default WebSocketClient