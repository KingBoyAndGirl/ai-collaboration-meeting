"""产出物生成器"""
import json
from datetime import datetime
from typing import Dict, List, Any
from pathlib import Path
from .models import Meeting, MeetingStage
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

    def generate_json(self, meeting: Meeting) -> Dict[str, Any]:
        """生成 JSON 格式产出物"""
        return {
            "meeting_id": meeting.id,
            "scene_name": meeting.scene_name,
            "status": meeting.status,
            "created_at": str(meeting.created_at),
            "updated_at": str(meeting.updated_at),
            "variables": meeting.variables,
            "stages": [
                {
                    "id": s.stage_id,
                    "status": s.status,
                    "consensus_reached": s.consensus_reached,
                    "output": s.output,
                    "rejection_reason": s.rejection_reason,
                    "rounds": [
                        {
                            "round_num": rnd.round_num,
                            "messages": [
                                {
                                    "role": m.role.value,
                                    "role_id": m.role_id,
                                    "content": m.content,
                                    "timestamp": str(m.timestamp)
                                }
                                for m in rnd.messages
                            ],
                            "summary": rnd.summary
                        }
                        for rnd in s.rounds
                    ]
                }
                for s in meeting.stages
            ]
        }

    def generate_mermaid(self, meeting: Meeting) -> str:
        """生成 Mermaid 流程图"""
        lines = ["graph TD"]
        
        # 会议开始
        lines.append("    Start([会议开始]) --> " + meeting.stages[0].stage_id if meeting.stages else "End")
        
        for i, stage in enumerate(meeting.stages):
            # 阶段节点
            status_icon = "✓" if stage.consensus_reached else "○"
            lines.append(f"    {stage.stage_id}[{status_icon} {stage.stage_id}]")
            
            # 阶段间连接
            if i < len(meeting.stages) - 1:
                lines.append(f"    {stage.stage_id} --> {meeting.stages[i+1].stage_id}")
        
        # 会议结束
        if meeting.stages:
            lines.append(f"    {meeting.stages[-1].stage_id} --> End([会议结束])")
        
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

    def generate_html(self, meeting: Meeting) -> str:
        """生成 HTML 格式产出物"""
        md_content = self.generate_markdown(meeting)
        # 简单转换为 HTML
        html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: -apple-system, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }}
        h1, h2, h3 {{ color: #333; }}
        .stage {{ border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }}
        .status {{ background: #f5f5f5; padding: 4px 12px; border-radius: 4px; }}
    </style>
</head>
<body>
    <pre>{md_content}</pre>
</body>
</html>"""
        return html

    def save_output(self, meeting: Meeting, format: str = "markdown") -> str:
        """保存产出物到文件"""
        formats = {
            "markdown": (self.generate_markdown, ".md"),
            "json": (self.generate_json, ".json"),
            "yaml": (self.generate_yaml, ".yaml"),
            "mermaid": (self.generate_mermaid, ".mmd"),
            "html": (self.generate_html, ".html"),
        }
        
        if format not in formats:
            raise ValueError(f"Unsupported format: {format}")
        
        generator, ext = formats[format]
        content = generator(meeting)
        
        # JSON 需要序列化
        if format == "json":
            content = json.dumps(content, ensure_ascii=False, indent=2)
        
        filename = f"{meeting.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{ext}"
        filepath = self.output_dir / filename
        
        filepath.write_text(content, encoding='utf-8')
        return str(filepath)

    def get_download_url(self, filepath: str) -> str:
        return f"/outputs/{Path(filepath).name}"