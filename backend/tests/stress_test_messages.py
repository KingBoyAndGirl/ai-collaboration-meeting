"""压力测试扩展 - 消息发送"""
import asyncio
import aiohttp
import time

BASE_URL = "http://localhost:18602"

async def create_meeting(session: aiohttp.ClientSession, meeting_id: str) -> str:
    """创建会议并返回ID"""
    async with session.post(f"{BASE_URL}/api/meetings", json={
        "scene_name": "test_scene",
        "variables": {}
    }) as resp:
        data = await resp.json()
        return data.get("id", meeting_id)

async def send_message(session: aiohttp.ClientSession, meeting_id: str, index: int) -> bool:
    """发送单条消息"""
    try:
        async with session.post(f"{BASE_URL}/api/meetings/{meeting_id}/intervene", json={
            "content": f"压力测试消息 {index}"
        }) as resp:
            return resp.status == 200
    except:
        return False

async def stress_test_messages(count: int = 1000):
    """并发发送消息测试"""
    # 先创建一个会议
    async with aiohttp.ClientSession() as session:
        meeting_id = await create_meeting(session, "stress_test")
        
        # 并发发送消息
        tasks = [send_message(session, meeting_id, i) for i in range(count)]
        start = time.time()
        results = await asyncio.gather(*tasks, return_exceptions=True)
        elapsed = time.time() - start
        
        success_count = sum(1 for r in results if r is True)
        print(f"发送 {count} 条消息: {success_count}/{count} 成功, 耗时 {elapsed:.2f}s")
        print(f"平均延迟: {elapsed/count*1000:.2f}ms")
        
        return success_count, elapsed

if __name__ == "__main__":
    success, elapsed = asyncio.run(stress_test_messages(1000))
    if success == 1000:
        print("✅ 消息发送压力测试通过")
    else:
        print(f"❌ 消息发送压力测试失败: {success}/1000 成功")