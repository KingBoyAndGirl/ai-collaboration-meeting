# Changelog

## [0.2.0] - 2026-05-06

### Added
- ExecutorManager with ACP protocol support (Hermes, Claude)
- Agent 发言逻辑集成到会议引擎
- WebSocket 实时推送 Agent 消息
- Agent 热插拔 API (`/api/agents`)
- ReactFlow 可视化场景编辑器
- 停止/恢复会议 API

### Changed
- Meeting 模型增加 `messages` 字段
- MeetingStage 模型增加 `messages` 字段

### Fixed
- 阶段执行流程完整实现
- 边界条件测试补充

### Tests
- 23/23 tests passing