from __future__ import annotations

from pathlib import Path
from typing import List, Optional


class MermaidGenerator:
    """Generate Mermaid diagrams from meeting content."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("/data/code/ai-collaboration-meeting/outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_flowchart(self, title: str, nodes: List[str], edges: List[tuple]) -> Path:
        """Generate a flowchart diagram.
        
        Args:
            title: Diagram title
            nodes: List of node labels
            edges: List of (from, to) tuples
        """
        lines = [f"# {title}", "", "```mermaid", "graph TD"]
        
        for i, node in enumerate(nodes):
            node_id = f"N{i}"
            lines.append(f"    {node_id}[{node}]")
        
        for src, dst in edges:
            src_id = f"N{nodes.index(src)}" if src in nodes else src
            dst_id = f"N{nodes.index(dst)}" if dst in nodes else dst
            lines.append(f"    {src_id} --> {dst_id}")
        
        lines.append("```")
        
        filepath = self.output_dir / f"{title.replace(' ', '_')}.md"
        filepath.write_text("\n".join(lines), encoding="utf-8")
        return filepath

    def generate_sequence(self, title: str, participants: List[str], messages: List[tuple]) -> Path:
        """Generate a sequence diagram."""
        lines = [f"# {title}", "", "```mermaid", "sequenceDiagram"]
        
        for p in participants:
            lines.append(f"    participant {p}")
        
        for src, dst, msg in messages:
            lines.append(f"    {src}->>{dst}: {msg}")
        
        lines.append("```")
        
        filepath = self.output_dir / f"{title.replace(' ', '_')}_seq.md"
        filepath.write_text("\n".join(lines), encoding="utf-8")
        return filepath


if __name__ == "__main__":
    gen = MermaidGenerator()
    path = gen.generate_flowchart(
        "Architecture",
        ["Frontend", "Backend", "Database"],
        [("Frontend", "Backend"), ("Backend", "Database")]
    )
    print(f"Generated: {path}")