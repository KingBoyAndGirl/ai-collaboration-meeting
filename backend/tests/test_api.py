"""集成测试"""
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
    response = client.post(
        "/api/scenes",
        json={
            "name": "测试场景",
            "description": "测试",
            "version": "1.0"
        }
    )
    assert response.status_code == 201


def test_list_scenes():
    """测试列出场景"""
    response = client.get("/api/scenes")
    assert response.status_code == 200
    assert "items" in response.json()


def test_create_meeting():
    """测试创建会议"""
    response = client.post(
        "/api/meetings",
        json={"scene_name": "test"}
    )
    assert response.status_code == 201


if __name__ == "__main__":
    pytest.main([__file__, "-v"])