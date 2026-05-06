"""WebSocket routes for real-time meeting updates."""

from __future__ import annotations

import json
from typing import Dict, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Active connections: meeting_id -> [websocket]
active_connections: Dict[str, List[WebSocket]] = {}


@router.websocket("/ws/meetings/{meeting_id}")
async def meeting_ws(websocket: WebSocket, meeting_id: str):
    """WebSocket endpoint for meeting real-time updates."""
    await websocket.accept()
    
    if meeting_id not in active_connections:
        active_connections[meeting_id] = []
    active_connections[meeting_id].append(websocket)
    
    try:
        while True:
            data = await websocket.receive_text()
            # Echo for heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        active_connections[meeting_id].remove(websocket)
        if not active_connections[meeting_id]:
            del active_connections[meeting_id]


async def broadcast_message(meeting_id: str, message: Dict):
    """Broadcast a message to all clients in a meeting."""
    if meeting_id in active_connections:
        disconnected = []
        for ws in active_connections[meeting_id]:
            try:
                await ws.send_text(json.dumps(message))
            except:
                disconnected.append(ws)
        
        # Clean up dead connections
        for ws in disconnected:
            active_connections[meeting_id].remove(ws)