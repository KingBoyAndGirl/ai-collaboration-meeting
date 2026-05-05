"""全局引擎存储"""
from typing import Dict
from .engine import MeetingEngine

# 会议 ID -> 引擎映射
engines: Dict[str, MeetingEngine] = {}

def register_engine(engine: MeetingEngine):
    """注册引擎"""
    engines[engine.meeting.id] = engine

def get_engine(meeting_id: str) -> MeetingEngine:
    """获取引擎"""
    return engines.get(meeting_id)