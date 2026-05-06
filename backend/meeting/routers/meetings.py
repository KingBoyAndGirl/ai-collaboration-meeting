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
    meeting_data = data.model_dump()
    meeting_data["id"] = meeting_id
    meeting_data["created_at"] = datetime.now()
    meeting_data["updated_at"] = datetime.now()
    meeting = Meeting(**meeting_data)
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


@router.post("/{meeting_id}/pause")
async def pause_meeting(meeting_id: str):
    """暂停会议"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _meetings[meeting_id].status = "paused"
    return {"status": "paused"}


@router.post("/{meeting_id}/resume")
async def resume_meeting(meeting_id: str):
    """恢复会议"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _meetings[meeting_id].status = "running"
    return {"status": "running"}


@router.post("/{meeting_id}/stop")
async def stop_meeting(meeting_id: str):
    """停止会议"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _meetings[meeting_id].status = "stopped"
    return {"status": "stopped"}


@router.post("/{meeting_id}/approve")
async def approve_meeting(meeting_id: str):
    """批准阶段"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _meetings[meeting_id].status = "running"
    return {"status": "approved"}


@router.post("/{meeting_id}/reject")
async def reject_meeting(meeting_id: str):
    """驳回阶段"""
    if meeting_id not in _meetings:
        raise HTTPException(status_code=404, detail="Meeting not found")
    _meetings[meeting_id].status = "running"
    return {"status": "rejected"}