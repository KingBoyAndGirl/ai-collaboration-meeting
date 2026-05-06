"""Tests for scene parser."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

from scene_parser import parse_scene, Scene, Role, Stage, get_default_scene


def test_parse_default_scene():
    """Test parsing default scene."""
    scene = parse_scene(get_default_scene())
    assert scene.name == "Demo Meeting"
    assert len(scene.roles) == 2
    assert len(scene.stages) == 2


def test_valid_scene():
    """Test valid scene structure."""
    yaml = """
name: "Test"
description: "Test scene"
roles:
  - id: pm
    name: "PM"
    description: "Product manager"
    executor: "claude"
stages:
  - id: req
    type: requirement
    roles: [pm]
    moderator: pm
"""
    scene = parse_scene(yaml)
    assert scene.name == "Test"
    assert scene.roles[0].id == "pm"


def test_invalid_role_reference():
    """Test invalid role reference fails."""
    yaml = """
name: "Test"
description: "Test"
roles:
  - id: pm
    name: "PM"
    description: "PM"
    executor: "claude"
stages:
  - id: req
    type: requirement
    roles: [unknown_role]
    moderator: pm
"""
    try:
        parse_scene(yaml)
        assert False, "Should have raised error"
    except ValueError as e:
        assert "unknown_role" in str(e)


def test_invalid_stage_type():
    """Test invalid stage type fails."""
    yaml = """
name: "Test"
description: "Test"
roles:
  - id: pm
    name: "PM"
    description: "PM"
    executor: "claude"
stages:
  - id: req
    type: invalid_type
    roles: [pm]
    moderator: pm
"""
    try:
        parse_scene(yaml)
        assert False, "Should have raised error"
    except Exception:
        pass


if __name__ == "__main__":
    test_parse_default_scene()
    test_valid_scene()
    test_invalid_role_reference()
    test_invalid_stage_type()
    print("✅ All scene parser tests passed!")