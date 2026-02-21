"""Tests for video stage."""

import pytest
import subprocess
import shutil

from app.stages.video import assemble_video
from app.models import (
    ImageResult,
    AudioResult,
    GeneratedImage,
    GeneratedAudio,
    VideoResult,
)


@pytest.mark.skipif(shutil.which('ffmpeg') is None, reason="FFmpeg not installed")
def test_ffmpeg_installed():
    """FFmpeg should be installed and accessible."""
    result = subprocess.run(['ffmpeg', '-version'], capture_output=True)
    assert result.returncode == 0


@pytest.mark.skipif(shutil.which('ffprobe') is None, reason="FFprobe not installed")
def test_ffprobe_installed():
    """FFprobe should be installed and accessible."""
    result = subprocess.run(['ffprobe', '-version'], capture_output=True)
    assert result.returncode == 0


@pytest.mark.asyncio
async def test_assemble_video_creates_file():
    """Video assembly should create a video file."""
    # This test requires actual image/audio files
    pytest.skip("Integration test - requires generated assets")
