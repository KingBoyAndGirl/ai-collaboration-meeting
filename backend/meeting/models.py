from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime


class StageType(str, Enum):
    REQUIREMENT = "requirement"
    DESIGN = "design"
    REVIEW = "review"
    DECISION = "decision"
    OUTPUT = "output"


class ConsensusMethod(str, Enum):
    KEYWORD = "keyword"
    MODERATOR = "moderator"
    VOTE = "vote"


class MessageRole(str, Enum):
    USER = "user"
    AGENT = "agent"
    MODERATOR = "moderator"


class Role(BaseModel):
    id: str
    name: str
    description: str
    executor: str
    model: Optional[str] = None
    max_output_tokens: int = 2000


class Stage(BaseModel):
    id: str
    type: StageType
    roles: List[str]
    moderator: str
    max_rounds: int = 5
    consensus: ConsensusMethod = ConsensusMethod.MODERATOR
    output_format: str = "markdown"


class Scene(BaseModel):
    name: str
    description: str
    version: str
    roles: List[Role]
    stages: List[Stage]
    variables: Dict[str, Any] = {}


class Message(BaseModel):
    id: str
    role: MessageRole
    role_id: str
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}


class Round(BaseModel):
    round_num: int
    messages: List[Message]
    summary: Optional[str] = None


class MeetingStage(BaseModel):
    stage_id: str
    status: str = "pending"
    rounds: List[Round] = []
    messages: List[Message] = []
    consensus_reached: bool = False
    output: Optional[str] = None
    rejection_reason: Optional[str] = None
    rejection_count: int = 0


class Meeting(BaseModel):
    id: str
    scene_name: str
    status: str = "created"
    current_stage: int = 0
    stages: List[MeetingStage] = []
    messages: List[Message] = []
    variables: Dict[str, Any] = {}
    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()


class MeetingCreate(BaseModel):
    scene_name: str
    variables: Dict[str, Any] = {}
