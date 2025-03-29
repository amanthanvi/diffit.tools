import pytest
import os
import sys
from fastapi.testclient import TestClient
from io import BytesIO
import tempfile

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend import diff_logic


class TestDiffLogic:
    def test_generate_text_diff_line(self):
        """Test line-by-line diff generation"""
        text1 = "Line 1\nLine 2\nLine 3"
        text2 = "Line 1\nModified Line\nLine 3"

        diff_html = diff_logic.generate_text_diff(text1, text2, "line")

        # Check that the diff contains the expected content
        assert "Line 1" in diff_html
        assert "Modified Line" in diff_html
        assert "Line 2" in diff_html  # Should be shown as removed
        assert "Line 3" in diff_html
        assert "diff_add" in diff_html  # Addition marker class
        assert "diff_sub" in diff_html  # Subtraction marker class

    def test_generate_text_diff_word(self):
        """Test word-by-word diff generation"""
        text1 = "This is a test sentence"
        text2 = "This is another test sentence"

        diff_html = diff_logic.generate_text_diff(text1, text2, "word")

        # Check that the diff contains the expected content
        assert "This" in diff_html
        assert "is" in diff_html
        assert "a" in diff_html
        assert "another" in diff_html
        assert "test" in diff_html
        assert "sentence" in diff_html
        assert "diff_add" in diff_html
        assert "diff_sub" in diff_html

    def test_html_to_pdf(self):
        """Test HTML to PDF conversion"""
        html_content = (
            "<html><body><h1>Test</h1><p>This is a test PDF</p></body></html>"
        )

        pdf_bytes = diff_logic.html_to_pdf(html_content)

        # Check that we got some content back
        assert pdf_bytes
        assert len(pdf_bytes) > 0
        # Check that it starts with the PDF signature
        assert pdf_bytes.startswith(b"%PDF")

    def test_html_to_markdown(self):
        """Test HTML to Markdown conversion"""
        html_content = "<html><body><h1>Test</h1><p>This is a <strong>test</strong> Markdown</p></body></html>"

        markdown_text = diff_logic.html_to_markdown(html_content)

        # Check that the markdown contains expected formatting
        assert "# Test" in markdown_text
        assert "**test**" in markdown_text

    def test_extract_file_content(self, mocker):
        """Test file content extraction using mocks"""
        # Create a mock file object
        mock_file = mocker.MagicMock()
        mock_file.filename = "test.txt"

        # Mock the file reading
        mocker.patch("aiofiles.open", mocker.mock_open(read_data="Test file content"))
        mocker.patch("tempfile.NamedTemporaryFile")

        # Run the function asynchronously
        import asyncio

        content = asyncio.run(diff_logic.extract_file_content(mock_file))

        # Check the result
        assert content == "Test file content"

    def test_extract_pdf_content(self, mocker):
        """Test PDF content extraction using mocks"""
        # Create a mock file object
        mock_file = mocker.MagicMock()
        mock_file.filename = "test.pdf"

        # Mock the PDF extraction
        mocker.patch(
            "pdfminer.high_level.extract_text", return_value="Extracted PDF text"
        )
        mocker.patch("aiofiles.open", mocker.mock_open(read_data=b"PDF content"))
        mocker.patch("tempfile.NamedTemporaryFile")

        # Run the function asynchronously
        import asyncio

        content = asyncio.run(diff_logic.extract_pdf_content(mock_file))

        # Check the result
        assert content == "Extracted PDF text"


class TestEnhancedDiff:
    def test_enhance_diff_html(self):
        """Test diff HTML enhancement"""
        html_content = """
        <table class="diff">
            <tr><td class="diff_header">1</td><td class="diff_add">Added line</td></tr>
            <tr><td class="diff_header">2</td><td class="diff_sub">Removed line</td></tr>
            <tr><td class="diff_header">3</td><td class="diff_chg">Changed line</td></tr>
        </table>
        """

        enhanced_html = diff_logic.enhance_diff_html(html_content)

        # Check that the enhancement added expected elements
        assert 'class="diff_header line-number"' in enhanced_html
        assert '<span class="diff-indicator"></span>' in enhanced_html
        assert '<span class="text-content">' in enhanced_html

    def test_add_syntax_highlighting(self):
        """Test syntax highlighting addition"""
        html_content = """
        <td class="text-content">function test() { return 42; // A comment }</td>
        """

        highlighted_html = diff_logic.add_syntax_highlighting(html_content)

        # Check that syntax highlighting was added
        assert '<span class="keyword">function</span>' in highlighted_html
        assert '<span class="keyword">return</span>' in highlighted_html
        assert '<span class="number">42</span>' in highlighted_html
        assert '<span class="comment">// A comment</span>' in highlighted_html
