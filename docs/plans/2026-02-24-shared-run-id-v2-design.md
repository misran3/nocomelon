# Shared Run ID Design (v2)

## Problem

The current implementation generates a new `run_id` at each API endpoint, so files from one pipeline run still have different prefixes:
- Images: `abc12345_scene_1.png`
- Audio: `def67890_scene_1.mp3`
- Video: `xyz99999_final.mp4`

## Solution

Generate `run_id` once at Vision stage, return it in the response, and require it in request bodies for stages 3-5.

## Data Flow

```
Vision (generates run_id)
    ↓ returns { drawing_analysis, run_id }
Story (no files, doesn't need run_id)
    ↓ returns { story_script }
Images (receives run_id in request)
    ↓ files: {run_id}_scene_1.png, etc.
Voice (receives run_id in request)
    ↓ files: {run_id}_scene_1.mp3, etc.
Video (receives run_id in request)
    ↓ file: {run_id}_final.mp4
```

## Changes

### 1. New Response Model

```python
class VisionResponse(BaseModel):
    """Response from vision analysis."""
    run_id: str
    drawing: DrawingAnalysis
```

### 2. Updated Request Models

```python
class ImagesRequest(BaseModel):
    run_id: str  # NEW
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style

class VoiceRequest(BaseModel):
    run_id: str  # NEW
    story: StoryScript
    voice_type: VoiceType

class VideoRequest(BaseModel):
    run_id: str  # NEW
    images: ImageResult
    audio: AudioResult
    music_track: str | None = None
```

### 3. API Endpoint Changes

- `POST /api/v1/vision/analyze` returns `VisionResponse` (includes `run_id`)
- `POST /api/v1/images/generate` reads `run_id` from request body
- `POST /api/v1/voice/generate` reads `run_id` from request body
- `POST /api/v1/video/assemble` reads `run_id` from request body

### 4. Streamlit Changes

- Vision page stores `run_id` in `st.session_state`
- Images, Voice, Video pages read `run_id` from session state and include in requests

## Result

All files from one pipeline run share the same prefix:
```
5f6c63ab_scene_1.png
5f6c63ab_scene_2.png
5f6c63ab_scene_1.mp3
5f6c63ab_scene_2.mp3
5f6c63ab_final.mp4
```
