"""集成测试 - 完整流程"""
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestFullWorkflow:
    """完整会议流程测试"""
    
    def test_complete_workflow(self):
        """测试完整流程: 创建场景 → 创建会议 → 启动 → 反馈 → 产出物"""
        # 1. 创建场景
        scene_resp = client.post("/api/scenes", json={
            "name": "integration-test",
            "description": "集成测试场景",
            "version": "1.0",
            "roles": [
                {"id": "assistant", "name": "助手", "description": "AI助手", "executor": "hermes"}
            ],
            "stages": [
                {"id": "discuss", "type": "design", "roles": ["assistant"], "moderator": "assistant", "max_rounds": 1}
            ]
        })
        assert scene_resp.status_code == 201
        scene_id = scene_resp.json()["id"]
        
        # 2. 创建会议
        meeting_resp = client.post("/api/meetings", json={"scene_name": "integration-test"})
        assert meeting_resp.status_code == 201
        meeting_id = meeting_resp.json()["id"]
        
        # 3. 启动会议
        run_resp = client.post("/api/run/start", json={"scene_name": "integration-test"})
        assert run_resp.status_code == 200
        assert "meeting_id" in run_resp.json()
        
        # 4. 生成产出物
        output_resp = client.post("/api/outputs/generate", json={
            "meeting_id": meeting_id,
            "format": "markdown"
        })
        assert output_resp.status_code == 200
        assert "file_path" in output_resp.json()
    
    def test_multi_stage_workflow(self):
        """测试多阶段流程"""
        # 创建多阶段场景
        client.post("/api/scenes", json={
            "name": "multi-stage",
            "description": "多阶段测试",
            "version": "1.0",
            "roles": [
                {"id": "pm", "name": "产品经理", "description": "PM", "executor": "hermes"}
            ],
            "stages": [
                {"id": "req", "type": "requirement", "roles": ["pm"], "moderator": "pm"},
                {"id": "design", "type": "design", "roles": ["pm"], "moderator": "pm"}
            ]
        })
        
        # 验证场景创建成功
        scenes = client.get("/api/scenes").json()
        multi_scene = next((s for s in scenes["items"] if s["name"] == "multi-stage"), None)
        assert multi_scene is not None


class TestErrorHandling:
    """错误处理测试"""
    
    def test_missing_scene(self):
        """测试场景不存在"""
        resp = client.get("/api/scenes/nonexistent")
        assert resp.status_code == 404
    
    def test_invalid_meeting_id(self):
        """测试无效会议ID"""
        resp = client.post("/api/intervention/meetings/invalid/feedback", 
                        json={"content": "test"})
        assert resp.status_code == 404
    
    def test_empty_scenes_list(self):
        """测试空场景列表"""
        # 这个测试假设初始状态为空
        resp = client.get("/api/scenes")
        assert resp.status_code == 200
        assert "items" in resp.json()


class TestOutputFormat:
    """输出格式测试"""
    
    def test_all_formats(self):
        """测试所有输出格式"""
        formats = ["markdown", "json", "yaml", "mermaid", "html"]
        
        # 创建会议
        meeting_resp = client.post("/api/meetings", json={"scene_name": "test"})
        meeting_id = meeting_resp.json()["id"]
        
        for fmt in formats:
            resp = client.post("/api/outputs/generate", json={
                "meeting_id": meeting_id,
                "format": fmt
            })
            assert resp.status_code == 200, f"Failed for format {fmt}"
            assert "file_path" in resp.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])