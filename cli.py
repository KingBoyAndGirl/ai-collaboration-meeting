#!/usr/bin/env python3
"""AI Meeting CLI 工具"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

import argparse
import asyncio
from meeting.scene_parser import SceneParser
from meeting.engine import MeetingEngine
from meeting.runner import MeetingRunner


async def run_scene_yaml(file_path: str):
    """运行场景 YAML 文件"""
    parser = SceneParser()
    scene = parser.parse_file(file_path)
    
    engine = MeetingEngine(scene)
    meeting = engine.init_meeting()
    
    print(f"启动会议: {meeting.id}")
    print(f"场景: {scene.name}")
    print("-" * 40)
    
    runner = MeetingRunner(engine)
    
    # 运行阶段（去掉网络依赖，使用模拟）
    for stage in scene.stages[:1]:  # 只运行第一阶段
        print(f"\n阶段: {stage.id}")
        for role_id in stage.roles:
            role = next((r for r in scene.roles if r.id == role_id), None)
            if role:
                print(f"  {role.name}: ", end="", flush=True)
                # 模拟输出
                print("输出内容...")


def main():
    parser = argparse.ArgumentParser(description="AI Meeting CLI")
    parser.add_argument("yaml_file", help="场景 YAML 文件路径")
    parser.add_argument("--run", action="store_true", help="运行会议")
    
    args = parser.parse_args()
    
    if args.run:
        asyncio.run(run_scene_yaml(args.yaml_file))


if __name__ == "__main__":
    main()