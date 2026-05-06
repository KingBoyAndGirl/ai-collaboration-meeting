"""Assistant Log Pydantic models for meeting logging."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class StageLogEntry(BaseModel):
    """Single stage log entry."""
    
    stage_id: str
    stage_type: str  # requirement, design, review, decision, output
    meeting_id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    
    # Content
    summary: str
    key_decisions: List[str] = Field(default_factory=list)
    action_items: List[str] = Field(default_factory=list)
    
    # Metadata
    consensus_reached: bool = False
    messages_count: int = 0
    duration_seconds: Optional[float] = None
    
    # Raw data (for recovery/debugging)
    raw_messages: Optional[List[Dict[str, Any]]] = None


class AssistantMemoryEntry(BaseModel):
    """Memory entry written by assistant to MEMORY.md."""
    
    type: str = "meeting_log"
    meeting_id: str
    stage_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now())
    content: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReminderEntry(BaseModel):
    """Reminder entry detected from user input."""
    
    trigger_text: str
    extracted_item: str
    meeting_id: str
    detected_at: datetime = Field(default_factory=lambda: datetime.now())
    reminded: bool = False