"""OpenAI 执行器"""
import asyncio
import json
from typing import Dict, Any, Optional
from .executor_manager import BaseExecutor

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class OpenAIExecutor(BaseExecutor):
    """OpenAI Executor"""
    
    def __init__(self, agent_id: str, model: str = "gpt-4"):
        super().__init__(agent_id)
        self.model = model
        self.api_key = None
    
    async def execute(self, prompt: str, context: Dict = None) -> str:
        """调用 OpenAI API"""
        if not OPENAI_AVAILABLE:
            return f"[OpenAI] 模拟回复: {prompt[:100]}..."
        
        try:
            client = openai.AsyncOpenAI(
                api_key=self.api_key or openai.api_key
            )
            
            messages = [{"role": "user", "content": prompt}]
            if context:
                messages.insert(0, {"role": "system", "content": str(context)})
            
            response = await client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=2000
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"[OpenAI Error] {str(e)[:100]}"
    
    def supports(self, agent_type: str) -> bool:
        return agent_type in ["openai", "gpt-4", "gpt-3.5-turbo", "o3"]