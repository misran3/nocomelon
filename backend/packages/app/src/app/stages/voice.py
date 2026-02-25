"""Stage 4: Generate voice narration using ElevenLabs."""

import uuid

from elevenlabs import AsyncElevenLabs
from elevenlabs.types import VoiceSettings
import aiofiles

from app.models import (
    StoryScript,
    VoiceType,
    GeneratedAudio,
    AudioResult,
)
from app.config import get_settings


# Voice ID mapping for ElevenLabs
# These are example voice IDs - replace with actual ElevenLabs voice IDs
VOICE_IDS = {
    VoiceType.GENTLE: "EXAVITQu4vr4xnSDxMaL",  # Rachel - warm, calm
    VoiceType.CHEERFUL: "TxGEqnHWrfWFTfGW9XjX",  # Josh - playful
}


async def generate_audio(
    story: StoryScript,
    voice_type: VoiceType,
) -> AudioResult:
    """
    Generate audio narration for each scene.

    Args:
        story: The story script with scenes
        voice_type: Type of narrator voice

    Returns:
        AudioResult with paths to audio files and durations
    """
    settings = get_settings()
    client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)

    # Ensure output directory exists
    settings.audio_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]

    audio_files = []
    total_duration = 0.0
    voice_id = VOICE_IDS[voice_type]

    for scene in story.scenes:
        # Generate audio for this scene
        audio_path = settings.audio_dir / f"{run_id}_scene_{scene.number}.mp3"

        # Generate the audio (returns async generator, not coroutine)
        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            text=scene.text,
            model_id="eleven_turbo_v2_5",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
            ),
        )

        # Save to file
        async with aiofiles.open(audio_path, "wb") as f:
            async for chunk in audio_generator:
                await f.write(chunk)

        # Get duration (approximate based on text length, ~150 words/min)
        # For accurate duration, we'd need to analyze the audio file
        word_count = len(scene.text.split())
        duration_sec = (word_count / 150) * 60  # Rough estimate

        audio_files.append(GeneratedAudio(
            scene_number=scene.number,
            path=str(audio_path),
            duration_sec=duration_sec,
        ))
        total_duration += duration_sec

    return AudioResult(
        audio_files=audio_files,
        total_duration_sec=total_duration,
    )
