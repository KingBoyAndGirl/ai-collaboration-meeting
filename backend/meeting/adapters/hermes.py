"""Hermes 适配器"""
import os
from typing import Dict, Any, List
import httpx
from .base import BaseMeetingAgent


class HermesAdapter(BaseMeetingAgent):
    """Hermes Agent 适配器"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('api_key') or os.getenv('HERMES_API_KEY')
        self.base_url = config.get('base_url', 'http://localhost:8642')  # Hermes Gateway 端口
        self.model = config.get('model', 'default')

    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """调用 Hermes 发言"""
        prompt = self.build_prompt(role_prompt, instruction, context, variables)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.model if self.model != "default" else None,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": self.max_output_tokens
        }
        
        # 过滤 None 值
        payload = {k: v for k, v in payload.items() if v is not None}
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        return self.truncate_output(data['choices'][0]['message']['content'])

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
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        return data['choices'][0]['message']['content']

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
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        result = data['choices'][0]['message']['content']
        is_consensus = "是" in result[:10]
        
        return is_consensus, result