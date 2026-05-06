"""Mermaid 流程图生成功能"""
from typing import Dict, List, Any
import json

class MermaidGenerator:
    """生成 Mermaid 流程图"""
    
    @staticmethod
    def workflow_to_mermaid(workflow: Dict[str, Any]) -> str:
        """将工作流转换为 Mermaid 流程图"""
        nodes = workflow.get("nodes", [])
        edges = workflow.get("edges", [])
        
        lines = ["graph TD"]
        
        # 添加节点
        for node in nodes:
            node_id = node.get("id", "")
            node_type = node.get("type", "default")
            label = node.get("label", node_id)
            
            # 根据类型添加不同样式
            if node_type == "start":
                lines.append(f"    {node_id}[\"{label}\"]:::start")
            elif node_type == "end":
                lines.append(f"    {node_id}[\"{label}\"]:::end")
            elif node_type == "decision":
                lines.append(f"    {node_id}{{\"{label}\"}}")
            else:
                lines.append(f"    {node_id}[\"{label}\"]")
        
        # 添加边
        for edge in edges:
            source = edge.get("source", "")
            target = edge.get("target", "")
            label = edge.get("label", "")
            if label:
                lines.append(f"    {source} -->|\"{label}\"| {target}")
            else:
                lines.append(f"    {source} --> {target}")
        
        # 添加样式
        lines.extend([
            "",
            "    classDef start fill:#4CAF50,stroke:#388E3C,color:#fff",
            "    classDef end fill:#F44336,stroke:#D32F2F,color:#fff",
            "    classDef default fill:#2196F3,stroke:#1976D2,color:#fff"
        ])
        
        return "\n".join(lines)
    
    @staticmethod
    def meeting_to_mermaid(meeting: Dict[str, Any]) -> str:
        """将会议流程转换为 Mermaid 流程图"""
        phases = meeting.get("phases", [])
        
        lines = ["graph TD"]
        
        for i, phase in enumerate(phases):
            phase_id = f"p{i+1}"
            label = f"{phase.get('name', f'Phase {i+1}')}"
            lines.append(f"    {phase_id}[\"{label}\"]")
        
        # 添加连接
        for i in range(len(phases) - 1):
            lines.append(f"    p{i+1} --> p{i+2}")
        
        lines.extend([
            "",
            "    classDef default fill:#673AB7,stroke:#512DA8,color:#fff"
        ])
        
        return "\n".join(lines)


def generate_workflow_mermaid(workflow_data: Dict) -> str:
    """便捷函数"""
    return MermaidGenerator.workflow_to_mermaid(workflow_data)