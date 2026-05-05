from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class BaseMeetingAgent(ABC):
    """会议 Agent 基类"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get('name', 'Unknown')
        self.model = config.get('model')
        self.timeout = config.get('timeout', 120)

    @abstractmethod
    async def speak(
        self,
        context: str,
        role_prompt: str,
        instruction: str,
        variables: Dict[str, Any]
    ) -> str:
        """Agent 发言"""
        pass

    @abstractmethod
    async def summarize(
        self,
        messages: list,
        instruction: str
    ) -> str:
        """总结讨论"""
        pass

    @abstractmethod
    async def judge_consensus(
        self,
        messages: list,
        criteria: str
    ) -> tuple[bool, str]:
        """判断是否达成共识"""
        pass

    async def health_check(self) -> bool:
        """健康检查"""
        return True

    def build_prompt(
        self,
        role_prompt: str,
        instruction: str,
        context: str,
        variables: Dict[str, Any]
    ) -> str:
        """构建提示词"""
        prompt = f"""{role_prompt}

## 当前任务
{instruction}

## 上下文
{context}

## 变量
{variables}

## 输出要求
- 用中文回复
- 结构化输出（使用 Markdown）
- 明确表达立场（同意/反对/建议）
"""
        return prompt
