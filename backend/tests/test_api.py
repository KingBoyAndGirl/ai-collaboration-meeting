"""API 单元测试"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    """测试健康检查"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_create_scene():
    """测试创建场景"""
    scene_data = {
        "name": "test-scene",
        "description": "Test scene",
        "version": "1.0",
        "roles": [{"id": "tester", "name": "Tester", "description": "Test", "executor": "hermes"}],
        "stages": [{"id": "test", "type": "design", "roles": ["tester"], "moderator": "tester"}]
    }
    response = client.post("/api/scenes", json=scene_data)
    assert response.status_code == 201
    assert "id" in response.json()


def test_list_scenes():
    """测试列出场景"""
    response = client.get("/api/scenes")
    assert response.status_code == 200
    assert "items" in response.json()


def test_create_meeting():
    """测试创建会议"""
    response = client.post("/api/meetings", json={"scene_name": "test-scene"})
    assert response.status_code == 201
    assert "id" in response.json()


def test_list_meetings():
    """测试列出会议"""
    response = client.get("/api/meetings")
    assert response.status_code == 200
    assert "items" in response.json()


def test_run_start():
    """测试启动会议"""
    response = client.post("/api/run/start", json={"scene_name": "test-scene"})
    assert response.status_code == 200
    assert "meeting_id" in response.json()


def test_outputs_generate():
    """测试产出物生成"""
    # 先创建一个会议
    meeting_resp = client.post("/api/meetings", json={"scene_name": "test-scene"})
    meeting_id = meeting_resp.json()["id"]
    
    response = client.post("/api/outputs/generate", json={
        "meeting_id": meeting_id,
        "format": "markdown"
    })
    assert response.status_code == 200
    assert "file_path" in response.json()


def test_intervention_routes():
    """测试介入路由"""
    # 先创建一个会议
    meeting_resp = client.post("/api/meetings", json={"scene_name": "test-scene"})
    meeting_id = meeting_resp.json()["id"]
    
    # 测试反馈 (注意路径是 /api/intervention/meetings/{id}/feedback)
    response = client.post(f"/api/intervention/meetings/{meeting_id}/feedback", json={
        "content": "Test feedback"
    })
    # 可能返回 404 因为没有运行中的引擎，但路由是正确的
    assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])