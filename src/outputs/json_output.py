from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


class JSONGenerator:
    """Generate JSON output from meeting results."""

    def __init__(self, output_dir: Optional[Path] = None):
        self.output_dir = output_dir or Path("/data/code/ai-collaboration-meeting/outputs")
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def generate_from_stages(self, meeting_id: str, stages: List[Dict[str, Any]]) -> Path:
        """Generate JSON from meeting stages."""
        data = {
            "meeting_id": meeting_id,
            "stages": stages,
            "metadata": {
                "total_stages": len(stages),
                "has_decisions": any(s.get("key_decisions") for s in stages)
            }
        }
        
        filepath = self.output_dir / f"meeting_{meeting_id}.json"
        filepath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return filepath

    def generate_from_dict(self, data: Dict[str, Any], filename: str) -> Path:
        """Generate JSON from arbitrary dict."""
        filepath = self.output_dir / f"{filename}.json"
        filepath.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        return filepath


if __name__ == "__main__":
    gen = JSONGenerator()
    path = gen.generate_from_dict({"test": "value"}, "test")
    print(f"Generated: {path}")