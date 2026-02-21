# NoComelon POC Design

> **Date**: 2026-02-21
> **Status**: Approved
> **Scope**: Local proof-of-concept for testing the AI pipeline

---

## 1. Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Streamlit + FastAPI | FastAPI backend reusable for actual app |
| **Package manager** | uv workspace | Two packages: `app` (AI logic) + `dev` (Streamlit) |
| **AI framework** | Pydantic AI + OpenAI | Structured outputs, type-safe |
| **Storage** | Local filesystem | Checkpoints as JSON, assets in data/ folders |
| **UI approach** | Stage-by-stage testing | Separate pages per pipeline stage |
| **Async handling** | Synchronous with spinner | Simple for POC |
| **Testing approach** | Incremental | Build and test each stage before moving to next |

---

## 2. Project Structure

```
columbia-hackathon/
├── docs/plans/                      # Design docs
├── backend/
│   ├── pyproject.toml               # uv workspace root
│   ├── packages/
│   │   ├── app/                     # Package 1: AI logic
│   │   │   ├── pyproject.toml
│   │   │   └── src/
│   │   │       └── app/
│   │   │           ├── __init__.py
│   │   │           ├── config.py
│   │   │           ├── models.py
│   │   │           ├── main.py      # FastAPI app
│   │   │           └── stages/
│   │   │               ├── __init__.py
│   │   │               ├── vision.py
│   │   │               ├── story.py
│   │   │               ├── images.py
│   │   │               ├── voice.py
│   │   │               └── video.py
│   │   │
│   │   └── dev/                     # Package 2: Streamlit testing
│   │       ├── pyproject.toml
│   │       └── src/
│   │           └── dev/
│   │               ├── __init__.py
│   │               ├── streamlit_app.py
│   │               └── pages/
│   │                   ├── 1_vision.py
│   │                   ├── 2_story.py
│   │                   ├── 3_images.py
│   │                   ├── 4_voice.py
│   │                   └── 5_video.py
│   │
│   ├── data/
│   │   ├── checkpoints/
│   │   ├── images/
│   │   ├── audio/
│   │   ├── videos/
│   │   └── samples/
│   │
│   └── assets/
│       └── music/
│
└── .env                             # API keys (gitignored)
```

**Setup commands** (use uv, not manual file editing):
```bash
cd backend
uv init
cd packages/app && uv init
cd ../dev && uv init
uv add pydantic-ai openai elevenlabs ffmpeg-python pydantic python-dotenv
uv add --dev streamlit requests pillow
```

---

## 3. Tech Stack

### Backend (`app` package)
| Dependency | Purpose |
|------------|---------|
| `pydantic-ai` | Structured outputs from LLMs |
| `openai` | DALL-E 3 image generation |
| `elevenlabs` | Voice synthesis |
| `ffmpeg-python` | Video assembly |
| `pydantic` | Data models |
| `fastapi` | API framework |
| `uvicorn` | ASGI server |
| `python-dotenv` | Environment variables |

### Frontend (`dev` package)
| Dependency | Purpose |
|------------|---------|
| `streamlit` | Testing UI |
| `requests` | Call FastAPI |
| `pillow` | Image display |

---

## 4. API Endpoints

### Health & Status
```
GET /health
Response: { status: "ok", timestamp: ISO8601 }

GET /api/v1/status
Response: {
  openai: "connected" | "error",
  elevenlabs: "connected" | "error",
  ffmpeg: "installed" | "missing",
  dataDir: "writable" | "error"
}
```

### Stage 1: Vision
```
POST /api/v1/vision/analyze
Request:  { image: base64 string }
Response: {
  subject: string,
  setting: string,
  details: string[],
  mood: string,
  colors: string[]
}
```

### Stage 2: Story
```
POST /api/v1/story/generate
Request:  {
  drawing: DrawingAnalysis,
  theme: "adventure" | "kindness" | "bravery" | ...,
  personalContext?: string,
  voiceType: "gentle" | "cheerful",
  childAge: 2-9
}
Response: {
  scenes: [
    { number: 1, text: "Once upon a time..." },
    ...
  ],
  totalScenes: number
}
```

### Stage 3: Images
```
POST /api/v1/images/generate
Request:  {
  story: StoryScript,
  drawing: DrawingAnalysis,
  style: "storybook" | "watercolor"
}
Response: {
  images: [
    { sceneNumber: 1, path: "/data/images/abc123_1.png" },
    ...
  ]
}
```

### Stage 4: Voice
```
POST /api/v1/voice/generate
Request:  {
  story: StoryScript,
  voiceType: "gentle" | "cheerful"
}
Response: {
  audioFiles: [
    { sceneNumber: 1, path: "/data/audio/abc123_1.mp3", durationSec: 8.2 },
    ...
  ],
  totalDurationSec: number
}
```

### Stage 5: Video
```
POST /api/v1/video/assemble
Request:  {
  images: ImageResult[],
  audio: AudioResult[],
  musicTrack?: string
}
Response: {
  videoPath: "/data/videos/abc123_final.mp4",
  durationSec: number
}
```

### Checkpoints
```
GET  /api/v1/checkpoint/{id}
POST /api/v1/checkpoint
PUT  /api/v1/checkpoint/{id}
```

---

## 5. Pydantic Models

```python
from pydantic import BaseModel
from enum import Enum

class Theme(str, Enum):
    ADVENTURE = "adventure"
    KINDNESS = "kindness"
    BRAVERY = "bravery"
    BEDTIME = "bedtime"
    FRIENDSHIP = "friendship"
    COUNTING = "counting"
    NATURE = "nature"

class Style(str, Enum):
    STORYBOOK = "storybook"
    WATERCOLOR = "watercolor"

class VoiceType(str, Enum):
    GENTLE = "gentle"
    CHEERFUL = "cheerful"

# Stage 1 Output
class DrawingAnalysis(BaseModel):
    subject: str
    setting: str
    details: list[str]
    mood: str
    colors: list[str]

# Stage 2 Output
class Scene(BaseModel):
    number: int
    text: str

class StoryScript(BaseModel):
    scenes: list[Scene]
    total_scenes: int

# Stage 3 Output
class GeneratedImage(BaseModel):
    scene_number: int
    path: str

class ImageResult(BaseModel):
    images: list[GeneratedImage]

# Stage 4 Output
class GeneratedAudio(BaseModel):
    scene_number: int
    path: str
    duration_sec: float

class AudioResult(BaseModel):
    audio_files: list[GeneratedAudio]
    total_duration_sec: float

# Stage 5 Output
class VideoResult(BaseModel):
    video_path: str
    duration_sec: float

# Checkpoint
class PipelineStage(str, Enum):
    VISION = "vision"
    STORY = "story"
    IMAGES = "images"
    VOICE = "voice"
    VIDEO = "video"
    COMPLETE = "complete"

class Checkpoint(BaseModel):
    id: str
    current_stage: PipelineStage
    drawing_analysis: DrawingAnalysis | None = None
    story_script: StoryScript | None = None
    image_result: ImageResult | None = None
    audio_result: AudioResult | None = None
    video_result: VideoResult | None = None
    error: str | None = None
```

---

## 6. Streamlit UI Design

### Stage-by-Stage Testing Pages

Each page follows this pattern:
1. **Load input**: From previous stage checkpoint OR paste JSON manually
2. **Configure options**: Stage-specific parameters
3. **Execute**: Call FastAPI endpoint with spinner
4. **Preview results**: Display output with formatting
5. **Save**: Save to checkpoint, copy JSON for debugging

### Page 1: Vision
- Upload image or select from samples
- Preview uploaded image
- "Analyze Drawing" button
- Display DrawingAnalysis results
- Save/Copy actions

### Page 2: Story
- Load DrawingAnalysis from checkpoint or paste
- Configure: Theme, Age, VoiceType, PersonalContext
- "Generate Story" button
- Display script with scene markers
- Save/Copy actions

### Page 3: Images
- Load StoryScript + DrawingAnalysis
- Configure: Style (storybook/watercolor)
- "Generate Images" button (shows progress per image)
- Display image grid
- Save/Copy actions

### Page 4: Voice
- Load StoryScript
- Configure: VoiceType
- "Generate Audio" button (shows progress per scene)
- Audio player per scene
- Save/Copy actions

### Page 5: Video
- Load ImageResult + AudioResult
- Configure: Background music track (optional)
- "Assemble Video" button
- Video player preview
- Download final video

---

## 7. Environment Variables

```bash
# .env (gitignored)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...

# Optional
DATA_DIR=./data
LOG_LEVEL=INFO
```

---

## 8. Running the POC

```bash
# Terminal 1: Start FastAPI backend
cd backend
uv run uvicorn app.main:app --reload --port 8000

# Terminal 2: Start Streamlit frontend
cd backend
uv run streamlit run packages/dev/src/dev/streamlit_app.py --server.port 8501
```

Access:
- FastAPI docs: http://localhost:8000/docs
- Streamlit UI: http://localhost:8501

---

## 9. Incremental Testing Order

1. **Stage 1 (Vision)**: Upload sample drawing → verify DrawingAnalysis output
2. **Stage 2 (Story)**: Use Vision output → verify scene-tagged script
3. **Stage 3 (Images)**: Use Story output → verify 6 images generated
4. **Stage 4 (Voice)**: Use Story output → verify audio per scene
5. **Stage 5 (Video)**: Use Images + Audio → verify final video

Each stage is tested independently before moving to the next.
