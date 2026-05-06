# AI Meeting Platform API Documentation

## Base URL
- Development: `http://localhost:18602`
- Production: `http://meeting.example.com`

## Authentication
Single-user mode uses API Key header:
```
X-API-Key: your-api-key
```

---

## Scenes API

### List Scenes
```http
GET /api/scenes
```

Response:
```json
{
  "items": [
    {"id": "abc123", "name": "Code Review", "description": "..."}
  ],
  "total": 1
}
```

### Get Scene
```http
GET /api/scenes/{scene_id}
```

### Create Scene
```http
POST /api/scenes
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "version": "1.0",
  "roles": [
    {
      "id": "role_id",
      "name": "Display Name",
      "description": "Role description",
      "executor": "hermes|claude|openai|claude_code",
      "model": "optional-model-override"
    }
  ],
  "stages": [
    {
      "id": "stage_id",
      "type": "requirement|design|review|decision|output",
      "roles": ["role_id1", "role_id2"],
      "moderator": "role_id",
      "max_rounds": 5,
      "consensus": "keyword|moderator|vote",
      "output_format": "markdown|code|json|mermaid"
    }
  ]
}
```

---

## Meetings API

### List Meetings
```http
GET /api/meetings
```

### Create Meeting
```http
POST /api/meetings
Content-Type: application/json

{
  "scene_name": "scene-name",
  "variables": {}
}
```

### Start Meeting
```http
POST /api/run/start
Content-Type: application/json

{
  "scene_name": "scene-name",
  "variables": {}
}
```

### Meeting Actions
```http
POST /api/meetings/{id}/pause
POST /api/meetings/{id}/resume
POST /api/meetings/{id}/approve
POST /api/meetings/{id}/reject
POST /api/meetings/{id}/intervene
Content-Type: application/json

{"content": "Your feedback"}
```

---

## Outputs API

### Generate Output
```http
POST /api/outputs/generate
Content-Type: application/json

{
  "meeting_id": "meeting-id",
  "format": "markdown|json|yaml|mermaid|html"
}
```

### List Outputs
```http
GET /api/outputs?limit=50&format=markdown&days=30
```

### Download Output
```http
GET /api/outputs/{filename}
```

---

## WebSocket API

Connect to: `ws://localhost:18602/ws/meetings/{meeting_id}`

### Message Types
```json
{
  "type": "message|stage_start|stage_update|consensus|output|agent_message",
  "data": {
    "role_id": "agent-name",
    "content": "message content",
    "stage_id": "stage-id"
  }
}
```

---

## Agents API (Phase 9)

### List Available Agents
```http
GET /api/agents
```

Response:
```json
{
  "items": [
    {"id": "hermes", "name": "HermesExecutor", "type": "executor", "status": "active"},
    {"id": "claude", "name": "ClaudeExecutor", "type": "executor", "status": "active"}
  ]
}
```

### Register Custom Agent
```http
POST /api/agents/register
Content-Type: application/json

{
  "id": "custom-agent",
  "type": "custom",
  "config": {
    "model": "gpt-4"
  }
}
```

### Remove Agent
```http
DELETE /api/agents/{agent_id}
```

### Check Agent Health
```http
GET /api/agents/{agent_id}/health
```

Response:
```json
{"status": "healthy"}
```

---

## Executor Types

| Executor | Agent Types | Description |
|----------|-------------|-------------|
| HermesExecutor | hermes, hermes-agent | Hermes Agent (ACP Protocol) |
| ClaudeExecutor | claude, claude-code | Claude Code (ACP Protocol) |
| CustomExecutor | any | Dynamically registered agents |

### Creating Custom Executor

1. Register via API or in code:
```python
from meeting.executor_manager import BaseExecutor, get_executor_manager

class MyExecutor(BaseExecutor):
    async def execute(self, prompt, context=None):
        return f"My response: {prompt}"
    
    def supports(self, agent_type):
        return agent_type == "my-agent"

manager = get_executor_manager()
manager.register_executor(MyExecutor("my-agent"))
```

2. Use in scene YAML:
```yaml
roles:
  - id: assistant
    name: "My Assistant"
    executor: "my-agent"
```