"""SQLite 数据库层 - 持久化存储"""
import sqlite3
import json
import os
from datetime import datetime
from typing import List, Optional, Dict, Any
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", os.path.expanduser("~/ai-collaboration-meeting/data/meeting.db"))

# 确保目录存在
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

def get_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """初始化数据库表"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # 场景表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS scenes (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            icon TEXT DEFAULT '💡',
            agents TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Agent 表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'active',
            config TEXT DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 会议表
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id TEXT PRIMARY KEY,
            scene_id TEXT,
            scene_name TEXT NOT NULL,
            status TEXT DEFAULT 'created',
            messages TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (scene_id) REFERENCES scenes(id)
        )
    """)
    
    conn.commit()
    conn.close()

# ==================== 场景操作 ====================

def create_scene(scene_id: str, name: str, description: str, icon: str, agents: List[Dict]) -> Dict:
    """创建场景"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO scenes (id, name, description, icon, agents) VALUES (?, ?, ?, ?, ?)",
        (scene_id, name, description, icon, json.dumps(agents))
    )
    conn.commit()
    conn.close()
    return {"id": scene_id, "name": name, "description": description, "icon": icon, "agents": agents}

def get_scene(scene_id: str) -> Optional[Dict]:
    """获取场景"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenes WHERE id = ?", (scene_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "icon": row["icon"],
            "agents": json.loads(row["agents"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
    return None

def list_scenes() -> List[Dict]:
    """列出所有场景"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scenes ORDER BY updated_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "icon": row["icon"],
            "agents": json.loads(row["agents"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
        for row in rows
    ]

def update_scene(scene_id: str, name: str, description: str, icon: str, agents: List[Dict]) -> Optional[Dict]:
    """更新场景"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE scenes SET name = ?, description = ?, icon = ?, agents = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (name, description, icon, json.dumps(agents), scene_id)
    )
    conn.commit()
    conn.close()
    return get_scene(scene_id)

def delete_scene(scene_id: str) -> bool:
    """删除场景"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM scenes WHERE id = ?", (scene_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# ==================== Agent 操作 ====================

def create_agent(agent_id: str, name: str, agent_type: str, description: str, config: Dict) -> Dict:
    """创建 Agent"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO agents (id, name, type, description, config) VALUES (?, ?, ?, ?, ?)",
        (agent_id, name, agent_type, description, json.dumps(config))
    )
    conn.commit()
    conn.close()
    return {"id": agent_id, "name": name, "type": agent_type, "description": description, "status": "active", "config": config}

def get_agent(agent_id: str) -> Optional[Dict]:
    """获取 Agent"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agents WHERE id = ?", (agent_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "description": row["description"],
            "status": row["status"],
            "config": json.loads(row["config"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
    return None

def list_agents() -> List[Dict]:
    """列出所有 Agent"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM agents ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row["id"],
            "name": row["name"],
            "type": row["type"],
            "description": row["description"],
            "status": row["status"],
            "config": json.loads(row["config"]),
            "created_at": row["created_at"],
            "updated_at": row["updated_at"]
        }
        for row in rows
    ]

def update_agent(agent_id: str, name: str, agent_type: str, description: str, status: str, config: Dict) -> Optional[Dict]:
    """更新 Agent"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE agents SET name = ?, type = ?, description = ?, status = ?, config = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (name, agent_type, description, status, json.dumps(config), agent_id)
    )
    conn.commit()
    conn.close()
    return get_agent(agent_id)

def delete_agent(agent_id: str) -> bool:
    """删除 Agent"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM agents WHERE id = ?", (agent_id,))
    deleted = cursor.rowcount > 0
    conn.commit()
    conn.close()
    return deleted

# 初始化数据库
init_db()
