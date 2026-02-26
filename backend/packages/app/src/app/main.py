"""FastAPI application for NoComelon AI pipeline."""

import subprocess
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import get_settings
from app.database import get_database
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
    LibraryEntry,
    PipelineRequest,
    PipelineResponse,
)
from app.stages import (
    analyze_drawing,
    generate_story,
    generate_images,
    generate_audio,
    assemble_video,
)


class JobStatusResponse(BaseModel):
    """Response model for job status polling."""
    user_id: str
    run_id: str
    status: str  # "processing", "complete", "error"
    current_stage: str | None = None
    error: str | None = None
    drawing_analysis: dict | None = None
    story_script: dict | None = None
    images: list | None = None
    video: dict | None = None
    updated_at: str | None = None


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

        # Save checkpoint if user is authenticated
        if request.user_id:
            db = get_database()
            db.save_checkpoint(request.user_id, run_id, {
                "current_stage": "vision",
                "drawing_analysis": drawing.model_dump(),
            })

        return VisionResponse(run_id=run_id, drawing=drawing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/story/generate", response_model=StoryScript)
async def api_generate_story(request: StoryRequest):
    """Stage 2: Generate a story."""
    try:
        story = await generate_story(
            drawing=request.drawing,
            theme=request.theme,
            child_age=request.child_age,
            voice_type=request.voice_type,
            personal_context=request.personal_context,
        )

        # Save checkpoint if user is authenticated
        if request.user_id and request.run_id:
            db = get_database()
            db.save_checkpoint(request.user_id, request.run_id, {
                "current_stage": "story",
                "drawing_analysis": request.drawing.model_dump(),
                "story_script": story.model_dump(),
            })

        return story
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
            user_id=request.user_id,
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
            user_id=request.user_id,
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
            user_id=request.user_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Library endpoints
@app.get("/api/v1/library", response_model=list[LibraryEntry])
async def api_get_library(user_id: str):
    """Get user's saved storybooks."""
    db = get_database()
    items = db.get_library(user_id)
    return [LibraryEntry(**item) for item in items]


@app.post("/api/v1/library", response_model=LibraryEntry)
async def api_save_to_library(entry: LibraryEntry, user_id: str):
    """Save storybook to library."""
    db = get_database()
    db.save_storybook(user_id, entry.model_dump())
    return entry


@app.delete("/api/v1/library/{storybook_id}")
async def api_delete_from_library(storybook_id: str, user_id: str):
    """Delete storybook from library."""
    db = get_database()
    db.delete_storybook(user_id, storybook_id)
    return {"status": "deleted"}


# Pipeline endpoint
@app.post("/api/v1/pipeline/generate", response_model=PipelineResponse)
async def api_generate_pipeline(request: PipelineRequest):
    """Run full video generation pipeline (images -> voice -> video)."""
    db = get_database()
    user_id = request.user_id
    run_id = request.run_id

    try:
        # Stage 3: Generate images
        if user_id:
            db.save_checkpoint(user_id, run_id, {"current_stage": "images"})
        image_result = await generate_images(
            story=request.story,
            drawing=request.drawing,
            style=request.style,
            run_id=run_id,
            user_id=user_id,
        )

        # Stage 4: Generate voice
        if user_id:
            db.save_checkpoint(user_id, run_id, {
                "current_stage": "voice",
                "image_result": image_result.model_dump(),
            })
        audio_result = await generate_audio(
            story=request.story,
            voice_type=request.voice_type,
            run_id=run_id,
            user_id=user_id,
        )

        # Stage 5: Assemble video
        if user_id:
            db.save_checkpoint(user_id, run_id, {
                "current_stage": "video",
                "image_result": image_result.model_dump(),
                "audio_result": audio_result.model_dump(),
            })
        video_result = await assemble_video(
            images=image_result,
            audio=audio_result,
            run_id=run_id,
            user_id=user_id,
        )

        # Mark complete
        if user_id:
            db.save_checkpoint(user_id, run_id, {
                "current_stage": "complete",
                "video_result": video_result.model_dump(),
            })

        return PipelineResponse(
            video=video_result,
            images=image_result.images,
        )

    except Exception as e:
        if user_id:
            db.save_checkpoint(user_id, run_id, {
                "current_stage": "error",
                "error": str(e),
            })
        raise HTTPException(status_code=500, detail=str(e))


# Job status endpoint (for async polling)
@app.get("/api/v1/jobs/{run_id}/status")
async def get_job_status(run_id: str, user_id: str = Query(...)) -> JobStatusResponse:
    """Get the status of an async job by polling the checkpoint."""
    db = get_database()
    checkpoint = db.get_checkpoint(user_id, run_id)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        user_id=checkpoint.get("user_id", user_id),
        run_id=checkpoint.get("run_id", run_id),
        status=checkpoint.get("status", "processing"),
        current_stage=checkpoint.get("current_stage"),
        error=checkpoint.get("error"),
        drawing_analysis=checkpoint.get("drawing_analysis"),
        story_script=checkpoint.get("story_script"),
        images=checkpoint.get("images"),
        video=checkpoint.get("video"),
        updated_at=checkpoint.get("updated_at"),
    )
