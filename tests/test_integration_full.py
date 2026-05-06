"""Integration tests for outputs and storage."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

import tempfile
from pathlib import Path
import pytest

from outputs.markdown import MarkdownGenerator
from outputs.code import CodeGenerator
from outputs.json_output import JSONGenerator
from outputs.mermaid import MermaidGenerator
from outputs.storage import StorageManager
from api.export import ExportService


class TestAllGenerators:
    """Integration tests for all output generators."""

    def test_full_workflow(self):
        """Test complete output generation workflow."""
        with tempfile.TemporaryDirectory() as tmpdir:
            out_dir = Path(tmpdir)
            
            # Markdown
            md_gen = MarkdownGenerator(out_dir)
            md_path = md_gen.generate_stage_output("test", "design", "Summary", ["D1"], ["A1"])
            assert md_path.exists()
            
            # Code
            code_gen = CodeGenerator(out_dir)
            code_path = code_gen.generate_python("test_module", "def test(): pass")
            assert code_path.exists()
            
            # JSON
            json_gen = JSONGenerator(out_dir)
            json_path = json_gen.generate_from_dict({"key": "value"}, "test")
            assert json_path.exists()
            
            # Mermaid
            m_gen = MermaidGenerator(out_dir)
            m_path = m_gen.generate_flowchart("Test", ["A", "B"], [("A", "B")])
            assert m_path.exists()
            
            # Storage
            sm = StorageManager(out_dir)
            files = sm.list_outputs()
            assert len(files) >= 4


if __name__ == "__main__":
    pytest.main([__file__, "-v"])