"""Tests for AssistantAgent and MemoryAdapter."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

import pytest


class TestAssistantAgent:
    """Test AssistantAgent functionality."""

    def test_log_stage(self):
        from assistant.agent import AssistantAgent
        agent = AssistantAgent("meeting-001")
        
        entry = agent.log_stage(
            stage_id="test",
            stage_type="design",
            messages=[{"role": "test", "content": "hi"}],
            summary="Test stage"
        )
        
        assert entry.stage_id == "test"
        assert entry.summary == "Test stage"
        assert len(agent.stage_logs) == 1

    def test_detect_reminder(self):
        from assistant.agent import AssistantAgent
        agent = AssistantAgent("meeting-001")
        
        reminder = agent.detect_reminder("记得完成任务")
        
        assert reminder is not None
        assert reminder.meeting_id == "meeting-001"

    def test_detect_reminder_not_found(self):
        from assistant.agent import AssistantAgent
        agent = AssistantAgent("meeting-001")
        
        reminder = agent.detect_reminder("hello world")
        assert reminder is None


class TestMemoryAdapter:
    """Test MemoryAdapter functionality."""
    
    def test_prefill_memory(self):
        from assistant.memory_adapter import MemoryAdapter
        adapter = MemoryAdapter()
        
        # Should not crash
        adapter.prefill_memory("test", {})


if __name__ == "__main__":
    pytest.main([__file__, "-v"])