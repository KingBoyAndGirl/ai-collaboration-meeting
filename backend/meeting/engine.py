"""会议引擎 - 核心状态机和流程控制"""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from enum import Enum
from ..models import (
    Meeting, MeetingStage, StageType, Message, MessageRole, Round,
    ConsensusMethod, Scene
)
from .scene_parser import SceneParser


class MeetingStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


class MeetingEngine:
    """会议引擎 - 管理会议生命周期"""

    def __init__(self, scene: Scene):
        self.scene = scene
        self.meeting: Optional[Meeting] = None
        self.current_stage_idx: int = 0
        self._stage_instances: Dict[str, MeetingStage] = {}

    def init_meeting(self, variables: Dict[str, Any] = None) -> Meeting:
        """初始化会议"""
        meeting_id = str(uuid.uuid4())[:8]
        self.meeting = Meeting(
            id=meeting_id,
            scene_name=self.scene.name,
            variables=variables or {},
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        # 初始化阶段实例
        for stage in self.scene.stages:
            self._stage_instances[stage.id] = MeetingStage(
                stage_id=stage.id,
                status="pending"
            )
        
        return self.meeting

    async def start(self) -> str:
        """启动会议"""
        if not self.meeting:
            raise ValueError("Meeting not initialized")
        
        self.meeting.status = "running"
        self.meeting.updated_at = datetime.now()
        
        # 执行各个阶段
        for i, stage in enumerate(self.scene.stages):
            self.current_stage_idx = i
            await self._execute_stage(stage)
            
            if self.meeting.status == "paused":
                return "paused"
        
        self.meeting.status = "completed"
        return "completed"

    async def _execute_stage(self, stage) -> None:
        """执行单个阶段"""
        meeting_stage = self._stage_instances[stage.id]
        meeting_stage.status = "running"
        
        # TODO: 实现 Agent 发言逻辑
        # 当前阶段占位，等待 Agent 适配层
        
        meeting_stage.status = "completed"

    async def pause(self) -> None:
        """暂停会议"""
        if self.meeting:
            self.meeting.status = "paused"

    async def resume(self) -> None:
        """恢复会议"""
        if self.meeting:
            self.meeting.status = "running"

    def get_state(self) -> Dict:
        """获取当前状态"""
        return {
            "meeting": self.meeting.model_dump() if self.meeting else None,
            "current_stage": self.current_stage_idx,
            "stage_status": {
                sid: ms.status for sid, ms in self._stage_instances.items()
            }
        }