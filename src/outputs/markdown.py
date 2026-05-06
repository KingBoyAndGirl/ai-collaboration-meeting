"""Markdown output generator for meeting stages."""

from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class MarkdownGenerator:
    """Generate Markdown output from meeting results."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("/data/code/ai-collaboration-meeting/outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_stage_output(self, stage_id: str, stage_type: str,
                               summary: str, decisions: List[str] = None,
                               action_items: List[str] = None,
                               messages: List[Dict[str, Any]] = None) -> Path:
        """Generate markdown file for a stage."""
        decisions = decisions or []
        action_items = action_items or []
        messages = messages or []

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{stage_id}_{timestamp}.md"
        filepath = self.output_dir / filename

        content = self._build_content(stage_id, stage_type, summary, decisions, action_items, messages)
        filepath.write_text(content, encoding="utf-8")

        return filepath

    def generate_meeting_summary(self, meeting_id: str, stages: List[Dict[str, Any]]) -> Path:
        """Generate complete meeting summary."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filepath = self.output_dir / f"meeting_{meeting_id}_{timestamp}.md"

        lines = [
            f"# 会议总结 - {meeting_id}",
            "",
            f"**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "",
            "---",
            ""
        ]

        for stage in stages:
            stage_type = stage.get("stage_type", "unknown")
            stage_id = stage.get("stage_id", "unknown")
            summary = stage.get("summary", "")
            decisions = stage.get("key_decisions", [])
            actions = stage.get("action_items", [])

            lines.extend([
                f"## {stage_type.title()} 阶段",
                "",
                f"**阶段ID**: {stage_id}",
                "",
                f"### 摘要",
                "",
                summary,
                ""
            ])

            if decisions:
                lines.append("### 关键决定")
                lines.append("")
                for d in decisions:
                    lines.append(f"- {d}")
                lines.append("")

            if actions:
                lines.append("### 待办事项")
                lines.append("")
                for a in actions:
                    lines.append(f"- [ ] {a}")
                lines.append("")

            lines.append("---")
            lines.append("")

        filepath.write_text("\n".join(lines), encoding="utf-8")
        return filepath

    def _build_content(self, stage_id: str, stage_type: str, summary: str,
                       decisions: List[str], action_items: List[str],
                       messages: List[Dict[str, Any]]) -> str:
        """Build markdown content."""
        lines = [
            f"# {stage_type.title()} 阶段输出",
            "",
            f"**阶段**: {stage_id}",
            f"**类型**: {stage_type}",
            f"**时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "",
            "---",
            "",
            "## 总结",
            "",
            summary,
            ""
        ]

        if decisions:
            lines.append("## 关键决定")
            lines.append("")
            for d in decisions:
                lines.append(f"- {d}")
            lines.append("")

        if action_items:
            lines.append("## 待办事项")
            lines.append("")
            for a in action_items:
                lines.append(f"- [ ] {a}")
            lines.append("")

        if messages:
            lines.append("## 讨论记录")
            lines.append("")
            for msg in messages:
                role = msg.get("role", "unknown")
                content = msg.get("content", "")
                lines.append(f"**{role}**: {content}")
                lines.append("")

        lines.append("---")
        lines.append("*由 AI 协作会议平台生成*")

        return "\n".join(lines)


if __name__ == "__main__":
    gen = MarkdownGenerator()
    path = gen.generate_stage_output(
        "test-stage", "requirement",
        "需求分析完成",
        ["采用 Python", "使用 FastAPI"],
        ["编写 API", "设计数据库"]
    )
    print(f"Generated: {path}")