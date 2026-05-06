"""Agent 管理路由 - 热插拔支持"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from meeting.executor_manager import get_executor_manager, BaseExecutor

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentInfo(BaseModel):
    id: str
    name: str
    type: str
    status: str
    config: Dict[str, Any] = {}


class RegisterAgent(BaseModel):
    id: str
    type: str
    config: Dict[str, Any] = {}


@router.get("", response_model=List[AgentInfo])
async def list_agents():
    """列出所有可用 Agent"""
    manager = get_executor_manager()
    agents = []
    for name, executor in manager._executors.items():
        agents.append(AgentInfo(
            id=name,
            name=executor.__class__.__name__,
            type="executor",
            status="active",
            config={}
        ))
    return agents


@router.post("/register", response_model=AgentInfo)
async def register_agent(data: RegisterAgent):
    """注册新的 Agent 执行器"""
    manager = get_executor_manager()
    
    # 创建自定义 Executor
    class CustomExecutor(BaseExecutor):
        def __init__(self, agent_id: str, config: Dict):
            super().__init__(agent_id)
            self.config = config
        
        async def execute(self, prompt: str, context: Dict = None) -> str:
            # TODO: 实现自定义 Agent 调用
            return f"[Custom-{self.name}] {prompt[:100]}..."
        
        def supports(self, agent_type: str) -> bool:
            return True
    
    executor = CustomExecutor(data.id, data.config)
    manager.register_executor(executor)
    
    return AgentInfo(
        id=data.id,
        name="CustomExecutor",
        type=data.type,
        status="registered"
    )


@router.delete("/{agent_id}")
async def unregister_agent(agent_id: str):
    """注销 Agent"""
    manager = get_executor_manager()
    if agent_id in manager._executors:
        del manager._executors[agent_id]
        return {"status": "removed"}
    raise HTTPException(status_code=404, detail="Agent not found")


@router.get("/{agent_id}/health")
async def agent_health(agent_id: str):
    """检查 Agent 健康状态"""
    manager = get_executor_manager()
    executor = manager.get_executor(agent_id)
    if not executor:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    healthy = await executor.health_check()
    return {"status": "healthy" if healthy else "unhealthy"}