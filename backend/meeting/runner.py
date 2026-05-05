"""会议运行器 - 实现单 Agent 对话"""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List
from .models import (
    Meeting, MeetingStage, Message, MessageRole, Round,
    Scene, Stage
)
from .engine import MeetingEngine
from .adapters.registry import AdapterRegistry
from .websocket import manager


class MeetingRunner:
    """会议运行器 - 执行会议流程"""

    def __init__(self, engine: MeetingEngine):
        self.engine = engine
        self.meeting = engine.meeting
        self.registry = AdapterRegistry()

    async def run_stage(self, stage: Stage) -> None:
        """运行单个阶段"""
        meeting_stage = self.engine._stage_instances[stage.id]
        meeting_stage.status = "running"
        
        # 向客户端广播阶段开始
        await self._notify_stage_start(stage)
        
        # 遍历角色发言
        for role_id in stage.roles:
            role = next((r for r in self.engine.scene.roles if r.id == role_id), None)
            if not role:
                continue
            
            # 获取 Agent 适配器
            adapter = self.registry.get_adapter(role.executor, {"name": role.name})
            if not adapter:
                continue
            
            # Agent 发言
            context = self._build_context()
            prompt = f"请针对当前阶段提供你的意见和建议"
            
            try:
                response = await adapter.speak(
                    context=context,
                    role_prompt=role.description,
                    instruction=prompt,
                    variables=self.meeting.variables
                )
                
                # 记录消息
                msg = Message(
                    id=str(uuid.uuid4())[:8],
                    role=MessageRole.AGENT,
                    role_id=role_id,
                    content=response,
                    timestamp=datetime.now()
                )
                
                # 添加到轮次
                round_obj = Round(round_num=len(meeting_stage.rounds), messages=[msg])
                meeting_stage.rounds.append(round_obj)
                
                # 推送消息
                await self._notify_message(msg)
                
            except Exception as e:
                print(f"Agent {role.name} failed: {e}")

        meeting_stage.status = "awaiting_approval"

    def _build_context(self) -> str:
        """构建上下文"""
        context = f"场景: {self.engine.scene.name}\n"
        context += f"描述: {self.engine.scene.description}\n"
        return context

    async def _notify_stage_start(self, stage: Stage):
        """通知阶段开始"""
        if self.meeting:
            await manager.push_message(
                self.meeting.id,
                "stage_start",
                {"stage_id": stage.id, "type": stage.type}
            )

    async def _notify_message(self, msg: Message):
        """通知新消息"""
        if self.meeting:
            await manager.push_message(
                self.meeting.id,
                "message",
                {
                    "id": msg.id,
                    "role": msg.role.value,
                    "role_id": msg.role_id,
                    "content": msg.content[:200]  # 截断
                }
            )

    async def run(self) -> str:
        """运行完整会议"""
        if not self.meeting:
            raise ValueError("Meeting not initialized")
        
        self.meeting.status = "running"
        
        # 只运行第一个阶段（v0.1 MVP）
        first_stage = self.engine.scene.stages[0]
        await self.run_stage(first_stage)
        
        return "awaiting_approval"