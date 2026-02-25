# Shared Run ID Design

## Problem

Each pipeline stage generates its own `run_id`, causing files from one pipeline run to have different prefixes:
- Images: `abc12345_scene_1.png`
- Audio: `def67890_scene_1.mp3`
- Video: `xyz99999_final.mp4`

This makes it hard to identify which files belong together.

## Solution

Generate `run_id` once at the API layer and pass it to each stage function.

## Changes

1. **Stage functions** (`images.py`, `voice.py`, `video.py`):
   - Add `run_id: str` parameter
   - Remove internal UUID generation

2. **API endpoints** (`main.py`):
   - Generate `run_id = uuid.uuid4().hex[:8]` once per request
   - Pass to stage functions

## Result

All files from one pipeline run share the same prefix:
```
5f6c63ab_scene_1.png
5f6c63ab_scene_2.png
5f6c63ab_scene_1.mp3
5f6c63ab_scene_2.mp3
5f6c63ab_final.mp4
```
