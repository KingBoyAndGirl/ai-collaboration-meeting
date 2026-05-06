# AI Collaboration Meeting Platform

> 人类当导演，AI当演员 — AI 协作会议平台

## 🌟 特性

- **多 Agent 讨论**：支持 Claude、OpenAI、Hermes、Claude Code 等多个 AI
- **YAML 场景定义**：灵活配置角色、阶段、共识规则
- **实时 WebSocket**：会议过程实时推送
- **多种产出物**：Markdown、JSON、Mermaid、HTML
- **ReactFlow 可视化**：拖拽式场景编辑器
- **Agent 热插拔**：运行时动态添加/移除 Agent

## 🚀 快速开始

### 环境要求
- Python 3.11+
- Node.js 20+
- uv (Python 包管理器)

### 启动

```bash
# 克隆项目
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting
cd ai-collaboration-meeting

# 后端 (端口 18602)
cd backend
uv run python main.py

# 前端 (端口 18601) - 新终端
cd ..
npm install
npm run dev
```

访问 http://localhost:18601

## 📁 项目结构

```
ai-collaboration-meeting/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── meeting/             # 核心模块
│   │   ├── models.py        # Pydantic 数据模型
│   │   ├── engine.py        # 会议引擎
│   │   ├── adapters/         # Agent 适配器
│   │   └── routers/         # API 路由
│   └── outputs/             # 产出物存储
├── frontend/
│   ├── src/
│   │   ├── pages/           # 页面组件
│   │   ├── components/      # 通用组件
│   │   └── services/        # API 客户端
│   └── vite.config.ts
├── scenes/                  # 场景模板
├── deploy.sh                # 部署脚本
└── docs/                    # 文档
```

## 🎮 使用流程

### 1. 创建场景
```yaml
# scenes/my-scene.yaml
name: "代码审查会议"
roles:
  - id: reviewer
    name: "审查员"
    executor: "hermes"
stages:
  - id: review
    type: review
    roles: [reviewer]
    moderator: reviewer
```

### 2. API 调用
```bash
# 创建场景
curl -X POST http://localhost:18602/api/scenes -d '{...}'

# 启动会议
curl -X POST http://localhost:18602/api/run/start -d '{"scene_name": "..."}'

# WebSocket 连接
ws://localhost:18602/ws/meetings/{meeting_id}
```

## 📡 API 端点

|| 方法 | 路径 | 说明 ||------|------|------|
|| GET | /health | 健康检查 ||
|| POST | /api/scenes | 创建场景 ||
|| GET | /api/scenes | 列出场景 ||
|| POST | /api/meetings | 创建会议 ||
|| POST | /api/run/start | 启动会议 ||
|| POST | /api/meetings/{id}/pause | 暂停会议 ||
|| POST | /api/meetings/{id}/resume | 恢复会议 ||
|| POST | /api/meetings/{id}/stop | 停止会议 ||
|| POST | /api/intervention/meetings/{id}/feedback | 用户反馈 ||
|| GET | /api/agents | 列出 Agent ||
|| POST | /api/agents/register | 注册 Agent ||
|| GET | /api/outputs | 列出产出物 ||

## 🧪 测试

```bash
# 后端测试
cd backend
uv run pytest tests/ -v

# 前端构建测试
cd ..
npm run build
```

## 🚀 部署 (prodbox)

```bash
# 使用 deploy.sh
./deploy.sh

# 或手动部署
systemctl --user enable ai-meeting-backend ai-meeting-frontend
systemctl --user start ai-meeting-backend ai-meeting-frontend
```

## 📚 文档

- [API 文档](docs/API.md)
- [部署指南](docs/DEPLOYMENT.md)
- [开发计划](PLAN.md)

## 📄 许可证

MIT