# Shared Run ID Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Pass a single `run_id` from the API layer to all pipeline stages so files from one run share the same prefix.

**Architecture:** Add `run_id: str` parameter to stage functions that generate files (images, voice, video). Generate the ID once in FastAPI endpoints and pass it through.

**Tech Stack:** Python, FastAPI, uuid

---

## Task 1: Update images.py to accept run_id

**Files:**
- Modify: `backend/packages/app/src/app/stages/images.py`

**Step 1: Update function signature and remove uuid import**

Replace:
```python
"""Stage 3: Generate images for each scene using DALL-E 3."""

import uuid

from openai import AsyncOpenAI
```

With:
```python
"""Stage 3: Generate images for each scene using DALL-E 3."""

from openai import AsyncOpenAI
```

**Step 2: Add run_id parameter to function**

Replace:
```python
async def generate_images(
    story: StoryScript,
    drawing: DrawingAnalysis,
    style: Style,
) -> ImageResult:
```

With:
```python
async def generate_images(
    story: StoryScript,
    drawing: DrawingAnalysis,
    style: Style,
    run_id: str,
) -> ImageResult:
```

**Step 3: Remove internal run_id generation**

Replace:
```python
    # Ensure output directory exists
    settings.images_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]

    images = []
```

With:
```python
    # Ensure output directory exists
    settings.images_dir.mkdir(parents=True, exist_ok=True)

    images = []
```

**Step 4: Verify import works**

```bash
cd backend
uv run python -c "from app.stages.images import generate_images; print('OK')"
```

Expected: `OK`

---

## Task 2: Update voice.py to accept run_id

**Files:**
- Modify: `backend/packages/app/src/app/stages/voice.py`

**Step 1: Remove uuid import**

Replace:
```python
"""Stage 4: Generate voice narration using ElevenLabs."""

import uuid

from elevenlabs import AsyncElevenLabs
```

With:
```python
"""Stage 4: Generate voice narration using ElevenLabs."""

from elevenlabs import AsyncElevenLabs
```

**Step 2: Add run_id parameter to function**

Replace:
```python
async def generate_audio(
    story: StoryScript,
    voice_type: VoiceType,
) -> AudioResult:
```

With:
```python
async def generate_audio(
    story: StoryScript,
    voice_type: VoiceType,
    run_id: str,
) -> AudioResult:
```

**Step 3: Remove internal run_id generation**

Replace:
```python
    # Ensure output directory exists
    settings.audio_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]

    audio_files = []
```

With:
```python
    # Ensure output directory exists
    settings.audio_dir.mkdir(parents=True, exist_ok=True)

    audio_files = []
```

**Step 4: Verify import works**

```bash
uv run python -c "from app.stages.voice import generate_audio; print('OK')"
```

Expected: `OK`

---

## Task 3: Update video.py to accept run_id

**Files:**
- Modify: `backend/packages/app/src/app/stages/video.py`

**Step 1: Remove uuid import**

Replace:
```python
"""Stage 5: Assemble final video using FFmpeg."""

import uuid
import subprocess
```

With:
```python
"""Stage 5: Assemble final video using FFmpeg."""

import subprocess
```

**Step 2: Add run_id parameter to function**

Replace:
```python
async def assemble_video(
    images: ImageResult,
    audio: AudioResult,
    music_track: str | None = None,
) -> VideoResult:
```

With:
```python
async def assemble_video(
    images: ImageResult,
    audio: AudioResult,
    run_id: str,
    music_track: str | None = None,
) -> VideoResult:
```

**Step 3: Remove internal run_id generation**

Replace:
```python
    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]
    output_path = settings.videos_dir / f"{run_id}_final.mp4"
```

With:
```python
    output_path = settings.videos_dir / f"{run_id}_final.mp4"
```

**Step 4: Verify import works**

```bash
uv run python -c "from app.stages.video import assemble_video; print('OK')"
```

Expected: `OK`

---

## Task 4: Update FastAPI endpoints to generate and pass run_id

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add uuid import**

After:
```python
import subprocess
from datetime import datetime, timezone
```

Add:
```python
import uuid
```

**Step 2: Update images endpoint**

Replace:
```python
@app.post("/api/v1/images/generate", response_model=ImageResult)
async def api_generate_images(request: ImagesRequest):
    """Stage 3: Generate images."""
    try:
        return await generate_images(
            story=request.story,
            drawing=request.drawing,
            style=request.style,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

With:
```python
@app.post("/api/v1/images/generate", response_model=ImageResult)
async def api_generate_images(request: ImagesRequest):
    """Stage 3: Generate images."""
    try:
        run_id = uuid.uuid4().hex[:8]
        return await generate_images(
            story=request.story,
            drawing=request.drawing,
            style=request.style,
            run_id=run_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 3: Update voice endpoint**

Replace:
```python
@app.post("/api/v1/voice/generate", response_model=AudioResult)
async def api_generate_audio(request: VoiceRequest):
    """Stage 4: Generate voice audio."""
    try:
        return await generate_audio(
            story=request.story,
            voice_type=request.voice_type,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

With:
```python
@app.post("/api/v1/voice/generate", response_model=AudioResult)
async def api_generate_audio(request: VoiceRequest):
    """Stage 4: Generate voice audio."""
    try:
        run_id = uuid.uuid4().hex[:8]
        return await generate_audio(
            story=request.story,
            voice_type=request.voice_type,
            run_id=run_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 4: Update video endpoint**

Replace:
```python
@app.post("/api/v1/video/assemble", response_model=VideoResult)
async def api_assemble_video(request: VideoRequest):
    """Stage 5: Assemble final video."""
    try:
        return await assemble_video(
            images=request.images,
            audio=request.audio,
            music_track=request.music_track,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

With:
```python
@app.post("/api/v1/video/assemble", response_model=VideoResult)
async def api_assemble_video(request: VideoRequest):
    """Stage 5: Assemble final video."""
    try:
        run_id = uuid.uuid4().hex[:8]
        return await assemble_video(
            images=request.images,
            audio=request.audio,
            run_id=run_id,
            music_track=request.music_track,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 5: Verify API imports work**

```bash
uv run python -c "from app.main import app; print('OK')"
```

Expected: `OK`

---

## Task 5: Run tests and commit

**Step 1: Run all tests**

```bash
uv run pytest packages/app/tests/ -v --tb=short
```

Expected: All tests pass (unit tests don't call real APIs)

**Step 2: Commit all changes**

```bash
git add backend/packages/app/src/app/stages/images.py \
        backend/packages/app/src/app/stages/voice.py \
        backend/packages/app/src/app/stages/video.py \
        backend/packages/app/src/app/main.py \
        docs/plans/
git commit -m "feat: use shared run_id across pipeline stages

- Add run_id parameter to generate_images, generate_audio, assemble_video
- Generate run_id once in API endpoints and pass to stage functions
- All files from one pipeline run now share the same prefix"
```
