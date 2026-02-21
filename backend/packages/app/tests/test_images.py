"""Tests for images stage."""

import pytest
from pathlib import Path

from app.stages.images import generate_images, STYLE_PROMPTS
from app.models import (
    DrawingAnalysis,
    StoryScript,
    Scene,
    Style,
    ImageResult,
)


def test_style_prompts_exist():
    """All styles should have prompt templates."""
    for style in Style:
        assert style in STYLE_PROMPTS
        assert len(STYLE_PROMPTS[style]) > 0


@pytest.fixture
def sample_drawing():
    return DrawingAnalysis(
        subject="a purple dinosaur",
        setting="a green meadow",
        details=["big eyes", "spiky back"],
        mood="happy",
        colors=["purple", "green"],
    )


@pytest.fixture
def sample_story():
    return StoryScript(
        scenes=[
            Scene(number=1, text="Once upon a time there was a dinosaur."),
            Scene(number=2, text="The dinosaur made a friend."),
        ],
        total_scenes=2,
    )


@pytest.mark.asyncio
async def test_generate_images_creates_files(sample_drawing, sample_story, tmp_path, monkeypatch):
    """Image generation should create image files."""
    # This test requires real API - mark as integration test
    pytest.skip("Integration test - requires OpenAI API")

    result = await generate_images(
        story=sample_story,
        drawing=sample_drawing,
        style=Style.STORYBOOK,
    )

    assert isinstance(result, ImageResult)
    assert len(result.images) == len(sample_story.scenes)

    for img in result.images:
        assert Path(img.path).exists()
