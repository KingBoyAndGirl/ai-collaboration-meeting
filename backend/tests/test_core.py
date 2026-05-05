"""单元测试"""
import pytest
from meeting.models import Scene, Role, Stage, StageType, ConsensusMethod
from meeting.scene_parser import SceneParser
from meeting.consensus import ConsensusDetector
from meeting.engine import MeetingEngine


def test_scene_model():
    """测试场景模型"""
    roles = [Role(id="dev", name="开发者", description="写代码", executor="claude")]
    stages = [Stage(id="design", type=StageType.DESIGN, roles=["dev"], moderator="dev")]
    
    scene = Scene(
        name="测试场景",
        description="测试用",
        version="1.0",
        roles=roles,
        stages=stages
    )
    
    assert scene.name == "测试场景"
    assert len(scene.roles) == 1


def test_scene_parser():
    """测试场景解析"""
    parser = SceneParser()
    config = {
        "name": "测试",
        "description": "描述",
        "version": "1.0",
        "roles": [{"id": "r1", "name": "角色1", "description": "测试", "executor": "claude"}],
        "stages": [{"id": "s1", "type": "design", "roles": ["r1"], "moderator": "r1"}]
    }
    
    scene = parser.parse(config)
    assert scene.name == "测试"


def test_consensus_detection():
    """测试共识检测"""
    from meeting.models import Message, MessageRole
    
    messages = [
        Message(id="1", role=MessageRole.AGENT, role_id="a1", content="同意", timestamp=0),
        Message(id="2", role=MessageRole.AGENT, role_id="a2", content="可以", timestamp=0),
    ]
    
    is_consensus, reason = ConsensusDetector.detect_by_keyword(messages, ["同意", "可以"])
    assert is_consensus is True


def test_meeting_engine():
    """测试会议引擎"""
    roles = [Role(id="dev", name="开发者", description="写代码", executor="claude")]
    stages = [Stage(id="design", type=StageType.DESIGN, roles=["dev"], moderator="dev")]
    scene = Scene(name="测试", description="测试", version="1.0", roles=roles, stages=stages)
    
    engine = MeetingEngine(scene)
    meeting = engine.init_meeting()
    
    assert meeting.scene_name == "测试"
    assert meeting.status == "created"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])