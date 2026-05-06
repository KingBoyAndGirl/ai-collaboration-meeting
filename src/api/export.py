from __future__ import annotations

from pathlib import Path
from typing import Optional


class ExportService:
    """Handle export operations for meeting outputs."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("/data/code/ai-collaboration-meeting/outputs")

    def export_markdown(self, meeting_id: str) -> Path:
        """Export meeting as markdown bundle."""
        # Find all stage files for meeting
        files = list(self.output_dir.glob(f"*{meeting_id}*.md"))
        if not files:
            raise FileNotFoundError(f"No outputs for meeting {meeting_id}")
        
        # Combine into single file
        combined_path = self.output_dir / f"{meeting_id}_export.md"
        combined_content = f"# Meeting {meeting_id} Export\n\n"
        
        for f in sorted(files):
            combined_content += f"## {f.stem}\n\n"
            combined_content += f.read_text(encoding="utf-8")
            combined_content += "\n\n"
        
        combined_path.write_text(combined_content, encoding="utf-8")
        return combined_path

    def export_json(self, meeting_id: str) -> Path:
        """Export meeting as JSON bundle."""
        import json
        from outputs.json_output import JSONGenerator
        
        # Aggregate data
        data = {"meeting_id": meeting_id, "stages": []}
        
        # Find markdown files and extract
        for md_file in self.output_dir.glob(f"*{meeting_id}*.md"):
            content = md_file.read_text(encoding="utf-8")
            data["stages"].append({
                "file": md_file.name,
                "content": content[:500]  # Truncate for summary
            })
        
        export_path = self.output_dir / f"{meeting_id}_export.json"
        export_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return export_path