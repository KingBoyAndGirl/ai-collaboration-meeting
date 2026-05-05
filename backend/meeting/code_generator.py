"""代码生成器 - 使用 Claude Code 生成代码"""
import asyncio
from typing import Dict, Any, Optional
from ..adapters.claude_code import ClaudeCodeAdapter


class CodeGenerator:
    """代码生成器"""

    def __init__(self, api_key: str = None):
        self.adapter = ClaudeCodeAdapter({"api_key": api_key} if api_key else {})

    async def generate_code(
        self,
        description: str,
        language: str = "python",
        framework: str = None,
        requirements: list = None
    ) -> str:
        """
        生成代码
        
        Args:
            description: 功能描述
            language: 编程语言
            framework: 框架名称
            requirements: 额外要求列表
        """
        prompt = f"""请生成 {language} 代码，实现以下功能：

{description}
"""
        
        if framework:
            prompt += f"\n使用框架: {framework}"
        
        if requirements:
            prompt += f"\n\n要求:\n" + "\n".join(f"- {r}" for r in requirements)
        
        prompt += """

请按以下格式输出：
```language
// 代码内容
```

包含文件结构建议和使用说明。"""
        
        result = await self.adapter.speak(
            context="",
            role_prompt="你是一个专业的软件工程师，擅长编写高质量代码",
            instruction=prompt,
            variables={}
        )
        
        return result

    async def generate_project(
        self,
        name: str,
        description: str,
        language: str = "python"
    ) -> Dict[str, str]:
        """生成完整项目"""
        prompt = f"""请设计一个名为 {name} 的项目，功能是：{description}

请提供：
1. 项目结构 (tree 格式)
2. 各文件内容
3. 安装运行说明"""
        
        result = await self.adapter.speak(
            context="",
            role_prompt="你是一个项目架构师，擅长设计完整项目结构",
            instruction=prompt,
            variables={"language": language}
        )
        
        # 简单解析结果中的文件
        files = {}
        current_file = None
        current_content = []
        
        for line in result.split('\n'):
            if line.startswith('```') and current_file:
                files[current_file] = '\n'.join(current_content)
                current_file = None
                current_content = []
            elif '```' in line and not current_file:
                parts = line.split('```')
                if len(parts) > 1:
                    current_file = f"file_{len(files)}.{language}"
            elif current_file:
                current_content.append(line)
        
        return files