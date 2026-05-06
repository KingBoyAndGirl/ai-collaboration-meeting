"""产出物路由"""
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
from ..output_generator import OutputGenerator
from ..models import Meeting

router = APIRouter(prefix="/api/outputs", tags=["outputs"])
_generator = OutputGenerator()


class OutputRequest(BaseModel):
    meeting_id: str
    format: str = "markdown"  # markdown, json, yaml, mermaid, html


class OutputInfo(BaseModel):
    filename: str
    size: int
    created_at: float
    url: str


@router.post("/generate")
async def generate_output(request: OutputRequest):
    """生成产出物"""
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


@router.get("/")
async def list_outputs(
    limit: int = Query(50, ge=1, le=100),
    format: str = Query(None),
    days: int = Query(30, ge=1, le=365)
) -> list[OutputInfo]:
    """列出产出物文件"""
    output_dir = _generator.output_dir
    files = []
    
    cutoff = datetime.now() - timedelta(days=days)
    
    for f in output_dir.iterdir():
        if f.is_file():
            # 按格式筛选
            if format and not f.name.endswith(f".{format}"):
                continue
            
            stat = f.stat()
            files.append({
                "filename": f.name,
                "size": stat.st_size,
                "created_at": stat.st_mtime,
                "url": _generator.get_download_url(str(f))
            })
    
    # 按时间倒序，限制数量
    files.sort(key=lambda x: x["created_at"], reverse=True)
    return files[:limit]


@router.get("/cleanup")
async def cleanup_old_outputs(
    days: int = Query(30, ge=1, le=365),
    dry_run: bool = Query(True)
):
    """清理旧产出物"""
    output_dir = _generator.output_dir
    cutoff = datetime.now() - timedelta(days=days)
    deleted = []
    
    for f in output_dir.iterdir():
        if f.is_file():
            stat = f.stat()
            mtime = datetime.fromtimestamp(stat.st_mtime)
            if mtime < cutoff:
                if not dry_run:
                    f.unlink()
                deleted.append(f.name)
    
    return {
        "deleted_count": len(deleted),
        "deleted_files": deleted,
        "dry_run": dry_run
    }


@router.get("/{filename}")
async def download_output(filename: str):
    """下载产出物"""
    filepath = _generator.output_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    # 根据扩展名确定媒体类型
    media_types = {
        ".md": "text/markdown",
        ".json": "application/json",
        ".yaml": "text/yaml",
        ".yml": "text/yaml",
        ".mmd": "text/plain",
        ".html": "text/html"
    }
    
    ext = filepath.suffix
    media_type = media_types.get(ext, "application/octet-stream")
    
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type=media_type
    )


@router.delete("/{filename}")
async def delete_output(filename: str):
    """删除产出物"""
    filepath = _generator.output_dir / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    filepath.unlink()
    return {"deleted": filename}