"""Agent 适配层"""
from .base import BaseMeetingAgent
from .claude import ClaudeAdapter
from .openai import OpenAIAdapter
from .hermes import HermesAdapter
from .claude_code import ClaudeCodeAdapter
from .registry import AdapterRegistry

__all__ = [
    "BaseMeetingAgent",
    "ClaudeAdapter",
    "OpenAIAdapter",
    "HermesAdapter",
    "ClaudeCodeAdapter",
    "AdapterRegistry",
]