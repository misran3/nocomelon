"""Tests for FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Health endpoint should return ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_status_endpoint(client):
    """Status endpoint should return dependency statuses."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert "openai" in data
    assert "elevenlabs" in data
    assert "ffmpeg" in data
    assert "data_dir" in data
