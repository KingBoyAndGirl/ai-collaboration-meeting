"""WebSocket 实时通信管理"""
import json
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, meeting_id: str, websocket: WebSocket):
        """建立连接"""
        await websocket.accept()
        if meeting_id not in self.active_connections:
            self.active_connections[meeting_id] = set()
        self.active_connections[meeting_id].add(websocket)

    def disconnect(self, meeting_id: str, websocket: WebSocket):
        """断开连接"""
        if meeting_id in self.active_connections:
            self.active_connections[meeting_id].discard(websocket)
            if not self.active_connections[meeting_id]:
                del self.active_connections[meeting_id]

    async def send_personal(self, websocket: WebSocket, message: dict):
        """发送给特定连接"""
        await websocket.send_json(message)

    async def broadcast(self, meeting_id: str, message: dict):
        """广播给会议所有连接"""
        if meeting_id not in self.active_connections:
            return
        
        disconnected = []
        for connection in self.active_connections[meeting_id]:
            try:
                await connection.send_json(message)
            except WebSocketDisconnect:
                disconnected.append(connection)
        
        # 清理断开的连接
        for ws in disconnected:
            self.disconnect(meeting_id, ws)

    async def push_message(self, meeting_id: str, msg_type: str, data: dict):
        """推送消息到会议"""
        await self.broadcast(meeting_id, {
            "type": msg_type,
            "data": data
        })


# 全局连接管理器
manager = ConnectionManager()