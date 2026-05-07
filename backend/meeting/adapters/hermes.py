"""Hermes 适配器 - 使用 hermes chat CLI"""
import os
import asyncio
from typing import Dict, Any, List
from .base import BaseMeetingAgent


class HermesAdapter(BaseMeetingAgent):
    """Hermes Agent 适配器 - 通过 hermes chat CLI 调用"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.hermes_path = config.get('hermes_path', '/home/prodbox/.local/bin/hermes')
        self.model = config.get('model', 'auto-free')

    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """调用 Hermes 发言"""
        prompt = self.build_prompt(role_prompt, instruction, context, variables)
        
        try:
            cmd = [
                self.hermes_path, "chat",
                "-q", prompt,
                "-m", self.model,
                "-Q"  # quiet mode
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=self.timeout
            )
            
            if proc.returncode == 0:
                return self.truncate_output(stdout.decode().strip())
            else:
                error_msg = stderr.decode().strip()[:200]
                return f"[Hermes Error] {error_msg}"
                
        except asyncio.TimeoutError:
            return "[Hermes] 调用超时"
        except Exception as e:
            return f"[Hermes Error] {str(e)[:200]}"

    async def summarize(self, messages: List[Dict], instruction: str) -> str:
        """总结讨论"""
        msg_text = "\n".join(f"{m.get('role', 'user')}: {m.get('content')}" for m in messages)
        
        prompt = f"""请总结以下讨论内容：

{msg_text}

{instruction}

请提供简洁的总结（Markdown 格式）："""
        
        try:
            cmd = [
                self.hermes_path, "chat",
                "-q", prompt,
                "-m", self.model,
                "-Q"
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, _ = await asyncio.wait_for(
                proc.communicate(),
                timeout=self.timeout
            )
            
            return stdout.decode().strip()
            
        except Exception as e:
            return f"[Hermes 总结错误] {str(e)[:200]}"

    async def judge_consensus(self, messages: List[Dict], criteria: str) -> tuple[bool, str]:
        """判断共识"""
        msg_text = "\n".join(f"{m.get('role', 'user')}: {m.get('content')}" for m in messages)
        
        prompt = f"""作为主持人，请判断以下讨论是否达成共识：

讨论内容：
{msg_text}

判断标准：{criteria}

请回答：
1. 是否达成共识 (是/否)
2. 简短理由"""
        
        try:
            cmd = [
                self.hermes_path, "chat",
                "-q", prompt,
                "-m", self.model,
                "-Q"
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, _ = await asyncio.wait_for(
                proc.communicate(),
                timeout=self.timeout
            )
            
            response = stdout.decode().strip()
            is_consensus = "是" in response[:20]
            
            return is_consensus, response
            
        except Exception as e:
            return False, f"[Hermes 判断错误] {str(e)[:200]}"