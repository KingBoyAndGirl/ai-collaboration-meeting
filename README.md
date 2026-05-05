# AI 协作会议平台

让人类当导演，AI当演员，通过会议协作完成任何任务。

## 功能特性

- ✅ 多 Agent 协作会议
- ✅ YAML 场景定义
- ✅ 实时 WebSocket 通信
- ✅ 用户介入/批准机制
- ✅ 产出物生成 (Markdown/代码)

## 快速开始

### 后端

```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 18502
```

### 前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:18501

## 场景 YAML 示例

```yaml
name: "代码审查"
description: "AI 协作代码审查"
version: "1.0.0"

roles:
  - id: reviewer
    name: "审查者"
    description: "阅读代码"
    executor: "claude"
    
stages:
  - id: review
    type: requirement
    roles: [reviewer]
    moderator: reviewer
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| /api/scenes | GET/POST | 场景管理 |
| /api/meetings | GET/POST | 会议管理 |
| /ws/meetings/{id} | WS | 实时通信 |
| /api/intervention/meetings/{id}/approve | POST | 批准阶段 |
| /api/intervention/meetings/{id}/reject | POST | 驳回阶段 |

## 支持的 Agent

- claude: Anthropic Claude
- openai: OpenAI GPT
- hermes: Hermes Agent
- claude_code: Claude Code (ACP)

## 许可证

MIT