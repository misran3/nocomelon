"""FastAPI application for NoComelon AI pipeline."""

import subprocess
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.models import (
    VisionRequest,
    StoryRequest,
    ImagesRequest,
    VoiceRequest,
    VideoRequest,
    DrawingAnalysis,
    VisionResponse,
    StoryScript,
    ImageResult,
    AudioResult,
    VideoResult,
)
from app.stages import (
    analyze_drawing,
    generate_story,
    generate_images,
    generate_audio,
    assemble_video,
)


app = FastAPI(
    title="NoComelon API",
    description="AI pipeline for generating children's storybooks from drawings",
    version="0.1.0",
)

# CORS for Streamlit
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Basic health check."""
    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/v1/status")
async def status():
    """Check status of all dependencies."""
    settings = get_settings()

    # Check OpenAI
    openai_status = "configured" if settings.openai_api_key else "missing"

    # Check ElevenLabs
    elevenlabs_status = "configured" if settings.elevenlabs_api_key else "missing"

    # Check FFmpeg
    try:
        subprocess.run(['ffmpeg', '-version'], capture_output=True, check=True)
        ffmpeg_status = "installed"
    except (subprocess.CalledProcessError, FileNotFoundError):
        ffmpeg_status = "missing"

    # Check data directory
    try:
        settings.data_dir.mkdir(parents=True, exist_ok=True)
        data_status = "writable"
    except Exception:
        data_status = "error"

    return {
        "openai": openai_status,
        "elevenlabs": elevenlabs_status,
        "ffmpeg": ffmpeg_status,
        "data_dir": data_status,
    }


@app.post("/api/v1/vision/analyze", response_model=VisionResponse)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        run_id = uuid.uuid4().hex[:8]
        drawing = await analyze_drawing(request.image_base64)
        return VisionResponse(run_id=run_id, drawing=drawing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/story/generate", response_model=StoryScript)
async def api_generate_story(request: StoryRequest):
    """Stage 2: Generate a story."""
    try:
        return await generate_story(
            drawing=request.drawing,
            theme=request.theme,
            child_age=request.child_age,
            voice_type=request.voice_type,
            personal_context=request.personal_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/images/generate", response_model=ImageResult)
async def api_generate_images(request: ImagesRequest):
    """Stage 3: Generate images."""
    try:
        return await generate_images(
            story=request.story,
            drawing=request.drawing,
            style=request.style,
            run_id=request.run_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/voice/generate", response_model=AudioResult)
async def api_generate_audio(request: VoiceRequest):
    """Stage 4: Generate voice audio."""
    try:
        return await generate_audio(
            story=request.story,
            voice_type=request.voice_type,
            run_id=request.run_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/video/assemble", response_model=VideoResult)
async def api_assemble_video(request: VideoRequest):
    """Stage 5: Assemble final video."""
    try:
        return await assemble_video(
            images=request.images,
            audio=request.audio,
            run_id=request.run_id,
            music_track=request.music_track,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
