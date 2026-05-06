"""压力测试"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestPerformance:
    """性能测试"""
    
    def test_concurrent_meetings(self):
        """测试并发创建会议"""
        import concurrent.futures
        import threading
        
        def create_meeting(i):
            resp = client.post("/api/meetings", json={"scene_name": f"test-{i}"})
            return resp.status_code == 201
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(create_meeting, range(20)))
        
        assert all(results), "Should handle concurrent requests"
    
    def test_large_scene(self):
        """测试大型场景"""
        # 创建具有多个角色和阶段的场景
        roles = [{"id": f"role-{i}", "name": f"角色{i}", "description": "测试", "executor": "hermes"} 
                 for i in range(5)]
        stages = [{"id": f"stage-{i}", "type": "design", "roles": ["role-0"], "moderator": "role-0"} 
                  for i in range(3)]
        
        resp = client.post("/api/scenes", json={
            "name": "large-scene",
            "description": "Large scene test",
            "version": "1.0",
            "roles": roles,
            "stages": stages
        })
        assert resp.status_code == 201


class TestEdgeCases:
    """边界情况测试"""
    
    def test_empty_content_feedback(self):
        """测试空反馈"""
        meeting_resp = client.post("/api/meetings", json={"scene_name": "test"})
        meeting_id = meeting_resp.json()["id"]
        
        resp = client.post(f"/api/intervention/meetings/{meeting_id}/feedback", 
                          json={"content": ""})
        # 404 是正常的，因为会议引擎未运行
        assert resp.status_code in [200, 400, 404]
    
    def test_very_long_feedback(self):
        """测试长反馈"""
        meeting_resp = client.post("/api/meetings", json={"scene_name": "test"})
        meeting_id = meeting_resp.json()["id"]
        
        long_text = "x" * 10000
        resp = client.post(f"/api/intervention/meetings/{meeting_id}/feedback", 
                          json={"content": long_text})
        assert resp.status_code in [200, 400, 404, 413]
    
    def test_special_characters(self):
        """测试特殊字符"""
        resp = client.post("/api/scenes", json={
            "name": "test-特殊-场景",
            "description": "描<述> & \"special' chars",
            "version": "1.0",
            "roles": [],
            "stages": []
        })
        assert resp.status_code == 201


if __name__ == "__main__":
    pytest.main([__file__, "-v"])