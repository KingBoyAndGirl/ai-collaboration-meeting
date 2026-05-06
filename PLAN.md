# AI 协作会议平台 — 技术开发计划

**版本**: v2.0
## 已完成
- [x] Phase 7-9 完成 (23/23 tests, ExecutorManager + WebSocket + ReactFlow)
- [x] OpenAI Executor 实现
- [x] Mermaid 可视化功能
- [x] 前端生产构建 (Tailwind CSS)
- [x] 前端完整功能 (首页/场景列表/会议大厅/监控)
- [x] systemd 服务配置
- [x] 监控告警配置
- [x] Phase 11 性能优化 (100 会议 0.09s)

---

## 一、项目定义

### 1.1 核心理念

**任何人 + 任何 Agent + 任何场景 + 任何产出物**

- 用户定义场景（YAML）→ 平台调度 Agent → 产出物
- Agent 像"演员"，用户是"导演"

### 1.2 产品形态

**命令行 + Web UI**

- 命令行：`meeting run scene.yaml`
- Web UI：可视化配置、执行、监控

### 1.3 MVP 范围

**v0.1 = 单 Agent + 用户对话**
**v0.5 = 多 Agent 讨论**
**v1.0 = 完整五阶段**

---

## 二、技术架构

### 2.1 三层架构

```
┌─────────────────────────────────────────────┐
│          用户界面 (Web UI / CLI)           │
├─────────────────────────────────────────────┤
│           场景定义层 (YAML Parser)          │
├─────────────────────────────────────────────┤
│           会议引擎 (Meeting Engine)         │
│  ┌─────────┬─────────┬─────────┬─────────┐  │
│  │ Moderator│ Discuss │ Output  │ Check   │  │
│  └─────────┴─────────┴─────────┴─────────┘  │
├─────────────────────────────────────────────┤
│           Agent 适配层 (Executor)           │
│  ┌─────────┬─────────┬─────────┬─────────┐  │
│  │  Claude │   GPT   │  Hermes │ Custom  │  │
│  └─────────┴─────────┴─────────┴─────────┘  │
└─────────────────────────────────────────────┘
```

### 2.2 核心模块

| 模块 | 职责 | 关键类 |
|------|------|--------|
| MeetingEngine | 会议生命周期管理 | Meeting, Stage, Round |
| SceneParser | YAML 场景解析 | Scene, Role, Flow |
| ExecutorManager | Agent 适配调度 | BaseExecutor, ExecutorRegistry |
| OutputGenerator | 产出物生成 | MarkdownGenerator, CodeGenerator |
| StateManager | 状态持久化 | MeetingStore, PostgreSQL |

### 2.3 技术栈

- **后端**: Python 3.11+ + FastAPI + uvicorn
- **前端**: React 18 + TypeScript + antd + Monaco Editor
- **存储**: PostgreSQL + YAML
- **实时通信**: WebSocket
- **包管理**: uv (Python), npm (Node.js)

---

## 三、数据模型

### 3.1 核心数据结构

```python
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime

# 枚举类型
class StageType(str, Enum):
    REQUIREMENT = "requirement"  # 需求分析
    DESIGN = "design"          # 设计方案
    REVIEW = "review"          # 评审讨论
    DECISION = "decision"      # 决策确认
    OUTPUT = "output"          # 产出物

class ConsensusMethod(str, Enum):
    KEYWORD = "keyword"        # 关键词检测
    MODERATOR = "moderator"    # 主持人判断
    VOTE = "vote"              # 投票表决

class MessageRole(str, Enum):
    USER = "user"              # 用户
    AGENT = "agent"            # AI Agent
    MODERATOR = "moderator"    # 主持人

# 场景定义
class Role(BaseModel):
    id: str
    name: str
    description: str
    executor: str              # Agent 适配器名称
    model: Optional[str] = None  # 可选模型覆盖

class Stage(BaseModel):
    id: str
    type: StageType
    roles: List[str]           # 参与角色 ID 列表
    moderator: str             # 主持人角色 ID
    max_rounds: int = 5
    consensus: ConsensusMethod = ConsensusMethod.MODERATOR
    output_format: str = "markdown"

class Scene(BaseModel):
    name: str
    description: str
    version: str
    roles: List[Role]
    stages: List[Stage]
    variables: Dict[str, Any] = {}

# 会议实例
class Message(BaseModel):
    id: str
    role: MessageRole
    role_id: str               # 角色 ID
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class Round(BaseModel):
    round_num: int
    messages: List[Message]
    summary: Optional[str] = None

class MeetingStage(BaseModel):
    stage_id: str
    status: str                # pending|running|completed|failed
    rounds: List[Round]
    consensus_reached: bool = False
    output: Optional[str] = None

class Meeting(BaseModel):
    id: str
    scene_name: str
    status: str                # created|running|completed|failed
    current_stage: int
    stages: List[MeetingStage]
    created_at: datetime
    updated_at: datetime
    variables: Dict[str, Any] = {}
```

### 3.2 数据库表结构

```sql
-- 场景定义
CREATE TABLE scenes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    yaml_content TEXT,
    version VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 会议实例
CREATE TABLE meetings (
    id VARCHAR(50) PRIMARY KEY,
    scene_id VARCHAR(50) REFERENCES scenes(id),
    status VARCHAR(20) DEFAULT 'created',
    current_stage INT DEFAULT 0,
    variables JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 会议阶段
CREATE TABLE meeting_stages (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR(50) REFERENCES meetings(id),
    stage_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    output TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 讨论消息
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    meeting_id VARCHAR(50) REFERENCES meetings(id),
    stage_id VARCHAR(50),
    round_num INT,
    role VARCHAR(20),
    role_id VARCHAR(50),
    content TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_messages_meeting ON messages(meeting_id);
CREATE INDEX idx_messages_stage ON messages(meeting_id, stage_id);
```

---

## 四、API 设计

### 4.1 REST API

```yaml
# 场景管理
GET    /api/scenes              # 列表
GET    /api/scenes/{id}         # 详情
POST   /api/scenes              # 创建
PUT    /api/scenes/{id}         # 更新
DELETE /api/scenes/{id}         # 删除

# 会议管理
GET    /api/meetings            # 列表
GET    /api/meetings/{id}       # 详情
POST   /api/meetings            # 创建会议
POST   /api/meetings/{id}/start # 启动会议
POST   /api/meetings/{id}/pause # 暂停
POST   /api/meetings/{id}/resume # 恢复

# 用户介入
POST   /api/meetings/{id}/intervene      # 介入反馈
POST   /api/meetings/{id}/approve        # 批准阶段
POST   /api/meetings/{id}/reject         # 驳回阶段

# 产出物
GET    /api/meetings/{id}/output         # 获取产出物
```

### 4.2 WebSocket API

```javascript
// 连接
ws://localhost:18502/ws/meetings/{meeting_id}

// 消息类型
{
  "type": "message",          // Agent 发言
  "data": {
    "role_id": "product_manager",
    "content": "..."
  }
}

{
  "type": "stage_update",     // 阶段状态更新
  "data": {
    "stage_id": "design",
    "status": "completed"
  }
}

{
  "type": "consensus",        // 共识达成
  "data": {
    "stage_id": "design",
    "summary": "..."
  }
}

{
  "type": "output",           // 产出物
  "data": {
    "format": "markdown",
    "content": "..."
  }
}
```

---

## 五、场景 YAML 定义格式

### 5.1 完整示例

```yaml
name: "代码开发会议"
description: "多角色协作完成代码开发"
version: "1.0"

# 变量定义（可在场景中引用）
variables:
  project_name: "用户管理系统"
  tech_stack: "Python + FastAPI + React"
  deadline: "2026-05-15"

# 角色定义
roles:
  - id: product_manager
    name: "产品经理"
    description: "负责需求分析和产品设计"
    executor: "claude"
    model: "claude-3-opus"

  - id: architect
    name: "架构师"
    description: "负责技术方案设计"
    executor: "claude"
    model: "claude-3-opus"

  - id: developer
    name: "开发工程师"
    description: "负责代码实现"
    executor: "claude_code"
    # model: 不设置，使用默认

  - id: reviewer
    name: "代码审查员"
    description: "负责代码质量和设计评审"
    executor: "openai"
    model: "gpt-4-turbo"

# 阶段流程
stages:
  - id: requirement
    type: requirement
    roles: [product_manager]
    moderator: product_manager
    max_rounds: 3
    consensus: keyword
    output_format: markdown

  - id: design
    type: design
    roles: [architect, product_manager]
    moderator: architect
    max_rounds: 5
    consensus: moderator
    output_format: markdown

  - id: review
    type: review
    roles: [reviewer, architect, developer]
    moderator: reviewer
    max_rounds: 5
    consensus: vote
    output_format: markdown

  - id: decision
    type: decision
    roles: [product_manager, architect]
    moderator: product_manager
    max_rounds: 3
    consensus: keyword
    output_format: markdown

  - id: output
    type: output
    roles: [developer]
    moderator: product_manager
    max_rounds: 1
    output_format: code
```

### 5.2 YAML Schema 规范

```yaml
# 必填字段
name: string          # 场景名称
description: string   # 场景描述
version: string       # 版本号
roles: array          # 角色列表
stages: array         # 阶段列表

# 角色字段
roles[].id: string            # 唯一 ID
roles[].name: string          # 显示名称
roles[].description: string   # 角色描述
roles[].executor: string      # Agent 适配器名称
roles[].model: string?        # 可选模型覆盖

# 阶段字段
stages[].id: string                   # 唯一 ID
stages[].type: enum                   # requirement|design|review|decision|output
stages[].roles: array<string>         # 参与角色 ID
stages[].moderator: string            # 主持人角色 ID
stages[].max_rounds: int              # 最大讨论轮次（默认 5）
stages[].consensus: enum              # keyword|moderator|vote（默认 moderator）
stages[].output_format: enum          # markdown|code|json（默认 markdown）
```

---

## 六、会议引擎核心逻辑

### 6.1 状态机

```
Meeting: created → running → completed/failed
Stage:   pending → running → completed/failed
Round:   (自动递增)
```

### 6.2 核心流程

```python
async def run_meeting(meeting_id: str):
    """运行会议的主流程"""
    meeting = load_meeting(meeting_id)
    scene = load_scene(meeting.scene_name)

    for stage_config in scene.stages:
        # 1. 初始化阶段
        stage = MeetingStage(stage_id=stage_config.id, status='running')

        # 2. 循环讨论
        for round_num in range(stage_config.max_rounds):
            # 2.1 依次让每个参与角色发言
            for role_id in stage_config.roles:
                role = get_role(scene, role_id)
                prompt = build_prompt(meeting, stage, role, round_num)
                response = await call_agent(role.executor, role.model, prompt)

                # 记录消息
                message = Message(
                    role='agent',
                    role_id=role_id,
                    content=response
                )
                stage.rounds[-1].messages.append(message)

                # 推送实时消息
                await ws_manager.broadcast(meeting_id, {
                    'type': 'message',
                    'data': message.dict()
                })

            # 2.2 检查共识
            if check_consensus(stage_config.consensus, stage):
                stage.consensus_reached = True
                break

            # 2.3 等待用户介入（如果有）
            user_feedback = await wait_for_user_input(meeting_id)
            if user_feedback:
                # 将用户反馈注入下一轮
                stage.rounds[-1].messages.append(Message(
                    role='user',
                    role_id='user',
                    content=user_feedback
                ))

        # 3. 生成阶段产出物
        stage.output = generate_output(stage, stage_config.output_format)
        stage.status = 'completed'

        # 4. 推送阶段完成
        await ws_manager.broadcast(meeting_id, {
            'type': 'stage_update',
            'data': {'stage_id': stage_config.id, 'status': 'completed'}
        })

        # 5. 等待用户批准（可选）
        if not await wait_for_approval(meeting_id, stage_config.id):
            # 用户驳回，重新执行当前阶段
            continue

    # 会议完成
    meeting.status = 'completed'
    meeting.output = generate_final_output(meeting)
```

### 6.3 共识检测算法

```python
def check_consensus(method: ConsensusMethod, stage: MeetingStage) -> bool:
    """检查是否达成共识"""

    if method == ConsensusMethod.KEYWORD:
        # 关键词检测：所有发言中包含"同意"/"赞成"
        last_round = stage.rounds[-1]
        agent_messages = [m for m in last_round.messages if m.role == 'agent']
        return all(
            '同意' in m.content or '赞成' in m.content or '认可' in m.content
            for m in agent_messages
        )

    elif method == ConsensusMethod.MODERATOR:
        # 主持人判断：主持人在总结中表示共识
        last_round = stage.rounds[-1]
        moderator_msg = [m for m in last_round.messages if m.role_id == stage.moderator]
        if moderator_msg:
            return '共识' in moderator_msg[-1].content or '达成一致' in moderator_msg[-1].content
        return False

    elif method == ConsensusMethod.VOTE:
        # 投票表决：统计同意票数
        last_round = stage.rounds[-1]
        agree_count = sum(1 for m in last_round.messages if '同意' in m.content)
        total_count = len([m for m in last_round.messages if m.role == 'agent'])
        return agree_count > total_count / 2

    return False
```

---

## 七、Agent 适配层

### 7.1 统一接口

```python
from abc import ABC, abstractmethod
from typing import Optional

class BaseMeetingAgent(ABC):
    """会议 Agent 基类"""

    @abstractmethod
    async def speak(
        self,
        context: str,           # 当前上下文（历史消息）
        role_prompt: str,       # 角色提示词
        instruction: str,       # 当轮指令
        variables: dict         # 场景变量
    ) -> str:
        """Agent 发言"""
        pass

    @abstractmethod
    async def summarize(
        self,
        messages: list,         # 讨论消息列表
        instruction: str        # 总结指令
    ) -> str:
        """总结讨论"""
        pass

    @abstractmethod
    async def judge_consensus(
        self,
        messages: list,         # 讨论消息列表
        criteria: str           # 共识标准
    ) -> tuple[bool, str]:
        """判断是否达成共识，返回 (是否共识, 理由)"""
        pass
```

### 7.2 内置适配器

| 适配器 | 用途 | 实现方式 |
|--------|------|----------|
| claude | Claude API | anthropic SDK |
| openai | OpenAI API | openai SDK |
| hermes | Hermes Agent | hermes CLI + subprocess |
| claude_code | Claude Code | claude CLI + subprocess |
| custom | 自定义 | 用户编写 Python 类 |

### 7.3 适配器注册

```yaml
# config/adapters.yaml
adapters:
  claude:
    class: "meeting.adapters.claude.ClaudeAdapter"
    config:
      api_key: "${ANTHROPIC_API_KEY}"
      default_model: "claude-3-opus"

  openai:
    class: "meeting.adapters.openai.OpenAIAdapter"
    config:
      api_key: "${OPENAI_API_KEY}"
      default_model: "gpt-4-turbo"

  hermes:
    class: "meeting.adapters.hermes.HermesAdapter"
    config:
      cli_path: "hermes"
      workspace: "/tmp/meeting-workspace"
```

---

## 八、用户介入机制

### 8.1 介入方式

1. **文字反馈**：用户输入文字，注入到下一轮讨论
2. **批准/驳回**：阶段完成后，用户选择是否继续
3. **手动停止**：随时停止会议

### 8.2 实现方式

```python
async def wait_for_user_input(meeting_id: str, timeout: int = 300) -> Optional[str]:
    """等待用户输入，超时返回 None"""
    # WebSocket 监听用户消息
    # 或 CLI 模式下 stdin 等待
    pass

async def wait_for_approval(meeting_id: str, stage_id: str) -> bool:
    """等待用户批准阶段，超时自动批准"""
    # 推送通知
    await notify_user(meeting_id, f"阶段 {stage_id} 完成，请确认")
    # 等待用户响应
    response = await wait_for_user_action(meeting_id, timeout=600)
    return response == 'approve'
```

---

## 九、产出物生成

### 9.1 产出物格式

| 格式 | 说明 | 生成方式 |
|------|------|----------|
| markdown | 文档/设计/需求 | LLM 总结 |
| code | 代码实现 | Claude Code 生成 |
| json | 结构化数据 | LLM 提取 |
| mermaid | 流程图/架构图 | LLM 生成 |

### 9.2 产出物存储

```
/meetings/{meeting_id}/
  ├── requirement.md        # 需求文档
  ├── design.md            # 设计文档
  ├── review.md            # 评审记录
  ├── decision.md          # 决策文档
  ├── output/              # 产出物目录
  │   ├── main.py          # 代码
  │   ├── README.md        # 说明文档
  │   └── ...
  └── meeting.log          # 完整讨论日志
```

---

## 十、Web UI 设计

### 10.1 页面结构

| 页面 | 功能 |
|------|------|
| 场景列表 | 浏览/搜索/创建场景 |
| 场景编辑器 | YAML 编辑 + 实时预览 |
| 会议大厅 | 创建/启动/管理会议 |
| 会议监控 | 实时查看讨论过程 |
| 产出物查看 | 查看/下载产出物 |

### 10.2 会议监控界面

```
┌─────────────────────────────────────────────────────────────────┐
│  会议：代码开发会议        状态：运行中    阶段：设计 (2/5)    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [产品经理] 我认为用户管理模块需要支持以下功能：              │
│  1. 用户注册（邮箱/手机号）                                    │
│  2. 用户登录（密码/验证码）                                    │
│  3. 个人信息管理                                               │
│  4. 权限管理                                                   │
│                                                                 │
│  [架构师] 同意产品经理的需求，技术方案如下：                  │
│  - 后端：FastAPI + SQLAlchemy                                   │
│  - 前端：React + antd                                           │
│  - 数据库：PostgreSQL                                           │
│  - 认证：JWT                                                    │
│                                                                 │
│  [产品经理] 同意该方案，达成共识。                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [用户输入] _________________________________________________  │
│  [发送] [批准阶段] [驳回阶段] [停止会议]                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 十一、项目结构

```
ai-collaboration-meeting/
├── backend/
│   ├── meeting/
│   │   ├── __init__.py
│   │   ├── engine.py          # 会议引擎
│   │   ├── scene_parser.py    # 场景解析
│   │   ├── adapters/          # Agent 适配器
│   │   │   ├── base.py
│   │   │   ├── claude.py
│   │   │   ├── openai.py
│   │   │   └── ...
│   │   ├── models.py          # 数据模型
│   │   ├── store.py           # 存储层
│   │   └── ws_manager.py      # WebSocket 管理
│   ├── api/
│   │   ├── __init__.py
│   │   ├── scenes.py
│   │   ├── meetings.py
│   │   └── ws.py
│   ├── config/
│   │   ├── adapters.yaml
│   │   └── settings.py
│   ├── main.py                # FastAPI 入口
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── SceneList.tsx
│   │   │   ├── SceneEditor.tsx
│   │   │   ├── MeetingHall.tsx
│   │   │   └── MeetingMonitor.tsx
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── StageProgress.tsx
│   │   │   └── OutputViewer.tsx
│   │   └── services/
│   │       ├── api.ts
│   │       └── ws.ts
│   ├── package.json
│   └── vite.config.ts
├── scenes/                    # 内置场景模板
│   ├── code-development.yaml
│   ├── content-creation.yaml
│   └── business-analysis.yaml
├── docs/
│   ├── API.md
│   ├── SCENE_FORMAT.md
│   └── ADAPTERS.md
├── PLAN.md                    # 本文件
└── README.md
```

---

## 十二、开发阶段

### Phase 1: 基础框架（1 周）

| 任务 | 说明 |
|------|------|
| P1.1 | 项目初始化（Python + React） |
| P1.2 | 数据模型定义（Pydantic） |
| P1.3 | 场景 YAML 解析器 |
| P1.4 | 基础 API（场景 CRUD） |

### Phase 2: 会议引擎（2 周）

| 任务 | 说明 |
|------|------|
| P2.1 | 会议引擎核心（状态机、流程控制） |
| P2.2 | 共识检测算法 |
| P2.3 | WebSocket 实时通信 |
| P2.4 | Agent 适配层基础接口 |

### Phase 3: Agent 适配（1 周）

| 任务 | 说明 |
|------|------|
| P3.1 | Claude 适配器 |
| P3.2 | OpenAI 适配器 |
| P3.3 | Hermes 适配器 |
| P3.4 | Claude Code 适配器 |

### Phase 4: 用户介入（1 周）

| 任务 | 说明 |
|------|------|
| P4.1 | 用户反馈注入机制 |
| P4.2 | 阶段批准/驳回 |
| P4.3 | 会议暂停/恢复 |

### Phase 5: Web UI（2 周）

| 任务 | 说明 |
|------|------|
| P5.1 | 场景列表/编辑器 |
| P5.2 | 会议监控界面 |
| P5.3 | 产出物查看器 |
| P5.4 | 实时消息流 |

### Phase 6: 产出物生成（1 周）

| 任务 | 说明 |
|------|------|
| P6.1 | Markdown 文档生成 |
| P6.2 | 代码生成（Claude Code） |
| P6.3 | 产出物存储/下载 |

### Phase 7: 测试与优化（1 周）

| 任务 | 说明 |
|------|------|
| P7.1 | 单元测试 |
| P7.2 | 集成测试 |
| P7.3 | 性能优化 |
| P7.4 | 文档完善 |

**总工期**: 9 周

---

## 十三、MVP 定义

### v0.1（第 2 周结束）

- ✅ 单 Agent + 用户对话
- ✅ 基础场景 YAML 解析
- ✅ WebSocket 实时消息
- ✅ 命令行执行

### v0.5（第 4 周结束）

- ✅ 多 Agent 讨论
- ✅ 共识检测
- ✅ 用户介入
- ✅ 基础 Web UI

### v1.0（第 9 周结束）

- ✅ 完整五阶段流程
- ✅ 多 Agent 适配器
- ✅ 产出物生成
- ✅ 场景模板库

---

## 十四、与 dag-workflow-engine 的关系

| 方面 | dag-workflow-engine | AI 协作会议 |
|------|---------------------|-------------|
| 核心模型 | DAG 工作流 | 多 Agent 讨论 |
| 执行方式 | 节点串行/并行 | 角色轮流发言 |
| 用户介入 | 无 | 随时介入 |
| 共识机制 | 无 | 关键词/主持人/投票 |
| 产出物 | 节点输出 | 文档/代码/决策 |

**复用部分**：
- Executor 插件系统（可参考）
- FastAPI + React 架构（可参考）
- WebSocket 实时通信（可参考）

**不复用部分**：
- 会议引擎（全新开发）
- 场景 YAML 格式（全新设计）
- 共识算法（全新开发）

---

## 十五、预设场景模板

### 15.1 代码开发场景

```yaml
name: "代码开发"
roles: [产品经理, 架构师, 开发工程师, 代码审查员]
stages: [需求分析, 技术设计, 代码审查, 决策确认, 代码输出]
```

### 15.2 内容创作场景

```yaml
name: "内容创作"
roles: [策划, 作者, 编辑, 读者代表]
stages: [主题讨论, 内容创作, 审稿润色, 最终定稿]
```

### 15.3 商业分析场景

```yaml
name: "商业分析"
roles: [分析师, 市场专家, 财务专家, 决策者]
stages: [数据收集, 市场分析, 财务分析, 综合报告]
```

---

## 十六、错误处理机制

### 16.1 Agent 调用失败处理

```python
class AgentCallError(Exception):
    """Agent 调用异常"""
    pass

async def call_agent_with_retry(
    executor: str,
    model: Optional[str],
    prompt: str,
    max_retries: int = 3,
    timeout: int = 120
) -> str:
    """带重试的 Agent 调用"""
    for attempt in range(max_retries):
        try:
            # 1. 调用 Agent
            response = await asyncio.wait_for(
                call_agent(executor, model, prompt),
                timeout=timeout
            )
            return response

        except asyncio.TimeoutError:
            logger.warning(f"Agent {executor} 超时 (attempt {attempt + 1}/{max_retries})")
            if attempt == max_retries - 1:
                raise AgentCallError(f"Agent {executor} 超时，已重试 {max_retries} 次")

        except Exception as e:
            logger.error(f"Agent {executor} 调用失败: {e}")
            if attempt == max_retries - 1:
                raise AgentCallError(f"Agent {executor} 调用失败: {e}")

            # 指数退避
            await asyncio.sleep(2 ** attempt)

    raise AgentCallError(f"Agent {executor} 调用失败")
```

### 16.2 会议异常恢复

```python
async def handle_meeting_error(meeting_id: str, error: Exception):
    """会议异常处理"""
    meeting = await load_meeting(meeting_id)

    # 1. 记录错误
    await save_error_log(meeting_id, error)

    # 2. 通知用户
    await ws_manager.broadcast(meeting_id, {
        'type': 'error',
        'data': {
            'message': str(error),
            'stage': meeting.current_stage,
            'recoverable': True
        }
    })

    # 3. 尝试恢复
    if isinstance(error, AgentCallError):
        # Agent 调用失败 → 跳过当前角色，继续下一个
        return 'skip_and_continue'
    elif isinstance(error, SceneParseError):
        # 场景解析失败 → 通知用户修改场景
        return 'notify_user'
    else:
        # 未知错误 → 暂停会议
        return 'pause'
```

### 16.3 错误类型分类

| 错误类型 | 处理策略 | 用户影响 |
|----------|----------|----------|
| AgentTimeout | 重试 → 跳过 → 暂停 | 等待或跳过 |
| AgentCallError | 重试 → 换 Agent → 暂停 | 等待或切换 |
| SceneParseError | 通知用户修改 | 需修改场景 |
| ConsensusTimeout | 延长轮次 → 强制共识 | 继续或停止 |
| UserInputTimeout | 自动继续 | 跳过介入 |

---

## 十七、会话状态持久化

### 17.1 状态保存策略

```python
class MeetingStatePersistence:
    """会议状态持久化"""

    async def save_checkpoint(self, meeting_id: str):
        """保存检查点"""
        meeting = await load_meeting(meeting_id)
        checkpoint = {
            'meeting_id': meeting_id,
            'status': meeting.status,
            'current_stage': meeting.current_stage,
            'stages': [stage.dict() for stage in meeting.stages],
            'variables': meeting.variables,
            'timestamp': datetime.now().isoformat()
        }
        await save_to_db('meeting_checkpoints', checkpoint)

    async def restore_from_checkpoint(self, meeting_id: str) -> Optional[Meeting]:
        """从检查点恢复"""
        checkpoint = await load_latest_checkpoint(meeting_id)
        if not checkpoint:
            return None

        # 重建会议状态
        meeting = Meeting(
            id=checkpoint['meeting_id'],
            status='running',
            current_stage=checkpoint['current_stage'],
            stages=[MeetingStage(**s) for s in checkpoint['stages']],
            variables=checkpoint['variables']
        )
        return meeting

    async def save_on_stage_complete(self, meeting_id: str, stage_id: str):
        """阶段完成时保存"""
        await self.save_checkpoint(meeting_id)
        logger.info(f"Checkpoint saved for meeting {meeting_id} at stage {stage_id}")
```

### 17.2 中断恢复流程

```
会议中断（网络/服务器/用户）
    ↓
保存检查点（当前状态）
    ↓
用户重新连接/重启服务
    ↓
检查未完成会议
    ↓
询问用户：恢复/重新开始/取消
    ↓
从检查点恢复会议
```

---

## 十八、CLI 命令设计

### 18.1 命令结构

```bash
# 场景管理
meeting scene list                    # 列出所有场景
meeting scene show <scene_id>         # 查看场景详情
meeting scene create <file.yaml>      # 创建场景
meeting scene validate <file.yaml>    # 验证 YAML 格式
meeting scene export <scene_id>       # 导出场景

# 会议管理
meeting run <scene_id>                # 运行会议（交互模式）
meeting run <scene_id> --auto         # 自动模式（无用户介入）
meeting run <scene_id> --resume       # 恢复中断的会议
meeting list                          # 列出所有会议
meeting show <meeting_id>             # 查看会议详情
meeting stop <meeting_id>             # 停止会议

# 产出物
meeting output <meeting_id>           # 查看产出物
meeting output <meeting_id> --format markdown  # 导出为 Markdown
meeting output <meeting_id> --download         # 下载产出物

# 配置
meeting config show                   # 查看配置
meeting config set <key> <value>      # 设置配置
meeting adapter list                  # 列出可用适配器
meeting adapter test <adapter_id>     # 测试适配器连接
```

### 18.2 交互模式示例

```bash
$ meeting run code-development

🚀 启动会议：代码开发会议
📋 阶段 1/5：需求分析

[产品经理] 分析用户需求...

────────────────────────────────────────
💬 轮次 1/3

[产品经理] 用户管理系统需要以下功能：
1. 用户注册（邮箱/手机号）
2. 用户登录（密码/验证码）
3. 个人信息管理
4. 权限管理

────────────────────────────────────────
📝 输入您的反馈（按 Enter 继续，输入 'skip' 跳过）：
> 需要支持第三方登录（微信/GitHub）

✅ 反馈已记录，继续讨论...

[产品经理] 收到反馈，补充第三方登录功能...

────────────────────────────────────────
🎯 共识达成！

📋 阶段 2/5：技术设计
...
```

---

## 十九、Agent 提示词模板

### 19.1 系统提示词模板

```python
SYSTEM_PROMPT_TEMPLATE = """
你是一个 AI 协作会议的参与者。

## 你的角色
- 角色名称：{role_name}
- 角色描述：{role_description}
- 当前阶段：{stage_name} ({stage_type})

## 会议上下文
- 会议主题：{meeting_topic}
- 当前轮次：{round_num}/{max_rounds}
- 已达成共识：{consensus_summary}

## 讨论历史
{discussion_history}

## 你的任务
{instruction}

## 输出要求
- 用中文回复
- 结构化输出（使用 Markdown）
- 明确表达立场（同意/反对/建议）
- 如有反对意见，说明理由和替代方案
"""

def build_prompt(
    meeting: Meeting,
    stage: MeetingStage,
    role: Role,
    round_num: int
) -> str:
    """构建 Agent 提示词"""
    # 获取历史消息
    history = []
    for s in meeting.stages:
        for r in s.rounds:
            for m in r.messages:
                history.append(f"[{m.role_id}] {m.content}")

    # 构建提示词
    return SYSTEM_PROMPT_TEMPLATE.format(
        role_name=role.name,
        role_description=role.description,
        stage_name=stage.stage_id,
        stage_type=stage.stage_type,
        meeting_topic=meeting.variables.get('topic', '未指定'),
        round_num=round_num,
        max_rounds=stage.max_rounds,
        consensus_summary=stage.output or '无',
        discussion_history='\n'.join(history[-10:]),  # 最近 10 条
        instruction=get_stage_instruction(stage.stage_type, round_num)
    )
```

### 19.2 阶段指令模板

```python
STAGE_INSTRUCTIONS = {
    'requirement': {
        0: "请分析用户需求，列出核心功能点。",
        1: "根据讨论补充需求细节，评估优先级。",
        2: "总结需求，确认是否达成共识。"
    },
    'design': {
        0: "请设计技术方案，包括架构、技术栈、模块划分。",
        1: "评审技术方案，提出改进建议。",
        2: "确认技术方案，评估可行性。"
    },
    'review': {
        0: "请评审代码质量、设计合理性、安全性。",
        1: "针对评审意见讨论解决方案。",
        2: "确认修复方案，达成共识。"
    },
    'decision': {
        0: "综合讨论结果，提出最终决策建议。",
        1: "评估决策的可行性和风险。",
        2: "确认最终决策，形成共识。"
    },
    'output': {
        0: "根据讨论结果，生成最终产出物。"
    }
}
```

---

## 二十、阶段间数据传递

### 20.1 数据传递机制

```python
class StageDataTransfer:
    """阶段间数据传递"""

    def get_stage_output(self, meeting: Meeting, stage_id: str) -> Optional[str]:
        """获取指定阶段的输出"""
        for stage in meeting.stages:
            if stage.stage_id == stage_id and stage.status == 'completed':
                return stage.output
        return None

    def build_stage_context(self, meeting: Meeting, current_stage_idx: int) -> str:
        """构建当前阶段的上下文（包含之前阶段的输出）"""
        context_parts = []

        for i in range(current_stage_idx):
            stage = meeting.stages[i]
            if stage.status == 'completed' and stage.output:
                context_parts.append(f"## {stage.stage_id} 阶段输出\n{stage.output}")

        return '\n\n'.join(context_parts)

    def inject_previous_output(self, prompt: str, previous_output: str) -> str:
        """将上阶段输出注入当前提示词"""
        return f"{prompt}\n\n## 上阶段输出\n{previous_output}"
```

### 20.2 变量替换机制

```python
import re

class VariableResolver:
    """变量替换"""

    def resolve(self, text: str, variables: dict) -> str:
        """替换 ${variable} 格式的变量"""
        def replace_var(match):
            var_name = match.group(1)
            return str(variables.get(var_name, match.group(0)))

        return re.sub(r'\$\{(\w+)\}', replace_var, text)

# 使用示例
variables = {
    'project_name': '用户管理系统',
    'tech_stack': 'Python + FastAPI + React',
    'deadline': '2026-05-15'
}

prompt = "请为 ${project_name} 设计技术方案，使用 ${tech_stack}，截止日期 ${deadline}"
resolved = resolver.resolve(prompt, variables)
# → "请为 用户管理系统 设计技术方案，使用 Python + FastAPI + React，截止日期 2026-05-15"
```

---

## 二十一、并发控制与发言顺序

### 21.1 发言顺序策略

```python
class SpeakingOrderStrategy:
    """发言顺序策略"""

    @staticmethod
    def sequential(roles: List[str]) -> List[str]:
        """顺序发言（默认）"""
        return roles

    @staticmethod
    def moderator_first(roles: List[str], moderator: str) -> List[str]:
        """主持人先发言"""
        others = [r for r in roles if r != moderator]
        return [moderator] + others

    @staticmethod
    def random(roles: List[str]) -> List[str]:
        """随机顺序"""
        import random
        shuffled = roles.copy()
        random.shuffle(shuffled)
        return shuffled

    @staticmethod
    def priority(roles: List[str], priorities: dict) -> List[str]:
        """按优先级排序"""
        return sorted(roles, key=lambda r: priorities.get(r, 0), reverse=True)
```

### 21.2 并发限制

```python
# 同一时间只允许一个会议运行（防止 API 限流）
meeting_semaphore = asyncio.Semaphore(1)

async def run_meeting_with_limit(meeting_id: str):
    """带并发限制的会议运行"""
    async with meeting_semaphore:
        await run_meeting(meeting_id)
```

---

## 二十二、日志与监控

### 22.1 日志结构

```python
import logging
from pythonjsonlogger import jsonlogger

# 配置 JSON 日志
handler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    fmt='%(asctime)s %(name)s %(levelname)s %(message)s',
    rename_fields={'levelname': 'level', 'asctime': 'timestamp'}
)
handler.setFormatter(formatter)

logger = logging.getLogger('meeting')
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# 日志示例
logger.info("Agent 发言", extra={
    'meeting_id': 'meeting-123',
    'stage_id': 'design',
    'role_id': 'architect',
    'round_num': 2,
    'content_length': 150
})
```

### 22.2 监控指标

| 指标 | 说明 | 告警阈值 |
|------|------|----------|
| meeting_duration | 会议时长 | > 30 分钟 |
| agent_response_time | Agent 响应时间 | > 60 秒 |
| consensus_rounds | 达成共识轮次 | > 5 轮 |
| error_rate | 错误率 | > 10% |
| active_meetings | 活跃会议数 | > 10 |

### 22.3 日志文件结构

```
/logs/
├── meetings/
│   ├── meeting-123.log        # 单次会议日志
│   └── meeting-456.log
├── agents/
│   ├── claude.log             # Agent 调用日志
│   └── openai.log
└── errors/
    └── errors.log             # 错误日志
```

---

## 二十三、部署方案

### 23.1 Docker 部署

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "18502:18502"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/meeting
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "18501:80"
    depends_on:
      - backend

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=meeting
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 23.2 systemd 服务

```ini
# /etc/systemd/system/meeting-backend.service
[Unit]
Description=AI Meeting Backend
After=network.target postgresql.service

[Service]
Type=simple
User=meeting
WorkingDirectory=/opt/meeting/backend
ExecStart=/opt/meeting/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 18502
Restart=always
RestartSec=5
Environment=DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting

[Install]
WantedBy=multi-user.target
```

### 23.3 环境变量

```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
LOG_LEVEL=INFO
MAX_CONCURRENT_MEETINGS=5
DEFAULT_TIMEOUT=120
```

---

## 二十四、测试策略

### 24.1 测试金字塔

```
        /\
       /  \      E2E 测试 (10%)
      /    \     - 完整会议流程
     /------\    - 用户介入测试
    /        \   集成测试 (30%)
   /          \  - API 测试
  /------------\ - Agent 适配器测试
 /              \ 单元测试 (60%)
/                \- 数据模型测试
------------------ - 共识算法测试
```

### 24.2 测试用例

```python
# tests/test_consensus.py
import pytest
from meeting.engine import check_consensus

def test_keyword_consensus():
    """测试关键词共识检测"""
    stage = MeetingStage(
        stage_id='design',
        rounds=[Round(messages=[
            Message(role='agent', role_id='architect', content='同意该方案'),
            Message(role='agent', role_id='pm', content='赞成，我也同意')
        ])]
    )
    assert check_consensus('keyword', stage) == True

def test_keyword_consensus_no_agreement():
    """测试关键词共识检测 - 未达成"""
    stage = MeetingStage(
        stage_id='design',
        rounds=[Round(messages=[
            Message(role='agent', role_id='architect', content='同意该方案'),
            Message(role='agent', role_id='pm', content='我反对，需要修改')
        ])]
    )
    assert check_consensus('keyword', stage) == False

def test_moderator_consensus():
    """测试主持人共识检测"""
    stage = MeetingStage(
        stage_id='design',
        moderator='architect',
        rounds=[Round(messages=[
            Message(role='agent', role_id='architect', content='经过讨论，我们达成共识')
        ])]
    )
    assert check_consensus('moderator', stage) == True
```

### 24.3 Mock Agent

```python
# tests/mock_agent.py
class MockAgent(BaseMeetingAgent):
    """Mock Agent 用于测试"""

    def __init__(self, responses: List[str]):
        self.responses = responses
        self.call_count = 0

    async def speak(self, context, role_prompt, instruction, variables) -> str:
        response = self.responses[self.call_count % len(self.responses)]
        self.call_count += 1
        return response

    async def summarize(self, messages, instruction) -> str:
        return "Mock 总结"

    async def judge_consensus(self, messages, criteria) -> tuple[bool, str]:
        return True, "Mock 共识"
```

---

## 二十五、技术风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|----------|
| Agent 响应慢 | 高 | 中 | 超时机制 + 异步处理 |
| 共识检测不准确 | 中 | 高 | 多种检测方法 + 人工兜底 |
| 长对话上下文溢出 | 中 | 中 | 消息压缩 + 摘要机制 |
| Agent 适配器兼容性 | 低 | 中 | 统一接口 + 错误处理 |

---

## 二十六、上下文窗口管理

### 26.1 问题场景

单次讨论可能产生 50+ 条消息，总 token 超过 Agent 上下文限制。

### 26.2 截断策略

```python
class ContextManager:
    """上下文窗口管理"""

    # 各模型上下文限制
    MODEL_LIMITS = {
        'claude-3-opus': 200000,
        'gpt-4-turbo': 128000,
        'default': 80000
    }

    def truncate_context(
        self,
        messages: List[Message],
        model: str,
        system_prompt_tokens: int = 2000,
        reserved_tokens: int = 4000  # 预留给输出
    ) -> List[Message]:
        """截断消息以适应上下文窗口"""
        max_tokens = self.MODEL_LIMITS.get(model, self.MODEL_LIMITS['default'])
        available = max_tokens - system_prompt_tokens - reserved_tokens

        # 策略：保留最近 N 条 + 前 2 条（开场）
        recent_messages = messages[-20:]  # 最近 20 条
        opening_messages = messages[:2]   # 前 2 条

        # 计算 token
        total = sum(self.count_tokens(m.content) for m in recent_messages + opening_messages)

        if total > available:
            # 生成摘要替代早期消息
            summary = self.summarize_early_messages(messages[:-20])
            summary_msg = Message(
                role='system',
                role_id='system',
                content=f"[早期讨论摘要]\n{summary}"
            )
            return [summary_msg] + recent_messages

        return opening_messages + recent_messages

    def count_tokens(self, text: str) -> int:
        """估算 token 数（中文约 1.5 字/token，英文约 4 字符/token）"""
        chinese_chars = len([c for c in text if '\u4e00' <= c <= '\u9fff'])
        other_chars = len(text) - chinese_chars
        return int(chinese_chars / 1.5 + other_chars / 4)

    async def summarize_early_messages(self, messages: List[Message]) -> str:
        """用 LLM 总结早期消息"""
        text = '\n'.join([f"[{m.role_id}] {m.content}" for m in messages])
        return await call_agent('claude', None, f"请用 200 字总结以下讨论：\n{text}")
```

### 26.3 每轮发言长度限制

```yaml
# 场景 YAML 中可配置
roles:
  - id: developer
    name: "开发工程师"
    max_output_tokens: 2000    # 单次发言最大 token
    description: "负责代码实现"
```

---

## 二十七、WebSocket 重连机制

### 27.1 前端重连实现

```typescript
// frontend/src/services/ws.ts
class MeetingWebSocket {
  private ws: WebSocket | null = null;
  private meetingId: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // 初始延迟 1s

  constructor(meetingId: string) {
    this.meetingId = meetingId;
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:18502/ws/meetings/${this.meetingId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed', event.code);
      if (!event.wasClean) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnect attempts reached');
      return;
    }

    // 指数退避
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  // 请求缺失消息
  private async fetchMissedMessages() {
    const lastMessageId = this.getLastMessageId();
    const response = await fetch(
      `/api/meetings/${this.meetingId}/messages?after=${lastMessageId}`
    );
    const messages = await response.json();
    messages.forEach(msg => this.onMessage(msg));
  }
}
```

### 27.2 后端消息缓存

```python
class WebSocketManager:
    """WebSocket 管理器（带消息缓存）"""

    def __init__(self):
        self.connections: Dict[str, List[WebSocket]] = {}
        self.message_cache: Dict[str, List[dict]] = {}  # meeting_id -> messages
        self.max_cache_size = 100  # 每个会议缓存最近 100 条

    async def broadcast(self, meeting_id: str, message: dict):
        """广播消息并缓存"""
        # 缓存消息
        if meeting_id not in self.message_cache:
            self.message_cache[meeting_id] = []
        self.message_cache[meeting_id].append({
            **message,
            'id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat()
        })
        # 裁剪缓存
        if len(self.message_cache[meeting_id]) > self.max_cache_size:
            self.message_cache[meeting_id] = self.message_cache[meeting_id][-self.max_cache_size:]

        # 广播给所有连接
        if meeting_id in self.connections:
            for ws in self.connections[meeting_id]:
                await ws.send_json(message)

    async def get_missed_messages(self, meeting_id: str, after_id: str) -> List[dict]:
        """获取指定消息之后的缓存消息"""
        messages = self.message_cache.get(meeting_id, [])
        found = False
        result = []
        for msg in messages:
            if found:
                result.append(msg)
            elif msg.get('id') == after_id:
                found = True
        return result
```

---

## 二十八、阶段回退机制

### 28.1 用户驳回后的回退逻辑

```python
async def handle_stage_rejection(meeting_id: str, stage_id: str, reason: str):
    """处理用户驳回阶段"""
    meeting = await load_meeting(meeting_id)

    # 找到当前阶段
    current_stage = None
    current_idx = -1
    for i, stage in enumerate(meeting.stages):
        if stage.stage_id == stage_id:
            current_stage = stage
            current_idx = i
            break

    if not current_stage:
        raise ValueError(f"Stage {stage_id} not found")

    # 记录驳回原因
    current_stage.rejection_reason = reason
    current_stage.status = 'rejected'

    # 重置阶段状态
    current_stage.rounds = []
    current_stage.consensus_reached = False
    current_stage.output = None
    current_stage.status = 'running'

    # 将驳回原因注入下一轮讨论
    current_stage.rounds.append(Round(
        round_num=0,
        messages=[Message(
            role='user',
            role_id='user',
            content=f"[用户驳回] {reason}\n请根据此反馈重新讨论。"
        )]
    ))

    await save_meeting(meeting)
    return current_stage
```

### 28.2 驳回次数限制

```python
# 防止无限驳回
MAX_REJECTIONS = 3

async def check_rejection_limit(meeting_id: str, stage_id: str) -> bool:
    """检查驳回次数是否超限"""
    meeting = await load_meeting(meeting_id)
    stage = get_stage(meeting, stage_id)
    rejection_count = getattr(stage, 'rejection_count', 0)
    return rejection_count < MAX_REJECTIONS
```

---

## 二十九、API 安全

### 29.1 单用户模式

本项目为单用户使用，无需多用户权限管理。

```python
# 简单的 API Key 验证（防止未授权访问）
API_KEY = os.getenv("MEETING_API_KEY", "default-key")

async def verify_api_key(request: Request):
    """验证 API Key"""
    api_key = request.headers.get("X-API-Key")
    if api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API Key")
    return True
```

### 29.2 Rate Limiting

```python
from fastapi import Request
from collections import defaultdict
import time

class RateLimiter:
    """API 限流器"""

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)

    async def check(self, request: Request):
        """检查请求频率"""
        client_ip = request.client.host
        now = time.time()

        # 清理过期记录
        self.requests[client_ip] = [
            t for t in self.requests[client_ip]
            if now - t < 60
        ]

        # 检查限制
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        # 记录请求
        self.requests[client_ip].append(now)

rate_limiter = RateLimiter(requests_per_minute=60)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    await rate_limiter.check(request)
    return await call_next(request)
```

---

## 三十、场景继承与组合

### 30.1 场景继承

```yaml
# 基础场景
name: "base-code-development"
description: "代码开发基础场景"
version: "1.0"
roles:
  - id: developer
    name: "开发工程师"
    executor: "claude_code"
stages:
  - id: output
    type: output
    roles: [developer]
    max_rounds: 1

---
# 继承场景
name: "full-stack-development"
description: "全栈开发场景"
inherits: "base-code-development"  # 继承基础场景
version: "1.0"

# 新增角色
roles:
  - id: frontend_dev
    name: "前端工程师"
    executor: "claude_code"
  - id: backend_dev
    name: "后端工程师"
    executor: "claude_code"

# 新增阶段
stages:
  - id: frontend_design
    type: design
    roles: [frontend_dev]
    moderator: frontend_dev
  - id: backend_design
    type: design
    roles: [backend_dev]
    moderator: backend_dev
```

### 30.2 场景组合

```yaml
# 组合多个场景
name: "full-project"
description: "完整项目开发"
compose:
  - scene: "requirement-analysis"
    alias: "需求分析"
  - scene: "code-development"
    alias: "代码开发"
    depends_on: ["需求分析"]  # 依赖关系
  - scene: "testing"
    alias: "测试"
    depends_on: ["代码开发"]
```

### 30.3 解析器实现

```python
class SceneParser:
    """场景解析器（支持继承和组合）"""

    async def parse(self, yaml_content: str) -> Scene:
        """解析场景 YAML"""
        config = yaml.safe_load(yaml_content)

        # 处理继承
        if 'inherits' in config:
            base_scene = await self.load_scene(config['inherits'])
            config = self.merge_configs(base_scene.config, config)

        # 处理组合
        if 'compose' in config:
            return await self.parse_composed_scene(config)

        return Scene(**config)

    def merge_configs(self, base: dict, override: dict) -> dict:
        """合并配置（override 覆盖 base）"""
        merged = base.copy()
        for key, value in override.items():
            if key == 'inherits':
                continue
            if isinstance(value, list) and key in merged:
                merged[key] = merged[key] + value  # 列表追加
            else:
                merged[key] = value
        return merged
```

---

## 三十一、健康检查与监控

### 31.1 健康检查端点

```python
@app.get("/health")
async def health_check():
    """健康检查"""
    checks = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "checks": {}
    }

    # 检查数据库
    try:
        await db.execute("SELECT 1")
        checks["checks"]["database"] = "ok"
    except Exception as e:
        checks["checks"]["database"] = f"error: {e}"
        checks["status"] = "unhealthy"

    # 检查 Agent 适配器
    for adapter_name, adapter in adapter_registry.items():
        try:
            await adapter.health_check()
            checks["checks"][f"adapter_{adapter_name}"] = "ok"
        except Exception as e:
            checks["checks"][f"adapter_{adapter_name}"] = f"error: {e}"

    # 返回状态码
    status_code = 200 if checks["status"] == "healthy" else 503
    return JSONResponse(content=checks, status_code=status_code)
```

### 31.2 Prometheus 指标

```python
from prometheus_client import Counter, Histogram, Gauge

# 定义指标
MEETINGS_TOTAL = Counter('meetings_total', 'Total meetings', ['status'])
MEETING_DURATION = Histogram('meeting_duration_seconds', 'Meeting duration')
ACTIVE_MEETINGS = Gauge('active_meetings', 'Number of active meetings')
AGENT_CALLS = Counter('agent_calls_total', 'Total agent calls', ['agent', 'status'])
AGENT_LATENCY = Histogram('agent_latency_seconds', 'Agent response latency', ['agent'])

# 使用示例
MEETINGS_TOTAL.labels(status='completed').inc()
MEETING_DURATION.observe(duration_seconds)
ACTIVE_MEETINGS.set(active_count)
AGENT_CALLS.labels(agent='claude', status='success').inc()
AGENT_LATENCY.labels(agent='claude').observe(response_time)
```

---

## 三十二、Graceful Shutdown

### 32.1 优雅关闭实现

```python
import signal
import asyncio

class GracefulShutdown:
    """优雅关闭"""

    def __init__(self):
        self.is_shutting_down = False
        self.active_meetings: Dict[str, asyncio.Task] = {}

    def setup_signal_handlers(self):
        """注册信号处理"""
        signal.signal(signal.SIGTERM, self.handle_shutdown)
        signal.signal(signal.SIGINT, self.handle_shutdown)

    def handle_shutdown(self, signum, frame):
        """处理关闭信号"""
        logger.info(f"Received signal {signum}, starting graceful shutdown...")
        self.is_shutting_down = True
        asyncio.create_task(self.shutdown())

    async def shutdown(self):
        """执行关闭流程"""
        # 1. 停止接受新会议
        logger.info("Stopping new meeting creation...")

        # 2. 等待活跃会议完成（最多 30 秒）
        logger.info(f"Waiting for {len(self.active_meetings)} active meetings...")
        try:
            await asyncio.wait_for(
                self.wait_for_meetings(),
                timeout=30
            )
        except asyncio.TimeoutError:
            logger.warning("Timeout waiting for meetings, saving checkpoints...")
            await self.save_all_checkpoints()

        # 3. 关闭 WebSocket 连接
        logger.info("Closing WebSocket connections...")
        await self.close_all_connections()

        # 4. 关闭数据库连接
        logger.info("Closing database connections...")
        await db.disconnect()

        logger.info("Shutdown complete")

    async def wait_for_meetings(self):
        """等待所有会议完成"""
        while self.active_meetings:
            await asyncio.sleep(1)

    async def save_all_checkpoints(self):
        """保存所有活跃会议的检查点"""
        for meeting_id in self.active_meetings:
            await state_manager.save_checkpoint(meeting_id)
            logger.info(f"Checkpoint saved for meeting {meeting_id}")
```

### 32.2 FastAPI 集成

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动
    shutdown_handler = GracefulShutdown()
    shutdown_handler.setup_signal_handlers()

    # 恢复中断的会议
    await recover_interrupted_meetings()

    yield

    # 关闭
    await shutdown_handler.shutdown()

app = FastAPI(lifespan=lifespan)
```

---

## 三十三、配置热重载

### 33.1 文件监听

```python
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

class ConfigFileHandler(FileSystemEventHandler):
    """配置文件变更监听"""

    def __init__(self, config_manager):
        self.config_manager = config_manager

    def on_modified(self, event):
        if event.src_path.endswith('.yaml'):
            logger.info(f"Config file changed: {event.src_path}")
            asyncio.create_task(self.config_manager.reload())

class ConfigManager:
    """配置管理器"""

    def __init__(self, config_dir: str):
        self.config_dir = config_dir
        self.configs: Dict[str, Any] = {}
        self.callbacks: List[callable] = []

    async def start_watching(self):
        """启动文件监听"""
        self.observer = Observer()
        handler = ConfigFileHandler(self)
        self.observer.schedule(handler, self.config_dir, recursive=False)
        self.observer.start()
        logger.info(f"Watching config directory: {self.config_dir}")

    async def reload(self):
        """重新加载配置"""
        try:
            # 重新加载所有 YAML 文件
            for filename in os.listdir(self.config_dir):
                if filename.endswith('.yaml'):
                    filepath = os.path.join(self.config_dir, filename)
                    with open(filepath) as f:
                        self.configs[filename] = yaml.safe_load(f)

            # 通知回调
            for callback in self.callbacks:
                await callback(self.configs)

            logger.info("Config reloaded successfully")
        except Exception as e:
            logger.error(f"Config reload failed: {e}")

    def on_change(self, callback: callable):
        """注册变更回调"""
        self.callbacks.append(callback)
```

---

## 三十四、数据库迁移

### 34.1 迁移工具

```python
# 使用 Alembic 进行数据库迁移
# alembic.ini
"""
[alembic]
script_location = alembic
sqlalchemy.url = postgresql://postgres:password@localhost:5432/meeting
"""

# alembic/env.py
from alembic import context
from meeting.models import Base

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata
        )
        with context.begin_transaction():
            context.run_migrations()
```

### 34.2 迁移命令

```bash
# 创建迁移
alembic revision --autogenerate -m "add_meeting_checkpoints"

# 执行迁移
alembic upgrade head

# 回滚
alembic downgrade -1

# 查看历史
alembic history
```

---

## 三十五、会议导出功能

### 35.1 导出格式

```python
class MeetingExporter:
    """会议导出器"""

    async def export_markdown(self, meeting_id: str) -> str:
        """导出为 Markdown"""
        meeting = await load_meeting(meeting_id)
        lines = [
            f"# 会议记录：{meeting.scene_name}",
            f"**会议 ID**: {meeting.id}",
            f"**状态**: {meeting.status}",
            f"**创建时间**: {meeting.created_at}",
            ""
        ]

        for stage in meeting.stages:
            lines.append(f"## 阶段：{stage.stage_id}")
            lines.append(f"**状态**: {stage.status}")
            lines.append("")

            for round in stage.rounds:
                lines.append(f"### 轮次 {round.round_num}")
                for msg in round.messages:
                    lines.append(f"**[{msg.role_id}]** {msg.content}")
                    lines.append("")

            if stage.output:
                lines.append(f"### 产出物")
                lines.append(stage.output)
                lines.append("")

        return '\n'.join(lines)

    async def export_json(self, meeting_id: str) -> dict:
        """导出为 JSON"""
        meeting = await load_meeting(meeting_id)
        return meeting.dict()

    async def export_html(self, meeting_id: str) -> str:
        """导出为 HTML（带样式）"""
        markdown = await self.export_markdown(meeting_id)
        html = markdown.markdown(markdown)
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                .message {{ margin: 10px 0; padding: 10px; border-radius: 5px; }}
                .agent {{ background: #e3f2fd; }}
                .user {{ background: #f3e5f5; }}
            </style>
        </head>
        <body>{html}</body>
        </html>
        """
```

### 35.2 导出 API

```python
@app.get("/api/meetings/{meeting_id}/export")
async def export_meeting(
    meeting_id: str,
    format: str = "markdown",  # markdown, json, html
    user = Depends(verify_api_key)
):
    """导出会议记录"""
    exporter = MeetingExporter()

    if format == "markdown":
        content = await exporter.export_markdown(meeting_id)
        return Response(content=content, media_type="text/markdown")
    elif format == "json":
        content = await exporter.export_json(meeting_id)
        return JSONResponse(content=content)
    elif format == "html":
        content = await exporter.export_html(meeting_id)
        return Response(content=content, media_type="text/html")
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {format}")
```

---

## 三十六、GitHub 规范

### 36.1 仓库结构

```
ai-collaboration-meeting/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # CI 流程
│   │   └── release.yml         # 发布流程
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md       # Bug 报告模板
│   │   └── feature_request.md  # 功能请求模板
│   └── pull_request_template.md
├── backend/
├── frontend/
├── scenes/
├── docs/
├── .gitignore
├── .env.example
├── LICENSE
├── README.md
├── CHANGELOG.md
├── CONTRIBUTING.md
└── PLAN.md
```

### 36.2 README.md 模板

```markdown
# AI 协作会议平台

让人类当导演，AI 当演员，通过会议协作完成任何任务。

## ✨ 特性

- 🎭 多 Agent 协作讨论
- 🎯 用户随时介入控制
- 📝 完整过程记录
- 🔌 支持任意 AI 模型
- 📋 YAML 场景定义

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting.git
cd ai-collaboration-meeting

# 后端
cd backend
uv venv
uv pip install -e .

# 前端
cd frontend
npm install
npm run build
```

### 配置

```bash
cp .env.example .env
# 编辑 .env，填入 API Key
```

### 运行

```bash
# 后端
cd backend
uv run uvicorn main:app --host 0.0.0.0 --port 18502

# 前端
cd frontend
npm run dev
```

### 命令行使用

```bash
# 运行会议
meeting run scenes/code-development.yaml

# 列出场景
meeting scene list
```

## 📖 文档

- [场景定义格式](docs/SCENE_FORMAT.md)
- [Agent 适配器](docs/ADAPTERS.md)
- [API 文档](docs/API.md)

## 🤝 参与贡献

请查看 [CONTRIBUTING.md](CONTRIBUTING.md)

## 📄 许可证

MIT License
```

### 36.3 .gitignore

```gitignore
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
.venv/
*.egg-info/
dist/
build/

# Node
node_modules/
frontend/dist/
frontend/.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# 环境变量
.env
.env.local

# 日志
logs/
*.log

# 数据库
*.db
*.sqlite3

# 临时文件
tmp/
temp/
.cache/

# 系统文件
.DS_Store
Thumbs.db
```

### 36.4 .env.example

```bash
# 数据库
DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting

# API Keys
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# 服务配置
HOST=0.0.0.0
PORT=18502
LOG_LEVEL=INFO

# API 安全
MEETING_API_KEY=your-secret-key
```

### 36.5 LICENSE (MIT)

```text
MIT License

Copyright (c) 2026 KingBoyAndGirl

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 36.6 CONTRIBUTING.md

```markdown
# 贡献指南

## 如何贡献

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'feat: add xxx'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```
feat(engine): 添加共识检测算法

- 实现关键词检测
- 实现主持人判断
- 实现投票表决

Closes #123
```

## 开发流程

1. 安装开发依赖
2. 运行测试 (`pytest`)
3. 代码格式化 (`ruff format`)
4. 类型检查 (`mypy`)
5. 提交 PR
```

### 36.7 CHANGELOG.md

```markdown
# 更新日志

本项目遵循 [Semantic Versioning](https://semver.org/)。

## [Unreleased]

### Added
- 初始项目结构
- 会议引擎核心
- 场景 YAML 解析
- Agent 适配层
- Web UI

## [0.1.0] - 2026-05-XX

### Added
- 单 Agent + 用户对话
- 基础场景 YAML 解析
- WebSocket 实时消息
- 命令行执行
```

### 36.8 GitHub Actions CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install uv
        uses: astral-sh/setup-uv@v3

      - name: Install dependencies
        run: |
          cd backend
          uv venv
          uv pip install -e ".[dev]"

      - name: Run tests
        run: |
          cd backend
          uv run pytest

      - name: Lint
        run: |
          cd backend
          uv run ruff check .
          uv run ruff format --check .

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build
        run: |
          cd frontend
          npm run build

      - name: Lint
        run: |
          cd frontend
          npm run lint
```

### 36.9 Issue 模板

```markdown
<!-- .github/ISSUE_TEMPLATE/bug_report.md -->
---
name: Bug 报告
about: 报告一个 Bug
title: '[Bug] '
labels: bug
assignees: ''
---

## Bug 描述

简要描述 Bug。

## 复现步骤

1. 运行 '...'
2. 点击 '...'
3. 看到错误 '...'

## 期望行为

描述期望的行为。

## 实际行为

描述实际的行为。

## 环境信息

- OS: [e.g. Ubuntu 22.04]
- Python: [e.g. 3.11.5]
- Node.js: [e.g. 20.10.0]

## 日志

```
粘贴相关日志
```
```

```markdown
<!-- .github/ISSUE_TEMPLATE/feature_request.md -->
---
name: 功能请求
about: 提出新功能建议
title: '[Feature] '
labels: enhancement
assignees: ''
---

## 功能描述

简要描述功能。

## 使用场景

描述使用场景。

## 建议实现

描述建议的实现方式。
```

### 36.10 PR 模板

```markdown
<!-- .github/pull_request_template.md -->
## 变更说明

简要描述本次变更。

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 重构
- [ ] 其他

## 测试

- [ ] 已添加测试
- [ ] 已通过现有测试

## 关联 Issue

Closes #xxx
```

---

## 三十八、错误码定义

### 38.1 统一错误码

```python
from enum import Enum

class ErrorCode(str, Enum):
    # 场景相关 (1xxx)
    SCENE_NOT_FOUND = "E1001"
    SCENE_PARSE_ERROR = "E1002"
    SCENE_INVALID_YAML = "E1003"
    SCENE_MISSING_ROLES = "E1004"
    SCENE_MISSING_STAGES = "E1005"

    # 会议相关 (2xxx)
    MEETING_NOT_FOUND = "E2001"
    MEETING_ALREADY_RUNNING = "E2002"
    MEETING_INVALID_STATE = "E2003"
    MEETING_CHECKPOINT_FAILED = "E2004"

    # Agent 相关 (3xxx)
    AGENT_CALL_TIMEOUT = "E3001"
    AGENT_CALL_FAILED = "E3002"
    AGENT_ADAPTER_NOT_FOUND = "E3003"
    AGENT_RATE_LIMITED = "E3004"

    # 共识相关 (4xxx)
    CONSENSUS_TIMEOUT = "E4001"
    CONSENSUS_MAX_ROUNDS = "E4002"

    # 用户介入相关 (5xxx)
    USER_INPUT_TIMEOUT = "E5001"
    USER_REJECTION_LIMIT = "E5002"

# 错误消息映射
ERROR_MESSAGES = {
    ErrorCode.SCENE_NOT_FOUND: "场景 '{scene_id}' 不存在",
    ErrorCode.SCENE_PARSE_ERROR: "场景解析失败: {detail}",
    ErrorCode.AGENT_CALL_TIMEOUT: "Agent {agent} 调用超时 ({timeout}s)",
    ErrorCode.AGENT_CALL_FAILED: "Agent {agent} 调用失败: {detail}",
    # ...
}
```

### 38.2 错误响应格式

```json
{
  "error": {
    "code": "E3001",
    "message": "Agent claude 调用超时 (120s)",
    "detail": "Connection timeout after 120 seconds",
    "recoverable": true,
    "suggestion": "请检查网络连接或增加超时时间"
  }
}
```

---

## 三十九、API 完整文档

### 39.1 场景管理 API

```yaml
# 创建场景
POST /api/scenes
Content-Type: application/json
X-API-Key: your-key

Request:
{
  "name": "代码开发",
  "description": "多角色协作完成代码开发",
  "yaml_content": "name: code-development\nroles:\n  - id: developer\n    ..."
}

Response (201):
{
  "id": "scene-001",
  "name": "代码开发",
  "created_at": "2026-05-05T12:00:00Z"
}

# 获取场景列表
GET /api/scenes?page=1&limit=10

Response (200):
{
  "items": [...],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

### 39.2 会议管理 API

```yaml
# 创建会议
POST /api/meetings
Content-Type: application/json

Request:
{
  "scene_id": "scene-001",
  "variables": {
    "project_name": "用户管理系统"
  }
}

Response (201):
{
  "id": "meeting-001",
  "scene_id": "scene-001",
  "status": "created",
  "created_at": "2026-05-05T12:00:00Z"
}

# 启动会议
POST /api/meetings/{meeting_id}/start

Response (200):
{
  "status": "running",
  "message": "会议已启动"
}

# 用户介入
POST /api/meetings/{meeting_id}/intervene
Content-Type: application/json

Request:
{
  "content": "需要支持第三方登录",
  "stage_id": "requirement"
}

Response (200):
{
  "status": "accepted",
  "message": "反馈已记录"
}

# 驳回阶段
POST /api/meetings/{meeting_id}/reject
Content-Type: application/json

Request:
{
  "stage_id": "design",
  "reason": "技术方案不够详细"
}

Response (200):
{
  "status": "rejected",
  "message": "阶段已驳回，将重新讨论"
}
```

### 39.3 WebSocket API

```yaml
# 连接
ws://localhost:18502/ws/meetings/{meeting_id}

# 客户端 → 服务端
{
  "type": "intervene",
  "data": {
    "content": "需要支持第三方登录"
  }
}

{
  "type": "approve",
  "data": {
    "stage_id": "design"
  }
}

{
  "type": "reject",
  "data": {
    "stage_id": "design",
    "reason": "技术方案不够详细"
  }
}

# 服务端 → 客户端
{
  "type": "message",
  "data": {
    "id": "msg-001",
    "role_id": "architect",
    "content": "技术方案如下...",
    "timestamp": "2026-05-05T12:00:00Z"
  }
}

{
  "type": "stage_update",
  "data": {
    "stage_id": "design",
    "status": "completed",
    "output": "..."
  }
}

{
  "type": "consensus",
  "data": {
    "stage_id": "design",
    "method": "keyword",
    "summary": "..."
  }
}

{
  "type": "error",
  "data": {
    "code": "E3001",
    "message": "Agent claude 调用超时",
    "recoverable": true
  }
}
```

---

## 四十、前端组件设计

### 40.1 组件结构

```
frontend/src/
├── components/
│   ├── ChatBubble.tsx          # 消息气泡
│   ├── StageProgress.tsx       # 阶段进度
│   ├── OutputViewer.tsx        # 产出物查看器
│   ├── MeetingControls.tsx     # 会议控制按钮
│   ├── SceneEditor.tsx         # 场景编辑器
│   └── ErrorBoundary.tsx       # 错误边界
├── pages/
│   ├── SceneList.tsx           # 场景列表页
│   ├── MeetingHall.tsx         # 会议大厅
│   └── MeetingMonitor.tsx      # 会议监控页
├── services/
│   ├── api.ts                  # API 客户端
│   └── ws.ts                   # WebSocket 客户端
└── types/
    └── index.ts                # 类型定义
```

### 40.2 核心组件 Props

```typescript
// ChatBubble.tsx
interface ChatBubbleProps {
  roleId: string;
  roleName: string;
  content: string;
  role: 'user' | 'agent' | 'moderator';
  timestamp: string;
  isLatest?: boolean;
}

// StageProgress.tsx
interface StageProgressProps {
  stages: Stage[];
  currentStageIndex: number;
  onStageClick?: (stageId: string) => void;
}

// MeetingControls.tsx
interface MeetingControlsProps {
  meetingId: string;
  status: 'created' | 'running' | 'completed' | 'paused';
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onIntervene: (content: string) => void;
}
```

### 40.3 类型定义

```typescript
// types/index.ts
export interface Role {
  id: string;
  name: string;
  description: string;
  executor: string;
  model?: string;
}

export interface Stage {
  id: string;
  type: 'requirement' | 'design' | 'review' | 'decision' | 'output';
  roles: string[];
  moderator: string;
  max_rounds: number;
  consensus: 'keyword' | 'moderator' | 'vote';
  output_format: 'markdown' | 'code' | 'json';
}

export interface Message {
  id: string;
  role: 'user' | 'agent' | 'moderator';
  role_id: string;
  content: string;
  timestamp: string;
}

export interface Meeting {
  id: string;
  scene_name: string;
  status: 'created' | 'running' | 'completed' | 'failed';
  current_stage: number;
  stages: MeetingStage[];
  created_at: string;
  updated_at: string;
}

export interface MeetingStage {
  stage_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rejected';
  rounds: Round[];
  consensus_reached: boolean;
  output?: string;
}

export interface Round {
  round_num: number;
  messages: Message[];
  summary?: string;
}
```

---

## 四十一、部署详细步骤

### 41.1 数据库初始化

```bash
# 1. 创建数据库
sudo -u postgres psql
CREATE DATABASE meeting;
CREATE USER meeting_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE meeting TO meeting_user;
\q

# 2. 运行迁移
cd backend
uv run alembic upgrade head

# 3. 导入内置场景
uv run python -m meeting.scripts.import_scenes
```

### 41.2 环境配置

```bash
# .env
DATABASE_URL=postgresql://meeting_user:your_password@localhost:5432/meeting
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
MEETING_API_KEY=your-secret-key
HOST=0.0.0.0
PORT=18502
LOG_LEVEL=INFO
```

### 41.3 systemd 服务

```ini
# /etc/systemd/system/meeting-backend.service
[Unit]
Description=AI Meeting Backend
After=network.target postgresql.service

[Service]
Type=simple
User=meeting
WorkingDirectory=/opt/meeting/backend
ExecStart=/opt/meeting/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 18502
Restart=always
RestartSec=5
EnvironmentFile=/opt/meeting/.env

[Install]
WantedBy=multi-user.target
```

```bash
# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable meeting-backend
sudo systemctl start meeting-backend
sudo systemctl status meeting-backend
```

---

## 四十三、配置文件完整示例

### 43.1 backend/config/settings.yaml

```yaml
# 应用配置
app:
  name: "AI Meeting Platform"
  version: "1.0.0"
  debug: false

# 服务配置
server:
  host: "0.0.0.0"
  port: 18502
  workers: 4
  timeout: 300

# 数据库配置
database:
  url: "${DATABASE_URL}"
  pool_size: 20
  max_overflow: 10
  pool_recycle: 3600

# WebSocket 配置
websocket:
  ping_interval: 20
  ping_timeout: 20
  max_connections: 100
  message_cache_size: 100

# Agent 适配器配置
adapters:
  claude:
    class: "meeting.adapters.claude.ClaudeAdapter"
    config:
      api_key: "${ANTHROPIC_API_KEY}"
      default_model: "claude-3-opus"
      timeout: 120
      max_retries: 3

  openai:
    class: "meeting.adapters.openai.OpenAIAdapter"
    config:
      api_key: "${OPENAI_API_KEY}"
      default_model: "gpt-4-turbo"
      timeout: 120
      max_retries: 3

  hermes:
    class: "meeting.adapters.hermes.HermesAdapter"
    config:
      cli_path: "hermes"
      workspace: "/tmp/meeting-workspace"
      timeout: 300

  claude_code:
    class: "meeting.adapters.claude_code.ClaudeCodeAdapter"
    config:
      cli_path: "claude"
      timeout: 600

# 会议引擎配置
engine:
  max_rounds_per_stage: 10
  consensus_timeout: 300
  user_input_timeout: 600
  max_rejections: 3
  checkpoint_interval: 1  # 每次阶段完成保存检查点

# 日志配置
logging:
  level: "${LOG_LEVEL:INFO}"
  format: "json"
  file: "/var/log/meeting/meeting.log"
  max_bytes: 10485760  # 10MB
  backup_count: 5

# 上下文管理
context:
  default_model_limit: 80000
  system_prompt_tokens: 2000
  reserved_tokens: 4000
  max_recent_messages: 20
  max_opening_messages: 2
```

### 43.2 frontend/.env.production

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:18502
VITE_WS_URL=ws://localhost:18502

# 功能开关
VITE_ENABLE_RECONNECT=true
VITE_MAX_RECONNECT_ATTEMPTS=10
VITE_RECONNECT_DELAY=1000

# UI 配置
VITE_DEFAULT_PAGE_SIZE=10
VITE_MAX_MESSAGE_LENGTH=10000
```

---

## 四十四、高级场景 YAML 用法

### 44.1 条件阶段

```yaml
name: "conditional-workflow"
description: "带条件判断的工作流"
version: "1.0"

roles:
  - id: reviewer
    name: "审查员"
    executor: "claude"

stages:
  - id: initial_review
    type: review
    roles: [reviewer]
    moderator: reviewer

  # 条件阶段：如果上阶段输出包含"需要修改"，则执行此阶段
  - id: revision
    type: design
    roles: [reviewer]
    condition: "${initial_review_output}" contains "需要修改"
    depends_on: [initial_review]

  - id: final_approval
    type: decision
    roles: [reviewer]
    depends_on: [initial_review, revision]
```

### 44.2 循环讨论

```yaml
name: "iterative-design"
description: "迭代设计直到满意"
version: "1.0"

stages:
  - id: design
    type: design
    roles: [architect]
    max_rounds: 10
    # 循环条件：未达成共识且轮次 < max_rounds
    loop:
      until: "consensus_reached"
      max_iterations: 5
```

### 44.3 动态角色

```yaml
name: "dynamic-roles"
description: "根据变量动态选择角色"
version: "1.0"

variables:
  project_type: "web"  # web | mobile | desktop

roles:
  - id: web_dev
    name: "Web 开发"
    executor: "claude_code"
    condition: "${project_type} == 'web'"

  - id: mobile_dev
    name: "移动开发"
    executor: "claude_code"
    condition: "${project_type} == 'mobile'"

stages:
  - id: development
    type: output
    # 动态角色：根据 project_type 选择
    roles: "${project_type}_dev"
```

### 44.4 嵌套场景

```yaml
name: "parent-scene"
description: "嵌套场景示例"
version: "1.0"

stages:
  - id: sub_scene_1
    type: custom
    handler: "run_sub_scene"
    params:
      scene: "requirement-analysis"
      inherit_variables: true

  - id: sub_scene_2
    type: custom
    handler: "run_sub_scene"
    params:
      scene: "code-development"
      depends_on: [sub_scene_1]
```

---

## 四十五、性能优化建议

### 45.1 数据库优化

```sql
-- 添加缺失索引
CREATE INDEX CONCURRENTLY idx_meetings_status_created
ON meetings (status, created_at DESC);

CREATE INDEX CONCURRENTLY idx_messages_meeting_stage
ON messages (meeting_id, stage_id, created_at);

-- 分区大表（按月份）
CREATE TABLE messages_2026_05 PARTITION OF messages
FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- 定期清理旧数据
CREATE OR REPLACE FUNCTION cleanup_old_meetings()
RETURNS void AS $$
BEGIN
    DELETE FROM meetings
    WHERE status = 'completed'
    AND updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 创建定时任务（需要 pg_cron 扩展）
SELECT cron.schedule('cleanup-meetings', '0 2 * * *', 'SELECT cleanup_old_meetings()');
```

### 45.2 后端优化

```python
# 1. 使用连接池
from sqlalchemy import create_engine
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    echo_pool=False
)

# 2. 异步数据库访问
from sqlalchemy.ext.asyncio import create_async_engine
async_engine = create_async_engine(
    "postgresql+asyncpg://...",
    pool_size=20
)

# 3. 缓存频繁访问的数据
from functools import lru_cache

@lru_cache(maxsize=128)
def get_scene_config(scene_id: str) -> dict:
    """缓存场景配置"""
    return load_scene_from_db(scene_id)

# 4. 流式响应（减少内存）
async def stream_agent_response(executor, prompt):
    """流式获取 Agent 响应"""
    async for chunk in agent.stream(executor, prompt):
        yield chunk
```

### 45.3 前端优化

```typescript
// 1. 虚拟滚动（大量消息）
import { FixedSizeList as List } from 'react-window';

<List
  height={600}
  itemCount={messages.length}
  itemSize={80}
  itemData={messages}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatBubble message={messages[index]} />
    </div>
  )}
</List>

// 2. 防抖用户输入
import { debounce } from 'lodash';

const debouncedIntervene = debounce((content) => {
  websocket.send({ type: 'intervene', data: { content } });
}, 500);

// 3. 懒加载组件
const MeetingMonitor = lazy(() => import('./pages/MeetingMonitor'));
```

---

## 四十六、安全加固建议

### 46.1 输入验证

```python
from pydantic import BaseModel, validator
from typing import List
import re

class SceneCreate(BaseModel):
    name: str
    description: str
    yaml_content: str

    @validator('name')
    def name_must_be_valid(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\-\u4e00-\u9fff]{1,50}$', v):
            raise ValueError('无效的场景名称')
        return v

    @validator('yaml_content')
    def yaml_size_limit(cls, v):
        if len(v) > 100000:  # 100KB
            raise ValueError('YAML 内容过大')
        return v
```

### 46.2 SQL 注入防护

```python
# ❌ 错误：直接拼接 SQL
query = f"SELECT * FROM meetings WHERE id = '{meeting_id}'"

# ✅ 正确：使用参数化查询
from sqlalchemy import text
query = text("SELECT * FROM meetings WHERE id = :meeting_id")
result = await db.execute(query, {"meeting_id": meeting_id})
```

### 46.3 XSS 防护

```typescript
// 前端：转义 HTML
import { escape } from 'lodash';

function MessageContent({ content }: { content: string }) {
  const escaped = escape(content);
  return <div dangerouslySetInnerHTML={{ __html: escaped }} />;
}

// 后端：清理 HTML（如果需要支持富文本）
from bleach import clean

clean_html = clean(
    user_input,
    tags=['p', 'br', 'strong', 'em'],
    attributes={}
)
```

### 46.4 速率限制细化

```python
class AdvancedRateLimiter:
    """细化速率限制"""

    limits = {
        '/api/scenes': {'calls': 100, 'period': 3600},      # 场景管理：100次/小时
        '/api/meetings': {'calls': 50, 'period': 3600},    # 会议管理：50次/小时
        '/api/meetings/*/start': {'calls': 10, 'period': 3600},  # 启动会议：10次/小时
        '/ws/meetings/*': {'calls': 5, 'period': 60},      # WebSocket：5次/分钟
    }

    async def check(self, request: Request):
        path = request.url.path
        method = request.method

        # 查找匹配的 limit
        for pattern, limit in self.limits.items():
            if self.match_pattern(pattern, path):
                key = f"{request.client.host}:{pattern}"
                if not self.is_allowed(key, limit['calls'], limit['period']):
                    raise HTTPException(status_code=429, detail="Rate limit exceeded")
```

---

## 四十七、监控告警配置

### 47.1 Prometheus 告警规则

```yaml
# prometheus/alerts.yml
groups:
  - name: meeting_alerts
    rules:
      - alert: MeetingBackendDown
        expr: up{job="meeting-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "会议后端服务下线"
          description: "服务 {{ $labels.instance }} 已下线超过 1 分钟"

      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "错误率过高"
          description: "5xx 错误率 {{ $value }} > 10%"

      - alert: AgentTimeout
        expr: rate(agent_calls_total{status="timeout"}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent 超时率过高"
          description: "Agent 超时率 {{ $value }} > 5%"

      - alert: SlowAgentResponse
        expr: histogram_quantile(0.95, agent_latency_seconds) > 30
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Agent 响应慢"
          description: "95% 的 Agent 响应时间 > 30 秒"
```

### 47.2 Grafana 仪表盘

```json
{
  "dashboard": {
    "title": "AI Meeting Platform",
    "panels": [
      {
        "title": "会议状态",
        "targets": [
          { "expr": "meetings_total" }
        ]
      },
      {
        "title": "Agent 调用延迟",
        "targets": [
          { "expr": "histogram_quantile(0.95, agent_latency_seconds)" }
        ]
      },
      {
        "title": "错误率",
        "targets": [
          { "expr": "rate(http_requests_total{status=~\"5..\"}[5m])" }
        ]
      }
    ]
  }
}
```

---

## 四十八、备份恢复策略

### 48.1 数据库备份

```bash
#!/bin/bash
# scripts/backup.sh

BACKUP_DIR="/var/backups/meeting"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="meeting_$DATE.sql.gz"

# 创建备份
pg_dump -h localhost -U meeting_user meeting | gzip > "$BACKUP_DIR/$FILENAME"

# 保留最近 7 天
find "$BACKUP_DIR" -name "meeting_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME"
```

```bash
# 定时任务
echo "0 2 * * * /opt/meeting/scripts/backup.sh >> /var/log/meeting/backup.log 2>&1" | crontab -
```

### 48.2 恢复流程

```bash
# 1. 停止服务
sudo systemctl stop meeting-backend

# 2. 恢复数据库
gunzip -c /var/backups/meeting/meeting_20260505_020000.sql.gz | psql -U meeting_user meeting

# 3. 重启服务
sudo systemctl start meeting-backend

# 4. 验证
curl http://localhost:18502/health
```

---

## 五十、故障排查指南

### 50.1 常见问题

#### 问题：会议启动时卡住无响应

**可能原因**：
1. Agent API Key 无效或过期
2. 网络连接问题
3. Agent 响应超时

**排查步骤**：
```bash
# 1. 检查日志
tail -f /var/log/meeting/meeting.log

# 2. 测试 Agent 连接
meeting adapter test claude

# 3. 检查数据库
psql -U meeting_user -d meeting -c "SELECT * FROM meetings ORDER BY created_at DESC LIMIT 5;"
```

#### 问题：WebSocket 连接频繁断开

**可能原因**：
1. 反向代理超时（nginx 默认 60s）
2. 客户端网络不稳定
3. 服务端 ping 超时

**解决方案**：
```nginx
# nginx 配置
location /ws/meetings/ {
    proxy_pass http://backend:18502;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;  # 增加超时
    proxy_send_timeout 3600s;
}
```

#### 问题：数据库迁移失败

**排查步骤**：
```bash
# 1. 检查数据库连接
psql -U meeting_user -d meeting -c "SELECT 1"

# 2. 查看迁移历史
cd backend
uv run alembic history

# 3. 降级后重新迁移
uv run alembic downgrade -1
uv run alembic upgrade head
```

#### 问题：场景 YAML 解析失败

**排查步骤**：
```bash
# 1. 验证 YAML 语法
python -c "import yaml; yaml.safe_load(open('scene.yaml'))"

# 2. 使用场景验证命令
meeting scene validate scene.yaml

# 3. 检查必有字段
grep -E "^(name|description|version|roles|stages):" scene.yaml
```

---

## 五十一、FAQ

### 51.1 使用问题

**Q: 支持哪些 Agent？**
A: 支持 Claude (API)、OpenAI (API)、Hermes (CLI)、Claude Code (CLI)，以及自定义 Agent。

**Q: 如何限制会议时长？**
A: 在场景 YAML 中设置 `max_rounds`，或在配置中设置 `engine.consensus_timeout`。

**Q: 能否导出会议记录？**
A: 支持，使用 `meeting export <meeting_id> --format markdown`。

**Q: 如何恢复中断的会议？**
A: 使用 `meeting run <scene_id> --resume`，或重启服务后通过 Web UI 恢复。

**Q: 支持哪些产出物格式？**
A: 支持 Markdown、代码、JSON、Mermaid 图表。

### 51.2 开发问题

**Q: 如何添加新 Agent 适配器？**
A: 继承 `BaseMeetingAgent`，实现 `speak()`、`summarize()`、`judge_consensus()` 方法，然后在 `config/adapters.yaml` 中注册。

**Q: 如何调试 WebSocket？**
A: 浏览器开发者工具 → Network → WS，查看消息帧。

**Q: 如何运行测试？**
A: `cd backend && uv run pytest -v`。

**Q: 如何查看 API 文档？**
A: 启动服务后访问 `http://localhost:18502/docs`。

---

## 五十二、开发环境详细搭建

### 52.1 后端开发环境

```bash
# 系统依赖
sudo apt update
sudo apt install -y python3.11 python3-pip postgresql-15 git

# 创建用户
sudo useradd -m -s /bin/bash meeting
sudo su - meeting

# 克隆仓库
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting.git
cd ai-collaboration-meeting

# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh
export PATH="$HOME/.local/bin:$PATH"

# 创建虚拟环境
cd backend
uv venv
source .venv/bin/activate

# 安装依赖
uv pip install -e ".[dev]"

# 配置环境变量
cp .env.example .env
vim .env  # 填入 API Key

# 初始化数据库
sudo -u postgres psql
CREATE DATABASE meeting;
GRANT ALL PRIVILEGES ON DATABASE meeting TO meeting;
\q

# 运行迁移
uv run alembic upgrade head

# 启动开发服务器
uv run uvicorn main:app --host 0.0.0.0 --port 18502 --reload
```

### 52.2 前端开发环境

```bash
# 安装 Node.js 20+
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 安装依赖
cd frontend
npm install

# 配置环境变量
cp .env.example .env.local
vim .env.local  # 配置 API URL

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173
```

### 52.3 验证安装

```bash
# 后端健康检查
curl http://localhost:18502/health

# 前端访问
curl http://localhost:5173

# 创建测试场景
cat > test_scene.yaml << EOF
name: "测试场景"
description: "测试会议"
version: "1.0"
roles:
  - id: test_role
    name: "测试角色"
    executor: "claude"
stages:
  - id: test_stage
    type: requirement
    roles: [test_role]
    moderator: test_role
EOF

meeting scene create test_scene.yaml
meeting run test_scene.yaml --auto
```

---

## 五十三、项目初始化详细步骤

### 53.1 目录结构创建

```bash
# 创建项目根目录
mkdir -p ai-collaboration-meeting
cd ai-collaboration-meeting

# 创建后端目录
mkdir -p backend/{meeting,api,config,scripts}
mkdir -p backend/meeting/{adapters,models}
mkdir -p backend/api

# 创建前端目录
mkdir -p frontend/src/{pages,components,services,types}
mkdir -p frontend/public

# 创建场景目录
mkdir -p scenes

# 创建文档目录
mkdir -p docs

# 创建 GitHub 目录
mkdir -p .github/{workflows,ISSUE_TEMPLATE}

# 创建日志目录
sudo mkdir -p /var/log/meeting
sudo chown meeting:meeting /var/log/meeting
```

### 53.2 后端文件初始化

```bash
# 创建 pyproject.toml
cat > backend/pyproject.toml << 'EOF'
[project]
name = "ai-meeting"
version = "0.1.0"
description = "AI Collaboration Meeting Platform"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110.0",
    "uvicorn[standard]>=0.27.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "psycopg2-binary>=2.9.0",
    "pydantic>=2.0.0",
    "pyyaml>=6.0.0",
    "websockets>=12.0",
    "prometheus-client>=0.19.0",
    "alembic>=1.13.0",
    "watchdog>=3.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-asyncio>=0.21.0",
    "ruff>=0.1.0",
    "mypy>=1.0.0",
]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.ruff]
line-length = 120

[tool.pytest.ini_options]
asyncio_mode = "auto"
EOF

# 创建主入口
touch backend/main.py
touch backend/meeting/__init__.py
touch backend/meeting/engine.py
touch backend/meeting/models.py
touch backend/meeting/scene_parser.py
touch backend/api/__init__.py
touch backend/api/scenes.py
touch backend/api/meetings.py
```

### 53.3 前端文件初始化

```bash
# 初始化 package.json
cd frontend
npm init -y

# 安装依赖
npm install react react-dom antd @ant-design/icons dayjs
npm install -D typescript @types/react @types/react-dom vite @vitejs/plugin-react

# 创建 tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# 创建 vite.config.ts
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:18502',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:18502',
        ws: true,
      },
    },
  },
})
EOF
```

---

---

## 五十四、Docker 详细配置

### 54.1 后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装 uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# 复制依赖文件
COPY pyproject.toml .

# 安装依赖
RUN uv venv && uv pip install -e .

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 18502

# 启动命令
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "18502"]
```

### 54.2 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 54.3 前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine as builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建
RUN npm run build

# 生产阶段 - 使用简单 HTTP 服务器
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./public

# 使用 http-server 提供静态文件
RUN npm install -g http-server

EXPOSE 8080

CMD ["http-server", "public", "-p", "8080", "-c", "86400"]
```

---

## 五十五、反向代理说明

### 55.1 代理配置责任

**nginx 配置由用户自行管理**，以下仅作说明：

- 前端服务端口：8080（Docker）或 5173（开发）
- 后端 API 端口：18502
- WebSocket 端点：`/ws/meetings/`

**用户需自行配置**：
- 反向代理（nginx/Caddy/其他）
- WebSocket 代理转发
- SSL/TLS 证书
- 静态资源缓存策略

### 55.2 服务架构

```
用户浏览器
    ↓
nginx (用户配置)
    ↓
├── 前端 (port 8080 或 5173)
└── 后端 API (port 18502)
    └── WebSocket (/ws/meetings/)
```

---

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "18502:18502"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/meeting
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - MEETING_API_KEY=${MEETING_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - meeting-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "18501:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - meeting-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=meeting
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - meeting-network

volumes:
  postgres_data:

networks:
  meeting-network:
    driver: bridge
```

---

## 五十五、API 版本控制

### 55.1 版本策略

```python
# 使用 URL 路径版本控制
app = FastAPI()

# v1 API
@api.get("/api/v1/scenes")
async def list_scenes_v1():
    return {"version": "v1", "items": []}

# v2 API（未来）
@api.get("/api/v2/scenes")
async def list_scenes_v2():
    # 可能返回不同的数据结构
    return {"version": "v2", "data": [], "pagination": {}}
```

### 55.2 向后兼容

```python
# 支持旧版本 API 调用
@app.middleware("http")
async def api_versioning(request: Request, call_next):
    """API 版本控制中间件"""
    path = request.url.path

    # 如果没有版本号，默认使用 v1
    if path.startswith("/api/") and "/v" not in path:
        # 重定向到 v1
        new_path = path.replace("/api/", "/api/v1/", 1)
        request.scope["path"] = new_path

    return await call_next(request)
```

---

## 五十六、前端路由设计

### 56.1 路由配置

```typescript
// frontend/src/router.tsx
import { createBrowserRouter } from 'react-router-dom';
import SceneList from './pages/SceneList';
import SceneEditor from './pages/SceneEditor';
import MeetingHall from './pages/MeetingHall';
import MeetingMonitor from './pages/MeetingMonitor';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SceneList />,
  },
  {
    path: '/scenes',
    element: <SceneList />,
  },
  {
    path: '/scenes/create',
    element: <SceneEditor mode="create" />,
  },
  {
    path: '/scenes/:id/edit',
    element: <SceneEditor mode="edit" />,
  },
  {
    path: '/meetings',
    element: <MeetingHall />,
  },
  {
    path: '/meetings/:id',
    element: <MeetingMonitor />,
  },
]);
```

### 56.2 路由守卫

```typescript
// frontend/src/components/AuthGuard.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

---

## 五十七、多环境配置

### 57.1 环境配置管理

```bash
# 目录结构
config/
├── .env.development     # 开发环境
├── .env.staging         # 预发布环境
├── .env.production      # 生产环境
└── .env.test             # 测试环境
```

```bash
# .env.development
DATABASE_URL=postgresql://postgres:password@localhost:5432/meeting_dev
LOG_LEVEL=DEBUG
HOST=localhost
PORT=18502
```

```bash
# .env.production
DATABASE_URL=postgresql://postgres:password@prod-db:5432/meeting
LOG_LEVEL=WARNING
HOST=0.0.0.0
PORT=18502
```

### 57.2 加载环境配置

```python
# backend/config/loader.py
import os
from dotenv import load_dotenv

def load_env():
    """根据环境加载配置"""
    env = os.getenv("ENV", "development")
    env_file = f".env.{env}"

    if os.path.exists(env_file):
        load_dotenv(env_file)
    else:
        load_dotenv(".env")  # 默认

    return env
```

---

## 五十八、灾难恢复计划

### 58.1 恢复时间目标

| 场景 | RTO | RPO | 策略 |
|------|-----|-----|------|
| 数据库崩溃 | < 1小时 | < 5分钟 | 从备份恢复 |
| 服务故障 | < 10分钟 | 0 | 重启服务 |
| 代码丢失 | < 30分钟 | 0 | 从 GitHub 恢复 |
| 配置丢失 | < 5分钟 | 0 | 从备份恢复 |

### 58.2 恢复步骤

```bash
#!/bin/bash
# scripts/disaster_recovery.sh

echo "开始灾难恢复..."

# 1. 停止所有服务
sudo systemctl stop meeting-backend
sudo systemctl stop meeting-frontend

# 2. 恢复数据库
echo "恢复数据库..."
LATEST_BACKUP=$(ls -t /var/backups/meeting/*.sql.gz | head -1)
gunzip -c "$LATEST_BACKUP" | psql -U meeting_user meeting

# 3. 恢复配置文件
echo "恢复配置文件..."
cp /var/backups/meeting/.env /opt/meeting/.env
cp /var/backups/meeting/config.yaml /opt/meeting/config/

# 4. 重新部署代码
echo "重新部署..."
cd /opt/meeting
git pull origin main
cd backend && uv pip install -e .
cd ../frontend && npm ci && npm run build

# 5. 重启服务
echo "重启服务..."
sudo systemctl start meeting-backend
sudo systemctl start meeting-frontend

# 6. 验证
echo "验证服务..."
curl -f http://localhost:18502/health || exit 1
curl -f http://localhost:18501 || exit 1

echo "灾难恢复完成！"
```

---

## 五十九、数据库迁移回滚

### 59.1 回滚策略

```bash
# 查看迁移历史
cd backend
uv run alembic history

# 回滚到指定版本
uv run alembic downgrade -1          # 回滚一个版本
uv run alembic downgrade abc123      # 回滚到指定版本
uv run alembic downgrade base      # 回滚到初始状态
```

### 59.2 数据迁移

```python
# backend/scripts/migrate_data.py
"""数据迁移脚本（用于大版本升级）"""

async def migrate_scenes():
    """迁移场景数据"""
    # 从旧表迁移到新表
    old_scenes = await db.execute("SELECT * FROM old_scenes")
    for scene in old_scenes:
        await db.execute(
            "INSERT INTO scenes (id, name, description) VALUES ($1, $2, $3)",
            scene['id'], scene['name'], scene['description']
        )
```

---

## 六十、性能基准测试

### 60.1 基准测试脚本

```python
# backend/scripts/benchmark.py
import asyncio
import time
from meeting.engine import run_meeting

async def benchmark_meeting():
    """会议性能基准测试"""
    start = time.time()

    # 运行测试会议
    meeting_id = "benchmark-test"
    await run_meeting(meeting_id)

    duration = time.time() - start

    # 指标
    print(f"会议耗时: {duration:.2f}s")
    print(f"Agent 调用次数: {agent_call_count}")
    print(f"平均响应时间: {avg_response_time:.2f}s")
    print(f"达成共识轮次: {consensus_rounds}")

if __name__ == "__main__":
    asyncio.run(benchmark_meeting())
```

### 60.2 负载测试

```bash
# 使用 locust 进行负载测试
pip install locust

# locustfile.py
from locust import HttpUser, task, between

class MeetingUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def list_meetings(self):
        self.client.get("/api/meetings", headers={"X-API-Key": "test-key"})

    @task
    def create_meeting(self):
        self.client.post(
            "/api/meetings",
            json={"scene_id": "test-scene"},
            headers={"X-API-Key": "test-key"}
        )

# 运行负载测试
locust -f locustfile.py --host=http://localhost:18502 --users=10 --spawn-rate=2
```

---

---

## 六十一、Phase 1 详细任务分解

### 61.1 Phase 1: 基础框架（第 1 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P1.1 | 项目初始化 | 1. 创建目录结构<br>2. 创建 pyproject.toml<br>3. 创建 package.json<br>4. 配置 .gitignore | 可安装依赖 | `uv pip install -e .` 成功 |
| P1.2 | 数据模型定义 | 1. 定义 Role/Stage/Scene<br>2. 定义 Message/Round<br>3. 定义 Meeting/MeetingStage<br>4. 添加类型验证 | models.py | `python -c "from meeting.models import *"` 无报错 |
| P1.3 | 场景 YAML 解析器 | 1. 实现 SceneParser.parse()<br>2. 实现验证方法<br>3. 添加错误处理<br>4. 支持变量替换 | scene_parser.py | `pytest tests/test_scene_parser.py -v` |
| P1.4 | 基础 API 框架 | 1. 创建 FastAPI 应用<br>2. 实现健康检查<br>3. 实现 API Key 验证<br>4. 添加 CORS 配置 | main.py | `curl http://localhost:18502/health` 返回 200 |
| P1.5 | 场景 API 骨架 | 1. POST /api/scenes<br>2. GET /api/scenes<br>3. GET /api/scenes/{id}<br>4. 添加参数验证 | api/scenes.py | `curl http://localhost:18502/api/scenes` 返回空列表 |
| P1.6 | 会议 API 骨架 | 1. POST /api/meetings<br>2. GET /api/meetings<br>3. GET /api/meetings/{id}<br>4. POST /start | api/meetings.py | `curl -X POST http://localhost:18502/api/meetings` 返回 201 |
| P1.7 | WebSocket 骨架 | 1. 实现 /ws/meetings/{id}<br>2. 接受连接<br>3. 发送欢迎消息<br>4. 关闭连接 | main.py (ws) | 浏览器访问 ws://localhost:18502/ws/meetings/test 成功连接 |
| P1.8 | CLI 入口 | 1. 创建 meeting __main__.py<br>2. 实现 scene/list/run 命令<br>3. 添加 --help<br>4. 配置 setup.py 入口 | __main__.py | `meeting --help` 显示帮助 |
| P1.9 | 单元测试 | 1. 测试数据模型<br>2. 测试场景解析器<br>3. 测试 API 端点<br>4. 覆盖率 > 60% | tests/ | `pytest --cov=meeting` 通过 |
| P1.10 | 前端项目初始化 | 1. 创建 Vite + React + TS<br>2. 配置 antd<br>3. 配置代理<br>4. 创建路由框架 | frontend/ | `npm run dev` 访问 http://localhost:5173 |

---

## 六十二、Phase 2 详细任务分解

### 62.1 Phase 2: 会议引擎（第 2-3 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P2.1 | 会议引擎核心 | 1. 实现 MeetingEngine 类<br>2. 状态机管理<br>3. 阶段切换逻辑<br>4. 会议生命周期 | engine.py | 单元测试覆盖状态转换 |
| P2.2 | 发言管理 | 1. 实现发言顺序<br>2. 调用 Agent<br>3. 记录消息<br>4. 广播消息 | engine.py | 模拟 Agent 调用，验证消息流程 |
| P2.3 | 共识检测 | 1. 实现关键词检测<br>2. 实现主持人判断<br>3. 实现投票表决<br>4. 边界条件处理 | engine.py | 测试用例覆盖 3 种方法 |
| P2.4 | WebSocket 管理 | 1. 实现 WebSocketManager<br>2. 消息广播<br>3. 连接管理<br>4. 消息缓存 | ws_manager.py | 多客户端连接测试 |
| P2.5 | Agent 适配层 | 1. 定义 BaseMeetingAgent<br>2. 实现 Claude 适配器<br>3. 实现 OpenAI 适配器<br>4. 实现 Hermes 适配器 | adapters/ | 每个适配器单元测试 |
| P2.6 | 上下文管理 | 1. 实现 ContextManager<br>2. 消息截断<br>3. 摘要生成<br>4. Token 计算 | context.py | 测试超长消息处理 |
| P2.7 | 状态持久化 | 1. 实现 MeetingStatePersistence<br>2. 检查点保存<br>3. 检查点恢复<br>4. 数据库存储 | store.py | 中断恢复测试 |
| P2.8 | 错误处理 | 1. 定义错误码<br>2. 实现重试逻辑<br>3. 异常恢复<br>4. 错误响应格式 | errors.py | 模拟各种错误场景 |
| P2.9 | 集成测试 | 1. 完整会议流程测试<br>2. 多阶段测试<br>3. 中断恢复测试<br>4. 错误场景测试 | tests/ | 端到端测试通过 |

---

## 六十三、Phase 3 详细任务分解

### 63.1 Phase 3: Agent 适配（第 4 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P3.1 | Claude 适配器 | 1. 实现 anthropic SDK 调用<br>2. 处理流式响应<br>3. 错误处理<br>4. 重试逻辑 | adapters/claude.py | 真实 API 调用测试 |
| P3.2 | OpenAI 适配器 | 1. 实现 openai SDK 调用<br>2. 处理流式响应<br>3. 错误处理<br>4. 重试逻辑 | adapters/openai.py | 真实 API 调用测试 |
| P3.3 | Hermes 适配器 | 1. 实现 CLI 调用<br>2. 解析输出<br>3. 超时处理<br>4. 工作目录管理 | adapters/hermes.py | 本地 Hermes 测试 |
| P3.4 | Claude Code 适配器 | 1. 实现 claude CLI 调用<br>2. ACP 协议处理<br>3. 代码生成<br>4. 超时处理 | adapters/claude_code.py | 本地 Claude Code 测试 |
| P3.5 | 自定义适配器 | 1. 文档说明<br>2. 示例适配器<br>3. 注册机制<br>4. 热加载 | docs/ADAPTERS.md | 用户自定义适配器测试 |
| P3.6 | 适配器测试 | 1. Mock Agent 实现<br>2. 单元测试<br>3. 集成测试<br>4. 性能测试 | tests/test_adapters.py | 测试覆盖率 > 80% |

---

## 六十四、Phase 4 详细任务分解

### 64.1 Phase 4: 用户介入（第 5 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P4.1 | 用户反馈注入 | 1. 实现 wait_for_user_input<br>2. WebSocket 接收反馈<br>3. 注入到下一轮<br>4. 超时处理 | engine.py | 模拟用户输入测试 |
| P4.2 | 阶段批准/驳回 | 1. 实现 approve API<br>2. 实现 reject API<br>3. 驳回后重置<br>4. 驳回次数限制 | api/meetings.py | 批准/驳回流程测试 |
| P4.3 | 会议暂停/恢复 | 1. 实现 pause API<br>2. 实现 resume API<br>3. 状态保存<br>4. 恢复逻辑 | engine.py | 暂停/恢复流程测试 |
| P4.4 | 阶段回退 | 1. 实现回退逻辑<br>2. 状态重置<br>3. 原因记录<br>4. 防止无限循环 | engine.py | 回退场景测试 |
| P4.5 | 手动停止 | 1. 实现 stop API<br>2. 清理资源<br>3. 保存最终状态<br>4. 通知客户端 | engine.py | 停止流程测试 |

---

## 六十五、Phase 5 详细任务分解

### 65.1 Phase 5: Web UI（第 6-7 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P5.1 | 场景列表页 | 1. 实现 SceneList 组件<br>2. 调用 API 获取列表<br>3. 添加创建按钮<br>4. 添加搜索/筛选 | pages/SceneList.tsx | 页面渲染正确 |
| P5.2 | 场景编辑器 | 1. 实现 SceneEditor 组件<br>2. YAML 编辑器（Monaco）<br>3. 实时验证<br>4. 保存/更新 | pages/SceneEditor.tsx | 创建/编辑场景成功 |
| P5.3 | 会议大厅 | 1. 实现 MeetingHall 组件<br>2. 创建会议表单<br>3. 启动会议<br>4. 会议列表 | pages/MeetingHall.tsx | 创建并启动会议 |
| P5.4 | 会议监控页 | 1. 实现 MeetingMonitor 组件<br>2. 消息气泡显示<br>3. 实时更新<br>4. 控制按钮 | pages/MeetingMonitor.tsx | WebSocket 实时更新 |
| P5.5 | 消息气泡 | 1. 实现 ChatBubble 组件<br>2. 不同角色样式<br>3. Markdown 渲染<br>4. 时间戳显示 | components/ChatBubble.tsx | 正确显示消息 |
| P5.6 | 阶段进度 | 1. 实现 StageProgress 组件<br>2. 进度条显示<br>3. 阶段状态<br>4. 点击切换 | components/StageProgress.tsx | 进度更新正确 |
| P5.7 | 会议控制 | 1. 实现 MeetingControls 组件<br>2. 开始/暂停/停止按钮<br>3. 用户反馈输入<br>4. 批准/驳回按钮 | components/MeetingControls.tsx | 控制功能正常 |
| P5.8 | 产出物查看 | 1. 实现 OutputViewer 组件<br>2. Markdown 渲染<br>3. 代码高亮<br>4. 下载功能 | components/OutputViewer.tsx | 产出物显示正确 |
| P5.9 | WebSocket 客户端 | 1. 实现 ws.ts 服务<br>2. 连接管理<br>3. 重连机制<br>4. 消息处理 | services/ws.ts | 重连测试通过 |
| P5.10 | API 客户端 | 1. 实现 api.ts 服务<br>2. 所有 API 端点<br>3. 错误处理<br>4. 类型定义 | services/api.ts | API 调用成功 |

---

## 六十六、Phase 6 详细任务分解

### 66.1 Phase 6: 产出物生成（第 8 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P6.1 | Markdown 生成 | 1. 实现 Markdown 模板<br>2. 从消息生成<br>3. 格式化输出<br>4. 保存文件 | outputs/markdown.py | 生成正确的 Markdown |
| P6.2 | 代码生成 | 1. 实现 Claude Code 调用<br>2. 代码文件生成<br>3. 目录结构<br>4. 保存文件 | outputs/code.py | 生成可运行的代码 |
| P6.3 | JSON 生成 | 1. 实现结构化提取<br>2. 验证 JSON 格式<br>3. 保存文件<br>4. 错误处理 | outputs/json_output.py | 生成有效的 JSON |
| P6.4 | Mermaid 生成 | 1. 实现图表生成<br>2. 流程图/架构图<br>3. 保存文件<br>4. 渲染预览 | outputs/mermaid.py | 生成有效的 Mermaid |
| P6.5 | 导出功能 | 1. 实现导出 API<br>2. Markdown 导出<br>3. JSON 导出<br>4. HTML 导出 | api/export.py | 导出文件正确 |
| P6.6 | 文件管理 | 1. 实现产出物存储<br>2. 目录管理<br>3. 清理旧文件<br>4. 下载服务 | outputs/storage.py | 文件存储正确 |

---

## 六十七、Phase 7 详细任务分解

### 67.1 Phase 7: 测试与优化（第 9 周）

| 任务 ID | 任务描述 | 详细步骤 | 预期产出 | 验证方式 |
|---------|----------|----------|----------|----------|
| P7.1 | 单元测试 | 1. 模型测试<br>2. 引擎测试<br>3. 适配器测试<br>4. API 测试 | tests/ | 覆盖率 > 80% |
| P7.2 | 集成测试 | 1. 完整流程测试<br>2. 多场景测试<br>3. 错误恢复测试<br>4. 并发测试 | tests/integration/ | 所有测试通过 |
| P7.3 | 性能优化 | 1. 数据库查询优化<br>2. 缓存策略<br>3. 异步优化<br>4. 前端优化 | - | 响应时间 < 1s |
| P7.4 | 性能测试 | 1. 负载测试（locust）<br>2. 基准测试<br>3. 内存泄漏检测<br>4. 并发测试 | tests/performance/ | 支持 10+ 并发 |
| P7.5 | 文档完善 | 1. API 文档<br>2. 用户手册<br>3. 开发者指南<br>4. 部署指南 | docs/ | 文档完整 |
| P7.6 | 代码清理 | 1. 代码格式化（ruff）<br>2. 类型检查（mypy）<br>3. 删除废弃代码<br>4. 注释完善 | - | 无 lint 错误 |
| P7.7 | 发布准备 | 1. 版本号更新<br>2. CHANGELOG 更新<br>3. Git tag<br>4. GitHub Release | - | 发布包可用 |

---

---

## 六十八、前端状态管理

### 68.1 状态管理方案

选择 **Zustand**（轻量级，TypeScript 友好）

```bash
cd frontend
npm install zustand
```

### 68.2 状态定义

```typescript
// frontend/src/stores/meetingStore.ts
import { create } from 'zustand';

interface MeetingState {
  // 场景列表
  scenes: Scene[];
  scenesLoading: boolean;

  // 会议列表
  meettings: Meeting[];
  currentMeeting: Meeting | null;

  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  // Actions
  fetchScenes: () => Promise<void>;
  fetchMeetings: () => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useMeetingStore = create<MeetingState>((set, get) => ({
  // 初始状态
  scenes: [],
  scenesLoading: false,
  meettings: [],
  currentMeeting: null,
  sidebarCollapsed: false,
  theme: 'light',

  // Actions
  fetchScenes: async () => {
    set({ scenesLoading: true });
    try {
      const response = await api.getScenes();
      set({ scenes: response.items, scenesLoading: false });
    } catch (error) {
      set({ scenesLoading: false });
      message.error('获取场景列表失败');
    }
  },

  fetchMeetings: async () => {
    try {
      const response = await api.getMeetings();
      set({ meettings: response.items });
    } catch (error) {
      message.error('获取会议列表失败');
    }
  },

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => set({ theme }),
}));
```

### 68.3 在组件中使用

```typescript
// frontend/src/pages/SceneList.tsx
import { useMeetingStore } from '../stores/meetingStore';

export function SceneList() {
  const { scenes, scenesLoading, fetchScenes } = useMeetingStore();

  useEffect(() => {
    fetchScenes();
  }, []);

  return (
    <div>
      {scenesLoading ? <Spin /> : (
        <List
          dataSource={scenes}
          renderItem={(scene) => <Card>{scene.name}</Card>}
        />
      )}
    </div>
  );
}
```

---

## 六十九、前端测试策略

### 69.1 测试工具

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

### 69.2 单元测试示例

```typescript
// frontend/src/components/__tests__/ChatBubble.test.tsx
import { render, screen } from '@testing-library/react';
import { ChatBubble } from '../ChatBubble';

describe('ChatBubble', () => {
  it('renders agent message correctly', () => {
    render(
      <ChatBubble
        roleId="architect"
        roleName="架构师"
        content="这是技术方案"
        role="agent"
        timestamp="2026-05-05T12:00:00Z"
      />
    );

    expect(screen.getByText('架构师')).toBeInTheDocument();
    expect(screen.getByText('这是技术方案')).toBeInTheDocument();
  });

  it('applies correct style for agent', () => {
    render(
      <ChatBubble
        roleId="architect"
        roleName="架构师"
        content="test"
        role="agent"
        timestamp="2026-05-05T12:00:00Z"
      />
    );

    const bubble = screen.getByTestId('chat-bubble');
    expect(bubble).toHaveClass('agent');
  });
});
```

### 69.3 E2E 测试

```bash
cd frontend
npm install -D playwright @playwright/test
```

```typescript
// frontend/e2e/meeting.spec.ts
import { test, expect } from '@playwright/test';

test('create and start meeting', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // 点击创建会议按钮
  await page.click('text=创建会议');

  // 选择场景
  await page.selectOption('select[name="scene"]', 'code-development');

  // 点击启动
  await page.click('text=启动会议');

  // 验证跳转到监控页
  await expect(page).toHaveURL(/.*meetings\/.*/);

  // 验证会议状态
  await expect(page.locator('text=running')).toBeVisible();
});
```

### 69.4 测试配置

```typescript
// frontend/vitest.config.ts
import { defineConfig } from 'vitest';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        branches: 80,
        functions: 80,
        statements: 80,
      },
    },
  },
});
```

---

## 七十、会话管理

### 70.1 多会话管理

```python
# backend/meeting/session_manager.py
from typing import Dict
from datetime import datetime

class SessionManager:
    """管理多个会议会话"""

    def __init__(self):
        self.active_sessions: Dict[str, dict] = {}

    def register_session(self, meeting_id: str, task: asyncio.Task):
        """注册会话"""
        self.active_sessions[meeting_id] = {
            'task': task,
            'started_at': datetime.now(),
            'status': 'running'
        }

    def unregister_session(self, meeting_id: str):
        """注销会话"""
        if meeting_id in self.active_sessions:
            del self.active_sessions[meeting_id]

    def get_active_sessions(self) -> list:
        """获取活跃会话列表"""
        return [
            {
                'meeting_id': mid,
                'started_at': info['started_at'].isoformat(),
                'duration': (datetime.now() - info['started_at']).seconds
            }
            for mid, info in self.active_sessions.items()
        ]

    def terminate_session(self, meeting_id: str):
        """终止会话"""
        if meeting_id in self.active_sessions:
            task = self.active_sessions[meeting_id]['task']
            task.cancel()
            self.unregister_session(meeting_id)
```

### 70.2 资源限制

```python
# backend/config/settings.yaml
resources:
  max_concurrent_meetings: 5      # 最大并发会议数
  max_rounds_per_meeting: 100    # 单会议最大轮次
  max_message_length: 10000      # 单条消息最大长度
  max_meeting_duration: 3600     # 单会议最大时长（秒）
  max_agent_timeout: 300          # Agent 最大超时（秒）
```

```python
# backend/meeting/resource_limiter.py
class ResourceLimiter:
    """资源限制器"""

    def __init__(self, config: dict):
        self.max_meetings = config.get('max_concurrent_meetings', 5)
        self.max_duration = config.get('max_meeting_duration', 3600)
        self.session_manager = SessionManager()

    def can_start_meeting(self) -> tuple[bool, str]:
        """检查是否可以启动新会议"""
        active = len(self.session_manager.active_sessions)

        if active >= self.max_meetings:
            return False, f"已达到最大并发会议数（{self.max_meetings}）"

        return True, "ok"

    def check_meeting_duration(self, meeting_id: str) -> tuple[bool, str]:
        """检查会议时长"""
        # 实现检查逻辑
        pass
```

---

---

## 七十一、技术选型理由

### 71.1 后端技术栈

| 技术 | 选型理由 | 替代方案 | 不选原因 |
|------|----------|----------|----------|
| **Python 3.11+** | 1. AI生态丰富（LangChain等）<br>2. 异步支持好（asyncio）<br>3. 开发效率高 | Go, Node.js, Rust | Go：AI库少<br>Node.js：异步复杂<br>Rust：学习曲线陡 |
| **FastAPI** | 1. 原生异步支持<br>2. 自动生成API文档<br>3. 数据验证（Pydantic）<br>4. 性能优秀 | Flask, Django, Sanic | Flask：功能太少<br>Django：过于重量级<br>Sanic：生态较小 |
| **PostgreSQL** | 1. 功能强大（JSONB）<br>2. 可靠稳定<br>3. 开源免费 | MySQL, MongoDB, SQLite | MySQL：JSON支持弱<br>MongoDB：无事务<br>SQLite：并发差 |
| **uv包管理** | 1. 速度快（Rust实现）<br>2. 兼容pip<br>3. 虚拟环境管理 | pip, poetry, conda | pip：无依赖解析<br>poetry：速度慢<br>conda：过于重量级 |
| **Pydantic v2** | 1. 数据验证强大<br>2. 类型提示支持好<br>3. FastAPI原生集成 | dataclass, marshmallow | dataclass：验证弱<br>marshmallow：语法复杂 |

### 71.2 前端技术栈

| 技术 | 选型理由 | 替代方案 | 不选原因 |
|------|----------|----------|----------|
| **React 18** | 1. 生态丰富<br>2. 组件化开发<br>3. 社区活跃 | Vue, Angular, Svelte | Vue：生态较小<br>Angular：过于重量级<br>Svelte：生态小 |
| **TypeScript** | 1. 类型安全<br>2. IDE支持好<br>3. 重构方便 | JavaScript, Flow | JS：无类型检查<br>Flow：已过时 |
| **Vite** | 1. 构建速度快<br>2. 开发体验好<br>3. 原生ES模块支持 | Webpack, CRA, Parcel | Webpack：配置复杂<br>CRA：已废弃<br>Parcel：生态小 |
| **antd 5.x** | 1. 组件丰富<br>2. 设计美观<br>3. TypeScript支持好 | MUI, Chakra, Tailwind | MUI：体积大<br>Chakra：组件少<br>Tailwind：需手写样式 |
| **Zustand** | 1. 轻量级<br>2. TypeScript友好<br>3. 学习成本低 | Redux, MobX, Context | Redux：样板代码多<br>MobX：学习曲线陡<br>Context：性能差 |
| **React Flow** | 1. 流程图专用<br>2. React生态集成好<br>3. 可定制性强 | D3.js, GoJS | D3：学习曲线陡<br>GoJS：商业授权 |

### 71.3 Agent适配技术

| 技术 | 选型理由 | 替代方案 |
|------|----------|----------|
| **anthropic SDK** | 官方SDK，稳定可靠 | 直接HTTP调用 |
| **openai SDK** | 官方SDK，功能完整 | 直接HTTP调用 |
| **Hermes CLI** | 本地部署，隐私保护 | API调用 |
| **Claude Code CLI** | 代码生成专用 | 其他代码生成器 |

---

## 七十二、风险评估矩阵

### 72.1 技术风险

| 风险 | 概率 | 影响 | 应对策略 | 负责人 |
|------|------|------|----------|--------|
| Agent API限流 | 高 | 中 | 1. 实现重试机制<br>2. 使用多个API Key<br>3. 降级处理 | 后端 |
| Agent响应超时 | 高 | 中 | 1. 设置合理超时<br>2. 超时后重试<br>3. 用户可选继续/跳过 | 后端 |
| 数据库写入失败 | 低 | 高 | 1. 事务回滚<br>2. 重试机制<br>3. 数据备份 | 后端 |
| WebSocket断开 | 中 | 中 | 1. 前端自动重连<br>2. 后端消息缓存<br>3. 用户手动刷新 | 前端 |
| 并发会议资源不足 | 中 | 高 | 1. 限制并发数<br>2. 资源监控<br>3. 优雅降级 | 后端 |
| 上下文窗口溢出 | 中 | 中 | 1. 消息截断<br>2. 摘要生成<br>3. 使用更大上下文模型 | 后端 |

### 72.2 项目风险

| 风险 | 概率 | 影响 | 应对策略 | 负责人 |
|------|------|------|----------|--------|
| 开发进度延期 | 中 | 高 | 1. 每日站会<br>2. 任务分解细化<br>3. 预留缓冲时间 | 项目经理 |
| 需求变更频繁 | 中 | 中 | 1. 需求冻结机制<br>2. 变更影响评估<br>3. 版本控制 | 项目经理 |
| 技术难点无法攻克 | 低 | 高 | 1. 技术预研<br>2. 备选方案<br>3. 社区求助 | 技术负责人 |
| 关键人员离职 | 低 | 高 | 1. 文档完善<br>2. 知识共享<br>3. 交叉培训 | 项目经理 |
| 预算超支 | 低 | 中 | 1. 成本监控<br>2. 预算预警<br>3. 优化资源使用 | 项目经理 |

### 72.3 外部依赖风险

| 风险 | 概率 | 影响 | 应对策略 | 负责人 |
|------|------|------|----------|--------|
| Agent API服务下线 | 低 | 高 | 1. 多供应商<br>2. 本地备用方案<br>3. 降级到规则引擎 | 技术负责人 |
| 开源组件漏洞 | 中 | 高 | 1. 定期更新依赖<br>2. 安全扫描<br>3. 漏洞监控 | 技术负责人 |
| GitHub服务中断 | 低 | 中 | 1. 本地镜像<br>2. 备用Git服务<br>3. 离线备份 | 技术负责人 |
| 云服务商故障 | 低 | 高 | 1. 多区域部署<br>2. 备份恢复<br>3. 手动切换 | 运维 |

---

## 七十三、Git分支策略

### 73.1 分支模型

```
main (生产分支)
├── develop (开发分支)
│   ├── feature/scene-parser (功能分支)
│   ├── feature/engine-core
│   └── feature/agent-adapters
├── release/v0.1.0 (发布分支)
├── hotfix/api-timeout (热修复分支)
└── hotfix/security-patch
```

### 73.2 分支规则

| 分支类型 | 命名规范 | 合并目标 | 保护规则 |
|----------|----------|----------|----------|
| **main** | `main` | - | 1. 禁止直接提交<br>2. PR+2个审核<br>3. CI必须通过 |
| **develop** | `develop` | main | 1. PR+1个审核<br>2. CI必须通过 |
| **feature** | `feature/*` | develop | 1. PR合并<br>2. 删除源分支 |
| **release** | `release/*` | main + develop | 1. PR+2个审核<br>2. 版本号更新 |
| **hotfix** | `hotfix/*` | main + develop | 1. PR+2个审核<br>2. 立即发布 |

### 73.3 提交规范

使用 **Conventional Commits**：

```bash
# 功能
git commit -m "feat(engine): 实现共识检测算法"

# 修复
git commit -m "fix(api): 修复会议创建失败问题"

# 文档
git commit -m "docs(readme): 更新快速开始指南"

# 重构
git commit -m "refactor(adapters): 重构Agent适配器"

# 性能
git commit -m "perf(engine): 优化上下文管理性能"

# 测试
git commit -m "test(engine): 添加共识检测测试"

# 构建
git commit -m "chore(deps): 更新fastapi到0.110.0"
```

---

## 七十四、发布流程

### 74.1 发布步骤

```bash
# 1. 从 develop 创建发布分支
git checkout develop
git pull origin develop
git checkout -b release/v0.1.0

# 2. 更新版本号
# 编辑 pyproject.toml, package.json, PLAN.md
git add .
git commit -m "chore: prepare release v0.1.0"

# 3. 运行测试
cd backend && uv run pytest
cd ../frontend && npm test

# 4. 构建前端
cd frontend
npm run build

# 5. 合并到 main
git checkout main
git merge --no-ff release/v0.1.0
git tag v0.1.0
git push origin main --tags

# 6. 合并回 develop
git checkout develop
git merge --no-ff release/v0.1.0
git push origin develop

# 7. 删除发布分支
git branch -d release/v0.1.0
git push origin --delete release/v0.1.0

# 8. 创建 GitHub Release
# 在 GitHub 上创建 Release，包含 CHANGELOG
```

### 74.2 GitHub Release 模板

```markdown
## What's Changed

### Features
- feat: 实现场景YAML解析器 (#1)
- feat: 实现会议引擎核心 (#2)
- feat: 添加 Claude Adapter (#3)

### Fixes
- fix: 修复 WebSocket 断开重连 (#4)
- fix: 修复数据库迁移失败 (#5)

### Breaking Changes
- 无

### Migration Guide
- 无

**Full Changelog**: https://github.com/KingBoyAndGirl/ai-collaboration-meeting/compare/v0.0.1...v0.1.0
```

---

## 七十五、依赖锁定策略

### 75.1 Python 依赖锁定

```bash
# 使用 uv.lock 锁定依赖
cd backend
uv lock

# 从 lock 文件安装
uv pip sync uv.lock

# 更新单个依赖
uv pip update pydantic

# 查看依赖树
uv pip tree
```

### 75.2 Node.js 依赖锁定

```bash
# package-lock.json 自动生成
cd frontend
npm install

# 从 lock 文件安装
npm ci

# 更新单个依赖
npm update antd

# 查看依赖树
npm list
```

### 75.3 依赖安全扫描

```bash
# Python 依赖扫描
pip install pip-audit
pip-audit

# Node.js 依赖扫描
npm audit
npm audit fix  # 自动修复

# 使用 Snyk（可选）
npm install -g snyk
snyk test
```

---

---

## 七十六、移动端适配

### 76.1 响应式设计

使用 antd 的响应式组件 + CSS Media Queries：

```typescript
// frontend/src/styles/responsive.ts
export const breakpoints = {
  xs: 480,   // 超小屏（手机竖屏）
  sm: 576,   // 小屏（手机横屏）
  md: 768,   // 中等屏（平板竖屏）
  lg: 992,   // 大屏（平板横屏/小桌面）
  xl: 1200,  // 超大屏（桌面）
};

export const media = {
  xs: `@media (max-width: ${breakpoints.xs}px)`,
  sm: `@media (max-width: ${breakpoints.sm}px)`,
  md: `@media (max-width: ${breakpoints.md}px)`,
  lg: `@media (max-width: ${breakpoints.lg}px)`,
  xl: `@media (max-width: ${breakpoints.xl}px)`,
};
```

### 76.2 移动端布局调整

```typescript
// frontend/src/pages/MeetingMonitor.tsx
import { useMediaQuery } from 'react-responsive';

export function MeetingMonitor() {
  const isMobile = useMediaQuery({ maxWidth: 768 });

  return (
    <div className={styles.monitorContainer}>
      {/* 桌面端：侧边栏 + 主内容 */}
      {!isMobile && <Sidebar />}

      <div className={styles.mainContent}>
        {/* 移动端：下拉菜单代替侧边栏 */}
        {isMobile && (
          <Select
            value={currentStage}
            onChange={setCurrentStage}
            options={stages}
            style={{ width: '100%', marginBottom: 16 }}
          />
        )}

        <MessageList />
        <InputArea />
      </div>
    </div>
  );
}
```

### 76.3 触摸优化

```css
/* frontend/src/styles/mobile.css */

/* 增大点击区域 */
.ant-btn, .ant-select-selector {
  min-height: 44px;  /* Apple 推荐最小触摸目标 */
}

/* 防止文本选择干扰触摸 */
.message-bubble {
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 优化滚动 */
.chat-container {
  -webkit-overflow-scrolling: touch;  /* iOS 平滑滚动 */
  overflow-y: auto;
  overscroll-behavior: contain;  /* 防止滚动穿透 */
}

/* 移动端隐藏部分元素 */
@media (max-width: 768px) {
  .desktop-only {
    display: none !important;
  }

  .mobile-full-width {
    width: 100% !important;
    padding: 8px !important;
  }
}
```

### 76.4 移动端测试

```bash
# 使用 Chrome DevTools 模拟移动设备
# 1. 打开 Chrome
# 2. F12 打开 DevTools
# 3. Ctrl+Shift+M 切换到设备模拟
# 4. 选择 iPhone/Android 设备

# 或使用 Playwright 移动端测试
npm install -D playwright @playwright/test
```

```typescript
// frontend/e2e/mobile.spec.ts
import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('mobile meeting monitor', async ({ page }) => {
  await page.goto('http://localhost:5173/meetings/123');

  // 验证移动端布局
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('select')).toBeVisible();

  // 验证触摸操作
  await page.tap('text=批准');
  await expect(page.locator('text=已批准')).toBeVisible();
});
```

### 76.5 移动端已知问题

| 问题 | 解决方案 |
|------|----------|
| iOS Safari 100vh 问题 | 使用 `window.innerHeight` 动态计算高度 |
| 软键盘弹出遮挡输入框 | 监听 `resize` 事件，滚动到输入框 |
| 双击缩放干扰 | 设置 `touch-action: manipulation` |
| 滚动回弹效果 | 使用 `overscroll-behavior: contain` |
| WebSocket 在后台挂起 | 实现可见性 API 检测，页面隐藏时暂停 |

---

## 七十七、浏览器兼容性

### 77.1 支持矩阵

| 浏览器 | 最低版本 | 备注 |
|--------|----------|------|
| **Chrome** | 90+ | 完全支持 |
| **Edge** | 90+ | 完全支持 |
| **Firefox** | 88+ | 完全支持 |
| **Safari** | 15+ | 完全支持 |
| **iOS Safari** | 15+ | 需测试触摸事件 |
| **Chrome Android** | 90+ | 需测试触摸事件 |
| **IE** | ❌ | 不支持（不使用 ES5 转译） |

### 77.2 Polyfill 配置

```bash
cd frontend
npm install core-js regenerator-runtime
```

```typescript
// frontend/src/main.tsx
import 'core-js/stable';
import 'regenerator-runtime/runtime';

// 可选：按需加载 polyfill
if (!('IntersectionObserver' in window)) {
  import('intersection-observer');
}
```

### 77.3 Vite 配置

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: ['chrome90', 'edge90', 'firefox88', 'safari15'],
    // 或
    // target: 'es2015',  // 支持更老的浏览器
  },
});
```

---

## 七十八、前端性能优化

### 78.1 代码分割

```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';

// 懒加载页面组件
const SceneList = lazy(() => import('./pages/SceneList'));
const MeetingMonitor = lazy(() => import('./pages/MeetingMonitor'));

function App() {
  return (
    <Suspense fallback={<Spin size="large" />}>
      <Routes>
        <Route path="/scenes" element={<SceneList />} />
        <Route path="/meetings/:id" element={<MeetingMonitor />} />
      </Routes>
    </Suspense>
  );
}
```

### 78.2 虚拟滚动

```bash
cd frontend
npm install react-window
```

```typescript
// frontend/src/components/MessageList.tsx
import { FixedSizeList as List } from 'react-window';

function MessageList({ messages }) {
  return (
    <List
      height={600}
      itemCount={messages.length}
      itemSize={100}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <ChatBubble message={messages[index]} />
        </div>
      )}
    </List>
  );
}
```

### 78.3 图片优化

```typescript
// frontend/src/components/Avatar.tsx
import { lazy, Suspense } from 'react';

// 使用 loading="lazy" 延迟加载图片
function Avatar({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => { e.target.src = '/default-avatar.png'; }}
    />
  );
}

// 或使用 blurhash 占位符
// npm install blurhash
```

### 78.4 防抖/节流

```typescript
// frontend/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// 使用
function SearchInput() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) {
      api.searchScenes(debouncedQuery);
    }
  }, [debouncedQuery]);

  return <Input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### 78.5 性能监控

```typescript
// frontend/src/utils/performance.ts
export function measurePerformance() {
  // 页面加载时间
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('页面加载时间:', pageLoadTime, 'ms');
  });

  // 首次内容绘制（FCP）
  new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      console.log('FCP:', entry.startTime, 'ms');
    }
  }).observe({ type: 'paint', buffered: true });
}
```

---

## 七十九、SLA/SLO 定义

### 79.1 服务级别目标

| 指标 | SLO 目标 | 测量方式 |
|------|----------|----------|
| **API 可用性** | 99.9% | 健康检查端点探测 |
| **API 响应时间（P95）** | < 500ms | 服务端日志 |
| **API 响应时间（P99）** | < 1s | 服务端日志 |
| **WebSocket 连接成功率** | 99.5% | 客户端上报 |
| **数据库查询时间（P95）** | < 100ms | 数据库日志 |
| **前端页面加载时间（FCP）** | < 2s | Performance API |
| **前端交互响应时间** | < 100ms | Performance API |

### 79.2 错误预算

```
30 天内允许的错误数 = (1 - SLO) × 总请求数
= (1 - 0.999) × 1,000,000
= 1,000 次错误

如果错误数超过预算，暂停新功能发布，专注稳定性。
```

### 79.3 告警规则

```yaml
# backend/monitoring/alerts.yaml
alerts:
  - name: HighErrorRate
    condition: "error_rate > 1% for 5m"
    severity: critical
    notification: ["telegram", "email"]

  - name: SlowAPIResponse
    condition: "p95_latency > 1s for 5m"
    severity: warning
    notification: ["telegram"]

  - name: WebSocketDisconnects
    condition: "ws_disconnect_rate > 5% for 5m"
    severity: warning
    notification: ["telegram"]
```

---

## 八十、容量规划

### 80.1 单会议资源估算

| 资源 | 估算值 | 说明 |
|------|--------|------|
| **内存** | 100-500MB | 取决于上下文长度、消息缓存 |
| **CPU** | 0.5-2 核 | 取决于 Agent 调用频率 |
| **磁盘** | 10-100MB | 产出物、日志、数据库 |
| **网络** | 1-10MB/min | Agent API 调用、WebSocket |
| **数据库** | 10-50MB | 会议记录、消息存储 |

### 80.2 多会议并发估算

假设单服务器配置：4核CPU，8GB内存，100GB磁盘

| 并发会议数 | 内存使用 | CPU 使用 | 磁盘使用 | 备注 |
|------------|----------|----------|----------|------|
| 1 | ~200MB | ~10% | ~20MB | 轻松 |
| 5 | ~1GB | ~50% | ~100MB | 正常 |
| 10 | ~2GB | ~80% | ~200MB | 接近上限 |
| 20 | ~4GB | ~100% | ~400MB | 可能卡顿 |

**建议**：生产环境限制并发会议数 ≤ 5。

### 80.3 扩展方案

```python
# backend/config/settings.yaml
scaling:
  strategy: "horizontal"  # 或 "vertical"

  # 水平扩展（多实例）
  horizontal:
    max_instances: 3
    load_balancer: "round-robin"

  # 垂直扩展（单实例增强）
  vertical:
    max_concurrent_meetings: 5
    max_memory_per_meeting: 512MB
```

---

---

## 八十一、快速开始指南

### 81.1 5分钟快速体验

```bash
# 1. 克隆项目
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting.git
cd ai-collaboration-meeting

# 2. 一键启动（推荐）
./scripts/quickstart.sh

# 或手动启动：

# 3. 启动后端
cd backend
uv sync
cp .env.example .env  # 编辑 .env，填入 API Key
uv run uvicorn meeting.main:app --host 0.0.0.0 --port 18502 &

# 4. 启动前端
cd ../frontend
npm install
npm run dev -- --port 18501 &

# 5. 访问
open http://localhost:18501
```

### 81.2 创建第一个会议

1. **访问场景列表**：点击左侧 "场景管理"
2. **创建场景**：点击 "新建场景"，粘贴示例 YAML（见 27.1 节）
3. **启动会议**：点击 "会议大厅" → "创建会议" → 选择场景 → "启动"
4. **监控会议**：自动跳转到监控页，观察 Agent 讨论
5. **介入讨论**：在底部输入框输入反馈，按 Enter 发送
6. **查看结果**：会议结束后，点击 "查看产出物"

### 81.3 示例场景（最小可用）

```yaml
# examples/minimal-scene.yaml
name: "快速测试"
description: "最小场景，2个Agent讨论一个问题"
version: "1.0"

roles:
  - id: thinker
    name: "思考者"
    agent: hermes
    system_prompt: "你是一个思考者，给出简洁想法。"

  - id: reviewer
    name: "评审者"
    agent: hermes
    system_prompt: "你是一个评审者，评审想法。"

stages:
  - name: "讨论"
    rounds: 2
    speaker_order: ["thinker", "reviewer"]
    max_tokens: 200

outputs:
  - type: markdown
    file: "output.md"
```

### 81.4 常见问题快速排查

| 问题 | 解决方案 |
|------|----------|
| 后端启动失败 | 检查 Python 3.11+ 和 uv 是否安装 |
| 前端启动失败 | 检查 Node.js 18+ 是否安装 |
| 无法创建会议 | 检查 .env 中 API Key 是否正确 |
| Agent 无响应 | 检查 API Key 配额、网络连通性 |
| WebSocket 连接失败 | 检查后端是否运行在 18502 端口 |

---

## 八十二、调试指南

### 82.1 后端调试

```bash
# 使用 debugpy 远程调试
cd backend
uv add debugpy

# 修改 main.py，添加：
# import debugpy
# debugpy.listen(("0.0.0.0", 5678))

# 启动后端
uv run uvicorn meeting.main:app --host 0.0.0.0 --port 18502

# VSCode 配置 .vscode/launch.json：
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "debugpy",
      "request": "attach",
      "name": "Attach to Backend",
      "connect": { "host": "localhost", "port": 5678 }
    }
  ]
}
```

### 82.2 前端调试

```bash
# 使用 Chrome DevTools
# 1. 启动前端：npm run dev
# 2. 打开 Chrome，访问 http://localhost:18501
# 3. F12 打开 DevTools
# 4. Sources 标签：设置断点
# 5. Console 标签：查看日志

# React DevTools
# Chrome 应用商店安装 React Developer Tools

# 网络请求查看
# Network 标签：查看 API 请求和 WebSocket 帧
```

### 82.3 日志查看

```bash
# 后端日志（systemd）
journalctl --user -u meeting-backend.service -f

# 后端日志（手动启动）
# 日志在终端输出，或重定向到文件：
uv run uvicorn meeting.main:app ... > /tmp/meeting.log 2>&1

# 前端日志
# Chrome DevTools → Console

# WebSocket 消息查看
# Chrome DevTools → Network → WS → 点击连接 → Messages
```

### 82.4 数据库查询

```bash
# 连接 PostgreSQL
psql -h postgresql.nasw.heiyu.space -p 54321 -U postgres -d meeting

# 常用查询
\dt  # 列出所有表
\d meetings  # 查看表结构
SELECT * FROM meetings LIMIT 10;
SELECT id, name, status, created_at FROM meetings ORDER BY created_at DESC;
DELETE FROM meetings WHERE status = 'failed';  # 清理失败会议
```

### 82.5 性能分析

```python
# backend 性能分析
# 安装：uv add py-spy

# 实时查看 CPU 使用
py-spy top --pid $(pgrep -f "uvicorn meeting.main:app")

# 生成火焰图
py-spy record -o /tmp/profile.svg --pid $(pgrep -f "uvicorn meeting.main:app")

# 或在代码中添加计时
import time
start = time.time()
# ... 代码 ...
print(f"耗时: {time.time() - start:.2f}s")
```

---

## 八十三、架构决策记录（ADR）

### ADR-001：为什么选择 Python + FastAPI？

**状态**：已接受

**背景**：
需要选择一个后端技术栈，要求：异步支持好、AI生态丰富、开发效率高。

**决策**：
选择 Python 3.11+ + FastAPI。

**理由**：
1. Python AI生态最丰富（LangChain、anthropic SDK等）
2. FastAPI 原生异步支持，性能优秀
3. Pydantic 数据验证强大
4. 自动生成 API 文档

**替代方案**：
- Go：AI库少，放弃
- Node.js：异步代码复杂，放弃
- Rust：学习曲线陡，开发效率低

**后果**：
- 正面：开发效率高，AI集成方便
- 负面：性能不如 Go/Rust（但够用）

---

### ADR-002：为什么选择 React + TypeScript？

**状态**：已接受

**背景**：
需要选择前端框架，要求：组件化、类型安全、生态丰富。

**决策**：
选择 React 18 + TypeScript。

**理由**：
1. React 生态最丰富（antd、React Flow等）
2. TypeScript 类型安全，重构方便
3. Vite 构建速度快

**替代方案**：
- Vue：生态较小，放弃
- Angular：过于重量级，放弃
- Svelte：生态太小，放弃

**后果**：
- 正面：组件复用方便，类型错误提前发现
- 负面：学习曲线略高（但值得）

---

### ADR-003：为什么选择 WebSocket 实时通信？

**状态**：已接受

**背景**：
会议过程中需要实时推送消息给前端。

**决策**：
使用 WebSocket（FastAPI + WebSocket）。

**理由**：
1. 双向实时通信
2. FastAPI 原生支持
3. 浏览器原生支持

**替代方案**：
- 长轮询：延迟高，放弃
- Server-Sent Events：单向，不够灵活
- gRPC-Web：复杂度高

**后果**：
- 正面：实时性好，用户体验佳
- 负面：需要处理重连、心跳等

---

### ADR-004：为什么选择 Zustand 而不是 Redux？

**状态**：已接受

**背景**：
需要选择前端状态管理方案。

**决策**：
选择 Zustand。

**理由**：
1. 轻量级，无样板代码
2. TypeScript 友好
3. 学习成本低

**替代方案**：
- Redux：样板代码太多，放弃
- MobX：学习曲线陡
- Context API：性能差，不适合复杂状态

**后果**：
- 正面：代码简洁，开发效率高
- 负面：生态不如 Redux 丰富（但够用）

---

## 八十四、未来路线图

### 84.1 v0.2 规划（预计 2026 Q3）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **多用户支持** | 用户注册/登录、权限管理 | P0 |
| **会议模板市场** | 社区共享场景模板 | P1 |
| **会议回放** | 重放历史会议，支持倍速 | P1 |
| **成本追踪** | 追踪每个会议的 API 调用成本 | P2 |
| **插件系统** | 类似 VSCode 的插件架构 | P2 |
| **国际化和本地化** | 支持英文界面 | P2 |

### 84.2 v1.0 规划（预计 2026 Q4）

| 功能 | 描述 | 优先级 |
|------|------|--------|
| **分布式部署** | 支持多实例负载均衡 | P0 |
| **企业级安全** | SSO、审计日志、数据加密 | P0 |
| **A/B 测试** | 不同 Agent 配置对比测试 | P1 |
| **会议录制导出** | 导出为视频/PDF | P1 |
| **AI 辅助优化** | AI 自动优化场景配置 | P2 |

### 84.3 技术债务

| 债务 | 描述 | 解决方案 | 计划版本 |
|------|------|----------|----------|
| **数据库无索引** | 某些查询未加索引 | 添加索引 | v0.2 |
| **前端无 SSR** | 首屏加载慢 | 引入 Next.js | v1.0 |
| **测试覆盖率低** | 部分模块无测试 | 补充测试 | v0.2 |
| **文档不完整** | 部分功能无文档 | 补充文档 | v0.2 |
| **错误提示不友好** | 部分错误提示晦涩 | 优化提示 | v0.2 |

---

---

## 八十五、项目目录结构

### 85.1 完整目录树

```
ai-collaboration-meeting/
├── backend/                      # 后端服务
│   ├── meeting/                  # 主包
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── models.py            # 数据模型（Pydantic）
│   │   ├── database.py          # SQLAlchemy 模型
│   │   ├── scene_parser.py      # 场景 YAML 解析器
│   │   ├── engine.py            # 会议引擎核心
│   │   ├── context.py           # 上下文管理
│   │   ├── errors.py            # 错误定义
│   │   ├── store.py             # 状态持久化
│   │   ├── ws_manager.py        # WebSocket 管理
│   │   ├── session_manager.py   # 会话管理
│   │   ├── resource_limiter.py  # 资源限制
│   │   ├── outputs/             # 产出物生成
│   │   │   ├── __init__.py
│   │   │   ├── markdown.py
│   │   │   ├── code.py
│   │   │   ├── json_output.py
│   │   │   ├── mermaid.py
│   │   │   └── storage.py
│   │   ├── adapters/            # Agent 适配器
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   ├── claude.py
│   │   │   ├── openai.py
│   │   │   ├── hermes.py
│   │   │   └── claude_code.py
│   │   └── api/                # API 路由
│   │       ├── __init__.py
│   │       ├── scenes.py
│   │       ├── meetings.py
│   │       └── export.py
│   ├── tests/                  # 后端测试
│   │   ├── __init__.py
│   │   ├── test_models.py
│   │   ├── test_scene_parser.py
│   │   ├── test_engine.py
│   │   ├── test_api.py
│   │   └── integration/
│   ├── alembic/               # 数据库迁移
│   │   ├── versions/
│   │   └── env.py
│   ├── .env.example           # 环境变量示例
│   ├── pyproject.toml        # Python 项目配置
│   └── uv.lock               # 依赖锁定
│
├── frontend/                   # 前端项目
│   ├── src/
│   │   ├── main.tsx           # 入口文件
│   │   ├── App.tsx            # 根组件
│   │   ├── pages/             # 页面组件
│   │   │   ├── SceneList.tsx
│   │   │   ├── SceneEditor.tsx
│   │   │   ├── MeetingHall.tsx
│   │   │   └── MeetingMonitor.tsx
│   │   ├── components/         # 通用组件
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── StageProgress.tsx
│   │   │   ├── MeetingControls.tsx
│   │   │   └── OutputViewer.tsx
│   │   ├── stores/            # 状态管理
│   │   │   └── meetingStore.ts
│   │   ├── services/          # API/WS 服务
│   │   │   ├── api.ts
│   │   │   └── ws.ts
│   │   ├── styles/            # 样式文件
│   │   │   ├── global.css
│   │   │   ├── responsive.ts
│   │   │   └── mobile.css
│   │   └── utils/            # 工具函数
│   │       └── performance.ts
│   ├── public/                # 静态资源
│   ├── tests/                 # 前端测试
│   ├── e2e/                  # E2E 测试
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── examples/                  # 示例场景
│   ├── code-development.yaml
│   ├── architecture-design.yaml
│   ├── requirement-analysis.yaml
│   └── minimal-scene.yaml
│
├── scripts/                   # 脚本工具
│   ├── quickstart.sh          # 快速开始
│   ├── backup.sh              # 备份脚本
│   ├── restore.sh             # 恢复脚本
│   └── deploy.sh             # 部署脚本
│
├── docs/                      # 文档
│   ├── ADR-001-fastapi.md
│   ├── ADR-002-react.md
│   └── API.md
│
├── .github/                   # GitHub 配置
│   ├── workflows/             # CI/CD
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── docker.yml
│   ├── ISSUE_TEMPLATE/        # Issue 模板
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .gitignore
├── PLAN.md                    # 本计划书
└── README.md                  # 项目说明
```

### 85.2 关键文件说明

| 文件路径 | 说明 | 必须 |
|----------|------|------|
| backend/meeting/main.py | FastAPI 入口，定义路由和 WebSocket | ✅ |
| backend/meeting/engine.py | 会议引擎核心逻辑 | ✅ |
| backend/meeting/models.py | Pydantic 数据模型 | ✅ |
| backend/meeting/database.py | SQLAlchemy 数据库模型 | ✅ |
| frontend/src/App.tsx | 前端根组件，路由配置 | ✅ |
| frontend/src/pages/MeetingMonitor.tsx | 会议监控页（核心） | ✅ |
| examples/code-development.yaml | 示例代码（用户参考） | ✅ |
| .github/workflows/ci.yml | CI 配置 | 推荐 |
| scripts/quickstart.sh | 快速开始脚本 | 推荐 |

---

## 八十六、环境变量完整列表

### 86.1 后端环境变量（.env）

```bash
# ============ 基础配置 ============
APP_NAME="AI Collaboration Meeting"
APP_VERSION="0.1.0"
DEBUG=true
ENVIRONMENT="development"  # development / staging / production

# ============ 服务配置 ============
HOST="0.0.0.0"
PORT=18502
API_PREFIX="/api"
CORS_ORIGINS=["http://localhost:18501", "http://localhost:5173"]

# ============ 数据库配置 ============
DATABASE_URL="postgresql+asyncpg://postgres:GwKZB3QPrxd75qIXfN8k@postgresql.nasw.heiyu.space:54321/meeting"
DATABASE_POOL_SIZE=10
DATABASE_MAX_OVERFLOW=20

# ============ API Key 配置 ============
ANTHROPIC_API_KEY="sk-ant-xxx"
OPENAI_API_KEY="sk-xxx"
DEEPSEEK_API_KEY=""
QWEN_API_KEY=""

# ============ Agent 配置 ============
DEFAULT_AGENT="hermes"  # hermes / claude / openai
HERMES_CLI_PATH="meeting"  # Hermes CLI 路径
CLAUDE_CLI_PATH="claude"   # Claude Code CLI 路径

# ============ 会议配置 ============
MAX_CONCURRENT_MEETINGS=5
MAX_ROUNDS_PER_MEETING=100
MAX_MESSAGE_LENGTH=10000
MAX_MEETING_DURATION=3600
DEFAULT_MAX_TOKENS=2000
DEFAULT_TEMPERATURE=0.7

# ============ WebSocket 配置 ============
WS_PING_INTERVAL=20
WS_PING_TIMEOUT=20
WS_MAX_QUEUE_SIZE=100

# ============ 日志配置 ============
LOG_LEVEL="INFO"  # DEBUG / INFO / WARNING / ERROR
LOG_FORMAT="json"  # json / text
LOG_FILE="/var/log/meeting/backend.log"

# ============ 安全配置（单用户模式简化） ============
API_KEY_HEADER="X-API-Key"
API_KEY=""  # 留空则不需要认证

# ============ 监控配置 ============
ENABLE_METRICS=true
METRICS_PORT=9090
```

### 86.2 前端环境变量（.env）

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:18502/api
VITE_WS_BASE_URL=ws://localhost:18502/ws
VITE_APP_NAME="AI Meeting"
VITE_APP_VERSION="0.1.0"

# .env.production
VITE_API_BASE_URL=/api
VITE_WS_BASE_URL=/ws
VITE_APP_NAME="AI Meeting"
VITE_APP_VERSION="0.1.0"
```

---

## 八十七、API 端点完整列表

### 87.1 场景管理 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/scenes | 创建场景 | 无 |
| GET | /api/scenes | 列出场景（分页） | 无 |
| GET | /api/scenes/{id} | 获取场景详情 | 无 |
| PUT | /api/scenes/{id} | 更新场景 | 无 |
| DELETE | /api/scenes/{id} | 删除场景 | 无 |
| POST | /api/scenes/validate | 验证场景 YAML | 无 |

### 87.2 会议管理 API

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | /api/meetings | 创建会议 | 无 |
| GET | /api/meetings | 列出会议（分页） | 无 |
| GET | /api/meetings/{id} | 获取会议详情 | 无 |
| POST | /api/meetings/{id}/start | 启动会议 | 无 |
| POST | /api/meetings/{id}/pause | 暂停会议 | 无 |
| POST | /api/meetings/{id}/resume | 恢复会议 | 无 |
| POST | /api/meetings/{id}/stop | 停止会议 | 无 |
| POST | /api/meetings/{id}/approve | 批准当前阶段 | 无 |
| POST | /api/meetings/{id}/reject | 驳回当前阶段 | 无 |
| POST | /api/meetings/{id}/user-input | 提交用户反馈 | 无 |
| GET | /api/meetings/{id}/outputs | 获取产出物列表 | 无 |
| GET | /api/meetings/{id}/outputs/{file} | 下载产出物 | 无 |
| DELETE | /api/meetings/{id} | 删除会议 | 无 |

### 87.3 WebSocket API

| 路径 | 说明 |
|------|------|
| /ws/meetings/{id} | 会议实时消息推送 |

**消息格式**：见 21 章 WebSocket 消息格式

### 87.4 导出 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/export/meetings/{id}/markdown | 导出为 Markdown |
| GET | /api/export/meetings/{id}/json | 导出为 JSON |
| GET | /api/export/meetings/{id}/html | 导出为 HTML |

### 87.5 系统 API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /api/version | 获取版本信息 |
| GET | /api/stats | 获取统计信息（单用户简化） |

---

## 八十八、数据库表结构详细定义

### 88.1 meetings 表

```sql
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    scene_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'created',
    stage_index INTEGER NOT NULL DEFAULT 0,
    round_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    config JSONB NOT NULL DEFAULT '{}',
    outputs JSONB NOT NULL DEFAULT '[]',
    error TEXT,

    -- 索引
    CONSTRAINT chk_status CHECK (status IN ('created', 'running', 'paused', 'completed', 'failed', 'cancelled')),
    CONSTRAINT chk_stage_index CHECK (stage_index >= 0),
    CONSTRAINT chk_round_index CHECK (round_index >= 0)
);

CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);
CREATE INDEX idx_meetings_status_created ON meetings(status, created_at DESC);
```

### 88.2 messages 表

```sql
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    stage_index INTEGER NOT NULL,
    round_index INTEGER NOT NULL,
    role_id VARCHAR(50) NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- 索引
    CONSTRAINT fk_meeting FOREIGN KEY (meeting_id) REFERENCES meetings(id),
    CONSTRAINT chk_role CHECK (role IN ('agent', 'moderator', 'user'))
);

CREATE INDEX idx_messages_meeting_id ON messages(meeting_id);
CREATE INDEX idx_messages_meeting_stage ON messages(meeting_id, stage_index, round_index);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
```

### 88.3 scenes 表（可选，场景也可存在文件系统）

```sql
CREATE TABLE scenes (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL,
    yaml_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scenes_updated_at ON scenes(updated_at DESC);
```

### 88.4 性能优化建议

```sql
-- 查询活跃会议
CREATE INDEX CONCURRENTLY idx_meetings_active
ON meetings(status) WHERE status IN ('running', 'paused');

-- 查询会议消息（分页）
CREATE INDEX CONCURRENTLY idx_messages_pagination
ON messages(meeting_id, timestamp DESC);

-- 定期清理旧数据（可选）
-- CREATE TABLE meetings_archive (LIKE meetings INCLUDING ALL);
-- INSERT INTO meetings_archive SELECT * FROM meetings WHERE ended_at < NOW() - INTERVAL '30 days';
-- DELETE FROM meetings WHERE ended_at < NOW() - INTERVAL '30 days';
```

---

---

## 八十九、发布前检查清单

### 89.1 功能检查

```markdown
## 发布前功能检查清单

### 基础功能
- [ ] 场景YAML解析正确（所有示例）
- [ ] 场景创建/编辑/删除正常
- [ ] 会议创建并启动成功
- [ ] Agent发言正常（Claude/OpenAI/Hermes）
- [ ] 用户反馈注入正常
- [ ] 阶段批准/驳回正常
- [ ] 会议暂停/恢复正常
- [ ] 会议停止正常
- [ ] 产出物生成正确（Markdown/JSON/Mermaid）
- [ ] 产出物下载正常

### 用户交互
- [ ] WebSocket实时更新正常
- [ ] 消息气泡显示正确（角色区分）
- [ ] 阶段进度显示正确
- [ ] 控制按钮状态正确
- [ ] 用户反馈输入框正常
- [ ] 错误提示友好易懂
- [ ] 加载状态显示正确

### 错误处理
- [ ] Agent API失败有提示
- [ ] 网络断开有提示和重连
- [ ] 参数错误有提示
- [ ] 超时处理正确
- [ ] 并发限制提示正确

### 性能
- [ ] 页面加载时间 < 2s
- [ ] API响应时间（P95）< 500ms
- [ ] WebSocket连接成功
- [ ] 长时间会议无内存泄漏
- [ ] 大量消息不卡顿（虚拟滚动）

### 兼容性
- [ ] Chrome 90+ 正常
- [ ] Firefox 88+ 正常
- [ ] Safari 15+ 正常
- [ ] 移动端（iOS Safari 15+）正常
- [ ] 移动端（Chrome Android 90+）正常
```

### 89.2 技术检查

```markdown
## 发布前技术检查清单

### 代码质量
- [ ] 所有单元测试通过（覆盖率 > 80%）
- [ ] 集成测试通过
- [ ] 后端lint检查通过（ruff）
- [ ] 前端lint检查通过（eslint）
- [ ] 后端类型检查通过（mypy）
- [ ] 前端类型检查通过（tsc）

### 安全
- [ ] 依赖漏洞扫描通过（pip-audit, npm audit）
- [ ] API Key未硬编码
- [ ] .env未提交到Git
- [ ] SQL注入检查（使用ORM）
- [ ] XSS防护（输出编码）
- [ ] CORS配置正确

### 配置
- [ ] .env.example完整
- [ ] 默认配置合理
- [ ] 敏感配置可覆盖
- [ ] 数据库URL配置正确
- [ ] API Key配置正确

### 文档
- [ ] README完整
- [ ] API文档完整（/docs）
- [ ] 快速开始指南完整
- [ ] 示例场景完整
- [ ] CHANGELOG更新
- [ ] 版本号更新

### 部署
- [ ] Docker镜像构建成功
- [ ] docker-compose启动成功
- [ ] 数据库迁移成功
- [ ] systemd服务启动成功
- [ ] 日志输出正常
- [ ] 健康检查正常
```

### 89.3 运维检查

```markdown
## 发布前运维检查清单

### 监控
- [ ] Prometheus指标暴露（/metrics）
- [ ] 日志格式正确（JSON）
- [ ] 日志级别配置正确
- [ ] 错误告警规则配置

### 备份
- [ ] 数据库备份脚本可用
- [ ] 产出物备份脚本可用
- [ ] 配置文件备份脚本可用
- [ ] 恢复脚本测试通过

### 高可用（如需要）
- [ ] 多实例部署测试
- [ ] 负载均衡配置正确
- [ ] 会话粘性配置（如需要）
- [ ] 健康检查配置正确
```

---

## 九十、前端错误提示设计

### 90.1 错误提示原则

1. **用户友好**：避免技术术语，用通俗语言
2. **提供方案**：告诉用户如何解决
3. **区分级别**：错误（红色）、警告（黄色）、信息（蓝色）
4. **可操作**：提供"重试"、"返回"等按钮

### 90.2 错误提示组件

```typescript
// frontend/src/components/ErrorDisplay.tsx
import { Alert, Button } from 'antd';
import { ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

interface ErrorDisplayProps {
  error: {
    code: string;
    message: string;
    suggestion?: string;
    retry?: () => void;
  };
}

export function ErrorDisplay({ error }: ErrorDisplayProps) {
  return (
    <Alert
      type="error"
      showIcon
      icon={<ExclamationCircleOutlined />}
      message={error.message}
      description={
        <div>
          <p>错误码：{error.code}</p>
          {error.suggestion && <p>建议：{error.suggestion}</p>}
        </div>
      }
      action={
        error.retry && (
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={error.retry}
          >
            重试
          </Button>
        )
      }
    />
  );
}
```

### 90.3 常见错误提示

```typescript
// frontend/src/utils/errorMessages.ts
export const errorMessages = {
  'MEETING_NOT_FOUND': {
    message: '会议不存在或已被删除',
    suggestion: '请返回会议列表，重新选择会议',
  },
  'AGENT_TIMEOUT': {
    message: 'Agent响应超时',
    suggestion: '请检查网络连接，或稍后重试。如持续超时，可能是API配额不足',
  },
  'API_KEY_INVALID': {
    message: 'API Key无效或已过期',
    suggestion: '请检查后端 .env 文件中的 API Key 配置',
  },
  'WS_CONNECT_FAIL': {
    message: '无法连接到服务器',
    suggestion: '请检查后端服务是否运行，或刷新页面重试',
  },
  'CONCURRENT_LIMIT': {
    message: '当前会议数已达上限',
    suggestion: '请等待其他会议结束，或稍后重试',
  },
  'SCENE_INVALID': {
    message: '场景配置有误',
    suggestion: '请检查YAML格式是否正确，或参考示例场景',
  },
};

// 使用
import { errorMessages } from '../utils/errorMessages';

function handleError(errorCode: string) {
  const error = errorMessages[errorCode] || {
    message: '未知错误',
    suggestion: '请联系管理员',
  };

  message.error(`${error.message}。${error.suggestion}`);
}
```

### 90.4 API错误处理

```typescript
// frontend/src/services/api.ts
import { message } from 'antd';
import { errorMessages } from '../utils/errorMessages';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorCode = error.response?.data?.error?.code || 'UNKNOWN';
    const errorInfo = errorMessages[errorCode] || {
      message: '未知错误',
      suggestion: '请稍后重试',
    };

    // 显示错误提示
    message.error(
      <div>
        <div>{errorInfo.message}</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          {errorInfo.suggestion}
        </div>
      </div>
    );

    return Promise.reject(error);
  }
);
```

---

---

## 九十一、场景设计最佳实践

### 91.1 设计原则

1. **明确目标**：每个阶段有明确输出
2. **角色清晰**：每个 Agent 有独特视角
3. **控制轮次**：避免无限讨论
4. **合理共识**：设置明确的通过条件
5. **产出具体**：每个阶段有具体产出物

### 91.2 常见场景模板

**需求分析场景**：
```yaml
name: "需求分析"
stages:
  - name: "需求收集"
    speaker_order: ["product-manager", "user"]
    rounds: 2
    max_tokens: 1000

  - name: "需求确认"
    speaker_order: ["architect"]
    consensus:
      method: "moderator_judgment"
      prompt: "确认需求完整、可测试、无歧义"
    outputs:
      - type: markdown
        file: "requirements.md"
```

**代码审查场景**：
```yaml
name: "代码审查"
stages:
  - name: "代码分析"
    speaker_order: ["senior-dev", "security-expert"]
    rounds: 3

  - name: "问题汇总"
    speaker_order: ["moderator"]
    consensus:
      method: "no_objections"
    outputs:
      - type: markdown
        file: "review-comments.md"
```

### 91.3 提示词设计技巧

| 技巧 | 说明 | 示例 |
|------|------|------|
| **角色定义** | 明确 Agent 的角色和职责 | "你是一名资深架构师，关注可扩展性和性能" |
| **输出格式** | 指定输出格式 | "用Markdown格式输出，包含代码示例" |
| **约束条件** | 明确限制和边界 | "不要使用第三方库，用标准库实现" |
| **思考步骤** | 引导推理过程 | "先分析需求，再设计方案，最后评估风险" |
| **示例引导** | 提供输出示例 | "参考以下格式：### 问题\n### 方案\n### 评估" |

### 91.4 避免的常见错误

| 错误 | 后果 | 解决方案 |
|------|------|----------|
| 轮次过多 | 成本高、耗时长 | 限制每阶段 ≤ 5 轮 |
| 角色重复 | 讨论冗余 | 确保每个角色有独特视角 |
| 无共识条件 | 无限循环 | 设置明确的通过/驳回条件 |
| 产出物不明确 | 结果不可用 | 每个阶段指定产出物 |
| 提示词模糊 | 输出质量差 | 使用具体、可操作的提示词 |

### 91.5 提示词模板库

```yaml
# prompts/architecture-review.yaml
system_prompt: |
  你是一名资深软件架构师，拥有10年以上分布式系统设计经验。

  你的职责：
  1. 评估方案的可扩展性
  2. 识别性能瓶颈
  3. 检查技术选型合理性
  4. 评估运维复杂度

  输出格式：
  ### 总体评估
  （优秀/良好/一般/较差）

  ### 具体问题
  - [问题1]
  - [问题2]

  ### 改进建议
  1. ...
  2. ...

  约束：
  - 不要使用过于晦涩的术语
  - 给出可落地的建议
  - 评估成本/收益比
```

---

## 九十二、Agent 提示词模板库

### 92.1 通用角色模板

```yaml
# prompts/roles.yaml

product-manager:
  system_prompt: |
    你是一名产品经理，擅长需求分析和优先级判断。

    职责：
    - 理解用户真实需求
    - 转化为可开发的需求文档
    - 平衡功能、成本、时间

    输出要求：
    - 用用户故事格式（As a... I want... So that...）
    - 包含验收标准
    - 标注优先级（P0/P1/P2）

architect:
  system_prompt: |
    你是一名软件架构师，精通分布式系统和微服务架构。

    职责：
    - 设计可扩展的系统架构
    - 选择合适的技术栈
    - 评估技术风险

    输出要求：
    - 包含架构图（Mermaid）
    - 说明技术选型理由
    - 列出潜在风险

developer:
  system_prompt: |
    你是一名高级软件工程师，熟悉 Python/JavaScript/Go。

    职责：
    - 编写高质量代码
    - 考虑边界条件和错误处理
    - 编写单元测试

    输出要求：
    - 代码简洁、可读
    - 包含必要注释
    - 遵循最佳实践

tester:
  system_prompt: |
    你是一名测试工程师，擅长测试用例设计和缺陷分析。

    职责：
    - 设计全面的测试用例
    - 识别边界条件
    - 评估测试覆盖率

    输出要求：
    - 用例包含：输入、预期输出、实际输出
    - 标注测试类型（单元/集成/系统）
    - 给出风险评级
```

### 92.2 场景特定模板

```yaml
# prompts/code-generation.yaml
code-reviewer:
  system_prompt: |
    你是代码审查专家，严格但不苛刻。

    审查维度：
    1. 正确性（逻辑错误、边界处理）
    2. 可读性（命名、注释、结构）
    3. 性能（时间/空间复杂度）
    4. 安全性（注入、XSS、CSRF）

    输出格式：
    ### 问题列表
    | 严重度 | 文件 | 行号 | 问题描述 | 建议 |
    |--------|------|-------|----------|------|

    ### 总体评价
    （LGTM / 有 minor 问题 / 需要重大修改）

security-auditor:
  system_prompt: |
    你是安全审计专家，熟悉 OWASP Top 10。

    审计重点：
    - SQL 注入
    - XSS 攻击
    - CSRF 攻击
    - 敏感数据泄露
    - 权限绕过

    输出：
    ### 高危漏洞（必须修复）
    ### 中危漏洞（建议修复）
    ### 低危问题（可后续处理）
```

### 92.3 使用模板

```yaml
# 在场景 YAML 中引用模板
name: "代码审查"
roles:
  - id: reviewer
    name: "审查者"
    agent: claude
    system_prompt_file: "prompts/code-generation.yaml#code-reviewer"
```

```python
# backend/meeting/scene_parser.py 中实现
import yaml

def load_role_template(file_path: str, template_name: str) -> str:
    """加载提示词模板"""
    with open(file_path, 'r') as f:
        templates = yaml.safe_load(f)

    template = templates.get(template_name)
    if not template:
        raise ValueError(f"Template {template_name} not found")

    return template['system_prompt']
```

---

## 九十三、成本控制策略

### 93.1 成本来源

| 来源 | 说明 | 优化策略 |
|------|------|----------|
| **Agent API 调用** | Claude/OpenAI 按 token 计费 | 1. 限制 max_tokens<br>2. 减少轮次<br>3. 使用更便宜的模型 |
| **数据库存储** | PostgreSQL 存储费用 | 定期清理旧数据 |
| **服务器资源** | CPU/内存/磁盘 | 限制并发会议数 |
| **网络流量** | WebSocket/API 请求 | 压缩消息、CDN 加速 |

### 93.2 Token 优化

```yaml
# 场景配置中优化 token 使用
stages:
  - name: "快速讨论"
    max_tokens: 500        # 限制每次响应长度
    temperature: 0.3       # 降低随机性，减少冗余
    rounds: 2               # 限制轮次

  - name: "详细设计"
    max_tokens: 2000       # 需要详细输出时增加
    temperature: 0.7       # 需要创意时提高
    rounds: 5
```

### 93.3 模型选择策略

| 任务类型 | 推荐模型 | 理由 | 成本 |
|----------|----------|------|------|
| **简单讨论** | Claude Haiku / GPT-3.5 | 成本低，够用 | $ |
| **代码生成** | Claude Sonnet / GPT-4 | 质量高 | $$$ |
| **代码审查** | Claude Sonnet | 细节捕捉好 | $$$ |
| **文档生成** | Claude Haiku | 生成长文本成本低 | $ |

### 93.4 成本追踪

```python
# backend/meeting/cost_tracker.py
from typing import Dict

class CostTracker:
    """追踪 API 调用成本"""

    # 价格（每 1M tokens）
    PRICES = {
        'claude-3-haiku': {'input': 0.25, 'output': 1.25},
        'claude-3-sonnet': {'input': 3.0, 'output': 15.0},
        'gpt-3.5-turbo': {'input': 0.5, 'output': 1.5},
        'gpt-4': {'input': 30.0, 'output': 60.0},
    }

    def __init__(self):
        self.costs: Dict[str, float] = {}  # meeting_id -> cost

    def track(self, meeting_id: str, model: str, input_tokens: int, output_tokens: int):
        """记录一次 API 调用的成本"""
        if model not in self.PRICES:
            return

        price = self.PRICES[model]
        cost = (input_tokens / 1_000_000 * price['input']) + \
               (output_tokens / 1_000_000 * price['output'])

        self.costs[meeting_id] = self.costs.get(meeting_id, 0) + cost

    def get_cost(self, meeting_id: str) -> float:
        """获取会议总成本"""
        return self.costs.get(meeting_id, 0.0)

    def get_summary(self) -> dict:
        """获取成本汇总"""
        total = sum(self.costs.values())
        return {
            'total_cost': total,
            'meeting_count': len(self.costs),
            'avg_cost': total / len(self.costs) if self.costs else 0,
        }
```

### 93.5 成本告警

```yaml
# backend/config/settings.yaml
cost_control:
  max_cost_per_meeting: 1.0      # 单会议最大成本（美元）
  max_cost_per_day: 10.0          # 每日最大成本
  alert_threshold: 0.8             # 达到 80% 时告警
```

```python
# 在 engine.py 中检查成本
def check_cost(self, meeting_id: str):
    cost = self.cost_tracker.get_cost(meeting_id)
    max_cost = self.config.get('cost_control', {}).get('max_cost_per_meeting', 1.0)

    if cost > max_cost:
        raise CostLimitExceeded(
            f"会议成本 ${cost:.2f} 已超过限制 ${max_cost:.2f}"
        )

    # 告警
    threshold = self.config.get('cost_control', {}).get('alert_threshold', 0.8)
    if cost > max_cost * threshold:
        self.notify_user(meeting_id, f"会议成本已使用 {cost/max_cost*100:.0f}%")
```

---

---

## 九十四、WebSocket 重连详细策略

### 94.1 重连算法

```typescript
// frontend/src/services/ws.ts
export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private baseDelay = 1000;  // 1秒
  private maxDelay = 30000;    // 30秒
  private reconnectTimer: number | null = null;

  private getReconnectDelay(): number {
    // 指数退避 + 抖动
    const exponentialDelay = this.baseDelay * Math.pow(2, this.reconnectAttempts);
    const delayWithJitter = exponentialDelay + Math.random() * 1000;
    return Math.min(delayWithJitter, this.maxDelay);
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      message.error('WebSocket连接失败，请刷新页面重试');
      return;
    }

    const delay = this.getReconnectDelay();
    console.log(`WebSocket重连中（${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}），等待${delay}ms...`);

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(this.url, this.meetingId);
    }, delay);
  }

  connect(url: string, meetingId: string) {
    this.url = url;
    this.meetingId = meetingId;

    try {
      this.ws = new WebSocket(`${url}/${meetingId}`);

      this.ws.onopen = () => {
        console.log('WebSocket已连接');
        this.reconnectAttempts = 0;  // 重置重连计数
        this.onOpen?.();
      };

      this.ws.onclose = (event) => {
        if (!event.wasClean) {
          console.log('WebSocket异常断开，开始重连...');
          this.reconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket错误:', error);
      };
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.reconnect();
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.maxReconnectAttempts = 0;  // 禁止重连
    this.ws?.close(1000, '用户主动断开');
  }
}
```

### 94.2 重连后状态同步

```typescript
// 连接成功后，请求缺失的消息
this.ws.onopen = () => {
  console.log('WebSocket已连接');
  this.reconnectAttempts = 0;

  // 请求自上次消息以来的所有消息
  if (this.lastMessageTimestamp) {
    this.requestMissedMessages(this.lastMessageTimestamp);
  }

  this.onOpen?.();
};

private requestMissedMessages(since: string) {
  this.send({
    type: 'request_sync',
    since: since,
  });
}

// 后端处理同步请求
@app.websocket("/ws/meetings/{meeting_id}")
async def websocket_endpoint(websocket: WebSocket, meeting_id: str):
    # ... 连接逻辑 ...

    try:
        data = await websocket.receive_json()

        if data.get('type') == 'request_sync':
            since = data.get('since')
            # 查询自 since 以来的所有消息
            messages = await get_messages_since(meeting_id, since)
            for msg in messages:
                await websocket.send_json(msg)
    except JSONDecodeError:
        pass
```

### 94.3 心跳检测

```typescript
// frontend/src/services/ws.ts
private heartbeatInterval: number | null = null;

private startHeartbeat() {
  this.heartbeatInterval = window.setInterval(() => {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, 30000);  // 每30秒发送一次心跳
}

private stopHeartbeat() {
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = null;
  }
}

// WebSocket连接打开时启动心跳
this.ws.onopen = () => {
  this.startHeartbeat();
};

// WebSocket关闭时停止心跳
this.ws.onclose = () => {
  this.stopHeartbeat();
};
```

### 94.4 网络状态检测

```typescript
// frontend/src/services/ws.ts
private setupNetworkDetection() {
  window.addEventListener('online', () => {
    console.log('网络恢复，尝试重连...');
    this.reconnectAttempts = 0;  // 重置重连计数
    this.connect(this.url, this.meetingId);
  });

  window.addEventListener('offline', () => {
    console.log('网络断开，暂停重连');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
  });
}
```

---

## 九十五、数据库迁移详细步骤

### 95.1 初始化 Alembic

```bash
cd backend
uv add alembic

# 初始化 Alembic
alembic init alembic

# 配置 alembic.ini
# sqlalchemy.url = postgresql+asyncpg://postgres:password@localhost:5432/meeting

# 配置 alembic/env.py，支持异步
# 见 54.2 节
```

### 95.2 创建第一个迁移

```bash
# 生成迁移脚本
alembic revision -m "create meetings and messages tables"

# 编辑生成的迁移脚本
# backend/alembic/versions/xxxx_create_meetings_and_messages.py
```

```python
"""create meetings and messages tables

Revision ID: xxxx
Revises:
Create Date: 2026-05-05 12:00:00
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = 'xxxx'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 创建 meetings 表
    op.create_table(
        'meetings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('scene_id', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='created'),
        sa.Column('stage_index', sa.Integer, nullable=False, default=0),
        sa.Column('round_index', sa.Integer, nullable=False, default=0),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ended_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('config', sa.JSON, nullable=False, server_default='{}'),
        sa.Column('outputs', sa.JSON, nullable=False, server_default='[]'),
        sa.Column('error', sa.Text, nullable=True),
    )

    # 创建索引
    op.create_index('idx_meetings_status', 'meetings', ['status'])
    op.create_index('idx_meetings_created_at', 'meetings', ['created_at'])

    # 创建 messages 表
    op.create_table(
        'messages',
        sa.Column('id', sa.Integer, primary_key=True, autoincrement=True),
        sa.Column('meeting_id', sa.String(36), sa.ForeignKey('meetings.id', ondelete='CASCADE'), nullable=False),
        sa.Column('stage_index', sa.Integer, nullable=False),
        sa.Column('round_index', sa.Integer, nullable=False),
        sa.Column('role_id', sa.String(50), nullable=False),
        sa.Column('role_name', sa.String(100), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # 创建索引
    op.create_index('idx_messages_meeting_id', 'messages', ['meeting_id'])
    op.create_index('idx_messages_meeting_stage', 'messages', ['meeting_id', 'stage_index', 'round_index'])

def downgrade() -> None:
    op.drop_table('messages')
    op.drop_table('meetings')
```

### 95.3 运行迁移

```bash
# 升级到最新版本
alembic upgrade head

# 降级到上一个版本
alembic downgrade -1

# 降级到特定版本
alembic downgrade xxxx

# 查看当前版本
alembic current

# 查看历史版本
alembic history

# 自动生成迁移（根据模型变更）
alembic revision --autogenerate -m "add column xxx"
```

### 95.4 生产环境迁移

```bash
# 1. 备份数据库
pg_dump -h postgresql.nasw.heiyu.space -p 54321 -U postgres -d meeting > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 检查迁移脚本
alembic check

# 3. 试运行（不实际执行）
alembic upgrade head --sql  # 只输出SQL，不执行

# 4. 执行迁移
alembic upgrade head

# 5. 验证
psql -h postgresql.nasw.heiyu.space -p 54321 -U postgres -d meeting -c "\dt"
```

### 95.5 回滚方案

```bash
# 如果迁移失败，立即回滚
alembic downgrade -1

# 恢复数据库
psql -h postgresql.nasw.heiyu.space -p 54321 -U postgres -d meeting < backup_xxxxxx.sql

# 通知开发人员
echo "数据库迁移失败，已回滚" | send-notification
```

---

---

## 九十六、用户手册

### 96.1 快速上手（5分钟）

**第一步：访问系统**
- 打开浏览器，访问 `http://your-server:18501`
- 如果无法访问，请联系管理员确认服务是否运行

**第二步：了解场景**
- 场景 = 会议模板，定义了有哪些 Agent、讨论什么、输出什么
- 系统自带示例场景（代码开发、架构设计等）

**第三步：创建会议**
1. 点击左侧 "会议大厅"
2. 点击 "创建会议"
3. 选择场景（如 "代码开发"）
4. 点击 "启动会议"

**第四步：观察讨论**
- Agent 们会自动讨论，消息实时显示
- 你可以看到不同 Agent 的发言（不同颜色气泡）

**第五步：介入讨论（可选）**
- 在底部输入框输入你的想法
- 按 Enter 发送，Agent 会考虑你的反馈

**第六步：查看结果**
- 会议结束后，点击 "查看产出物"
- 可以下载 Markdown、代码等文件

### 96.2 场景管理

**查看场景列表**
- 点击左侧 "场景管理"
- 可以看到所有可用场景

**创建自己的场景**
1. 点击 "新建场景"
2. 填写场景名称、描述
3. 编写 YAML 配置（参考示例）
4. 点击 "保存并验证"

**YAML 配置是什么？**
- 一种简单的配置文件格式
- 定义了会议有哪些 Agent、讨论几轮、输出什么
- 不用担心，系统提供示例和验证

**修改场景**
- 在场景列表中点击 "编辑"
- 修改 YAML 配置
- 保存并验证

**删除场景**
- 在场景列表中点击 "删除"
- 注意：已删除的场景无法恢复

### 96.3 会议管理

**查看会议列表**
- 点击左侧 "会议大厅"
- 可以看到所有会议及其状态

**会议状态说明**
- `created`：已创建，未启动
- `running`：正在讨论中
- `paused`：已暂停（可恢复）
- `completed`：已完成
- `failed`：失败（可查看错误）
- `cancelled`：已取消

**暂停/恢复会议**
- 会议运行中，点击 "暂停"
- 处理完其他事后，点击 "恢复"

**停止会议**
- 会议运行中，点击 "停止"
- 会保存当前已讨论的内容

**删除会议**
- 在会议列表中点击 "删除"
- 注意：会删除所有消息和产出物

### 96.4 监控会议

**消息气泡**
- 不同颜色代表不同 Agent
- 蓝色：思考者
- 绿色：评审者
- 黄色：用户（你自己）
- 灰色：主持人

**阶段进度**
- 顶部显示当前阶段和进度
- 点击阶段可以跳转

**控制按钮**
- 批准：同意当前阶段的输出，进入下一阶段
- 驳回：不同意，要求重新讨论（有次数限制）
- 暂停：暂停会议
- 停止：终止会议

**用户反馈**
- 底部输入框输入你的想法
- 按 Enter 发送
- Agent 会在下一轮考虑你的反馈

### 96.5 查看产出物

**会议结束后**
- 自动跳转到产出物页面
- 或点击会议列表中的 "查看产出物"

**产出物类型**
- Markdown 文档：需求文档、设计文档等
- 代码文件：源代码、配置文件等
- JSON 数据：结构化数据
- Mermaid 图表：架构图、流程图等

**下载产出物**
- 点击文件名即可下载
- 或点击 "全部下载" 打包下载

### 96.6 常见问题

| 问题 | 解决方案 |
|------|----------|
| 无法访问系统 | 检查网址是否正确，联系管理员 |
| 无法创建会议 | 检查是否选择了场景，查看错误提示 |
| Agent 不发言 | 检查网络，查看 Agent API Key 是否配置正确 |
| 会议卡住不动 | 点击 "停止"，查看错误信息 |
| 产出物为空 | 检查场景配置是否正确，Agent 是否生成了内容 |
| 页面显示异常 | 刷新页面，或清除浏览器缓存 |

### 96.7 最佳实践

**设计场景**
- 明确每个阶段的输出
- 给 Agent 清晰的角色定义
- 设置合理的轮次限制

**参加会议**
- 观察讨论，适时给予反馈
- 不要频繁介入，让 Agent 先讨论
- 批准前仔细检查输出

**管理产出物**
- 及时下载重要产出物
- 定期清理已完成会议
- 备份重要产出物

---

## 九十七、FAQ 详细版

### 97.1 产品相关

**Q: 这是什么系统？**
A: 这是一个 AI 协作会议平台。多个 AI Agent 像人类团队成员一样讨论问题，你可以像导演一样介入讨论，最终生成产出物（文档、代码等）。

**Q: 和直接使用 Claude/GPT 有什么区别？**
A: 直接对话是 "一问一答"，这个是 "多人讨论"。多个 Agent 从不同角度分析问题，互相质疑和补充，结果更完整。

**Q: 我能用这个做什么？**
A: 需求分析、架构设计、代码审查、文档编写、技术调研等。任何需要多角度思考的任务都适合。

**Q: 需要付费吗？**
A: 系统本身免费开源。但调用 Claude/OpenAI 等 Agent 需要 API Key，这些是第三方收费服务。

**Q: 支持中文吗？**
A: 支持。你可以输入中文提示词，Agent 也会用中文回复（取决于模型支持）。

### 97.2 技术相关

**Q: 需要什么环境？**
A: 一台服务器（或你的电脑）运行后端，另一台设备（手机/电脑）通过浏览器访问前端。详见部署章节。

**Q: 支持哪些 Agent？**
A: 目前支持 Claude、OpenAI、Hermes、Claude Code。你也可以自己接入其他 Agent。

**Q: 场景 YAML 很难写吗？**
A: 不难。系统提供示例场景，你可以复制修改。YAML 是一种简单的配置格式，类似大纲。

**Q: 会议会运行多久？**
A: 取决于场景配置。简单讨论几分钟，复杂设计可能几十分钟。

**Q: 产出物存在哪里？**
A: 存在服务器上，你可以随时下载。建议定期备份重要产出物。

### 97.3 使用相关

**Q: 如何设计好的场景？**
A: 1. 明确每个阶段的输出；2. 给 Agent 清晰的角色定义；3. 设置合理的轮次限制。详见 "场景设计最佳实践" 章节。

**Q: Agent 讨论偏离主题怎么办？**
A: 在底部输入框输入反馈，引导 Agent 回到主题。或者驳回当前阶段，让它重新讨论。

**Q: 可以中途加入讨论吗？**
A: 可以。在底部输入框输入你的想法，按 Enter 发送。

**Q: 如何保存会议结果？**
A: 会议结束后，在产出物页面下载。系统也会自动保存在服务器上。

**Q: 会议失败了怎么办？**
A: 查看错误信息，通常是 API Key 问题或网络问题。修复后，可以重新创建会议。

### 97.4 故障排查

**Q: 页面打不开**
A: 1. 检查网址是否正确；2. 检查后端是否运行；3. 检查网络连接；4. 查看浏览器控制台错误。

**Q: 创建会议没反应**
A: 1. 检查是否选择了场景；2. 打开浏览器开发者工具（F12）查看网络请求；3. 查看后端日志。

**Q: Agent 不发言**
A: 1. 检查 API Key 是否配置正确；2. 检查 API 配额是否充足；3. 查看后端日志。

**Q: WebSocket 连接失败**
A: 1. 检查后端是否运行在正确端口；2. 检查防火墙设置；3. 查看浏览器控制台错误。

**Q: 产出物下载失败**
A: 1. 检查会议是否已完成；2. 检查产出物是否生成；3. 尝试刷新页面重新下载。

---

---

## 九十八、键盘快捷键设计

### 98.1 会议监控页快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| `Enter` | 发送消息 | 在输入框输入后按 Enter 发送 |
| `Ctrl+Enter` | 换行 | 在输入框内换行 |
| `Alt+Enter` | 发送特殊命令 | 发送 `\u001b\r` 给终端（如需要） |
| `Space` | 暂停/恢复 | 切换会议暂停状态 |
| `Escape` | 停止会议 | 停止当前会议（需确认） |
| `Ctrl+P` | 批准阶段 | 批准当前阶段，进入下一阶段 |
| `Ctrl+R` | 驳回阶段 | 驳回当前阶段，重新讨论 |
| `Ctrl+S` | 保存产出物 | 下载当前产出物 |
| `Ctrl+?` | 显示快捷键帮助 | 弹出快捷键列表 |

### 98.2 实现示例

```typescript
// frontend/src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: {
  onPauseResume?: () => void;
  onStop?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onSave?: () => void;
  onHelp?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略在输入框中的按键
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // 但允许 Escape 和 Ctrl+?
        if (e.key !== 'Escape' && !(e.ctrlKey && e.key === '?')) {
          return;
        }
      }

      // Ctrl+P: 批准
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlers.onApprove?.();
      }

      // Ctrl+R: 驳回
      if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        handlers.onReject?.();
      }

      // Ctrl+S: 保存
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handlers.onSave?.();
      }

      // Space: 暂停/恢复
      if (e.key === ' ' && !e.ctrlKey) {
        e.preventDefault();
        handlers.onPauseResume?.();
      }

      // Escape: 停止
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.onStop?.();
      }

      // Ctrl+?: 帮助
      if (e.ctrlKey && e.key === '?') {
        e.preventDefault();
        handlers.onHelp?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// 在组件中使用
function MeetingMonitor() {
  const { pauseMeeting, stopMeeting, approveStage, rejectStage } = useMeetingActions();

  useKeyboardShortcuts({
    onPauseResume: () => pauseMeeting(),
    onStop: () => {
      if (confirm('确定停止会议吗？')) stopMeeting();
    },
    onApprove: () => approveStage(),
    onReject: () => rejectStage(),
    onSave: () => saveOutputs(),
    onHelp: () => showShortcutsHelp(),
  });

  return <div>...</div>;
}
```

### 98.3 快捷键帮助弹窗

```typescript
// frontend/src/components/ShortcutsHelp.tsx
import { Modal } from 'antd';

export function ShortcutsHelp({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const shortcuts = [
    { key: 'Enter', description: '发送消息' },
    { key: 'Ctrl+Enter', description: '输入框换行' },
    { key: 'Space', description: '暂停/恢复会议' },
    { key: 'Escape', description: '停止会议（需确认）' },
    { key: 'Ctrl+P', description: '批准当前阶段' },
    { key: 'Ctrl+R', description: '驳回当前阶段' },
    { key: 'Ctrl+S', description: '保存产出物' },
    { key: 'Ctrl+?', description: '显示此帮助' },
  ];

  return (
    <Modal
      title="键盘快捷键"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <table style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>快捷键</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          {shortcuts.map((s) => (
            <tr key={s.key}>
              <td><code>{s.key}</code></td>
              <td>{s.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
```

---

## 九十九、多设备访问指南

### 99.1 场景说明

用户可能从多个设备访问系统：
- **电脑（开发）**：创建场景、编写复杂 YAML
- **手机（监控）**：查看会议进展、发送反馈
- **平板（评审）**：查看产出物、批准/驳回

### 99.2 网络配置

**同一局域网**：
```
电脑（后端 + 前端）：192.168.1.100
手机（浏览器）：http://192.168.1.100:18501
平板（浏览器）：http://192.168.1.100:18501
```

**跨网络（通过互联网）**：
```
服务器（公网 IP 或域名）：meeting.example.com
所有设备：https://meeting.example.com
```

### 99.3 手机端优化

**1. 添加到主屏幕（iOS）**：
1. 用 Safari 打开 `http://your-server:18501`
2. 点击底部分享按钮
3. 滑动找到 "添加到主屏幕"
4. 命名 "AI Meeting"，点击 "添加"
5. 以后像 App 一样打开

**2. 添加到主屏幕（Android）**：
1. 用 Chrome 打开网址
2. 点击右上角菜单
3. 选择 "安装应用" 或 "添加到主屏幕"
4. 确认安装

**3. 手机端使用技巧**：
- 横屏显示更多内容
- 双指缩放调整字体大小
- 下拉刷新页面
- 使用蓝牙键盘可获得快捷键支持

### 99.4 会话保持

**WebSocket 自动重连**：
- 手机锁屏后，WebSocket 可能断开
- 打开屏幕后，系统会自动重连
- 重连后，会收到离线期间的消息

**会议状态保持**：
- 服务器会保存会议状态
- 从任何设备重新打开，都能看到最新状态
- 即使手机关机，会议继续在服务器运行

### 99.5 多设备协作示例

```
场景：你用电脑创建会议，用手机监控

1. 电脑：打开 http://your-server:18501
   创建场景 → 编写 YAML → 启动会议

2. 手机：打开 http://your-server:18501
   自动跳转到会议监控页
   实时查看 Agent 讨论
   输入反馈（语音输入更方便）

3. 电脑：继续查看产出物
   会议结束后，下载结果

提示：多个设备可以同时打开同一个会议！
```

---

---

## 一百、README.md 模板

```markdown
# AI Collaboration Meeting (AI 协作会议)

> 让多个 AI Agent 像人类团队一样协作讨论，你当导演，AI 当演员。

## ✨ 特性

- 🎭 **多 Agent 协作**：多个 AI 从不同视角讨论问题
- 🎬 **用户导演模式**：你可以随时介入讨论，引导方向
- 📦 **结构化产出**：自动生成文档、代码、图表等
- 🔄 **实时 WebSocket**：消息实时推送，无需刷新
- 🌐 **多设备访问**：电脑、手机、平板都能用
- 🔧 **高度可配置**：定义角色、阶段、产出物

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting.git
cd ai-collaboration-meeting
```

### 2. 一键启动（推荐）

```bash
./scripts/quickstart.sh
```

### 3. 或手动启动

```bash
# 后端
cd backend
uv sync
cp .env.example .env  # 编辑 .env，填入 API Key
uv run uvicorn meeting.main:app --host 0.0.0.0 --port 18502 &

# 前端
cd ../frontend
npm install
npm run dev -- --port 18501 &
```

### 4. 访问

打开浏览器：`http://localhost:18501`

## 📚 文档

- [快速开始指南](docs/quickstart.md) - 5分钟上手
- [场景设计指南](docs/scene-design.md) - 如何设计场景
- [API 文档](docs/API.md) - 后端 API 参考
- [部署指南](docs/deployment.md) - 生产环境部署
- [FAQ](docs/FAQ.md) - 常见问题解答

完整的开发计划书见：[PLAN.md](PLAN.md)（99章，超详细）

## 🎯 使用场景

- **需求分析**：产品经理 + 架构师 + 开发者讨论需求
- **架构设计**：多个架构师从不同角度设计系统
- **代码审查**：资深开发者 + 安全专家审查代码
- **文档编写**：技术作家 + 开发者协作编写文档
- **技术调研**：多个专家调研并汇总报告

## 🛠️ 技术栈

**后端：**
- Python 3.11+
- FastAPI（异步 Web 框架）
- PostgreSQL（数据库）
- SQLAlchemy + Alembic（ORM + 迁移）

**前端：**
- React 18 + TypeScript
- Vite（构建工具）
- antd 5.x（UI 组件库）
- Zustand（状态管理）
- React Flow（流程图）

**Agent 支持：**
- Claude（Anthropic）
- GPT（OpenAI）
- Hermes（本地）
- Claude Code（代码生成）

## 📋 示例场景

```yaml
name: "代码开发"
description: "需求分析 → 架构设计 → 代码生成 → 代码审查"

roles:
  - id: pm
    name: "产品经理"
    agent: claude
    system_prompt: "你是产品经理，关注用户需求..."

stages:
  - name: "需求分析"
    speaker_order: ["pm", "architect"]
    rounds: 3

  - name: "架构设计"
    speaker_order: ["architect", "reviewer"]
    rounds: 4

outputs:
  - type: markdown
    file: "requirements.md"
```

更多示例见：[examples/](examples/)

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)。

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [antd](https://ant.design/)
- [Raycast](https://raycast.com/)（灵感来源）
```

---

## 一百零一、CONTRIBUTING.md 模板

```markdown
# 贡献指南

感谢你考虑为 AI Collaboration Meeting 做出贡献！

## 📋 贡献流程

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 🧹 代码规范

### 后端（Python）

- 使用 `ruff` 格式化代码
- 使用 `mypy` 进行类型检查
- 遵循 [PEP 8](https://pep8.org/)
- 所有函数/类都要有 docstring
- 测试覆盖率 > 80%

### 前端（TypeScript）

- 使用 `eslint` 检查代码
- 使用 `prettier` 格式化
- 遵循 [Airbnb Style Guide](https://github.com/airbnb/javascript)
- 使用 TypeScript 类型
- 组件要有注释

## 🧪 测试

### 后端测试

```bash
cd backend
uv run pytest
uv run pytest --cov=meeting  # 覆盖率
```

### 前端测试

```bash
cd frontend
npm test
npm run test:coverage  # 覆盖率
```

## 📝 提交规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构（不是新功能也不是修复）
test: 添加测试
chore: 构建过程或辅助工具变更
```

示例：
```bash
git commit -m "feat(engine): 实现共识检测算法"
git commit -m "fix(api): 修复会议创建失败问题"
```

## 🔍 PR 指南

- PR 标题遵循提交规范
- 描述清楚改动内容和原因
- 关联相关 Issue
- 通过所有 CI 检查
- 至少 1 个审核通过（核心改动需要 2 个）
- 更新相关文档

## 🐛 报告 Bug

使用 GitHub Issues 报告 bug，包含：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（OS、Python版本、Node版本等）
- 相关日志

## 💡 提出新功能

使用 GitHub Issues 提出新功能，包含：
- 功能描述
- 使用场景
- 实现思路（可选）
- 相关示例（可选）

## 📧 联系方式

如有疑问，请联系：[your-email@example.com](mailto:your-email@example.com)

感谢你的贡献！🎉
```

---

---

## 一百零二、监控大盘 Grafana 配置

### 102.1 Grafana 仪表盘 JSON

```json
{
  "dashboard": {
    "id": null,
    "title": "AI Collaboration Meeting - Monitor",
    "tags": ["meeting", "ai"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "API Response Time",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, path))",
            "legendFormat": "{{path}} P95"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "id": 2,
        "title": "Active Meetings",
        "type": "stat",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(meeting_active_total)",
            "legendFormat": "Active Meetings"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0}
      },
      {
        "id": 3,
        "title": "WebSocket Connections",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "meeting_ws_connections_active",
            "legendFormat": "Active WS Connections"
          }
        ],
        "gridPos": {"h": 8, "w": 6, "x": 18, "y": 0}
      },
      {
        "id": 4,
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m]))",
            "legendFormat": "5xx Error Rate"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8}
      },
      {
        "id": 5,
        "title": "API Cost (Daily)",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "increase(meeting_api_cost_dollars_total[24h])",
            "legendFormat": "Daily Cost"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 8}
      }
    ]
  }
}
```

### 102.2 导入仪表盘

```bash
# 保存为 grafana-dashboard.json
curl -X POST \
  -H "Content-Type: application/json" \
  -d @grafana-dashboard.json \
  http://grafana:3000/api/dashboards/db

# 或通过 UI 导入
# 1. 打开 Grafana
# 2. 点击 "+" → Import
# 3. 上传 JSON 文件
# 4. 选择 Prometheus 数据源
# 5. 点击 Import
```

---

## 一百零三、告警通知模板

### 103.1 Telegram 通知模板

```python
# backend/monitoring/notifier.py
import requests
from typing import Dict, Any

class TelegramNotifier:
    """Telegram 告警通知"""

    def __init__(self, bot_token: str, chat_id: str):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.base_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"

    def send_alert(self, alert: Dict[str, Any]):
        """发送告警到 Telegram"""
        emoji = "🔴" if alert.get('severity') == 'critical' else "🟡"

        message = f"""
{emoji} *AI Meeting Alert*

*告警名称*：{alert['name']}
*严重度*：{alert['severity']}
*状态*：{alert['state']}
*描述*：{alert['description']}
*时间*：{alert['time']}

[查看详情]({alert.get('url', '')})
        """.strip()

        requests.post(self.base_url, json={
            'chat_id': self.chat_id,
            'text': message,
            'parse_mode': 'Markdown',
        })

# 告警规则示例
ALERT_TEMPLATES = {
    'HighErrorRate': {
        'message': '5分钟内错误率超过1%，请检查服务',
        'severity': 'critical',
    },
    'SlowAPIResponse': {
        'message': 'API 响应缓慢，检查 Agent 或数据库',
        'severity': 'warning',
    },
    'WebSocketDisconnects': {
        'message': 'WebSocket 连接频繁断开，检查网络或负载',
        'severity': 'warning',
    },
    'MeetingCostExceeded': {
        'message': '单会议成本已超过预算，请暂停自动会议',
        'severity': 'critical',
    },
}
```

### 103.2 邮件通知模板

```html
<!-- backend/templates/alert_email.html -->
<!DOCTYPE html>
<html>
<head>
    <style>
        .alert-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin: 20px;
            background: #f9f9f9;
        }
        .critical { border-left: 5px solid #ff4d4f; }
        .warning { border-left: 5px solid #faad14; }
        .info { border-left: 5px solid #1890ff; }
    </style>
</head>
<body>
    <div class="alert-card {{ severity }}">
        <h2>🔔 AI Meeting Alert</h2>
        <p><strong>告警名称：</strong>{{ alert.name }}</p>
        <p><strong>严重度：</strong>{{ alert.severity }}</p>
        <p><strong>状态：</strong>{{ alert.state }}</p>
        <p><strong>描述：</strong>{{ alert.description }}</p>
        <p><strong>时间：</strong>{{ alert.time }}</p>
        <hr>
        <p><a href="{{ alert.url }}">查看详情</a></p>
    </div>
</body>
</html>
```

---

## 一百零四、竞品分析

### 104.1 产品对比表

| 特性 | AI Collaboration Meeting | **Cursor** | **GitHub Copilot** | **Replit Ghost** | **ChatGPT** |
|------|------------------------|------------|------------------|-----------------|-------------|
| **多 Agent 协作** | ✅ （自定义 Agent） | ❌ | ❌ | ❌ | ❌ |
| **用户介入讨论** | ✅ （导演模式） | ❌ | ❌ | ❌ | ✅ |
| **结构化产出物** | ✅ （自动生成） | ✅ | ✅ | ✅ | ❌ |
| **场景配置** | ✅ （YAML） | ❌ | ❌ | ❌ | ❌ |
| **实时讨论** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **成本控制** | ✅ （token 计费） | ❌（订阅） | ❌（订阅） | ❌（订阅） | ✅ |
| **本地部署** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **自定义角色** | ✅ | ❌ | ❌ | ❌ | 部分 |
| **工作流编排** | ✅ | ❌ | ❌ | ❌ | ❌ |

### 104.2 差异化优势

**我们的优势：**
1. **多 Agent 协作** - 多个 AI 深度讨论，如同团队
2. **导演模式** - 你像导演一样介入，指导讨论过程
3. **场景模板** - YAML 定义工作流，高度可定制
4. **结构化产出** - 自动生成文档、代码、图表
5. **成本透明** - 每个会议的 API 成本可见
6. **本地部署** - 数据隐私可控

**竞品劣势：**
1. **Cursor** - 只能辅助写代码，不能主动讨论
2. **Copilot** - 代码补全工具，不能替代团队讨论
3. **ChatGPT** - 需要手动协调多个对话
4. **Claude** - 聊天模式，缺少场景化工作流

---

---

## 一百零五、增强功能设计（可选）

### 105.1 国际化设计

```typescript
// frontend/src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        'meeting.title': 'AI Collaboration Meeting',
        'meeting.status.running': 'Running',
        'meeting.status.completed': 'Completed',
        // ... more translations
      },
    },
    zh: {
      translation: {
        'meeting.title': 'AI 协作会议',
        'meeting.status.running': '进行中',
        'meeting.status.completed': '已完成',
        // ... more translations
      },
    },
  },
  lng: 'en', // 默认语言
  fallbackLng: 'en',
});

export default i18n;
```

### 105.2 PWA 支持

```typescript
// frontend/public/manifest.json
{
  "name": "AI Collaboration Meeting",
  "short_name": "AI Meeting",
  "description": "Multi-Agent AI Collaboration Platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1890ff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 105.3 数据导出格式

```python
# backend/meeting/exporters.py
from typing import Any
import json
import csv
from io import StringIO

class ExportService:
    """数据导出服务"""

    def export_json(self, meeting: dict) -> str:
        """导出为 JSON"""
        return json.dumps(meeting, indent=2, ensure_ascii=False)

    def export_csv(self, meeting: dict) -> str:
        """导出为 CSV"""
        output = StringIO()
        writer = csv.writer(output)

        # 写入表头
        writer.writerow(['round', 'speaker', 'content', 'timestamp'])

        # 写入数据
        for msg in meeting.get('messages', []):
            writer.writerow([
                msg['round'],
                msg['role_name'],
                msg['content'],
                msg['timestamp']
            ])

        return output.getvalue()

    def export_markdown(self, meeting: dict) -> str:
        """导出为 Markdown"""
        lines = [f"# {meeting['name']}\n"]

        for msg in meeting.get('messages', []):
            lines.append(f"## {msg['role_name']} ({msg['timestamp']})")
            lines.append(msg['content'])
            lines.append("")

        return "\n".join(lines)
```

### 105.4 收藏功能

```python
# backend/meeting/models.py
class Favorite(Base):
    """收藏表"""
    __tablename__ = 'favorites'

    id = Column(String(36), primary_key=True)
    user_id = Column(String(36), nullable=False)  # 简单设计，暂无用户系统
    meeting_id = Column(String(36), ForeignKey('meetings.id'), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meeting = relationship("Meeting", back_populates="favorites")


# API 端点
@app.post("/api/meetings/{meeting_id}/favorite")
async def favorite_meeting(meeting_id: str):
    """收藏会议"""
    # ...

@app.delete("/api/meetings/{meeting_id}/favorite")
async def unfavorite_meeting(meeting_id: str):
    """取消收藏"""
    # ...
```

### 105.5 标签功能

```python
# backend/meeting/models.py
class Tag(Base):
    """标签表"""
    __tablename__ = 'tags'

    id = Column(String(50), primary_key=True)
    name = Column(String(50), nullable=False)
    color = Column(String(7), default='#1890ff')  # 颜色代码


class MeetingTag(Base):
    """会议标签关联表"""
    __tablename__ = 'meeting_tags'

    meeting_id = Column(String(36), ForeignKey('meetings.id'), primary_key=True)
    tag_id = Column(String(50), ForeignKey('tags.id'), primary_key=True)
```

### 105.6 搜索功能

```python
# backend/api/search.py
@app.get("/api/search")
async def search_meetings(
    q: str,  # 搜索关键词
    tag: str = None,  # 按标签筛选
    status: str = None,  # 按状态筛选
    limit: int = 20
):
    """搜索会议"""
    query = select(Meeting)

    # 全文搜索
    if q:
        query = query.where(
            or_(
                Meeting.name.ilike(f"%{q}%"),
                Meeting.description.ilike(f"%{q}%")
            )
        )

    # 标签筛选
    if tag:
        query = query.join(MeetingTag).where(MeetingTag.tag_id == tag)

    # 状态筛选
    if status:
        query = query.where(Meeting.status == status)

    query = query.order_by(Meeting.created_at.desc()).limit(limit)

    return await db.execute(query)
```

---

---

## 一百零六、UI 设计规范

### 106.1 配色方案

```scss
// frontend/src/styles/themes.scss
:root {
  // 主色调
  --primary-color: #1890ff;
  --primary-hover: #40a9ff;
  --primary-active: #0958d9;

  // 功能色
  --success-color: #52c41a;
  --warning-color: #faad14;
  --error-color: #ff4d4f;
  --info-color: #1890ff;

  // 灰度
  --text-primary: #262626;
  --text-secondary: #595959;
  --text-disabled: #bfbfbf;
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --bg-disabled: #f5f5f5;

  // Agent 头像色
  --agent-thinking: #1890ff;
  --agent-reviewing: #52c41a;
  --agent-user: #faad14;
  --agent-moderator: #722ed1;
}
```

### 106.2 布局规范

```typescript
// 前端布局组件结构
<AppLayout>
  <Header>
    <Logo />
    <Title>AI Collaboration Meeting</Title>
    <UserMenu />
  </Header>

  <MainContent>
    <Sidebar>
      <Navigation />
      <SceneList />
    </Sidebar>

    <ContentArea>
      <ToolBar>
        <RefreshButton />
        <SettingsButton />
      </ToolBar>

      <MeetingContent>
        <MessageList />
        <InputArea />
      </MeetingContent>
    </ContentArea>
  </MainContent>
</AppLayout>
```

### 106.3 响应式断点

| 尺寸 | 范围 | 布局 |
|------|------|------|
| xs | < 480px | 单列，汉堡菜单 |
| sm | 480px - 768px | 单列，收起侧边栏 |
| md | 768px - 992px | 双列，侧边栏收缩 |
| lg | 992px - 1200px | 双列，正常布局 |
| xl | > 1200px | 双列，最大宽度 |

---

## 一百零七、视频教程大纲

### 107.1 教程列表

| 视频 | 时长 | 内容 |
|------|------|------|
| 5分钟上手 | 5min | 安装 → 创建会议 → 观察讨论 |
| 场景设计入门 | 10min | YAML基础 → 创建场景 → 测试场景 |
| 高级功能 | 8min | 用户介入 → 批准/驳回 → 产出物下载 |
| 部署教程 | 15min | 服务器配置 → Docker部署 → 域名配置 |

### 107.2 脚本大纲（5分钟上手）

```text
[0:00-0:30] 简介：介绍 AI Collaboration Meeting
[0:30-1:30] 安装：一键启动脚本演示
[1:30-2:30] 创建会议：选择场景、启动会议
[2:30-4:00] 观察讨论：实时消息、Agent发言
[4:00-4:30] 介入讨论：输入反馈、发送
[4:30-5:00] 总结：下载产出物、快速开始
```

---

## 一百零八、法律条款

### 108.1 用户协议 (TERMS.md)

```markdown
# 用户协议

## 1. 接受条款
使用本服务即表示接受本协议。

## 2. 使用资格
- 年满18周岁
- 不得从事非法活动

## 3. 内容责任
- 用户对发布内容负责
- 不得发布违法违规内容
- 系统保留删除权

## 4. 免责声明
- 服务按"现状"提供
- 不保证结果准确性
- 免除不可抗力责任

## 5. 协议修改
- 协议会在更新时公布
- 继续使用表示接受修改
```

### 108.2 隐私政策 (PRIVACY.md)

```markdown
# 隐私政策

## 1. 信息收集
- 账号信息（可选）
- 使用日志
- Agent 对话内容

## 2. 信息使用
- 提供服务
- 优化体验
- 性能分析

## 3. 信息保护
- 数据加密存储
- 访问控制
- 定期备份

## 4. 第三方共享
- 不共享个人信息
- 法律要求除外

## 5. 用户权利
- 查看个人数据
- 请求删除数据
- 退出服务
```

---

---

## 一百零九、性能基准数据

### 109.1 后端性能基准

| 指标 | 目标值 | 测试方法 | 备注 |
|------|--------|----------|------|
| **API 响应时间（P95）** | < 500ms | wrk2 测试 | 包含数据库查询 |
| **API 响应时间（P99）** | < 1s | wrk2 测试 | 包含数据库查询 |
| **WebSocket 连接数** | 1000+ | artillery 测试 | 单实例 |
| **会议创建速度** | < 2s | 压力测试 | 包括数据库写入 |
| **并发会议数** | 5 | 资源限制 | CPU 4 核，内存 8GB |
| **Token 处理速度** | 1000 tokens/s | 压力测试 | Claude Haiku |

### 109.2 前端性能基准

| 指标 | 目标值 | 测试方法 | 备注 |
|------|--------|----------|------|
| **首屏加载时间 (FCP)** | < 2s | Lighthouse | 移动端 3G 网络 |
| **交互响应时间** | < 100ms | 手点测试 | 点击到视觉反馈 |
| **消息渲染性能** | 100条 < 1s | 压力测试 | 虚拟滚动优化 |
| **打包大小** | < 2MB | webpack-bundle-analyzer | 包含所有依赖 |

### 109.3 测试脚本

```bash
# 后端 API 测试
wrk -t12 -c400 -d30s --timeout 10s \
  -H "Content-Type: application/json" \
  http://localhost:18502/api/meetings

# WebSocket 连接测试
artillery run -t 60s websocket-test.yml

# 前端性能测试
lighthouse http://localhost:18501 --output=json --output-path=./lighthouse-report.json
```

---

## 一百一十、安全测试计划

### 110.1 渗透测试项目

| 项目 | 工具 | 负责人 | 计划时间 |
|------|------|--------|----------|
| **SQL 注入测试** | sqlmap | 开发 | 每次发布前 |
| **XSS 测试** | burp suite | 开发 | 每次发布前 |
| **CSRF 测试** | burp suite | 开发 | 每次发布前 |
| **权限测试** | manual | 开发 | 每次发布前 |
| **敏感信息泄露** | manual | 开发 | 每次发布前 |
| **依赖漏洞扫描** | safety, npm audit | 自动化 | CI/CD |

### 110.2 安全配置清单

```yaml
# backend/config/security.yaml
security:
  # API 安全
  api_key_rotation_days: 90
  rate_limit_per_minute: 60
  cors_origins:
    - "https://your-domain.com"
    - "http://localhost:18501"

  # 数据库安全
  db_ssl: true
  db_pool_size: 10
  db_max_overflow: 20

  # 日志安全
  log_sensitive_fields:
    - "password"
    - "api_key"
    - "token"

  # 备份安全
  backup_encryption: true
  backup_retention_days: 30
```

### 110.3 应急响应流程

```text
1. 发现安全事件
   ↓
2. 立即隔离（停机/限制访问）
   ↓
3. 记录证据（日志、截图）
   ↓
4. 通知负责人
   ↓
5. 分析原因和影响
   ↓
6. 修复漏洞
   ↓
7. 复盘和改进
```

---

---

## 一百一十一、普通用户引导流程

### 111.1 首次访问引导

**步骤1：欢迎页**
```
欢迎使用 AI 协作会议！
让 AI Agent 像团队成员一样讨论您的问题

[观看演示 (2min)] [立即开始]
```

**步骤2：场景推荐（智能匹配）**
```
请选择您的用途：

[代码开发] → "开发新功能、编写代码、解决bug"
[架构设计] → "设计系统架构、技术选型、容量规划"  
[需求分析] → "分析需求、编写用户故事、定义验收标准"
[代码审查] → "审查代码质量、找出安全问题、优化建议"

[自定义场景] → "已有场景经验？创建自己的场景"
```

**步骤3：智能引导（首次）**
```
首次体验？我们来看个例子 👇

1. 观察 AI 如何讨论
2. 尝试输入你的想法
3. 看到最终产出物

[观看演示] [跳过，直接开始]
```

### 111.2 操作引导气泡

```typescript
// frontend/src/components/TourGuide.tsx
const tourSteps = [
  {
    target: '.scene-card',
    title: '选择场景',
    content: '点击任意场景开始。系统会根据您的描述自动匹配合适场景。',
    placement: 'bottom',
  },
  {
    target: '.meeting-controls',
    title: '会议控制',
    content: '暂停、批准、驳回按钮。在右下角。',
    placement: 'top',
  },
  {
    target: '.input-area',
    title: '输入反馈',
    content: '输入您的想法，按 Enter 发送。AI 会考虑您的反馈。',
    placement: 'top',
  },
];
```

### 111.3 友好错误提示设计

```python
# backend/errors/user_friendly.py
USER_FRIENDLY_MESSAGES = {
    'WEBSOCKET_DISCONNECT': {
        'user': '连接丢失了，正在重连...',
        'action': '刷新页面',
        'technical': 'WebSocket disconnected, reconnecting...'
    },
    'AGENT_TIMEOUT': {
        'user': 'AI 响应超时，可能是网络问题或AI繁忙',
        'action': '稍后重试或联系管理员',
        'technical': 'Agent response timeout after 300s'
    },
    'SCENE_INVALID_YAML': {
        'user': '场景格式不正确，请检查 YAML 语法',
        'action': '参考示例场景重新编写',
        'technical': 'YAML parsing error at line 15'
    },
    'API_KEY_INVALID': {
        'user': '系统配置问题，请联系管理员',
        'action': '检查 API Key 设置',
        'technical': 'Invalid API key for Anthropic'
    },
    'CONCURRENT_LIMIT': {
        'user': '当前会议数已达上限，请稍后重试',
        'action': '等待其他会议结束',
        'technical': 'Max concurrent meetings (5) reached'
    },
}
```

### 111.4 常见用户场景

**场景1：新用户第一次**
```
问题：怎么开始？
流程：观看演示 → 选择场景 → 启动 → 观察 → 输入反馈 → 查看结果
时间：10分钟
```

**场景2：熟练用户自定义**
```
问题：如何设计自己的场景？
流程：复制示例 → 修改角色 → 修改阶段 → 测试运行 → 保存
时间：30分钟
```

**场景3：团队协作**
```
问题：如何分享会议？
流程：会议结束 → 导出产出物 → 分享链接
时间：5分钟
```

### 111.5 新手常见问题

**Q: AI 讨论太长了，怎么办？**
A: 点击暂停按钮，等待当前轮次结束。

**Q: AI 说错了，怎么纠正？**
A: 在输入框输入"纠正：xxx"，AI 会调整。

**Q: 怎么让 AI 更快些？**
A: 减少 rounds，减少 max_tokens，选择更快的模型（Haiku vs Sonnet）。

**Q: 会议突然停止了？**
A: 检查 API Key 配额，或刷新页面重试。

---

## 四十九、验收标准

### 17.1 功能验收

- [ ] 场景 YAML 解析正确
- [ ] 会议流程完整执行
- [ ] 共识检测准确
- [ ] 用户介入正常
- [ ] 产出物生成正确

### 17.2 性能验收

- [ ] 单次会议支持 50+ 轮讨论
- [ ] WebSocket 消息延迟 < 1s
- [ ] 支持 10+ 并发会议

### 17.3 用户体验

- [ ] 场景配置 < 5 分钟
- [ ] 会议监控实时更新
- [ ] 产出物可直接使用

---

## 十八、下一步

### 立即行动

1. ✅ 计划书确认
2. ⏳ 项目初始化
3. ⏳ 开始 Phase 1

### 需要确认

1. MVP 范围是否合适？
2. 开发阶段划分是否合理？
3. 是否有遗漏的功能需求？

---

**计划书状态**: 待确认
**下一步**: 用户确认后开始实施
