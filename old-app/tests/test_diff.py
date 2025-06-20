import pytest
from fastapi.testclient import TestClient
import sys
import os

# Add the parent directory to the path so we can import the app
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.app import app
from backend import diff_logic

client = TestClient(app)


def test_generate_text_diff():
    text1 = "Line 1\nLine 2\nLine 3"
    text2 = "Line 1\nModified Line\nLine 3"

    diff_html = diff_logic.generate_text_diff(text1, text2)

    # Check that the diff contains the modified line
    assert "Line 1" in diff_html
    assert "Modified Line" in diff_html
    assert "Line 2" in diff_html  # Should be shown as removed
    assert "Line 3" in diff_html


def test_home_page():
    response = client.get("/")
    assert response.status_code == 200
    assert "Diffit Tools" in response.text


def test_text_diff_endpoint():
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
    assert "Line 2" in response.text  # Should be shown as removed
    assert "Line 3" in response.text


# Add more tests for file and PDF diff endpoints
