"""适配器注册表"""
from typing import Dict, Any, Optional
from .base import BaseMeetingAgent
from .claude import ClaudeAdapter
from .openai import OpenAIAdapter
from .hermes import HermesAdapter
from .claude_code import ClaudeCodeAdapter


class AdapterRegistry:
    """适配器注册表"""
    
    _adapters = {
        "claude": ClaudeAdapter,
        "openai": OpenAIAdapter,
        "hermes": HermesAdapter,
        "claude_code": ClaudeCodeAdapter,
    }

    @classmethod
    def get_adapter(cls, executor: str, config: Dict[str, Any] = None) -> Optional[BaseMeetingAgent]:
        """获取适配器实例"""
        adapter_cls = cls._adapters.get(executor.lower())
        if not adapter_cls:
            return None
        return adapter_cls(config or {})

    @classmethod
    def register(cls, name: str, adapter_cls):
        """注册新适配器"""
        cls._adapters[name.lower()] = adapter_cls

    @classmethod
    def list_adapters(cls) -> list:
        """列出所有可用适配器"""
        return list(cls._adapters.keys())


# 导出
__all__ = ["AdapterRegistry", "BaseMeetingAgent"]