"""场景路由 - 数据库持久化"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from meeting.database import create_scene, get_scene, list_scenes, update_scene, delete_scene

router = APIRouter(prefix="/api/scenes", tags=["scenes"])


class AgentConfig(BaseModel):
    role: str
    executor: str = "claude-sonnet-4"
    model: str = "claude-sonnet-4"
    prompt: str = ""


class SceneCreate(BaseModel):
    name: str
    description: str = ""
    icon: str = "💡"
    agents: List[AgentConfig] = []


@router.post("", status_code=201)
async def create_scene_api(data: SceneCreate):
    """创建场景"""
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="场景名称不能为空")
    if len(data.agents) == 0:
        raise HTTPException(status_code=400, detail="至少需要一个 Agent")
    for agent in data.agents:
        if not agent.role.strip():
            raise HTTPException(status_code=400, detail="Agent 角色名称不能为空")
    
    scene_id = str(uuid.uuid4())[:8]
    agents_data = [a.model_dump() for a in data.agents]
    scene = create_scene(scene_id, data.name, data.description, data.icon, agents_data)
    return scene


@router.get("")
async def list_scenes_api():
    """列出所有场景"""
    return {"items": list_scenes(), "total": len(list_scenes())}


@router.get("/{scene_id}")
async def get_scene_api(scene_id: str):
    """获取场景详情"""
    scene = get_scene(scene_id)
    if not scene:
        raise HTTPException(status_code=404, detail="场景不存在")
    return scene


@router.put("/{scene_id}")
async def update_scene_api(scene_id: str, data: SceneCreate):
    """更新场景"""
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="场景名称不能为空")
    if len(data.agents) == 0:
        raise HTTPException(status_code=400, detail="至少需要一个 Agent")
    for agent in data.agents:
        if not agent.role.strip():
            raise HTTPException(status_code=400, detail="Agent 角色名称不能为空")
    
    agents_data = [a.model_dump() for a in data.agents]
    scene = update_scene(scene_id, data.name, data.description, data.icon, agents_data)
    if not scene:
        raise HTTPException(status_code=404, detail="场景不存在")
    return scene


@router.delete("/{scene_id}")
async def delete_scene_api(scene_id: str):
    """删除场景"""
    if not delete_scene(scene_id):
        raise HTTPException(status_code=404, detail="场景不存在")
    return {"status": "deleted", "id": scene_id}
