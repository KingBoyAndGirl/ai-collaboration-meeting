"""压力测试工具"""
import asyncio
import aiohttp
import time
from typing import List, Dict

BASE_URL = "http://localhost:18602"

async def create_meeting(session: aiohttp.ClientSession, meeting_id: str) -> Dict:
    """创建会议"""
    async with session.post(f"{BASE_URL}/api/meetings", json={
        "scene_name": "test_scene",
        "variables": {}
    }) as resp:
        return await resp.json()

async def send_message(session: aiohttp.ClientSession, meeting_id: str, content: str) -> Dict:
    """发送消息"""
    async with session.post(f"{BASE_URL}/api/meetings/{meeting_id}/intervene", json={
        "content": content
    }) as resp:
        return await resp.json()

async def stress_test_meetings(count: int = 100):
    """并发创建会议"""
    async with aiohttp.ClientSession() as session:
        tasks = [create_meeting(session, f"test_{i}") for i in range(count)]
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        elapsed = time.time() - start
        print(f"创建 {count} 个会议耗时: {elapsed:.2f}s")
        return results

async def stress_test_messages(meeting_id: str, count: int = 1000):
    """并发发送消息"""
    async with aiohttp.ClientSession() as session:
        tasks = [send_message(session, meeting_id, f"消息 {i}") for i in range(count)]
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        elapsed = time.time() - start
        print(f"发送 {count} 条消息耗时: {elapsed:.2f}s")
        return results

if __name__ == "__main__":
    asyncio.run(stress_test_meetings(100))