import pytest
import os
import sys
from fastapi.testclient import TestClient
import tempfile
from unittest.mock import patch, MagicMock

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app import app

client = TestClient(app)


@pytest.fixture
def mock_db_session():
    """Fixture to mock the database session and queries"""
    with patch("backend.database.SessionLocal") as mock_session:
        # Mock the session and the objects it returns
        session_instance = MagicMock()
        mock_session.return_value = session_instance

        # Configure the query builder and results
        query_builder = MagicMock()
        session_instance.query.return_value = query_builder
        filter_builder = MagicMock()
        query_builder.filter.return_value = filter_builder

        # Set up defaults - can be overridden in tests
        filter_builder.first.return_value = None
        filter_builder.all.return_value = []

        yield session_instance


class TestAppEndpoints:
    def test_home_page(self):
        """Test the home page endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        assert "Diffit Tools" in response.text

    def test_diff_text(self, mock_db_session):
        """Test the text diff endpoint"""
        # Set up the mock to return a diff ID
        mock_db_session.add.return_value = None
        mock_db_session.commit.return_value = None

        response = client.post(
            "/diff/text",
            data={
                "text1": "Line 1\nLine 2\nLine 3",
                "text2": "Line 1\nModified Line\nLine 3",
                "diff_type": "line",
            },
        )
        assert response.status_code == 200
        assert "Line 1" in response.text
        assert "Modified Line" in response.text
        assert "Line 2" in response.text
        assert "Line 3" in response.text
        assert "diff_add" in response.text
        assert "diff_sub" in response.text

    def test_shared_diff_not_found(self, mock_db_session):
        """Test the shared diff endpoint when diff is not found"""
        # Configure the mock to return None (diff not found)
        query_builder = mock_db_session.query.return_value
        filter_builder = query_builder.filter.return_value
        filter_builder.first.return_value = None

        response = client.get("/diff/share/non-existent-id")
        assert response.status_code == 200
        assert "not found or expired" in response.text

    def test_shared_diff_found(self, mock_db_session):
        """Test the shared diff endpoint when diff is found"""
        # Create a mock diff result
        mock_diff = MagicMock()
        mock_diff.content = "<table class='diff'>Test diff content</table>"
        mock_diff.title = "Test Diff"

        # Configure the mock to return our mock diff
        query_builder = mock_db_session.query.return_value
        filter_builder = query_builder.filter.return_value
        filter_builder.first.return_value = mock_diff

        response = client.get("/diff/share/existing-id")
        assert response.status_code == 200
        assert "Test diff content" in response.text

    def test_export_pdf(self, mock_db_session):
        """Test the PDF export endpoint"""
        # Create a mock diff result
        mock_diff = MagicMock()
        mock_diff.content = "<html><body>Test content</body></html>"
        mock_diff.title = "Test Export"

        # Configure the mock to return our mock diff
        query_builder = mock_db_session.query.return_value
        filter_builder = query_builder.filter.return_value
        filter_builder.first.return_value = mock_diff

        # Mock the PDF conversion function
        with patch("backend.diff_logic.html_to_pdf", return_value=b"%PDF-test"):
            response = client.get("/export/existing-id/pdf")
            assert response.status_code == 200
            assert response.headers["content-type"] == "application/pdf"
            assert response.content == b"%PDF-test"

    def test_export_markdown(self, mock_db_session):
        """Test the Markdown export endpoint"""
        # Create a mock diff result
        mock_diff = MagicMock()
        mock_diff.content = "<html><body>Test content</body></html>"
        mock_diff.title = "Test Export"

        # Configure the mock to return our mock diff
        query_builder = mock_db_session.query.return_value
        filter_builder = query_builder.filter.return_value
        filter_builder.first.return_value = mock_diff

        # Mock the Markdown conversion function
        with patch(
            "backend.diff_logic.html_to_markdown", return_value="# Test Markdown"
        ):
            response = client.get("/export/existing-id/markdown")
            assert response.status_code == 200
            assert response.headers["content-type"] == "text/markdown"
            assert response.content == b"# Test Markdown"
