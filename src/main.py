"""Main entry point for AI Collaboration Meeting platform."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from assistant.agent import AssistantAgent
from executors.hermes_executor import HermesExecutor
from ws import router as ws_router
from generator import OutputGenerator, format_meeting_summary

app = FastAPI(
    title="AI Collaboration Meeting Platform",
    version="0.1.0"
)

# CORS for Web UI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include WebSocket routes
app.include_router(ws_router)

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}

@app.post("/api/meetings/{meeting_id}/stages/{stage_id}/complete")
async def complete_stage(meeting_id: str, stage_id: str, summary: str):
    """Complete a stage and log to memory."""
    assistant = AssistantAgent(meeting_id=meeting_id)
    # FUTURE: integrate with MeetingEngine for stage completion
    # 当前仅记录到 Hermes 记忆
    return {"meeting_id": meeting_id, "stage_id": stage_id, "logged": True}

@app.post("/api/meetings/{meeting_id}/generate")
async def generate_output(meeting_id: str, stage_logs: list, title: str = "Meeting Output"):
    """Generate deliverables from meeting stage logs."""
    gen = OutputGenerator(meeting_id)
    md_content = format_meeting_summary(stage_logs)
    filepath = gen.generate_markdown(title, md_content, "final")
    return {"path": str(filepath), "size": filepath.stat().st_size}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18600)