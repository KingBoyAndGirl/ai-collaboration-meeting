"""场景模板路由"""
from fastapi import APIRouter
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/templates", tags=["templates"])


class Template(BaseModel):
    id: str
    name: str
    description: str
    category: str


TEMPLATES = [
    Template(
        id="code_review",
        name="代码审查",
        description="多 Agent 协作进行代码审查",
        category="开发"
    ),
    Template(
        id="content_creation",
        name="内容创作",
        description="AI 协作创作文章和内容",
        category="创作"
    ),
    Template(
        id="data_analysis",
        name="数据分析",
        description="数据分析和可视化设计",
        category="分析"
    ),
    Template(
        id="product_design",
        name="产品设计",
        description="产品需求分析和设计",
        category="业务"
    ),
    Template(
        id="meeting_notes",
        name="会议记录",
        description="会议记录和总结",
        category="办公"
    ),
]


@router.get("")
async def list_templates() -> List[Template]:
    """列出所有模板"""
    return TEMPLATES


@router.get("/{template_id}")
async def get_template(template_id: str):
    """获取模板详情"""
    # 返回 YAML 内容
    yaml_path = f"scenes/{template_id}.yaml"
    try:
        with open(yaml_path, 'r') as f:
            return {"id": template_id, "yaml": f.read()}
    except FileNotFoundError:
        return {"error": "Template not found"}