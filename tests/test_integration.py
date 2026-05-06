"""Integration tests for AI Collaboration Meeting Platform."""

import sys
from pathlib import Path

sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

from assistant.models import StageLogEntry, AssistantMemoryEntry, ReminderEntry
from generator import OutputGenerator, format_meeting_summary


class TestStageLogEntry:
    """Tests for StageLogEntry model."""

    def test_basic_creation(self):
        entry = StageLogEntry(
            stage_id="design",
            stage_type="design",
            meeting_id="test-001",
            summary="设计完成",
        )
        assert entry.stage_id == "design"
        assert entry.consensus_reached == False

    def test_with_decisions_and_actions(self):
        entry = StageLogEntry(
            stage_id="req",
            stage_type="requirement",
            meeting_id="test-002",
            summary="需求明确",
            key_decisions=["使用 Python", "采用 FastAPI"],
            action_items=["编写 API", "设计数据库"],
        )
        assert len(entry.key_decisions) == 2
        assert len(entry.action_items) == 2

    def test_default_values(self):
        entry = StageLogEntry(
            stage_id="test",
            stage_type="design",
            meeting_id="m1",
            summary="test",
        )
        assert entry.key_decisions == []
        assert entry.action_items == []
        assert entry.messages_count == 0


class TestAssistantMemoryEntry:
    """Tests for AssistantMemoryEntry model."""

    def test_creation(self):
        entry = AssistantMemoryEntry(
            meeting_id="test-meeting",
            content="This is a test memory",
        )
        assert entry.type == "meeting_log"
        assert entry.meeting_id == "test-meeting"

    def test_with_metadata(self):
        entry = AssistantMemoryEntry(
            meeting_id="m1",
            content="test",
            metadata={"stage": "design"},
        )
        assert entry.metadata["stage"] == "design"


class TestReminderEntry:
    """Tests for ReminderEntry model."""

    def test_creation(self):
        entry = ReminderEntry(
            trigger_text="记得做 X",
            extracted_item="做 X",
            meeting_id="m1",
        )
        assert entry.reminded == False


class TestFormatMeetingSummary:
    """Tests for meeting summary formatting."""

    def test_empty_logs(self):
        result = format_meeting_summary([])
        assert "# 会议总结" in result

    def test_single_stage(self):
        logs = [{
            "stage_type": "requirement",
            "summary": "需求明确",
            "key_decisions": ["选择 FastAPI"],
            "action_items": ["编写代码"],
        }]
        result = format_meeting_summary(logs)
        assert "需求分析" in result
        assert "FastAPI" in result

    def test_multiple_stages(self):
        logs = [
            {"stage_type": "requirement", "summary": "需求阶段"},
            {"stage_type": "design", "summary": "设计阶段"},
        ]
        result = format_meeting_summary(logs)
        assert "需求分析" in result
        assert "设计方案" in result


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])