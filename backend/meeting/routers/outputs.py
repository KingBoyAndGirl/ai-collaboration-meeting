"""产出物路由"""
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from ..output_generator import OutputGenerator
from ..models import Meeting

router = APIRouter(prefix="/api/outputs", tags=["outputs"])
_generator = OutputGenerator()


class OutputRequest(BaseModel):
    meeting_id: str
    format: str = "markdown"  # markdown or yaml


@router.post("/generate")
async def generate_output(request: OutputRequest):
    """生成产出物"""
    # TODO: 从数据库获取会议
    # 这里模拟
    meeting = Meeting(
        id=request.meeting_id,
        scene_name="示例会议",
        status="completed"
    )
    
    filepath = _generator.save_output(meeting, request.format)
    return {
        "file_path": filepath,
        "download_url": _generator.get_download_url(filepath)
    }


@router.get("/{filename}")
async def download_output(filename: str):
    """下载产出物"""
    filepath = _generator.output_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="text/markdown" if filename.endswith(".md") else "text/yaml"
    )