"""会议路由"""
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from meeting import Meeting, MeetingCreate

router = APIRouter(prefix="/api/meetings", tags=["meetings"])

_meetings = {}


@router.post("", status_code=201)
async def create_meeting(data: MeetingCreate):
    """创建会议"""
    meeting_id = str(uuid.uuid4())[:8]
    meeting = Meeting(**data)
    meeting.id = meeting_id
    meeting.created_at = datetime.now()
    meeting.updated_at = datetime.now()
    _meetings[meeting_id] = meeting
    return {"id": meeting_id, "status": "created"}


@router.get("")
async def list_meetings():
    """列出会议"""
    return {
        "items": [{"id": mid, "scene_name": m.scene_name, "status": m.status}
                   for mid, m in _meetings.items()],
        "total": len(_meetings)
    }


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    """获取会议详情"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return _meetings[meeting_id]