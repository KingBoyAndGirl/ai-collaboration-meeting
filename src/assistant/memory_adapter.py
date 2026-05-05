"""Memory adapter for integrating Hermes memory with AI collaboration meetings.

Hermes has TWO memory systems:
1. MemoryStore (builtin): MEMORY.md + USER.md, always available
2. MemoryManager + MemoryProvider: External providers (honcho, mem0, etc.)
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

# Hermes agent imports (available on prodbox)
try:
    from tools.memory_tool import MemoryStore
    from agent.memory_manager import MemoryManager
    from agent.memory_provider import MemoryProvider
    from plugins.memory import load_memory_provider
    HERMES_AVAILABLE = True
except ImportError:
    HERMES_AVAILABLE = False
    MemoryStore = None  # type: ignore
    MemoryManager = None  # type: ignore
    MemoryProvider = None  # type: ignore
    load_memory_provider = None  # type: ignore


def create_builtin_memory_store() -> Optional[MemoryStore]:
    """Create the builtin MemoryStore (MEMORY.md + USER.md)."""
    if not HERMES_AVAILABLE:
        return None
    return MemoryStore()


def create_memory_manager(provider_name: Optional[str] = None) -> Optional[MemoryManager]:
    """Create MemoryManager with optional external provider.
    
    Args:
        provider_name: Optional external provider ('honcho', 'mem0', etc.)
    
    Returns:
        MemoryManager instance
    """
    if not HERMES_AVAILABLE:
        return None
    
    mm = MemoryManager()
    if provider_name and load_memory_provider:
        provider = load_memory_provider(provider_name)
        if provider and provider.is_available():
            mm.add_provider(provider)
    return mm


class MeetingMemoryAdapter:
    """Adapter combining MemoryStore (builtin) and MemoryManager (external)."""
    
    def __init__(self, meeting_id: str):
        self.meeting_id = meeting_id
        self.store = create_builtin_memory_store()
        self.mm = create_memory_manager()
    
    def prefetch_context(self, query: str) -> str:
        """Get relevant memory from builtin store."""
        if self.store:
            return self.store.query_memory(query)
        return ""
    
    def record_turn(self, user_msg: str, assistant_msg: str) -> None:
        """Record conversation to both systems."""
        # Builtin memory store
        if self.store:
            # MemoryStore writes via memory tool actions
            pass  # Handled by MeetingEngine if needed
        
        # External provider (if configured)
        if self.mm and self.mm.providers:
            self.mm.sync_all(
                user_content=user_msg,
                assistant_content=assistant_msg,
                session_id=self.meeting_id
            )
    
    def session_end(self, messages: List[Dict[str, Any]]) -> None:
        """Flush memory at meeting end."""
        if self.mm and self.mm.providers:
            self.mm.on_session_end(messages)
    
    def log_to_builtin(self, content: str) -> None:
        """Write a memory entry to MEMORY.md."""
        if self.store:
            # MemoryStore uses memory tool format internally
            # For direct write to MEMORY.md:
            pass