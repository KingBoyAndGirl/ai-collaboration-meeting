# AI Collaboration Meeting Platform

> 人类当导演，AI当演员

## Quick Start

```bash
# Prerequisites: uv, Node.js 20+
git clone https://github.com/KingBoyAndGirl/ai-collaboration-meeting
cd ai-collaboration-meeting

# Backend (port 18600)
uv run uvicorn main:app --host 0.0.0.0 --port 18600

# Frontend (port 18601)
npm install
npm run dev
```

## Architecture

```
src/
├── main.py          # FastAPI entry
├── ws.py            # WebSocket routes
├── generator.py     # Output generation
└── assistant/
    ├── models.py    # Pydantic models
    ├── agent.py     # AssistantAgent
    └── memory_adapter.py
```

## API Endpoints

- `GET /api/health` - Health check
- `WS /ws/{meeting_id}` - WebSocket connection

## Production

- Frontend: https://ai-meeting.nasw.heiyu.space
- Backend: https://ai-meeting.nasw.heiyu.space/api

## License

MIT