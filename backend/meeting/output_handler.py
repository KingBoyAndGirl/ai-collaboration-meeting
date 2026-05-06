"""产出物阶段处理"""
from typing import Dict, Any
from .models import Meeting, Stage
from .output_generator import OutputGenerator
from .code_generator import CodeGenerator


class OutputStageHandler:
    """产出物阶段处理器"""

    def __init__(self, output_dir: str = "./outputs"):
        self.generator = OutputGenerator(output_dir)
        self.code_generator = CodeGenerator()

    async def handle_output_stage(self, stage: Stage, meeting: Meeting) -> Dict[str, Any]:
        """处理产出阶段"""
        outputs = {}
        
        # 生成所有格式的产出物
        for format_type in ["markdown", "json", "yaml", "mermaid", "html"]:
            filepath = self.generator.save_output(meeting, format_type)
            outputs[format_type] = {
                "filepath": filepath,
                "url": self.generator.get_download_url(filepath)
            }
        
        # 如果是代码输出阶段，生成代码
        if stage.output_format == "code":
            code_output = await self._generate_code_output(meeting)
            outputs["code"] = code_output
        
        return outputs

    async def _generate_code_output(self, meeting: Meeting) -> Dict[str, Any]:
        """生成代码产出物"""
        # 收集所有阶段输出作为上下文
        context = self._collect_context(meeting)
        
        code = await self.code_generator.generate_code(
            description=f"根据以下会议讨论生成实现代码:\n{context}",
            language="python"
        )
        
        return {"content": code, "type": "python"}

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