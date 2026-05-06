"""Assistant Agent - Records, memorizes, and reminds during AI collaboration meetings.

Uses native Hermes Agent memory system (MemoryManager + MemoryProvider).
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from .models import StageLogEntry, AssistantMemoryEntry, ReminderEntry


class AssistantAgent:
    """Stage assistant that logs meeting progress and manages memory.
    
    Responsibilities:
    - Record each stage outcome
    - Store key decisions in memory (via MemoryManager)
    - Trigger reminders based on "remember X" patterns
    """
    
    def __init__(self, meeting_id: str, memory_manager: Optional[Any] = None):
        self.meeting_id = meeting_id
        self.memory_manager = memory_manager
        self.stage_logs: List[StageLogEntry] = []
        self.reminders: List[ReminderEntry] = []
    
    def log_stage(self, stage_id: str, stage_type: str, messages: List[Dict[str, Any]],
                  summary: str, consensus: bool = False,
                  decisions: Optional[List[str]] = None,
                  action_items: Optional[List[str]] = None) -> StageLogEntry:
        """Record stage completion and sync to memory."""
        entry = StageLogEntry(
            stage_id=stage_id,
            stage_type=stage_type,
            meeting_id=self.meeting_id,
            summary=summary,
            consensus_reached=consensus,
            messages_count=len(messages),
            raw_messages=messages,
            key_decisions=decisions or [],
            action_items=action_items or []
        )
        self.stage_logs.append(entry)
        
        # Sync to Hermes memory
        if self.memory_manager:
            self.memory_manager.on_delegation(
                task=f"Stage {stage_id} completed",
                result=summary,
                session_id=self.meeting_id
            )
        
        return entry
    
    def detect_reminder(self, content: str) -> Optional[ReminderEntry]:
        """Detect 'remember X' patterns for future reminders."""
        patterns = ["记得", "别忘了", "需要", "一定要", "别放过"]
        for p in patterns:
            if p in content:
                idx = content.find(p)
                item = content[idx:].split("。")[0]
                reminder = ReminderEntry(
                    trigger_text=content,
                    extracted_item=item,
                    meeting_id=self.meeting_id
                )
                self.reminders.append(reminder)
                return reminder
        return None
    
    def get_context(self) -> str:
        """Get stored context for this meeting."""
        if not self.memory_manager:
            return ""
        return self.memory_manager.prefetch_all(
            query=f"meeting:{self.meeting_id}",
            session_id=self.meeting_id
        )
    
    def finalize(self, all_messages: List[Dict[str, Any]]) -> None:
        """Called at meeting end to flush memory."""
        if self.memory_manager:
            self.memory_manager.on_session_end(all_messages)