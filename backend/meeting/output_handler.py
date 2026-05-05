"""产出物阶段处理"""
import uuid
from datetime import datetime
from typing import Dict, Any
from ..models import Meeting, MeetingStage, Stage
from ..output_generator import OutputGenerator


class OutputStageHandler:
    """产出物阶段处理器"""

    def __init__(self, output_dir: str = "./outputs"):
        self.generator = OutputGenerator(output_dir)

    async def handle_output_stage(self, stage: Stage, meeting: Meeting) -> Dict[str, Any]:
        """处理产出阶段"""
        # 收集所有阶段的输出
        context = self._collect_context(meeting)
        
        # 生成产出物
        output = self.generator.generate_markdown(meeting)
        
        # 保存
        filepath = self.generator.save_output(meeting, "markdown")
        
        return {
            "output": output,
            "filepath": filepath,
            "download_url": self.generator.get_download_url(filepath)
        }

    def _collect_context(self, meeting: Meeting) -> str:
        """收集上下文"""
        context = f"# {meeting.scene_name}\n\n"
        
        for stage in meeting.stages:
            context += f"## {stage.stage_id}\n"
            for rnd in stage.rounds:
                for msg in rnd.messages:
                    context += f"- {msg.role_id}: {msg.content[:100]}...\n"
        
        return context


# 全局处理器
output_handler = OutputStageHandler()