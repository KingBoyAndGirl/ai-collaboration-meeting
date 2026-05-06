"""Test coverage analysis."""

import sys
sys.path.insert(0, '/data/code/ai-collaboration-meeting/src')

import pytest


class TestOutputsCovered:
    """Ensure all output generators have tests."""
    
    def test_markdown_generator_exists(self):
        from outputs.markdown import MarkdownGenerator
        assert MarkdownGenerator is not None
    
    def test_code_generator_exists(self):
        from outputs.code import CodeGenerator
        assert CodeGenerator is not None
    
    def test_json_generator_exists(self):
        from outputs.json_output import JSONGenerator
        assert JSONGenerator is not None
    
    def test_mermaid_generator_exists(self):
        from outputs.mermaid import MermaidGenerator
        assert MermaidGenerator is not None
    
    def test_export_service_exists(self):
        from api.export import ExportService
        assert ExportService is not None
    
    def test_storage_manager_exists(self):
        from outputs.storage import StorageManager
        assert StorageManager is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])