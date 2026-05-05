from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.responses import JSONResponse, Response
from contextlib import asynccontextmanager
import os
import logging
from datetime import datetime

from meeting import *
from meeting.routers import scenes, meetings, intervention
from meeting.websocket import manager

# 配置日志
logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format='%(asctime)s %(name)s %(levelname)s %(message)s'
)
logger = logging.getLogger("meeting")

# 生命周期管理
@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动和关闭逻辑"""
    logger.info("Starting AI Meeting Platform...")
    yield
    logger.info("Shutting down...")

# 创建应用
app = FastAPI(
    title="AI Meeting Platform",
    description="让人类当导演，AI当演员，通过会议协作完成任何任务",
    version="0.1.0",
    lifespan=lifespan
)

# 注册路由
app.include_router(scenes.router)
app.include_router(meetings.router)
app.include_router(intervention.router)

# 健康检查
@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "0.1.0"
    }

# API Key 验证（单用户模式）
API_KEY = os.getenv("API_KEY", "default-key")

async def verify_api_key(request: Request):
    """验证 API Key"""
    api_key = request.headers.get("X-API-Key")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return True

# WebSocket 端点
@app.websocket("/ws/meetings/{meeting_id}")
async def websocket_endpoint(websocket, meeting_id: str):
    """WebSocket 连接"""
    await manager.connect(meeting_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await manager.send_personal(websocket, {"echo": data})
    except Exception as e:
        manager.disconnect(meeting_id, websocket)
        logger.info(f"WebSocket disconnected: {meeting_id}")

# 主入口
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "18502"))
    )