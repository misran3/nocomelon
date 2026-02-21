"""Tests for story stage."""

import pytest

from app.stages.story import generate_story, get_age_guideline
from app.models import DrawingAnalysis, StoryScript, Theme, VoiceType


def test_get_age_guideline_returns_string():
    """Age guideline lookup should return a string."""
    for age in range(2, 10):
        guideline = get_age_guideline(age)
        assert isinstance(guideline, str)
        assert len(guideline) > 0


@pytest.fixture
def sample_drawing():
    """Sample drawing analysis for testing."""
    return DrawingAnalysis(
        subject="a purple dinosaur",
        setting="a green meadow with flowers",
        details=["big friendly eyes", "spiky back", "short arms"],
        mood="happy and playful",
        colors=["purple", "green", "yellow"],
    )


@pytest.mark.asyncio
async def test_generate_story_returns_story_script(sample_drawing):
    """Story stage should return a StoryScript model."""
    result = await generate_story(
        drawing=sample_drawing,
        theme=Theme.BRAVERY,
        child_age=5,
        voice_type=VoiceType.GENTLE,
        personal_context="starting kindergarten next week",
    )

    assert isinstance(result, StoryScript)
    assert len(result.scenes) >= 3
    assert result.total_scenes == len(result.scenes)

    # Check scene structure
    for scene in result.scenes:
        assert scene.number > 0
        assert len(scene.text) > 0
