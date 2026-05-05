"""交互路由 - 批准/驳回/反馈"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..state import engines

router = APIRouter(prefix="/api/intervention", tags=["intervention"])


class FeedbackIn(BaseModel):
    content: str
    role_id: str = "user"


class RejectIn(BaseModel):
    reason: str = ""


@router.post("/meetings/{meeting_id}/feedback")
async def inject_feedback(meeting_id: str, data: FeedbackIn):
    """注入用户反馈"""
    engine = engines.get(meeting_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    await engine.inject_feedback(data.content, data.role_id)
    return {"status": "feedback_injected"}


@router.post("/meetings/{meeting_id}/approve")
async def approve_stage(meeting_id: str):
    """批准当前阶段"""
    engine = engines.get(meeting_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    approved = await engine.approve_stage()
    if approved:
        return {"status": "approved", "message": "阶段已批准"}
    raise HTTPException(status_code=400, detail="Cannot approve this stage")


@router.post("/meetings/{meeting_id}/reject")
async def reject_stage(meeting_id: str, data: RejectIn):
    """驳回当前阶段"""
    engine = engines.get(meeting_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    rejected = await engine.reject_stage(data.reason)
    if rejected:
        return {"status": "rejected", "reason": data.reason}
    raise HTTPException(status_code=400, detail="Cannot reject this stage")


@router.post("/meetings/{meeting_id}/pause")
async def pause_meeting(meeting_id: str):
    """暂停会议"""
    engine = engines.get(meeting_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    await engine.pause()
    return {"status": "paused"}


@router.post("/meetings/{meeting_id}/resume")
async def resume_meeting(meeting_id: str):
    """恢复会议"""
    engine = engines.get(meeting_id)
    if not engine:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    await engine.resume()
    return {"status": "resumed"}