"""Stage 5: Assemble final video using FFmpeg."""

import subprocess
from pathlib import Path
import tempfile
import shutil

import httpx

from app.models import (
    ImageResult,
    AudioResult,
    VideoResult,
)
from app.config import get_settings


async def _download_to_temp(url: str, suffix: str, temp_dir: str) -> str:
    """
    Download a file from URL to a temp file.

    Args:
        url: URL to download from (presigned S3 URL)
        suffix: File suffix (e.g., '.png', '.mp3')
        temp_dir: Directory to save temp file in

    Returns:
        Path to the downloaded temp file
    """
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(url)
        response.raise_for_status()

        # Create temp file in the specified directory
        temp_file = tempfile.NamedTemporaryFile(
            suffix=suffix,
            dir=temp_dir,
            delete=False
        )
        temp_file.write(response.content)
        temp_file.close()
        return temp_file.name


async def assemble_video(
    images: ImageResult,
    audio: AudioResult,
    run_id: str,
    music_track: str | None = None,
    user_id: str | None = None,
) -> VideoResult:
    """
    Assemble images and audio into final video.

    Args:
        images: Generated images from Stage 3
        audio: Generated audio from Stage 4
        run_id: Unique identifier for this run
        music_track: Optional path to background music
        user_id: Optional user ID for S3 path organization

    Returns:
        VideoResult with path to final video
    """
    settings = get_settings()
    storage = settings.get_storage()

    # Create a temp directory for all intermediate files
    temp_dir = tempfile.mkdtemp()

    try:
        # Download images from S3 keys or URLs, or use local paths
        local_image_paths = []
        for img in images.images:
            if img.key.startswith("http"):
                # Already a URL (legacy)
                local_path = await _download_to_temp(img.key, ".png", temp_dir)
            elif storage is not None and not Path(img.key).exists():
                # S3 key - generate presigned URL and download
                url = storage.generate_presigned_url(img.key)
                local_path = await _download_to_temp(url, ".png", temp_dir)
            else:
                # Local path
                local_path = str(Path(img.key).resolve())
            local_image_paths.append(local_path)

        # Download audio files from S3 keys or URLs, or use local paths
        local_audio_paths = []
        for aud in audio.audio_files:
            if aud.key.startswith("http"):
                # Already a URL (legacy)
                local_path = await _download_to_temp(aud.key, ".mp3", temp_dir)
            elif storage is not None and not Path(aud.key).exists():
                # S3 key - generate presigned URL and download
                url = storage.generate_presigned_url(aud.key)
                local_path = await _download_to_temp(url, ".mp3", temp_dir)
            else:
                # Local path
                local_path = str(Path(aud.key).resolve())
            local_audio_paths.append(local_path)

        # Create output path in temp directory
        output_filename = f"{run_id}_final.mp4"
        temp_output_path = Path(temp_dir) / output_filename

        # Create concat file for images with durations
        # Match each image to its audio duration
        concat_file = Path(temp_dir) / "images.txt"
        with open(concat_file, 'w') as f:
            for img_path, aud in zip(local_image_paths, audio.audio_files):
                f.write(f"file '{img_path}'\n")
                f.write(f"duration {aud.duration_sec}\n")
            # Add last image again (FFmpeg concat requirement)
            if local_image_paths:
                f.write(f"file '{local_image_paths[-1]}'\n")

        # Concatenate all audio files
        audio_concat_file = Path(temp_dir) / "audio.txt"
        with open(audio_concat_file, 'w') as f:
            for audio_path in local_audio_paths:
                f.write(f"file '{audio_path}'\n")

        # Merge audio files
        merged_audio = Path(temp_dir) / "merged_audio.mp3"
        subprocess.run([
            'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
            '-i', str(audio_concat_file),
            '-c', 'copy', str(merged_audio)
        ], check=True, capture_output=True)

        # Build FFmpeg command
        if music_track and Path(music_track).exists():
            # With background music at 15% volume
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0', '-i', str(concat_file),
                '-i', str(merged_audio),
                '-i', music_track,
                '-filter_complex', '[1:a][2:a]amix=inputs=2:duration=first:weights=1 0.15[a]',
                '-map', '0:v', '-map', '[a]',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k',
                '-shortest',
                str(temp_output_path)
            ]
        else:
            # Without background music
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0', '-i', str(concat_file),
                '-i', str(merged_audio),
                '-map', '0:v', '-map', '1:a',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k',
                '-shortest',
                str(temp_output_path)
            ]

        # Run FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr}")

        # Get video duration
        probe_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(temp_output_path)
        ]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        duration = float(probe_result.stdout.strip()) if probe_result.stdout.strip() else audio.total_duration_sec

        # Generate thumbnail from first frame
        thumbnail_filename = f"{run_id}_thumb.jpg"
        temp_thumbnail_path = Path(temp_dir) / thumbnail_filename
        thumb_cmd = [
            'ffmpeg', '-y', '-i', str(temp_output_path),
            '-ss', '00:00:01', '-vframes', '1',
            '-vf', 'scale=480:-1',
            str(temp_thumbnail_path)
        ]
        subprocess.run(thumb_cmd, capture_output=True)

        # Upload to S3 or save locally
        if storage is not None:
            # Upload video
            video_key = storage.build_s3_key(user_id, "videos", output_filename)
            storage.upload_file(str(temp_output_path), video_key)

            # Upload thumbnail
            thumbnail_key = storage.build_s3_key(user_id, "videos", thumbnail_filename)
            if temp_thumbnail_path.exists():
                storage.upload_file(str(temp_thumbnail_path), thumbnail_key)
            else:
                thumbnail_key = video_key  # Fallback if thumbnail generation failed
        else:
            # Save locally (development mode)
            settings.videos_dir.mkdir(parents=True, exist_ok=True)
            final_output_path = settings.videos_dir / output_filename
            shutil.move(str(temp_output_path), str(final_output_path))
            video_key = str(final_output_path)

            if temp_thumbnail_path.exists():
                final_thumb_path = settings.videos_dir / thumbnail_filename
                shutil.move(str(temp_thumbnail_path), str(final_thumb_path))
                thumbnail_key = str(final_thumb_path)
            else:
                thumbnail_key = video_key

        return VideoResult(
            video_key=video_key,
            duration_sec=duration,
            thumbnail_key=thumbnail_key,
        )
    finally:
        # Cleanup temp directory and all its contents
        shutil.rmtree(temp_dir, ignore_errors=True)
