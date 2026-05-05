"""Agent 适配层 - 基础接口"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
import asyncio


class BaseMeetingAgent(ABC):
    """会议 Agent 基类"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = config.get('name', 'Unknown')
        self.model = config.get('model')
        self.timeout = config.get('timeout', 120)
        self.max_output_tokens = config.get('max_output_tokens', 2000)

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
        messages: List[Dict],
        instruction: str
    ) -> str:
        """总结讨论"""
        pass

    @abstractmethod
    async def judge_consensus(
        self,
        messages: List[Dict],
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
        var_str = "\n".join(f"- {k}: {v}" for k, v in variables.items())
        
        prompt = f"""{role_prompt}

## 当前任务
{instruction}

## 上下文
{context}

## 变量
{var_str}

## 输出要求
- 用中文回复
- 结构化输出（使用 Markdown）
- 明确表达立场（同意/反对/建议）
- 指出需要澄清的问题"""

        return prompt

    def truncate_output(self, text: str, max_tokens: int = None) -> str:
        """截断输出"""
        if max_tokens is None:
            max_tokens = self.max_output_tokens
        # 简单按字符截断（4 字符 ≈ 1 token）
        max_chars = max_tokens * 4
        if len(text) > max_chars:
            return text[:max_chars] + "\n...(已截断)"
        return text