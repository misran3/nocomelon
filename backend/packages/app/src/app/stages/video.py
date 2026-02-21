"""Stage 5: Assemble final video using FFmpeg."""

import uuid
import subprocess
from pathlib import Path
import tempfile

from app.models import (
    ImageResult,
    AudioResult,
    VideoResult,
)
from app.config import get_settings


async def assemble_video(
    images: ImageResult,
    audio: AudioResult,
    music_track: str | None = None,
) -> VideoResult:
    """
    Assemble images and audio into final video.

    Args:
        images: Generated images from Stage 3
        audio: Generated audio from Stage 4
        music_track: Optional path to background music

    Returns:
        VideoResult with path to final video
    """
    settings = get_settings()

    # Ensure output directory exists
    settings.videos_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]
    output_path = settings.videos_dir / f"{run_id}_final.mp4"

    # Create concat file for images with durations
    # Match each image to its audio duration
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        concat_file = f.name
        for img, aud in zip(images.images, audio.audio_files):
            f.write(f"file '{img.path}'\n")
            f.write(f"duration {aud.duration_sec}\n")
        # Add last image again (FFmpeg concat requirement)
        if images.images:
            f.write(f"file '{images.images[-1].path}'\n")

    # Concatenate all audio files
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        audio_concat_file = f.name
        for aud in audio.audio_files:
            f.write(f"file '{aud.path}'\n")

    # Merge audio files
    merged_audio = tempfile.NamedTemporaryFile(suffix='.mp3', delete=False).name
    subprocess.run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
        '-i', audio_concat_file,
        '-c', 'copy', merged_audio
    ], check=True, capture_output=True)

    # Build FFmpeg command
    if music_track and Path(music_track).exists():
        # With background music at 15% volume
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat', '-safe', '0', '-i', concat_file,
            '-i', merged_audio,
            '-i', music_track,
            '-filter_complex', '[1:a][2:a]amix=inputs=2:duration=first:weights=1 0.15[a]',
            '-map', '0:v', '-map', '[a]',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            '-shortest',
            str(output_path)
        ]
    else:
        # Without background music
        cmd = [
            'ffmpeg', '-y',
            '-f', 'concat', '-safe', '0', '-i', concat_file,
            '-i', merged_audio,
            '-map', '0:v', '-map', '1:a',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            '-c:a', 'aac', '-b:a', '128k',
            '-shortest',
            str(output_path)
        ]

    # Run FFmpeg
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg failed: {result.stderr}")

    # Get video duration
    probe_cmd = [
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', str(output_path)
    ]
    probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
    duration = float(probe_result.stdout.strip()) if probe_result.stdout.strip() else audio.total_duration_sec

    # Cleanup temp files
    Path(concat_file).unlink(missing_ok=True)
    Path(audio_concat_file).unlink(missing_ok=True)
    Path(merged_audio).unlink(missing_ok=True)

    return VideoResult(
        video_path=str(output_path),
        duration_sec=duration,
    )
