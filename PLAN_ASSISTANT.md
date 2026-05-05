# 计划书补充：助手 Agent + Hermes 记忆集成

## 一、产品理念

**人类当导演，AI当演员** — 通过多阶段会议协作完成任何任务。助手 Agent 是会议过程的"舞台助手"，负责记录、记忆、提醒，确保每一幕都围绕导演（用户）的意图进行。

---

## 二、助手 Agent 设计

### 2.1 角色定义

```yaml
roles:
  - id: assistant
    name: "助手"
    description: "记录全流程、记忆管理、任务提醒"
    executor: "hermes"    # 使用 Hermes ACP 协议
    model: null           # 继承主模型
```

**职责矩阵**

| 功能 | 时机 | 实现 |
|------|------|------|
| 📋 记录 | 每阶段结束 | YAML 序列化，写入会议日志 |
| 💾 记忆 | 每轮结束 | MemoryManager.sync_all() |
| 🔔 提醒 | 检测到"记得X" | Prefetch 触发，注入上下文 |

### 2.2 生命周期钩子映射

| 会议阶段 | Hermes 钩子 | 助手行为 |
|----------|-------------|----------|
| 开始 | on_turn_start | 加载该会议相关记忆 |
| 进行中 | on_delegation | 记录子任务结果 |
| 阶段结束 | on_session_end | 阶段摘要写入 MEMORY.md |
| 产出物 | sync_all | 生成产出物存档 |

---

## 三、原生 Hermes 记忆架构

### 3.1 目录结构

```
~/.hermes/
├── hermes-agent/           # 安装目录
├── sessions/               # SQLite 会话存储 (FTS5)
├── memories/               # MEMORY.md / USER.md 存放
├── plugins/                # 外部记忆 provider
│   ├── honcho/
│   ├── mem0/
│   └── ...
├── SOUL.md                 # 身份锚点 (必读)
└── cron/                   # 定时任务
```

### 3.2 Memory Provider 选型

| Provider | 特点 | 推荐场景 |
|----------|------|----------|
| **builtin** | MEMORY.md + USER.md，永久启用 | 通用记忆存档 |
| **honcho** | 用户建模，习惯分析 | 需要个性化推荐 |
| **mem0** | 向量搜索，语义检索 | 跨项目知识复用 |
| **hindsight** | 自动总结，压缩 | 长期对话精简 |
| **byterover** | 持久化云存储 | 多设备同步 |

> ⚠️ 只能启用 1 个外部 provider，builtin 始终启用。

### 3.3 Python API （基于原生 v0.12.0）

```python
from tools.memory_tool import MemoryStore        # builtin: MEMORY.md/USER.md
from agent.memory_manager import MemoryManager      # external providers
from plugins.memory import load_memory_provider

# === 1. Builtin memory (MEMORY.md + USER.md) ===
store = MemoryStore(memory_char_limit=2200, user_char_limit=1375)
store.load_from_disk()

# 写入记忆（每轮结束）
store.add_memory("阶段总结：用户确认使用 honcho provider")
store.save_memory()  # 持久化到 MEMORY.md

# === 2. 外部记忆 provider（可选） ===
mm = MemoryManager()
provider = load_memory_provider("honcho")  # 或 "mem0", "hindsight"
if provider and provider.is_available():
    mm.add_provider(provider)
    mm.initialize_all(session_id=meeting_id)

# 取回记忆（轮次开始）
context = mm.prefetch_all(
    query="会议记录",
    session_id=meeting_id
)

# 写入记忆（轮次结束）
mm.sync_all(
    user_content=user_message,
    assistant_content=response,
    session_id=meeting_id
)

# 会议结束
mm.on_session_end(messages=all_messages)
```

---

## 四、prodbox 部署

### 4.1 环境准备

```bash
# 1. SSH 到 prodbox（免密）
ssh -i ~/.ssh/id_ed25519_prodbox -p 2028 prodbox@nasw.heiyu.space

# 2. 安装 Hermes Agent（官方脚本）
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 3. 验证安装
hermes --version   # 应显示 v0.12.0+
```

### 4.2 记忆 provider 配置

```bash
# 交互式配置（推荐）
hermes memory setup

# 或直接写入 config.yaml
cat >> ~/.hermes/config.yaml <<EOF
memory:
  provider: honcho    # 或 mem0、builtin
  # provider_configs 根据 provider 不同填写
EOF
```

### 4.3 助手 Agent 启动方式

**ACP 模式（推荐）**

```bash
# prodbox 启动 Hermes ACP 服务器
hermes acp --port 18580

# 会议引擎作为 ACP 客户端调用
# （在 ai-collaboration-meeting 项目中实现）
```

**Gateway 模式**

```bash
# 启动消息网关（支持 Telegram/WeChat）
hermes gateway --platform telegram
```

---

## 五、与主计划书的集成

| 章节 | 修改 |
|------|------|
| 2.2 核心模块 | 新增 `AssistantAgent` 模块 |
| 3.1 数据模型 | 增加 `AssistantLog` 数据结构 |
| 5.2 部署指南 | 基于 prodbox 的标准化部署流程 |
| 附录 | 记忆 provider 选型参考表 |

---

## 六、开发里程碑

| 阶段 | 任务 | 验证 |
|------|------|------|
| 1 | 实现 AssistantAgent 骨架 | 单元测试通过 |
| 2 | 集成 MemoryManager | 内存读写正常 |
| 3 | session_id 隔离 | 不同会议记忆不串 |
| 4 | prodbox 部署 | `hermes acp` 远程启动 |
| 5 | 多设备访问 | 手机浏览器访问会议 UI |

---

## 七、下一步

1. ✅ prodbox 已 `hermes update`（更新完成）
2. ✅ 创建 `/data/code/ai-collaboration-meeting/src/assistant/` 目录
3. ✅ 实现 `AssistantAgent` 类、`memory_adapter.py`
4. 🔄 在 prodbox 上部署测试，验证记忆隔离与 ACP 调用
5. 实现 `AssistantLog` Pydantic 模型