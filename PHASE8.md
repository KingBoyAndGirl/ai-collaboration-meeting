# Phase 8 开发计划

## 目标
实现 Agent 发言逻辑和 ExecutorManager，完成会议引擎核心功能

## 任务分解

### 8.1 ExecutorManager (2天)
- [ ] 创建 `backend/meeting/executor_manager.py`
- [ ] 实现 BaseExecutor 基类
- [ ] 实现 HermesExecutor (ACP 协议)
- [ ] 实现 ClaudeExecutor (ACP 协议)

### 8.2 Agent 发言逻辑 (3天)
- [ ] 在 `engine.py` 实现 `_run_agent_round()`
- [ ] 实现发言队列管理
- [ ] 实现 consensus 检测

### 8.3 集成测试 (1天)
- [ ] 编写 Agent 发言集成测试
- [ ] 验证多 Agent 讨论流程

## 技术细节

### Executor 接口
```python
class BaseExecutor(ABC):
    @abstractmethod
    async def execute(self, prompt: str, context: Dict) -> str:
        pass
    
    @abstractmethod
    def supports(self, agent_type: str) -> bool:
        pass
```

### 阶段执行流程
```
1. Stage 开始 → 2. Agent 依次发言 → 3. Consensus 检测 → 4. 等待批准
```