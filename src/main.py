"""Main entry point for AI Collaboration Meeting platform."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from assistant.agent import AssistantAgent
from executors.hermes_executor import HermesExecutor
from ws import router as ws_router

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
    # TODO: integrate with actual stage completion logic
    return {"meeting_id": meeting_id, "stage_id": stage_id, "logged": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=18600)