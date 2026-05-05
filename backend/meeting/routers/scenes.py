"""场景路由"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from meeting import Scene, SceneParser

router = APIRouter(prefix="/api/scenes", tags=["scenes"])

# 内存存储（临时）
_scenes = {}
_parser = SceneParser()


class SceneCreate(BaseModel):
    name: str
    description: str
    version: str
    roles: list
    stages: list
    variables: dict = {}


@router.post("", status_code=201)
async def create_scene(data: SceneCreate):
    """创建场景"""
    scene_id = str(uuid.uuid4())[:8]
    scene = Scene(**data.model_dump())
    _scenes[scene_id] = scene
    return {"id": scene_id, "status": "created"}


@router.get("")
async def list_scenes():
    """列出场景"""
    return {
        "items": [{"id": sid, "name": s.name, "description": s.description}
                   for sid, s in _scenes.items()],
        "total": len(_scenes)
    }


@router.get("/{scene_id}")
async def get_scene(scene_id: str):
    """获取场景详情"""
    if scene_id not in _scenes:
        raise HTTPException(status_code=404, detail="Scene not found")
    return _scenes[scene_id]


@router.post("/{scene_id}/validate")
async def validate_scene(scene_id: str):
    """验证场景"""
    if scene_id not in _scenes:
        raise HTTPException(status_code=404, detail="Scene not found")
    return {"valid": True, "errors": []}