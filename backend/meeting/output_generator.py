"""产出物生成器"""
import uuid
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path
from ..models import Meeting, MeetingStage
import yaml


class OutputGenerator:
    """产出物生成器"""

    def __init__(self, output_dir: str = "./outputs"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)

    def generate_markdown(self, meeting: Meeting) -> str:
        """生成 Markdown 格式产出物"""
        lines = [
            f"# {meeting.scene_name}",
            "",
            f"**会议 ID**: {meeting.id}",
            f"**创建时间**: {meeting.created_at}",
            "",
            "## 会议阶段",
            "",
        ]
        
        for stage in meeting.stages:
            lines.extend([
                f"### {stage.stage_id}",
                "",
                f"- 状态: {stage.status}",
                f"- 共识: {'已达成' if stage.consensus_reached else '未达成'}",
                "",
            ])
            
            if stage.output:
                lines.extend([
                    "#### 输出",
                    "",
                    stage.output,
                    "",
                ])
        
        return "\n".join(lines)

    def generate_yaml(self, meeting: Meeting) -> str:
        """生成 YAML 格式产出物"""
        data = {
            "meeting_id": meeting.id,
            "scene_name": meeting.scene_name,
            "status": meeting.status,
            "created_at": str(meeting.created_at),
            "stages": [
                {
                    "id": s.stage_id,
                    "status": s.status,
                    "consensus_reached": s.consensus_reached,
                    "output": s.output,
                    "rejection_reason": s.rejection_reason
                }
                for s in meeting.stages
            ],
            "variables": meeting.variables
        }
        return yaml.dump(data, allow_unicode=True)

    def save_output(self, meeting: Meeting, format: str = "markdown") -> str:
        """保存产出物到文件"""
        if format == "markdown":
            content = self.generate_markdown(meeting)
            ext = ".md"
        else:
            content = self.generate_yaml(meeting)
            ext = ".yaml"
        
        filename = f"{meeting.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
        filepath = self.output_dir / filename
        
        filepath.write_text(content, encoding='utf-8')
        return str(filepath)

    def get_download_url(self, filepath: str) -> str:
        """获取下载 URL"""
        return f"/outputs/{Path(filepath).name}"