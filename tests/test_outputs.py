"""Tests for Markdown output generator."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

import tempfile
from pathlib import Path
from outputs.markdown import MarkdownGenerator


def test_generate_stage_output():
    """Test stage markdown generation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = MarkdownGenerator(Path(tmpdir))
        
        path = gen.generate_stage_output(
            stage_id="test-stage",
            stage_type="requirement",
            summary="Test summary",
            decisions=["Decision 1"],
            action_items=["Action 1"]
        )
        
        assert path.exists()
        content = path.read_text()
        assert "# Requirement 阶段输出" in content
        assert "Test summary" in content
        assert "Decision 1" in content
        assert "Action 1" in content


def test_generate_meeting_summary():
    """Test meeting summary generation."""
    with tempfile.TemporaryDirectory() as tmpdir:
        gen = MarkdownGenerator(Path(tmpdir))
        
        stages = [{
            "stage_type": "requirement",
            "stage_id": "req-1",
            "summary": "Requirements gathered",
            "key_decisions": ["Use Python"],
            "action_items": ["Build API"]
        }]
        
        path = gen.generate_meeting_summary("meeting-001", stages)
        
        assert path.exists()
        content = path.read_text()
        assert "会议总结" in content
        assert "Requirements gathered" in content


if __name__ == "__main__":
    test_generate_stage_output()
    test_generate_meeting_summary()
    print("✅ Markdown generator tests passed!")