"""启动路由"""
import asyncio
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from meeting import Scene, MeetingEngine
from meeting.runner import MeetingRunner
from meeting.state import engines, register_engine
from meeting.scene_parser import SceneParser

router = APIRouter(prefix="/api/run", tags=["run"])


class RunRequest(BaseModel):
    scene_name: str
    variables: dict = {}


@router.post("/start")
async def start_meeting(request: RunRequest):
    """启动会议"""
    parser = SceneParser()
    scene = parser.parse({
        "name": request.scene_name,
        "description": "运行时创建",
        "version": "1.0",
        "roles": [{"id": "assistant", "name": "助手", "description": "AI 助手", "executor": "hermes"}],
        "stages": [{
            "id": "discuss",
            "type": "design",
            "roles": ["assistant"],
            "moderator": "assistant"
        }]
    })
    
    engine = MeetingEngine(scene)
    meeting = engine.init_meeting(request.variables)
    
    register_engine(engine)
    
    # 异步运行
    runner = MeetingRunner(engine)
    asyncio.create_task(runner.run())
    
    return {"meeting_id": meeting.id, "status": "running"}