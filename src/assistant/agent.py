"""Assistant Agent - Records, memorizes, and reminds during AI collaboration meetings.

Uses native Hermes Agent memory system (MemoryManager + MemoryProvider).
"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any, Dict, List, Optional

# Deferred imports to avoid hard dependency on hermes-agent
# Used in prodbox deployment where hermes-agent is installed

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
        self.stage_logs: List[Dict[str, Any]] = []
    
    def log_stage(self, stage_id: str, messages: List[Dict[str, Any]], 
                  summary: str, consensus: bool = False) -> Dict[str, Any]:
        """Record stage completion and sync to memory."""
        log_entry = {
            "meeting_id": self.meeting_id,
            "stage_id": stage_id,
            "timestamp": datetime.utcnow().isoformat(),
            "messages_count": len(messages),
            "summary": summary,
            "consensus_reached": consensus
        }
        self.stage_logs.append(log_entry)
        
        # Sync to Hermes memory
        if self.memory_manager:
            content = json.dumps({
                "type": "stage_log",
                "stage": stage_id,
                "summary": summary,
                "consensus": consensus
            })
            # Use on_delegation hook for stage completion
            self.memory_manager.on_delegation(
                task=f"Stage {stage_id} completed",
                result=summary,
                session_id=self.meeting_id
            )
        
        return log_entry
    
    def detect_reminder(self, content: str) -> Optional[str]:
        """Detect 'remember X' patterns for future reminders."""
        patterns = ["记得", "别忘了", "需要", "一定要", "别放过"]
        for p in patterns:
            if p in content:
                # Extract the thing to remember
                idx = content.find(p)
                return content[idx:].split("。")[0]  # Take first sentence
        return None
    
    def get_context(self) -> str:
        """Get stored context for this meeting."""
        if not self.memory_manager:
            return ""
        return self.memory_manager.prefetch_all(
            f"meeting:{self.meeting_id}",
            session_id=self.meeting_id
        )
    
    def finalize(self, all_messages: List[Dict[str, Any]]) -> None:
        """Called at meeting end to flush memory."""
        if self.memory_manager:
            self.memory_manager.on_session_end(all_messages)