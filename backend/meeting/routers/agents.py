"""Agent 管理路由 - 数据库持久化"""
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from meeting.database import create_agent, get_agent, list_agents, update_agent, delete_agent

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentCreate(BaseModel):
    name: str
    type: str
    description: str = ""
    config: Dict[str, Any] = {}


@router.get("")
async def list_agents_api():
    """列出所有 Agent"""
    return {"items": list_agents(), "total": len(list_agents())}


@router.post("", status_code=201)
async def create_agent_api(data: AgentCreate):
    """创建 Agent"""
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Agent 名称不能为空")
    if not data.type.strip():
        raise HTTPException(status_code=400, detail="Agent 类型不能为空")
    
    agent_id = f"agent_{uuid.uuid4().hex[:8]}"
    agent = create_agent(agent_id, data.name, data.type, data.description, data.config)
    return agent


@router.get("/{agent_id}")
async def get_agent_api(agent_id: str):
    """获取 Agent 详情"""
    agent = get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent 不存在")
    return agent


@router.put("/{agent_id}")
async def update_agent_api(agent_id: str, data: AgentCreate):
    """更新 Agent"""
    if not data.name.strip():
        raise HTTPException(status_code=400, detail="Agent 名称不能为空")
    if not data.type.strip():
        raise HTTPException(status_code=400, detail="Agent 类型不能为空")
    
    agent = update_agent(agent_id, data.name, data.type, data.description, "active", data.config)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent 不存在")
    return agent


@router.delete("/{agent_id}")
async def delete_agent_api(agent_id: str):
    """删除 Agent"""
    if not delete_agent(agent_id):
        raise HTTPException(status_code=404, detail="Agent 不存在")
    return {"status": "deleted", "id": agent_id}
