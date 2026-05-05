"""会议运行器 - 实现多 Agent 讨论"""
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
        """运行单个阶段 - 支持多轮讨论"""
        meeting_stage = self.engine._stage_instances[stage.id]
        meeting_stage.status = "running"
        
        # 向客户端广播阶段开始
        await self._notify_stage_start(stage)
        
        # 多轮讨论
        for round_num in range(stage.max_rounds):
            # 收集本轮所有角色的发言
            round_messages = []
            
            for idx, role_id in enumerate(stage.roles):
                role = next((r for r in self.engine.scene.roles if r.id == role_id), None)
                if not role:
                    continue
                
                adapter = self.registry.get_adapter(role.executor, {"name": role.name})
                if not adapter:
                    continue
                
                # 构建上下文（包含之前的讨论）
                context = self._build_context(round_messages, role_id)
                prompt = self._build_instruction(round_num, stage)
                
                try:
                    response = await adapter.speak(
                        context=context,
                        role_prompt=role.description,
                        instruction=prompt,
                        variables=self.meeting.variables
                    )
                    
                    msg = Message(
                        id=str(uuid.uuid4())[:8],
                        role=MessageRole.AGENT,
                        role_id=role_id,
                        content=response,
                        timestamp=datetime.now()
                    )
                    
                    round_messages.append(msg)
                    self._add_message_to_round(meeting_stage, round_num, msg)
                    await self._notify_message(msg)
                    
                except Exception as e:
                    print(f"Agent {role.name} failed: {e}")
            
            # 检查共识（除最后一轮）
            if round_num < stage.max_rounds - 1:
                from .consensus import ConsensusDetector
                is_consensus, reason = ConsensusDetector.detect(
                    round_messages, 
                    stage.consensus
                )
                if is_consensus:
                    meeting_stage.consensus_reached = True
                    break
        
        meeting_stage.status = "awaiting_approval"

    def _build_context(self, previous_messages: List[Message], current_role: str) -> str:
        """构建上下文"""
        context = f"场景: {self.engine.scene.name}\n"
        context += f"描述: {self.engine.scene.description}\n\n"
        
        if previous_messages:
            context += "## 之前的讨论\n"
            for msg in previous_messages:
                prefix = "你" if msg.role_id == current_role else msg.role_id
                context += f"{prefix}: {msg.content[:100]}...\n"
        
        return context

    def _build_instruction(self, round_num: int, stage: Stage) -> str:
        """构建指令"""
        if round_num == 0:
            return "请根据你的角色提出初始意见和建议"
        else:
            return f"请根据之前的讨论进行回应和补充（第{round_num + 1}轮）"

    def _add_message_to_round(self, meeting_stage: MeetingStage, round_num: int, msg: Message):
        """添加消息到对应的轮次"""
        while len(meeting_stage.rounds) <= round_num:
            meeting_stage.rounds.append(Round(round_num=len(meeting_stage.rounds), messages=[]))
        
        meeting_stage.rounds[round_num].messages.append(msg)

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
                    "content": msg.content[:200]
                }
            )

    async def run(self) -> str:
        """运行完整会议"""
        if not self.meeting:
            raise ValueError("Meeting not initialized")
        
        self.meeting.status = "running"
        
        # 运行所有阶段
        for stage in self.engine.scene.stages:
            await self.run_stage(stage)
            
            if self.meeting.status == "paused":
                return "paused"
        
        self.meeting.status = "completed"
        return "completed"