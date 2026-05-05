"""会议引擎 - 核心状态机和流程控制"""
import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum
from .models import (
    Meeting, MeetingStage, StageType, Message, MessageRole, Round,
    ConsensusMethod, Scene
)
from .scene_parser import SceneParser


class MeetingStatus(str, Enum):
    CREATED = "created"
    RUNNING = "running"
    PAUSED = "paused"
    AWAITING_APPROVAL = "awaiting_approval"  # 等待用户批准
    COMPLETED = "completed"
    FAILED = "failed"


class UserIntervention:
    """用户介入请求"""
    def __init__(self, type: str, data: Dict):
        self.type = type  # "feedback", "approve", "reject", "pause"
        self.data = data


class MeetingEngine:
    """会议引擎 - 管理会议生命周期"""

    def __init__(self, scene: Scene):
        self.scene = scene
        self.meeting: Optional[Meeting] = None
        self.current_stage_idx: int = 0
        self._stage_instances: Dict[str, MeetingStage] = {}
        self._user_feedback_queue: asyncio.Queue = asyncio.Queue()
        self._intervention_event = asyncio.Event()

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
            result = await self._execute_stage(stage)
            
            if result == "paused":
                return "paused"
            elif result == "awaiting_approval":
                approved = await self._wait_for_approval(stage)
                if not approved:
                    return "rejected"
        
        self.meeting.status = "completed"
        return "completed"

    async def _execute_stage(self, stage) -> str:
        """执行单个阶段，返回状态"""
        meeting_stage = self._stage_instances[stage.id]
        meeting_stage.status = "running"
        
        # TODO: 实现 Agent 发言逻辑
        # 当前阶段占位，等待 Agent 适配层
        
        meeting_stage.status = "awaiting_approval"
        self.meeting.status = "awaiting_approval"
        return "awaiting_approval"

    async def inject_feedback(self, feedback: str, role_id: str = "user") -> None:
        """注入用户反馈"""
        msg = Message(
            id=str(uuid.uuid4())[:8],
            role=MessageRole.USER,
            role_id=role_id,
            content=feedback,
            timestamp=datetime.now(),
            metadata={"source": "user_feedback"}
        )
        self._user_feedback_queue.put_nowait(msg)

    async def _wait_for_approval(self, stage) -> bool:
        """等待用户批准"""
        # 这里可以实现更复杂的等待逻辑
        # 简单起见，等待 5 分钟或用户批准
        try:
            feedback = await asyncio.wait_for(
                self._user_feedback_queue.get(),
                timeout=300  # 5分钟
            )
            # 处理反馈
            return True
        except asyncio.TimeoutError:
            return False

    async def approve_stage(self) -> bool:
        """批准当前阶段"""
        if self.meeting and self.meeting.status == "awaiting_approval":
            current_stage = self._stage_instances.get(
                self.scene.stages[self.current_stage_idx].id
            )
            if current_stage:
                current_stage.status = "approved"
            self.meeting.status = "running"
            return True
        return False

    async def reject_stage(self, reason: str = "") -> bool:
        """驳回当前阶段"""
        if self.meeting and self.meeting.status == "awaiting_approval":
            current_stage = self._stage_instances.get(
                self.scene.stages[self.current_stage_idx].id
            )
            if current_stage:
                current_stage.status = "rejected"
                current_stage.rejection_reason = reason
                current_stage.rejection_count += 1
            self.meeting.status = "paused"
            return True
        return False

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
            },
            "pending_feedback": self._user_feedback_queue.qsize()
        }