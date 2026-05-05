"""Claude Code 适配器 - 使用 ACP 协议"""
import os
import json
import asyncio
from typing import Dict, Any, List
from .base import BaseMeetingAgent


class ClaudeCodeAdapter(BaseMeetingAgent):
    """Claude Code ACP 适配器"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('api_key') or os.getenv('ANTHROPIC_API_KEY')
        self.timeout = config.get('timeout', 180)

    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """调用 Claude Code 发言 (ACP 模式)"""
        prompt = self.build_prompt(role_prompt, instruction, context, variables)
        
        # 使用 claude 命令行
        cmd = ["claude", "--acp", "--stdio"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # ACP 协议消息
            request = {
                "type": "query",
                "data": {"prompt": prompt}
            }
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=json.dumps(request).encode()),
                timeout=self.timeout
            )
            
            if proc.returncode != 0:
                return f"错误: {stderr.decode()}"
            
            result = json.loads(stdout.decode())
            return self.truncate_output(result.get('response', ''))
            
        except asyncio.TimeoutError:
            return "超时错误"
        except Exception as e:
            return f"错误: {str(e)}"

    async def summarize(
        self,
        messages: List[Dict],
        instruction: str
    ) -> str:
        """总结讨论"""
        msg_text = "\n".join(f"{m.get('role', 'user')}: {m.get('content')}" for m in messages)
        
        prompt = f"""请总结以下讨论内容：

{msg_text}

{instruction}

请提供简洁的总结（Markdown 格式）："""
        
        cmd = ["claude", "--acp", "--stdio"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            request = {"type": "query", "data": {"prompt": prompt}}
            stdout, _ = await asyncio.wait_for(
                proc.communicate(input=json.dumps(request).encode()),
                timeout=self.timeout
            )
            
            result = json.loads(stdout.decode())
            return result.get('response', '')
            
        except Exception as e:
            return f"错误: {str(e)}"

    async def judge_consensus(
        self,
        messages: List[Dict],
        criteria: str
    ) -> tuple[bool, str]:
        """判断共识"""
        msg_text = "\n".join(f"{m.get('role', 'user')}: {m.get('content')}" for m in messages)
        
        prompt = f"""作为主持人，请判断以下讨论是否达成共识：

讨论内容：
{msg_text}

判断标准：{criteria}

请回答：
1. 是否达成共识 (是/否)
2. 简短理由"""
        
        cmd = ["claude", "--acp", "--stdio"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            request = {"type": "query", "data": {"prompt": prompt}}
            stdout, _ = await asyncio.wait_for(
                proc.communicate(input=json.dumps(request).encode()),
                timeout=self.timeout
            )
            
            result = json.loads(stdout.decode())
            response = result.get('response', '')
            is_consensus = "是" in response[:10]
            
            return is_consensus, response
            
        except Exception as e:
            return False, f"错误: {str(e)}"