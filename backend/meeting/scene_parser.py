"""场景 YAML 解析器"""
from typing import List, Dict
import yaml
from pathlib import Path
from .models import Scene, Role, Stage


class SceneParser:
    """场景 YAML 解析器"""

    def parse_file(self, file_path: str) -> Scene:
        """从文件解析场景"""
        with open(file_path, 'r', encoding='utf-8') as f:
            content = yaml.safe_load(f)
        return self.parse(content)

    def parse(self, config: dict) -> Scene:
        """解析场景配置"""
        # 验证必填字段
        required = ['name', 'description', 'version', 'roles', 'stages']
        for field in required:
            if field not in config:
                raise ValueError(f"Missing required field: {field}")

        # 解析角色
        roles = [Role(**r) for r in config['roles']]

        # 解析阶段
        stages = [Stage(**s) for s in config['stages']]

        return Scene(
            name=config['name'],
            description=config['description'],
            version=config['version'],
            roles=roles,
            stages=stages,
            variables=config.get('variables', {})
        )

    def validate(self, config: dict) -> List[str]:
        """验证场景配置，返回错误列表"""
        errors = []

        # 检查必填字段
        required = ['name', 'description', 'version', 'roles', 'stages']
        for field in required:
            if field not in config:
                errors.append(f"Missing required field: {field}")

        # 检查角色 ID 唯一性
        if 'roles' in config:
            role_ids = [r.get('id') for r in config['roles'] if 'id' in r]
            if len(role_ids) != len(set(role_ids)):
                errors.append("Duplicate role IDs found")

        # 检查阶段 ID 唯一性
        if 'stages' in config:
            stage_ids = [s.get('id') for s in config['stages'] if 'id' in s]
            if len(stage_ids) != len(set(stage_ids)):
                errors.append("Duplicate stage IDs found")

        # 检查阶段中的角色是否存在
        if 'roles' in config and 'stages' in config:
            role_ids = {r.get('id') for r in config['roles'] if 'id' in r}
            for stage in config['stages']:
                for role_id in stage.get('roles', []):
                    if role_id not in role_ids:
                        errors.append(f"Role '{role_id}' in stage '{stage.get('id')}' not found")

        return errors