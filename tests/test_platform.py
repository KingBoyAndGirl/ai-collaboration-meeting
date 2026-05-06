"""Tests for AI Collaboration Meeting Platform."""

import sys
from pathlib import Path
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

from assistant.models import StageLogEntry
from generator import OutputGenerator, format_meeting_summary


def test_stage_log_entry():
    """Test StageLogEntry model."""
    entry = StageLogEntry(
        stage_id="design",
        stage_type="design",
        meeting_id="test-001",
        summary="设计完成",
        key_decisions=["采用 React"],
        action_items=["实现 UI"]
    )
    assert entry.stage_id == "design"
    assert entry.meeting_id == "test-001"
    assert entry.consensus_reached == False
    print("✅ StageLogEntry test passed")


def test_output_generator():
    """Test OutputGenerator with temp directory."""
    import tempfile
    
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = OutputGenerator("test-meeting", output_dir=Path(tmpdir))
        
        filepath = gen.generate_markdown("Test Doc", "# Hello")
        assert filepath.exists()
        assert "Test Doc" in filepath.read_text()
        print("✅ OutputGenerator test passed")


def test_format_meeting_summary():
    """Test meeting summary formatting."""
    logs = [{
        "stage_type": "requirement",
        "summary": "需求明确",
        "key_decisions": ["使用 Python"],
        "action_items": ["编写代码"]
    }]
    result = format_meeting_summary(logs)
    assert "需求分析" in result
    assert "需求明确" in result
    print("✅ format_meeting_summary test passed")


if __name__ == "__main__":
    test_stage_log_entry()
    test_output_generator()
    test_format_meeting_summary()
    print("\n✅ All tests passed!")