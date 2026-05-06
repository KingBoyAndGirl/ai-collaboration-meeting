"""Executor 管理器 - Agent 适配层"""
import asyncio
import subprocess
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import os


class BaseExecutor(ABC):
    """Executor 基类"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.name = agent_id
    
    @abstractmethod
    async def execute(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """执行 Agent 发言"""
        pass
    
    @abstractmethod
    def supports(self, agent_type: str) -> bool:
        """支持的 Agent 类型"""
        pass
    
    async def health_check(self) -> bool:
        """健康检查"""
        return True


class HermesExecutor(BaseExecutor):
    """Hermes Agent 执行器 (ACP 协议)"""
    
    def __init__(self, agent_id: str):
        super().__init__(agent_id)
        self.acp_path = os.getenv("HERMES_ACP_PATH", "hermes-agent")
    
    async def execute(self, prompt: str, context: Dict = None) -> str:
        """ACP 协议调用"""
        try:
            # 使用 subprocess 调用 hermes-agent acp
            cmd = [
                "hermes-agent", "acp", "run",
                "--prompt", prompt,
                "--json"
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=60
            )
            
            if proc.returncode == 0:
                result = json.loads(stdout)
                return result.get("response", str(stdout.decode()))
            else:
                return f"[Hermes Error] {stderr.decode()[:100]}"
                
        except asyncio.TimeoutError:
            return "[Hermes] 超时"
        except Exception as e:
            return f"[Hermes Error] {str(e)[:100]}"
    
    def supports(self, agent_type: str) -> bool:
        return agent_type in ["hermes", "hermes-agent"]


class ClaudeExecutor(BaseExecutor):
    """Claude Code 执行器"""
    
    def __init__(self, agent_id: str, model: str = "claude-sonnet-4"):
        super().__init__(agent_id)
        self.model = model
    
    async def execute(self, prompt: str, context: Dict = None) -> str:
        """ACP 协议调用 Claude Code"""
        try:
            cmd = [
                "claude", "--acp", "--stdio",
                "--prompt", prompt
            ]
            
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(),
                timeout=60
            )
            
            if proc.returncode == 0:
                return stdout.decode()
            else:
                return f"[Claude Error] {stderr.decode()[:100]}"
                
        except asyncio.TimeoutError:
            return "[Claude] 超时"
        except FileNotFoundError:
            # 模拟回退
            return f"[Claude-{self.model}] {prompt[:100]}..."
        except Exception as e:
            return f"[Claude Error] {str(e)[:100]}"
    
    def supports(self, agent_type: str) -> bool:
        return agent_type in ["claude", "claude-code"]


class ExecutorManager:
    """Executor 管理器"""
    
    def __init__(self):
        self._executors: Dict[str, BaseExecutor] = {}
        self._type_map: Dict[str, str] = {}  # agent_type -> executor_id
        
        # 注册默认 executors
        hermes = HermesExecutor("hermes")
        self.register_executor(hermes)
        
        claude = ClaudeExecutor("claude", "claude-sonnet-4")
        self.register_executor(claude)
        
        openai = OpenAIExecutor("openai", "gpt-4")
        self.register_executor(openai)
    
    def register_executor(self, executor: BaseExecutor) -> None:
        """注册 executor"""
        self._executors[executor.name] = executor
    
    def get_executor(self, agent_type: str) -> Optional[BaseExecutor]:
        """获取支持的 executor"""
        # 先精确匹配
        if agent_type in self._executors:
            return self._executors[agent_type]
        
        # 再遍历查找支持的
        for executor in self._executors.values():
            if executor.supports(agent_type):
                return executor
        
        return None
    
    async def run_agent(self, agent_type: str, prompt: str, context: Dict = None) -> str:
        """运行 Agent"""
        executor = self.get_executor(agent_type)
        if not executor:
            raise ValueError(f"No executor found for agent type: {agent_type}")
        
        return await executor.execute(prompt, context)
    
    async def health_check(self) -> Dict[str, bool]:
        """检查所有 executor 健康状态"""
        results = {}
        for name, executor in self._executors.items():
            try:
                results[name] = await executor.health_check()
            except Exception:
                results[name] = False
        return results


# 全局单例
_manager: Optional[ExecutorManager] = None


def get_executor_manager() -> ExecutorManager:
    """获取全局 ExecutorManager"""
    global _manager
    if not _manager:
        _manager = ExecutorManager()
    return _manager