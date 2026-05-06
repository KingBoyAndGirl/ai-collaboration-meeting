"""Tests for meeting engine."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

import asyncio
import pytest
from meeting_engine import MeetingEngine, create_meeting
from scene_parser import get_default_scene, parse_scene


def test_create_meeting():
    """Test meeting creation."""
    engine = create_meeting("test-001", get_default_scene())
    assert engine.scene.name == "Demo Meeting"
    assert engine.status == "created"


def test_get_current_stage():
    """Test current stage retrieval."""
    engine = create_meeting("test-001", get_default_scene())
    stage = engine.get_current_stage()
    assert stage is not None
    assert stage.id == "requirement"


def test_all_stages_completed():
    """Test stage completion check."""
    engine = create_meeting("test-001", get_default_scene())
    assert not engine.all_stages_completed()
    
    # Simulate all stages completed
    engine.current_stage_idx = 10
    assert engine.all_stages_completed()


def test_stage_progress():
    """Test stage progression."""
    engine = create_meeting("test-001", get_default_scene())
    assert engine.current_stage_idx == 0
    stage = engine.get_current_stage()
    assert stage.id == "requirement"
    
    engine.current_stage_idx = 1
    stage = engine.get_current_stage()
    assert stage.id == "output"


@pytest.mark.asyncio
async def test_run_stage():
    """Test running a single stage."""
    engine = create_meeting("test-001", get_default_scene())
    stage = engine.get_current_stage()
    result = await engine.run_stage(stage)
    
    assert result.stage_id == "requirement"
    assert result.consensus_reached == True
    assert len(engine.stage_results) == 1


@pytest.mark.asyncio
async def test_run_all():
    """Test running all stages."""
    engine = create_meeting("test-001", get_default_scene())
    results = await engine.run_all()
    
    assert len(results) == 2
    assert engine.status == "completed"


if __name__ == "__main__":
    asyncio.run(test_run_stage())
    asyncio.run(test_run_all())
    test_create_meeting()
    test_get_current_stage()
    test_all_stages_completed()
    test_stage_progress()
    print("✅ All meeting engine tests passed!")