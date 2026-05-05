"""OpenAI 适配器"""
import os
from typing import Dict, Any, List
import httpx
from .base import BaseMeetingAgent


class OpenAIAdapter(BaseMeetingAgent):
    """OpenAI API 适配器"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.api_key = config.get('api_key') or os.getenv('OPENAI_API_KEY')
        self.base_url = config.get('base_url', 'https://api.openai.com/v1')
        self.model = config.get('model', 'gpt-4')

    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """调用 OpenAI 发言"""
        prompt = self.build_prompt(role_prompt, instruction, context, variables)
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "content-type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": self.max_output_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
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
            "model": self.model,
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
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
        """判断共识（主持人模式）"""
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
            "model": self.model,
            "max_tokens": 500,
            "messages": [{"role": "user", "content": prompt}]
        }
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            response.raise_for_status()
            data = response.json()
            
        result = data['choices'][0]['message']['content']
        is_consensus = "是" in result[:10]
        
        return is_consensus, result