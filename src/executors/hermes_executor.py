"""Hermes Executor for AI Collaboration Meeting platform.

Calls Hermes Agent via CLI subprocess.
"""

from __future__ import annotations

import asyncio
import json
import os
import subprocess
from typing import Any, Dict, List, Optional

HERMES_COMMAND = os.environ.get("HERMES_COMMAND", "hermes")


class HermesExecutor:
    """Executor that calls Hermes Agent via CLI."""

    def __init__(self, hermes_cmd: str = HERMES_COMMAND):
        self.hermes_cmd = hermes_cmd

    def run(self, prompt: str, context: Optional[List[Dict[str, str]]] = None,
            model: Optional[str] = None, **kwargs) -> str:
        """Execute a prompt via Hermes CLI chat command."""
        cmd = [self.hermes_cmd, "chat", "-z", prompt]
        if model:
            cmd.extend(["-m", model])

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 min timeout
                check=False
            )
            if result.returncode != 0:
                raise RuntimeError(f"Hermes CLI error: {result.stderr}")
            return result.stdout.strip()
        except subprocess.TimeoutExpired:
            raise RuntimeError("Hermes CLI timeout") from None
        except FileNotFoundError:
            raise RuntimeError(f"Hermes CLI not found: {self.hermes_cmd}")

    async def run_async(self, prompt: str, context: Optional[List[Dict[str, str]]] = None,
                        model: Optional[str] = None, **kwargs) -> str:
        """Async version using thread pool."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None, self.run, prompt, context, model
        )


# Sync wrapper
def run_hermes(prompt: str, hermes_cmd: str = HERMES_COMMAND) -> str:
    """Simple synchronous Hermes execution."""
    executor = HermesExecutor(hermes_cmd)
    return executor.run(prompt)