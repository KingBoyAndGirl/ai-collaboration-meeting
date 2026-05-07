"""Claude Code 适配器 - 支持 ACP 协议和 AxonHub 代理"""
import os
import json
import asyncio
from typing import Dict, Any, List
import httpx
from .base import BaseMeetingAgent


class ClaudeCodeAdapter(BaseMeetingAgent):
    """Claude Code 适配器 - 优先使用 AxonHub 代理，fallback 到 CLI"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('api_key') or os.getenv('ANTHROPIC_API_KEY')
        self.axonhub_key = config.get('axonhub_key') or os.getenv('AXONHUB_API_KEY', 'ah-ed512094f2da8fadd186b58e26d18d132b747d4dfc47ea3ee09da3f0f928cd88')
        self.axonhub_url = config.get('axonhub_url', 'https://axonhub.nasw.heiyu.space/v1')
        self.model = config.get('model', 'claude-sonnet-4-20250514')
        self.timeout = config.get('timeout', 180)
        self.use_cli = config.get('use_cli', False)  # 默认使用 API 模式
    
    async def _call_axonhub(self, prompt: str) -> str:
        """通过 AxonHub 调用 Claude API"""
        headers = {
            "Authorization": f"Bearer {self.axonhub_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": self.max_output_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.axonhub_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        return data['choices'][0]['message']['content']
    
    async def _call_cli(self, prompt: str) -> str:
        """通过 CLI 调用 Claude Code (ACP 模式)"""
        cmd = ["claude", "--acp", "--stdio"]
        
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # ACP 协议消息
            request = {"type": "query", "data": {"prompt": prompt}}
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=json.dumps(request).encode()),
                timeout=self.timeout
            )
            
            if proc.returncode != 0:
                return f"CLI 错误: {stderr.decode()[:200]}"
            
            result = json.loads(stdout.decode())
            return result.get('response', '')
            
        except FileNotFoundError:
            raise Exception("Claude CLI 未安装，请使用 API 模式")
        except asyncio.TimeoutError:
            raise Exception("CLI 调用超时")
    
    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """调用 Claude 发言"""
        prompt = self.build_prompt(role_prompt, instruction, context, variables)
        
        try:
            if self.use_cli:
                response = await self._call_cli(prompt)
            else:
                response = await self._call_axonhub(prompt)
            return self.truncate_output(response)
        except Exception as e:
            # Fallback: 如果 AxonHub 失败，尝试直接调用 Anthropic API
            if not self.use_cli and self.api_key:
                try:
                    return await self._call_anthropic(prompt)
                except:
                    pass
            return f"[Claude 错误] {str(e)[:200]}"
    
    async def _call_anthropic(self, prompt: str) -> str:
        """直接调用 Anthropic API (fallback)"""
        headers = {
            "x-api-key": self.api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": self.max_output_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        return data['content'][0]['text']
    
    async def summarize(self, messages: List[Dict], instruction: str) -> str:
        """总结讨论"""
        msg_text = "\n".join(f"{m.get('role', 'user')}: {m.get('content')}" for m in messages)
        
        prompt = f"""请总结以下讨论内容：

{msg_text}

{instruction}

请提供简洁的总结（Markdown 格式）："""
        
        try:
            if self.use_cli:
                return await self._call_cli(prompt)
            else:
                return await self._call_axonhub(prompt)
        except Exception as e:
            return f"[总结错误] {str(e)[:200]}"
    
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
            if self.use_cli:
                response = await self._call_cli(prompt)
            else:
                response = await self._call_axonhub(prompt)
            
            is_consensus = "是" in response[:20]
            return is_consensus, response
            
        except Exception as e:
            return False, f"[判断错误] {str(e)[:200]}"