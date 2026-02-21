"""Tests for voice stage."""

import pytest

from app.stages.voice import generate_audio, VOICE_IDS
from app.models import (
    StoryScript,
    Scene,
    VoiceType,
    AudioResult,
)


def test_voice_ids_exist():
    """All voice types should have ElevenLabs IDs."""
    for voice_type in VoiceType:
        assert voice_type in VOICE_IDS
        assert len(VOICE_IDS[voice_type]) > 0


@pytest.fixture
def sample_story():
    return StoryScript(
        scenes=[
            Scene(number=1, text="Once upon a time there was a little dinosaur."),
            Scene(number=2, text="The dinosaur loved to play in the meadow."),
        ],
        total_scenes=2,
    )


@pytest.mark.asyncio
async def test_generate_audio_creates_files(sample_story):
    """Audio generation should create audio files."""
    # This test requires real API - mark as integration test
    pytest.skip("Integration test - requires ElevenLabs API")

    result = await generate_audio(
        story=sample_story,
        voice_type=VoiceType.GENTLE,
    )

    assert isinstance(result, AudioResult)
    assert len(result.audio_files) == len(sample_story.scenes)
    assert result.total_duration_sec > 0
