"""共识检测算法"""
import re
from typing import Tuple, List, Optional
from ..models import Message, ConsensusMethod


class ConsensusDetector:
    """共识检测器"""

    @staticmethod
    def detect_by_keyword(messages: List[Message], keywords: List[str]) -> Tuple[bool, str]:
        """
        通过关键词检测共识
        - keywords: 同意关键词列表，如 ["同意", "通过", "可以"]
        """
        if not messages:
            return False, "无消息"
        
        agent_messages = [m for m in messages if m.role == "agent"]
        if not agent_messages:
            return False, "无 Agent 发言"
        
        # 检查最近几条消息中是否包含同意关键词
        recent = agent_messages[-3:] if len(agent_messages) >= 3 else agent_messages
        agree_count = 0
        
        for msg in recent:
            for kw in keywords:
                if kw in msg.content:
                    agree_count += 1
                    break
        
        if agree_count >= len(recent) * 0.67:  # 2/3 同意
            return True, f"关键词匹配 ({agree_count}/{len(recent)})"
        return False, "未达成共识"

    @staticmethod
    def detect_by_moderator(messages: List[Message]) -> Tuple[bool, str]:
        """
        主持人判断 - 简单返回 False，等待主持人介入
        """
        # 主持人会通过 API 手动判断
        return False, "等待主持人判断"

    @staticmethod
    def detect_by_vote(messages: List[Message], threshold: float = 0.5) -> Tuple[bool, str]:
        """
        投票表决 - 检查投票意向
        """
        vote_pattern = r"(赞成|反对|弃权)\s*(\d+)?"
        
        votes = {"agree": 0, "disagree": 0, "abstain": 0}
        total_votes = 0
        
        for msg in messages:
            match = re.search(vote_pattern, msg.content)
            if match:
                vote_type = match.group(1)
                count = int(match.group(2)) if match.group(2) else 1
                total_votes += count
                if vote_type == "赞成":
                    votes["agree"] += count
                elif vote_type == "反对":
                    votes["disagree"] += count
                else:
                    votes["abstain"] += count
        
        if total_votes == 0:
            return False, "无有效投票"
        
        agree_ratio = votes["agree"] / total_votes
        if agree_ratio >= threshold:
            return True, f"投票通过 ({votes['agree']}/{total_votes})"
        return False, f"投票未通过 ({votes['agree']}/{total_votes})"

    @classmethod
    def detect(cls, messages: List[Message], method: ConsensusMethod, **kwargs) -> Tuple[bool, str]:
        """统一入口"""
        if method == ConsensusMethod.KEYWORD:
            keywords = kwargs.get("keywords", ["同意", "通过", "可以"])
            return cls.detect_by_keyword(messages, keywords)
        elif method == ConsensusMethod.MODERATOR:
            return cls.detect_by_moderator(messages)
        elif method == ConsensusMethod.VOTE:
            return cls.detect_by_vote(messages, kwargs.get("threshold", 0.5))
        return False, "未知共识方法"