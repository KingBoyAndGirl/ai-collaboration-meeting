from __future__ import annotations

import time
from pathlib import Path
from typing import Optional


class StorageManager:
    """Manage meeting output files."""

    def __init__(self, output_dir: Optional[Path] = None, max_age_days: int = 30):
        self.output_dir = output_dir or Path("/data/code/ai-collaboration-meeting/outputs")
        self.max_age_seconds = max_age_days * 24 * 60 * 60

    def cleanup_old_files(self) -> int:
        """Remove files older than max_age_days."""
        count = 0
        now = time.time()
        
        for f in self.output_dir.glob("*"):
            if f.is_file() and (now - f.stat().st_mtime) > self.max_age_seconds:
                f.unlink()
                count += 1
        
        return count

    def list_outputs(self, meeting_id: Optional[str] = None):
        """List all output files."""
        if meeting_id:
            return list(self.output_dir.glob(f"*{meeting_id}*"))
        return list(self.output_dir.iterdir())

    def get_file_path(self, filename: str) -> Optional[Path]:
        """Get specific file path."""
        filepath = self.output_dir / filename
        return filepath if filepath.exists() else None


if __name__ == "__main__":
    sm = StorageManager()
    files = sm.list_outputs()
    print(f"Files: {len(files)}")