"""Scene YAML Parser - Parse and validate scene definitions."""

from __future__ import annotations

import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

from assistant.models import StageLogEntry


# Stage types
class StageType(str):
    REQUIREMENT = "requirement"
    DESIGN = "design"
    REVIEW = "review"
    DECISION = "decision"
    OUTPUT = "output"


# Consensus methods
class ConsensusMethod(str):
    KEYWORD = "keyword"
    MODERATOR = "moderator"
    VOTE = "vote"


# Models


class Role(BaseModel):
    """角色定义."""
    id: str
    name: str
    description: str
    executor: str
    model: Optional[str] = None


class Stage(BaseModel):
    """阶段定义."""
    id: str
    type: str = Field(pattern="^(requirement|design|review|decision|output)$")
    roles: List[str]
    moderator: str
    max_rounds: int = 5
    consensus: str = "moderator"
    output_format: str = "markdown"


class Scene(BaseModel):
    """场景定义."""
    name: str
    description: str
    version: str = "1.0"
    variables: Dict[str, Any] = Field(default_factory=dict)
    roles: List[Role]
    stages: List[Stage]

    @field_validator('stages')
    @classmethod
    def validate_stage_references(cls, v: List[Stage], info) -> List[Stage]:
        """Validate role references in stages."""
        if not info.data.get('roles'):
            return v
        role_ids = {r.id for r in info.data['roles']}
        for stage in v:
            for role_id in stage.roles:
                if role_id not in role_ids:
                    raise ValueError(f"Stage '{stage.id}' references unknown role '{role_id}'")
            if stage.moderator not in role_ids:
                raise ValueError(f"Stage '{stage.id}' moderator '{stage.moderator}' not in roles")
        return v


def parse_scene(yaml_content: str) -> Scene:
    """Parse YAML content into Scene model."""
    data = yaml.safe_load(yaml_content)
    return Scene(**data)


def parse_scene_file(filepath: Path | str) -> Scene:
    """Parse YAML file into Scene model."""
    content = Path(filepath).read_text()
    return parse_scene(content)


def get_default_scene() -> str:
    """Get default demo scene."""
    return """
name: "Demo Meeting"
description: "Demo scenario for testing"
version: "1.0"

variables:
  project_name: "Sample Project"

roles:
  - id: product_manager
    name: "Product Manager"
    description: "Handles requirements"
    executor: "claude"
  
  - id: developer
    name: "Developer"
    description: "Writes code"
    executor: "claude_code"

stages:
  - id: requirement
    type: requirement
    roles: [product_manager]
    moderator: product_manager
    max_rounds: 3

  - id: output
    type: output
    roles: [developer]
    moderator: product_manager
    max_rounds: 1
"""


if __name__ == "__main__":
    scene = parse_scene(get_default_scene())
    print(f"Parsed scene: {scene.name}")
    print(f"Roles: {[r.id for r in scene.roles]}")
    print(f"Stages: {[s.id for s in scene.stages]}")