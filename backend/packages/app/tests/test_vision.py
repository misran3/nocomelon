"""Tests for vision stage."""

import pytest

from app.stages.vision import analyze_drawing
from app.models import DrawingAnalysis


# Sample 1x1 red pixel PNG for basic testing
TINY_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


@pytest.mark.asyncio
async def test_analyze_drawing_returns_drawing_analysis():
    """Vision stage should return a DrawingAnalysis model."""
    # This test requires a real API call
    # Skip if no API key configured
    pytest.importorskip("app.config")

    result = await analyze_drawing(TINY_PNG_B64)

    assert isinstance(result, DrawingAnalysis)
    assert isinstance(result.subject, str)
    assert isinstance(result.setting, str)
    assert isinstance(result.details, list)
    assert isinstance(result.mood, str)
    assert isinstance(result.colors, list)
