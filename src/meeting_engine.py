"""Meeting Engine - Core orchestration for AI collaboration meetings."""

from __future__ import annotations

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from scene_parser import Scene, Stage, parse_scene
from assistant.models import StageLogEntry


class MeetingEngine:
    """Orchestrates the meeting flow across stages."""

    def __init__(self, meeting_id: str, scene: Scene, executor_factory: Optional[callable] = None):
        self.meeting_id = meeting_id
        self.scene = scene
        self.executor_factory = executor_factory
        self.current_stage_idx: int = 0
        self.stage_results: List[StageLogEntry] = []
        self.variables: Dict[str, Any] = dict(scene.variables)
        self.status: str = "created"

    def get_current_stage(self) -> Optional[Stage]:
        if self.current_stage_idx < len(self.scene.stages):
            return self.scene.stages[self.current_stage_idx]
        return None

    def all_stages_completed(self) -> bool:
        return self.current_stage_idx >= len(self.scene.stages)

    async def run_stage(self, stage: Stage) -> StageLogEntry:
        """Run a single stage (simplified - no actual agent calls)."""
        messages: List[Dict[str, Any]] = []
        
        # Simulate agent discussion
        for role_id in stage.roles:
            role = next((r for r in self.scene.roles if r.id == role_id), None)
            if role:
                msg = {
                    "role": "agent",
                    "role_id": role_id,
                    "content": f"[{role.name}] Stage {stage.id} perspective..."
                }
                messages.append(msg)
        
        # Create result entry
        result = StageLogEntry(
            stage_id=stage.id,
            stage_type=stage.type,
            meeting_id=self.meeting_id,
            summary=f"Stage {stage.id} completed",
            consensus_reached=True,
            messages_count=len(messages),
            key_decisions=[f"Decision for {stage.id}"],
            action_items=[f"Action for {stage.id}"]
        )
        self.stage_results.append(result)
        return result

    async def run_all(self) -> List[StageLogEntry]:
        """Run all stages sequentially."""
        self.status = "running"
        
        while not self.all_stages_completed():
            stage = self.get_current_stage()
            if stage:
                await self.run_stage(stage)
                self.current_stage_idx += 1
        
        self.status = "completed"
        return self.stage_results


# Factory function for default scene
def create_meeting(meeting_id: str, scene_yaml: Optional[str] = None) -> MeetingEngine:
    """Create a meeting engine with optional custom scene."""
    if scene_yaml:
        scene = parse_scene(scene_yaml)
    else:
        from scene_parser import get_default_scene
        scene = parse_scene(get_default_scene())
    
    return MeetingEngine(meeting_id=meeting_id, scene=scene)


if __name__ == "__main__":
    async def demo():
        from scene_parser import get_default_scene
        engine = create_meeting("demo-001", get_default_scene())
        results = await engine.run_all()
        for r in results:
            print(f"✅ {r.stage_type}: {r.summary}")
    
    asyncio.run(demo())