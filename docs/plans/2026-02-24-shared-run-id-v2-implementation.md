# Shared Run ID v2 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Generate `run_id` once at Vision stage and pass it via request bodies to stages 3-5 so all files share the same prefix.

**Architecture:** Add `VisionResponse` model that wraps `DrawingAnalysis` with `run_id`. Add `run_id: str` field to `ImagesRequest`, `VoiceRequest`, `VideoRequest`. Vision endpoint generates `run_id`, other endpoints read it from request. Streamlit stores/reads `run_id` from session state.

**Tech Stack:** Python, Pydantic, FastAPI, Streamlit

---

## Task 1: Add VisionResponse model and update request models

**Files:**
- Modify: `backend/packages/app/src/app/models.py`

**Step 1: Add VisionResponse model after DrawingAnalysis**

After line 37 (after DrawingAnalysis class), add:

```python
class VisionResponse(BaseModel):
    """Response from vision analysis including run_id."""
    run_id: str
    drawing: DrawingAnalysis
```

**Step 2: Add run_id to ImagesRequest**

Replace:
```python
class ImagesRequest(BaseModel):
    """Request to generate images."""
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style
```

With:
```python
class ImagesRequest(BaseModel):
    """Request to generate images."""
    run_id: str
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style
```

**Step 3: Add run_id to VoiceRequest**

Replace:
```python
class VoiceRequest(BaseModel):
    """Request to generate voice audio."""
    story: StoryScript
    voice_type: VoiceType
```

With:
```python
class VoiceRequest(BaseModel):
    """Request to generate voice audio."""
    run_id: str
    story: StoryScript
    voice_type: VoiceType
```

**Step 4: Add run_id to VideoRequest**

Replace:
```python
class VideoRequest(BaseModel):
    """Request to assemble video."""
    images: ImageResult
    audio: AudioResult
    music_track: str | None = None
```

With:
```python
class VideoRequest(BaseModel):
    """Request to assemble video."""
    run_id: str
    images: ImageResult
    audio: AudioResult
    music_track: str | None = None
```

**Step 5: Verify models import**

```bash
cd backend
uv run python -c "from app.models import VisionResponse, ImagesRequest, VoiceRequest, VideoRequest; print('OK')"
```

Expected: `OK`

---

## Task 2: Update FastAPI endpoints

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add VisionResponse to imports**

Replace:
```python
from app.models import (
    VisionRequest,
    StoryRequest,
    ImagesRequest,
    VoiceRequest,
    VideoRequest,
    DrawingAnalysis,
    StoryScript,
    ImageResult,
    AudioResult,
    VideoResult,
)
```

With:
```python
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
```

**Step 2: Update Vision endpoint to return VisionResponse with run_id**

Replace:
```python
@app.post("/api/v1/vision/analyze", response_model=DrawingAnalysis)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        return await analyze_drawing(request.image_base64)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

With:
```python
@app.post("/api/v1/vision/analyze", response_model=VisionResponse)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        run_id = uuid.uuid4().hex[:8]
        drawing = await analyze_drawing(request.image_base64)
        return VisionResponse(run_id=run_id, drawing=drawing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 3: Update Images endpoint to use run_id from request**

Replace:
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

With:
```python
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
```

**Step 4: Update Voice endpoint to use run_id from request**

Replace:
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

With:
```python
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
```

**Step 5: Update Video endpoint to use run_id from request**

Replace:
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

With:
```python
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
```

**Step 6: Verify API imports**

```bash
uv run python -c "from app.main import app; print('OK')"
```

Expected: `OK`

---

## Task 3: Update Vision Streamlit page to store run_id

**Files:**
- Modify: `backend/packages/dev/src/dev/pages/1_Vision.py`

**Step 1: Update result handling to extract run_id and drawing**

Replace lines 72-92:
```python
                    if response.status_code == 200:
                        result = response.json()
                        st.success("Analysis complete!")

                        # Display results
                        st.subheader("Results")
                        col1, col2 = st.columns(2)

                        with col1:
                            st.markdown(f"**Subject:** {result['subject']}")
                            st.markdown(f"**Setting:** {result['setting']}")
                            st.markdown(f"**Mood:** {result['mood']}")

                        with col2:
                            st.markdown("**Details:**")
                            for detail in result['details']:
                                st.markdown(f"- {detail}")
                            st.markdown(f"**Colors:** {', '.join(result['colors'])}")

                        # Store in session state
                        st.session_state['vision_result'] = result
```

With:
```python
                    if response.status_code == 200:
                        result = response.json()
                        run_id = result['run_id']
                        drawing = result['drawing']
                        st.success(f"Analysis complete! Run ID: `{run_id}`")

                        # Display results
                        st.subheader("Results")
                        col1, col2 = st.columns(2)

                        with col1:
                            st.markdown(f"**Subject:** {drawing['subject']}")
                            st.markdown(f"**Setting:** {drawing['setting']}")
                            st.markdown(f"**Mood:** {drawing['mood']}")

                        with col2:
                            st.markdown("**Details:**")
                            for detail in drawing['details']:
                                st.markdown(f"- {detail}")
                            st.markdown(f"**Colors:** {', '.join(drawing['colors'])}")

                        # Store in session state
                        st.session_state['run_id'] = run_id
                        st.session_state['vision_result'] = drawing
```

**Step 2: Update JSON output section**

Replace lines 94-103:
```python
                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(result, indent=2),
                            file_name="vision_result.json",
                            mime="application/json",
                        )
```

With:
```python
                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(drawing, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(drawing, indent=2),
                            file_name="vision_result.json",
                            mime="application/json",
                        )
```

---

## Task 4: Update Images Streamlit page to pass run_id

**Files:**
- Modify: `backend/packages/dev/src/dev/pages/3_Images.py`

**Step 1: Add run_id retrieval and display**

After line 24 (after `drawing_data = None`), add:
```python
    run_id = st.session_state.get('run_id')
    if run_id:
        st.info(f"Using Run ID: `{run_id}`")
    else:
        st.warning("No run_id found. Run Vision stage first.")
```

**Step 2: Add run_id to payload and check before sending**

Replace lines 64-78:
```python
    if story_data and drawing_data:
        if st.button("🎨 Generate Images", type="primary"):
            with st.spinner("Generating images (this may take a few minutes)..."):
                try:
                    payload = {
                        "story": story_data,
                        "drawing": drawing_data,
                        "style": style,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/images/generate",
                        json=payload,
                        timeout=600,  # 10 min timeout for multiple images
                    )
```

With:
```python
    if story_data and drawing_data and run_id:
        if st.button("🎨 Generate Images", type="primary"):
            with st.spinner("Generating images (this may take a few minutes)..."):
                try:
                    payload = {
                        "run_id": run_id,
                        "story": story_data,
                        "drawing": drawing_data,
                        "style": style,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/images/generate",
                        json=payload,
                        timeout=600,  # 10 min timeout for multiple images
                    )
```

**Step 3: Update the else message**

Replace:
```python
    else:
        st.info("Load both Story Script and Drawing Analysis to generate images.")
```

With:
```python
    elif not run_id:
        st.info("Run Vision stage first to generate a run_id.")
    else:
        st.info("Load both Story Script and Drawing Analysis to generate images.")
```

---

## Task 5: Update Voice Streamlit page to pass run_id

**Files:**
- Modify: `backend/packages/dev/src/dev/pages/4_Voice.py`

**Step 1: Add run_id retrieval and display**

After line 20 (after `story_data = None`), add:
```python
    run_id = st.session_state.get('run_id')
    if run_id:
        st.info(f"Using Run ID: `{run_id}`")
    else:
        st.warning("No run_id found. Run Vision stage first.")
```

**Step 2: Add run_id to payload and check before sending**

Replace lines 45-58:
```python
    if story_data:
        if st.button("🔊 Generate Audio", type="primary"):
            with st.spinner("Generating audio..."):
                try:
                    payload = {
                        "story": story_data,
                        "voice_type": voice_type,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/voice/generate",
                        json=payload,
                        timeout=300,
                    )
```

With:
```python
    if story_data and run_id:
        if st.button("🔊 Generate Audio", type="primary"):
            with st.spinner("Generating audio..."):
                try:
                    payload = {
                        "run_id": run_id,
                        "story": story_data,
                        "voice_type": voice_type,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/voice/generate",
                        json=payload,
                        timeout=300,
                    )
```

**Step 3: Add else message for missing run_id**

At the end of `main()`, before the last line, add:
```python
    elif not run_id:
        st.info("Run Vision stage first to generate a run_id.")
```

---

## Task 6: Update Video Streamlit page to pass run_id

**Files:**
- Modify: `backend/packages/dev/src/dev/pages/5_Video.py`

**Step 1: Add run_id retrieval and display**

After line 22 (after `audio_data = None`), add:
```python
    run_id = st.session_state.get('run_id')
    if run_id:
        st.info(f"Using Run ID: `{run_id}`")
    else:
        st.warning("No run_id found. Run Vision stage first.")
```

**Step 2: Add run_id to payload and check before sending**

Replace lines 75-88:
```python
    if images_data and audio_data:
        if st.button("🎬 Assemble Video", type="primary"):
            with st.spinner("Assembling video..."):
                try:
                    payload = {
                        "images": images_data,
                        "audio": audio_data,
                        "music_track": music_track,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/video/assemble",
                        json=payload,
                        timeout=300,
                    )
```

With:
```python
    if images_data and audio_data and run_id:
        if st.button("🎬 Assemble Video", type="primary"):
            with st.spinner("Assembling video..."):
                try:
                    payload = {
                        "run_id": run_id,
                        "images": images_data,
                        "audio": audio_data,
                        "music_track": music_track,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/video/assemble",
                        json=payload,
                        timeout=300,
                    )
```

**Step 3: Update else message**

Replace:
```python
    else:
        st.info("Load both Images and Audio results to assemble video.")
```

With:
```python
    elif not run_id:
        st.info("Run Vision stage first to generate a run_id.")
    else:
        st.info("Load both Images and Audio results to assemble video.")
```

---

## Task 7: Run tests and commit

**Step 1: Run all tests**

```bash
cd backend
uv run pytest packages/app/tests/ -v --tb=short
```

Expected: All tests pass

**Step 2: Commit all changes**

```bash
git add backend/packages/app/src/app/models.py \
        backend/packages/app/src/app/main.py \
        backend/packages/dev/src/dev/pages/1_Vision.py \
        backend/packages/dev/src/dev/pages/3_Images.py \
        backend/packages/dev/src/dev/pages/4_Voice.py \
        backend/packages/dev/src/dev/pages/5_Video.py \
        docs/plans/
git commit -m "feat: pass run_id via request bodies for shared file prefixes

- Add VisionResponse model with run_id and drawing
- Add run_id field to ImagesRequest, VoiceRequest, VideoRequest
- Vision endpoint generates run_id and returns it
- Other endpoints read run_id from request body
- Streamlit stores run_id in session state and passes to APIs"
```
