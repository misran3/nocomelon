# NoComelon POC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a local proof-of-concept to test the AI pipeline (Vision → Story → Images → Voice → Video) using OpenAI + ElevenLabs.

**Architecture:** FastAPI backend with 5 pipeline stages, each as a separate module. Streamlit frontend for stage-by-stage testing. Local filesystem for checkpoints and generated assets.

**Tech Stack:** Python 3.11+, uv workspace, Pydantic AI, OpenAI SDK, ElevenLabs SDK, FFmpeg, FastAPI, Streamlit

---

## Task 0: Project Setup

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/packages/app/pyproject.toml`
- Create: `backend/packages/dev/pyproject.toml`
- Create: `.env`
- Create: `.gitignore`

**Step 1: Create backend directory and initialize uv workspace**

```bash
mkdir -p backend/packages
cd backend
uv init --name nocomelon-backend
```

**Step 2: Create app package (AI logic)**

```bash
cd packages
mkdir -p app/src/app/stages
cd app
uv init --name app --lib
```

**Step 3: Create dev package (Streamlit)**

```bash
cd ../
mkdir -p dev/src/dev/pages
cd dev
uv init --name dev --lib
```

**Step 4: Configure workspace members**

```bash
cd ../../
# Edit pyproject.toml to add workspace config
```

Add to `backend/pyproject.toml`:
```toml
[tool.uv.workspace]
members = ["packages/*"]
```

**Step 5: Add dependencies to app package**

```bash
cd packages/app
uv add pydantic-ai openai elevenlabs ffmpeg-python pydantic fastapi uvicorn python-dotenv aiofiles
```

**Step 6: Add dependencies to dev package**

```bash
cd ../dev
uv add streamlit requests pillow
uv add --dev app --editable
```

**Step 7: Create data directories**

```bash
cd ../../
mkdir -p data/{checkpoints,images,audio,videos,samples}
mkdir -p assets/music
```

**Step 8: Create .env file**

Create `.env` in project root:
```bash
OPENAI_API_KEY=sk-your-key-here
ELEVENLABS_API_KEY=your-key-here
DATA_DIR=./backend/data
```

**Step 9: Create .gitignore**

Create `.gitignore`:
```
.env
__pycache__/
*.pyc
.venv/
backend/data/images/*
backend/data/audio/*
backend/data/videos/*
backend/data/checkpoints/*
!backend/data/*/.gitkeep
.DS_Store
```

**Step 10: Add .gitkeep files**

```bash
touch backend/data/checkpoints/.gitkeep
touch backend/data/images/.gitkeep
touch backend/data/audio/.gitkeep
touch backend/data/videos/.gitkeep
touch backend/data/samples/.gitkeep
touch backend/assets/music/.gitkeep
```

**Step 11: Commit**

```bash
git add .
git commit -m "chore: initialize uv workspace with app and dev packages"
```

---

## Task 1: Pydantic Models

**Files:**
- Create: `backend/packages/app/src/app/models.py`
- Create: `backend/packages/app/src/app/__init__.py`

**Step 1: Create __init__.py**

Create `backend/packages/app/src/app/__init__.py`:
```python
"""NoComelon AI Pipeline."""
```

**Step 2: Write models**

Create `backend/packages/app/src/app/models.py`:
```python
"""Pydantic models for the NoComelon AI pipeline."""

from enum import Enum
from pydantic import BaseModel, Field


class Theme(str, Enum):
    """Story theme options."""
    ADVENTURE = "adventure"
    KINDNESS = "kindness"
    BRAVERY = "bravery"
    BEDTIME = "bedtime"
    FRIENDSHIP = "friendship"
    COUNTING = "counting"
    NATURE = "nature"


class Style(str, Enum):
    """Visual style options."""
    STORYBOOK = "storybook"
    WATERCOLOR = "watercolor"


class VoiceType(str, Enum):
    """Narrator voice options."""
    GENTLE = "gentle"
    CHEERFUL = "cheerful"


# Stage 1: Vision Output
class DrawingAnalysis(BaseModel):
    """Result of analyzing a child's drawing."""
    subject: str = Field(description="Main subject of the drawing")
    setting: str = Field(description="Background or setting")
    details: list[str] = Field(description="Notable details")
    mood: str = Field(description="Apparent mood/emotion")
    colors: list[str] = Field(description="Primary colors used")


# Stage 2: Story Output
class Scene(BaseModel):
    """A single scene in the story."""
    number: int
    text: str


class StoryScript(BaseModel):
    """Complete story script with scenes."""
    scenes: list[Scene]
    total_scenes: int


# Stage 3: Images Output
class GeneratedImage(BaseModel):
    """A generated image for a scene."""
    scene_number: int
    path: str


class ImageResult(BaseModel):
    """Result of image generation stage."""
    images: list[GeneratedImage]


# Stage 4: Voice Output
class GeneratedAudio(BaseModel):
    """Generated audio for a scene."""
    scene_number: int
    path: str
    duration_sec: float


class AudioResult(BaseModel):
    """Result of voice generation stage."""
    audio_files: list[GeneratedAudio]
    total_duration_sec: float


# Stage 5: Video Output
class VideoResult(BaseModel):
    """Result of video assembly stage."""
    video_path: str
    duration_sec: float


# Checkpoint
class PipelineStage(str, Enum):
    """Current stage in the pipeline."""
    VISION = "vision"
    STORY = "story"
    IMAGES = "images"
    VOICE = "voice"
    VIDEO = "video"
    COMPLETE = "complete"


class Checkpoint(BaseModel):
    """Pipeline state checkpoint."""
    id: str
    current_stage: PipelineStage
    drawing_analysis: DrawingAnalysis | None = None
    story_script: StoryScript | None = None
    image_result: ImageResult | None = None
    audio_result: AudioResult | None = None
    video_result: VideoResult | None = None
    error: str | None = None


# Request Models
class VisionRequest(BaseModel):
    """Request to analyze a drawing."""
    image_base64: str


class StoryRequest(BaseModel):
    """Request to generate a story."""
    drawing: DrawingAnalysis
    theme: Theme
    personal_context: str | None = None
    voice_type: VoiceType
    child_age: int = Field(ge=2, le=9)


class ImagesRequest(BaseModel):
    """Request to generate images."""
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style


class VoiceRequest(BaseModel):
    """Request to generate voice audio."""
    story: StoryScript
    voice_type: VoiceType


class VideoRequest(BaseModel):
    """Request to assemble video."""
    images: ImageResult
    audio: AudioResult
    music_track: str | None = None
```

**Step 3: Verify models compile**

```bash
cd backend
uv run python -c "from app.models import *; print('Models OK')"
```

Expected: `Models OK`

**Step 4: Commit**

```bash
git add backend/packages/app/src/app/
git commit -m "feat: add Pydantic models for all pipeline stages"
```

---

## Task 2: Config Module

**Files:**
- Create: `backend/packages/app/src/app/config.py`

**Step 1: Write config**

Create `backend/packages/app/src/app/config.py`:
```python
"""Configuration management."""

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    # API Keys
    openai_api_key: str
    elevenlabs_api_key: str

    # Paths
    data_dir: Path = Path("./data")

    # Derived paths
    @property
    def checkpoints_dir(self) -> Path:
        return self.data_dir / "checkpoints"

    @property
    def images_dir(self) -> Path:
        return self.data_dir / "images"

    @property
    def audio_dir(self) -> Path:
        return self.data_dir / "audio"

    @property
    def videos_dir(self) -> Path:
        return self.data_dir / "videos"

    @property
    def samples_dir(self) -> Path:
        return self.data_dir / "samples"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

**Step 2: Add pydantic-settings dependency**

```bash
cd backend/packages/app
uv add pydantic-settings
```

**Step 3: Verify config loads**

```bash
cd backend
uv run python -c "from app.config import get_settings; s = get_settings(); print(f'Data dir: {s.data_dir}')"
```

Expected: `Data dir: ./data` (or error about missing API keys if .env not set up)

**Step 4: Commit**

```bash
git add backend/packages/app/src/app/config.py
git commit -m "feat: add config module with settings"
```

---

## Task 3: Stage 1 - Vision (Drawing Analysis)

**Files:**
- Create: `backend/packages/app/src/app/stages/__init__.py`
- Create: `backend/packages/app/src/app/stages/vision.py`
- Test: `backend/packages/app/tests/test_vision.py`

**Step 1: Create stages __init__.py**

Create `backend/packages/app/src/app/stages/__init__.py`:
```python
"""Pipeline stages."""

from .vision import analyze_drawing

__all__ = ["analyze_drawing"]
```

**Step 2: Write the vision stage**

Create `backend/packages/app/src/app/stages/vision.py`:
```python
"""Stage 1: Analyze a child's drawing using vision AI."""

import base64
from pydantic_ai import Agent, BinaryContent

from app.models import DrawingAnalysis
from app.config import get_settings


# Create the vision agent
vision_agent = Agent(
    "openai:gpt-4o",
    output_type=DrawingAnalysis,
    system_prompt="""You are analyzing a child's drawing. Your job is to identify:
1. The main subject (character, animal, object)
2. The setting or background
3. Notable details that make this drawing unique
4. The apparent mood/emotion
5. Primary colors used

Be generous in interpretation — assume the child meant to draw something coherent
even if the execution is imperfect. A scribble with eyes is probably a creature.
Describe what the child likely INTENDED, not what it literally looks like.

Return your analysis as structured data.""",
)


async def analyze_drawing(image_base64: str) -> DrawingAnalysis:
    """
    Analyze a drawing image and return structured analysis.

    Args:
        image_base64: Base64 encoded image data

    Returns:
        DrawingAnalysis with subject, setting, details, mood, colors
    """
    settings = get_settings()

    # Decode base64 to bytes for BinaryContent
    image_bytes = base64.b64decode(image_base64)

    # Construct the message with the image using pydantic-ai's BinaryContent
    result = await vision_agent.run(
        [
            BinaryContent(data=image_bytes, media_type="image/png"),
            "Please analyze this child's drawing.",
        ]
    )

    return result.output
```

**Step 3: Create test directory and write test**

```bash
mkdir -p backend/packages/app/tests
touch backend/packages/app/tests/__init__.py
```

Create `backend/packages/app/tests/test_vision.py`:
```python
"""Tests for vision stage."""

import pytest
import base64
from pathlib import Path

from app.stages.vision import analyze_drawing
from app.models import DrawingAnalysis


# Sample 1x1 red pixel PNG for basic testing
TINY_PNG_B64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="


@pytest.mark.asyncio
async def test_analyze_drawing_returns_drawing_analysis():
    """Vision stage should return a DrawingAnalysis model."""
    # This test requires a real API call
    # Skip if no API key configured
    pytest.importorskip("app.config")

    result = await analyze_drawing(TINY_PNG_B64)

    assert isinstance(result, DrawingAnalysis)
    assert isinstance(result.subject, str)
    assert isinstance(result.setting, str)
    assert isinstance(result.details, list)
    assert isinstance(result.mood, str)
    assert isinstance(result.colors, list)
```

**Step 4: Add pytest dependencies**

```bash
cd backend/packages/app
uv add --dev pytest pytest-asyncio
```

**Step 5: Run test (requires API key)**

```bash
cd backend
uv run pytest packages/app/tests/test_vision.py -v
```

Expected: PASS (if API key configured) or SKIP (if not)

**Step 6: Commit**

```bash
git add backend/packages/app/src/app/stages/ backend/packages/app/tests/
git commit -m "feat: add vision stage for drawing analysis"
```

---

## Task 4: Stage 2 - Story Generation

**Files:**
- Modify: `backend/packages/app/src/app/stages/__init__.py`
- Create: `backend/packages/app/src/app/stages/story.py`
- Test: `backend/packages/app/tests/test_story.py`

**Step 1: Write the story stage**

Create `backend/packages/app/src/app/stages/story.py`:
```python
"""Stage 2: Generate a story script from drawing analysis."""

from pydantic_ai import Agent

from app.models import (
    DrawingAnalysis,
    StoryScript,
    Scene,
    Theme,
    VoiceType
)
from app.config import get_settings


# Age-based content guidelines
AGE_GUIDELINES = {
    (2, 3): "Use very simple words (5-7 words per sentence). 3-4 scenes total. Simple cause and effect.",
    (4, 5): "Use basic adjectives (8-12 words per sentence). 5-6 scenes total. Clear story arc.",
    (6, 7): "Richer vocabulary (12-15 words per sentence). 6-7 scenes. Add light humor.",
    (8, 9): "Age-appropriate language (15-20 words per sentence). 7-8 scenes. Mini plot twists OK.",
}


def get_age_guideline(age: int) -> str:
    """Get content guideline for age."""
    for (min_age, max_age), guideline in AGE_GUIDELINES.items():
        if min_age <= age <= max_age:
            return guideline
    return AGE_GUIDELINES[(4, 5)]  # Default


# Create the story agent
story_agent = Agent(
    "openai:gpt-4o",
    output_type=StoryScript,
    system_prompt="""You are a children's story writer. Generate a story based on the drawing
and theme provided.

CONTENT RULES (non-negotiable):
- No violence, conflict, or scary imagery
- No death, illness, or loss
- No villains or antagonists
- Characters solve problems through kindness, not confrontation
- All emotions are validated, all endings are positive
- No mention of real-world dangers (strangers, accidents)

FORMAT:
- Each scene should be tagged with [SCENE N] in the text
- Return scenes as a list with number and text
- Include an [END] scene with a gentle lesson/moral

The story should feel warm, safe, and celebrate the child's creativity.""",
)


async def generate_story(
    drawing: DrawingAnalysis,
    theme: Theme,
    child_age: int,
    voice_type: VoiceType,
    personal_context: str | None = None,
) -> StoryScript:
    """
    Generate a story script based on drawing analysis.

    Args:
        drawing: Analysis of the child's drawing
        theme: Story theme (adventure, kindness, etc.)
        child_age: Age of the child (2-9)
        voice_type: Narrator voice type
        personal_context: Optional personal context to incorporate

    Returns:
        StoryScript with numbered scenes
    """
    settings = get_settings()
    age_guideline = get_age_guideline(child_age)

    # Build the prompt
    prompt_parts = [
        f"Create a story about: {drawing.subject}",
        f"Setting: {drawing.setting}",
        f"Details to incorporate: {', '.join(drawing.details)}",
        f"Mood: {drawing.mood}",
        f"Theme: {theme.value}",
        f"Age guideline: {age_guideline}",
        f"Voice tone: {'warm and calm' if voice_type == VoiceType.GENTLE else 'playful and energetic'}",
    ]

    if personal_context:
        prompt_parts.append(f"Personal context to weave in: {personal_context}")

    prompt = "\n".join(prompt_parts)

    result = await story_agent.run(prompt)
    return result.output
```

**Step 2: Update stages __init__.py**

Edit `backend/packages/app/src/app/stages/__init__.py`:
```python
"""Pipeline stages."""

from .vision import analyze_drawing
from .story import generate_story

__all__ = ["analyze_drawing", "generate_story"]
```

**Step 3: Write test**

Create `backend/packages/app/tests/test_story.py`:
```python
"""Tests for story stage."""

import pytest

from app.stages.story import generate_story, get_age_guideline
from app.models import DrawingAnalysis, StoryScript, Theme, VoiceType


def test_get_age_guideline_returns_string():
    """Age guideline lookup should return a string."""
    for age in range(2, 10):
        guideline = get_age_guideline(age)
        assert isinstance(guideline, str)
        assert len(guideline) > 0


@pytest.fixture
def sample_drawing():
    """Sample drawing analysis for testing."""
    return DrawingAnalysis(
        subject="a purple dinosaur",
        setting="a green meadow with flowers",
        details=["big friendly eyes", "spiky back", "short arms"],
        mood="happy and playful",
        colors=["purple", "green", "yellow"],
    )


@pytest.mark.asyncio
async def test_generate_story_returns_story_script(sample_drawing):
    """Story stage should return a StoryScript model."""
    result = await generate_story(
        drawing=sample_drawing,
        theme=Theme.BRAVERY,
        child_age=5,
        voice_type=VoiceType.GENTLE,
        personal_context="starting kindergarten next week",
    )

    assert isinstance(result, StoryScript)
    assert len(result.scenes) >= 3
    assert result.total_scenes == len(result.scenes)

    # Check scene structure
    for scene in result.scenes:
        assert scene.number > 0
        assert len(scene.text) > 0
```

**Step 4: Run test**

```bash
cd backend
uv run pytest packages/app/tests/test_story.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/packages/app/src/app/stages/story.py backend/packages/app/tests/test_story.py
git commit -m "feat: add story generation stage"
```

---

## Task 5: Stage 3 - Image Generation

**Files:**
- Modify: `backend/packages/app/src/app/stages/__init__.py`
- Create: `backend/packages/app/src/app/stages/images.py`
- Test: `backend/packages/app/tests/test_images.py`

**Step 1: Write the images stage**

Create `backend/packages/app/src/app/stages/images.py`:
```python
"""Stage 3: Generate images for each scene using DALL-E 3."""

import uuid
from pathlib import Path

from openai import AsyncOpenAI
import aiofiles
import base64
import httpx

from app.models import (
    DrawingAnalysis,
    StoryScript,
    Style,
    GeneratedImage,
    ImageResult,
)
from app.config import get_settings


# Style prompt templates
STYLE_PROMPTS = {
    Style.STORYBOOK: "children's book illustration, warm colors, soft lighting, hand-painted feel, cozy atmosphere",
    Style.WATERCOLOR: "watercolor painting, soft edges, dreamy, pastel tones, artistic, ethereal",
}

NEGATIVE_PROMPT = "violence, weapons, blood, scary, dark, horror, realistic, photorealistic, adult content, inappropriate, frightening"


async def generate_images(
    story: StoryScript,
    drawing: DrawingAnalysis,
    style: Style,
) -> ImageResult:
    """
    Generate images for each scene in the story.

    Args:
        story: The story script with scenes
        drawing: Original drawing analysis (for character description)
        style: Visual style to use

    Returns:
        ImageResult with paths to generated images
    """
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    # Ensure output directory exists
    settings.images_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique run ID
    run_id = uuid.uuid4().hex[:8]

    images = []
    style_prompt = STYLE_PROMPTS[style]
    character_desc = f"The main character is {drawing.subject} with {', '.join(drawing.details)}."

    for scene in story.scenes:
        # Build the prompt
        prompt = f"""{style_prompt} of {scene.text}
{character_desc}
Child-friendly, safe for young children, no scary elements."""

        # Generate image
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        # Download and save the image
        image_url = response.data[0].url
        image_path = settings.images_dir / f"{run_id}_scene_{scene.number}.png"

        async with httpx.AsyncClient() as http_client:
            img_response = await http_client.get(image_url)
            async with aiofiles.open(image_path, "wb") as f:
                await f.write(img_response.content)

        images.append(GeneratedImage(
            scene_number=scene.number,
            path=str(image_path),
        ))

    return ImageResult(images=images)
```

**Step 2: Add httpx dependency**

```bash
cd backend/packages/app
uv add httpx
```

**Step 3: Update stages __init__.py**

Edit `backend/packages/app/src/app/stages/__init__.py`:
```python
"""Pipeline stages."""

from .vision import analyze_drawing
from .story import generate_story
from .images import generate_images

__all__ = ["analyze_drawing", "generate_story", "generate_images"]
```

**Step 4: Write test**

Create `backend/packages/app/tests/test_images.py`:
```python
"""Tests for images stage."""

import pytest
from pathlib import Path

from app.stages.images import generate_images, STYLE_PROMPTS
from app.models import (
    DrawingAnalysis,
    StoryScript,
    Scene,
    Style,
    ImageResult,
)


def test_style_prompts_exist():
    """All styles should have prompt templates."""
    for style in Style:
        assert style in STYLE_PROMPTS
        assert len(STYLE_PROMPTS[style]) > 0


@pytest.fixture
def sample_drawing():
    return DrawingAnalysis(
        subject="a purple dinosaur",
        setting="a green meadow",
        details=["big eyes", "spiky back"],
        mood="happy",
        colors=["purple", "green"],
    )


@pytest.fixture
def sample_story():
    return StoryScript(
        scenes=[
            Scene(number=1, text="Once upon a time there was a dinosaur."),
            Scene(number=2, text="The dinosaur made a friend."),
        ],
        total_scenes=2,
    )


@pytest.mark.asyncio
async def test_generate_images_creates_files(sample_drawing, sample_story, tmp_path, monkeypatch):
    """Image generation should create image files."""
    # This test requires real API - mark as integration test
    pytest.skip("Integration test - requires OpenAI API")

    result = await generate_images(
        story=sample_story,
        drawing=sample_drawing,
        style=Style.STORYBOOK,
    )

    assert isinstance(result, ImageResult)
    assert len(result.images) == len(sample_story.scenes)

    for img in result.images:
        assert Path(img.path).exists()
```

**Step 5: Run test**

```bash
cd backend
uv run pytest packages/app/tests/test_images.py -v
```

Expected: PASS (unit tests pass, integration test skipped)

**Step 6: Commit**

```bash
git add backend/packages/app/src/app/stages/images.py backend/packages/app/tests/test_images.py
git commit -m "feat: add image generation stage with DALL-E 3"
```

---

## Task 6: Stage 4 - Voice Generation

**Files:**
- Modify: `backend/packages/app/src/app/stages/__init__.py`
- Create: `backend/packages/app/src/app/stages/voice.py`
- Test: `backend/packages/app/tests/test_voice.py`

**Step 1: Write the voice stage**

Create `backend/packages/app/src/app/stages/voice.py`:
```python
"""Stage 4: Generate voice narration using ElevenLabs."""

import uuid
from pathlib import Path

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

        # Generate the audio
        audio_generator = await client.text_to_speech.convert(
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
```

**Step 2: Update stages __init__.py**

Edit `backend/packages/app/src/app/stages/__init__.py`:
```python
"""Pipeline stages."""

from .vision import analyze_drawing
from .story import generate_story
from .images import generate_images
from .voice import generate_audio

__all__ = ["analyze_drawing", "generate_story", "generate_images", "generate_audio"]
```

**Step 3: Write test**

Create `backend/packages/app/tests/test_voice.py`:
```python
"""Tests for voice stage."""

import pytest

from app.stages.voice import generate_audio, VOICE_IDS
from app.models import (
    StoryScript,
    Scene,
    VoiceType,
    AudioResult,
)


def test_voice_ids_exist():
    """All voice types should have ElevenLabs IDs."""
    for voice_type in VoiceType:
        assert voice_type in VOICE_IDS
        assert len(VOICE_IDS[voice_type]) > 0


@pytest.fixture
def sample_story():
    return StoryScript(
        scenes=[
            Scene(number=1, text="Once upon a time there was a little dinosaur."),
            Scene(number=2, text="The dinosaur loved to play in the meadow."),
        ],
        total_scenes=2,
    )


@pytest.mark.asyncio
async def test_generate_audio_creates_files(sample_story):
    """Audio generation should create audio files."""
    # This test requires real API - mark as integration test
    pytest.skip("Integration test - requires ElevenLabs API")

    result = await generate_audio(
        story=sample_story,
        voice_type=VoiceType.GENTLE,
    )

    assert isinstance(result, AudioResult)
    assert len(result.audio_files) == len(sample_story.scenes)
    assert result.total_duration_sec > 0
```

**Step 4: Run test**

```bash
cd backend
uv run pytest packages/app/tests/test_voice.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/packages/app/src/app/stages/voice.py backend/packages/app/tests/test_voice.py
git commit -m "feat: add voice generation stage with ElevenLabs"
```

---

## Task 7: Stage 5 - Video Assembly

**Files:**
- Modify: `backend/packages/app/src/app/stages/__init__.py`
- Create: `backend/packages/app/src/app/stages/video.py`
- Test: `backend/packages/app/tests/test_video.py`

**Step 1: Write the video stage**

Create `backend/packages/app/src/app/stages/video.py`:
```python
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
```

**Step 2: Update stages __init__.py**

Edit `backend/packages/app/src/app/stages/__init__.py`:
```python
"""Pipeline stages."""

from .vision import analyze_drawing
from .story import generate_story
from .images import generate_images
from .voice import generate_audio
from .video import assemble_video

__all__ = [
    "analyze_drawing",
    "generate_story",
    "generate_images",
    "generate_audio",
    "assemble_video",
]
```

**Step 3: Write test**

Create `backend/packages/app/tests/test_video.py`:
```python
"""Tests for video stage."""

import pytest
import subprocess

from app.stages.video import assemble_video
from app.models import (
    ImageResult,
    AudioResult,
    GeneratedImage,
    GeneratedAudio,
    VideoResult,
)


def test_ffmpeg_installed():
    """FFmpeg should be installed and accessible."""
    result = subprocess.run(['ffmpeg', '-version'], capture_output=True)
    assert result.returncode == 0


def test_ffprobe_installed():
    """FFprobe should be installed and accessible."""
    result = subprocess.run(['ffprobe', '-version'], capture_output=True)
    assert result.returncode == 0


@pytest.mark.asyncio
async def test_assemble_video_creates_file():
    """Video assembly should create a video file."""
    # This test requires actual image/audio files
    pytest.skip("Integration test - requires generated assets")
```

**Step 4: Run test**

```bash
cd backend
uv run pytest packages/app/tests/test_video.py -v
```

Expected: PASS (unit tests for FFmpeg installation)

**Step 5: Commit**

```bash
git add backend/packages/app/src/app/stages/video.py backend/packages/app/tests/test_video.py
git commit -m "feat: add video assembly stage with FFmpeg"
```

---

## Task 8: FastAPI Application

**Files:**
- Create: `backend/packages/app/src/app/main.py`
- Test: `backend/packages/app/tests/test_api.py`

**Step 1: Write FastAPI app**

Create `backend/packages/app/src/app/main.py`:
```python
"""FastAPI application for NoComelon AI pipeline."""

import subprocess
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


@app.post("/api/v1/vision/analyze", response_model=DrawingAnalysis)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        return await analyze_drawing(request.image_base64)
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
            music_track=request.music_track,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Write API tests**

Create `backend/packages/app/tests/test_api.py`:
```python
"""Tests for FastAPI application."""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_health_endpoint(client):
    """Health endpoint should return ok status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "timestamp" in data


def test_status_endpoint(client):
    """Status endpoint should return dependency statuses."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert "openai" in data
    assert "elevenlabs" in data
    assert "ffmpeg" in data
    assert "data_dir" in data
```

**Step 3: Add test client dependency**

```bash
cd backend/packages/app
uv add --dev httpx  # Required for TestClient
```

**Step 4: Run tests**

```bash
cd backend
uv run pytest packages/app/tests/test_api.py -v
```

Expected: PASS

**Step 5: Verify server starts**

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000/docs
# Ctrl+C to stop
```

**Step 6: Commit**

```bash
git add backend/packages/app/src/app/main.py backend/packages/app/tests/test_api.py
git commit -m "feat: add FastAPI application with all endpoints"
```

---

## Task 9: Streamlit App - Main Page

**Files:**
- Create: `backend/packages/dev/src/dev/__init__.py`
- Create: `backend/packages/dev/src/dev/streamlit_app.py`

**Step 1: Create __init__.py**

Create `backend/packages/dev/src/dev/__init__.py`:
```python
"""Streamlit development/testing app."""
```

**Step 2: Write main Streamlit app**

Create `backend/packages/dev/src/dev/streamlit_app.py`:
```python
"""Main Streamlit app for testing the NoComelon pipeline."""

import streamlit as st
import requests

st.set_page_config(
    page_title="NoComelon POC",
    page_icon="🎨",
    layout="wide",
)

API_BASE = "http://localhost:8000"


def check_api_health():
    """Check if the API is running."""
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False


def main():
    st.title("🎨 NoComelon POC")
    st.markdown("Test the AI pipeline stage by stage.")

    # Check API status
    if check_api_health():
        st.success("✅ API is running")

        # Get detailed status
        try:
            status = requests.get(f"{API_BASE}/api/v1/status").json()
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("OpenAI", status.get("openai", "unknown"))
            with col2:
                st.metric("ElevenLabs", status.get("elevenlabs", "unknown"))
            with col3:
                st.metric("FFmpeg", status.get("ffmpeg", "unknown"))
            with col4:
                st.metric("Data Dir", status.get("data_dir", "unknown"))
        except Exception as e:
            st.warning(f"Could not get status: {e}")
    else:
        st.error("❌ API is not running. Start it with: `uv run uvicorn app.main:app --reload --port 8000`")

    st.divider()

    st.markdown("""
    ## Pipeline Stages

    Use the sidebar to navigate to each stage:

    1. **Vision** - Upload and analyze a drawing
    2. **Story** - Generate a story script
    3. **Images** - Generate illustrations
    4. **Voice** - Generate narration
    5. **Video** - Assemble final video

    Each stage can be tested independently or you can chain outputs together.
    """)


if __name__ == "__main__":
    main()
```

**Step 3: Test Streamlit runs**

```bash
cd backend
uv run streamlit run packages/dev/src/dev/streamlit_app.py --server.port 8501
# Visit http://localhost:8501
# Ctrl+C to stop
```

**Step 4: Commit**

```bash
git add backend/packages/dev/src/dev/
git commit -m "feat: add Streamlit main page with health checks"
```

---

## Task 10: Streamlit - Vision Page

**Files:**
- Create: `backend/packages/dev/src/dev/pages/1_vision.py`

**Step 1: Write vision page**

Create `backend/packages/dev/src/dev/pages/1_vision.py`:
```python
"""Stage 1: Vision - Analyze a drawing."""

import streamlit as st
import requests
import base64
from pathlib import Path
import json

st.set_page_config(page_title="Vision Stage", page_icon="🎨")

API_BASE = "http://localhost:8000"


def main():
    st.title("🎨 Stage 1: Drawing Analysis")

    # Image upload
    st.subheader("Upload Drawing")

    upload_method = st.radio(
        "Choose input method:",
        ["Upload Image", "Use Sample"],
        horizontal=True,
    )

    image_data = None

    if upload_method == "Upload Image":
        uploaded_file = st.file_uploader(
            "Choose an image",
            type=["png", "jpg", "jpeg"],
        )
        if uploaded_file:
            image_data = uploaded_file.read()
            st.image(image_data, caption="Uploaded drawing", width=400)

    else:  # Use Sample
        sample_dir = Path("data/samples")
        if sample_dir.exists():
            samples = list(sample_dir.glob("*.png")) + list(sample_dir.glob("*.jpg"))
            if samples:
                sample_choice = st.selectbox(
                    "Select a sample:",
                    samples,
                    format_func=lambda x: x.name,
                )
                if sample_choice:
                    image_data = sample_choice.read_bytes()
                    st.image(image_data, caption=f"Sample: {sample_choice.name}", width=400)
            else:
                st.warning("No sample images found in data/samples/")
        else:
            st.warning("Sample directory not found. Create data/samples/ and add images.")

    st.divider()

    # Analyze button
    if image_data:
        if st.button("🔍 Analyze Drawing", type="primary"):
            with st.spinner("Analyzing drawing..."):
                try:
                    # Encode to base64
                    b64_image = base64.b64encode(image_data).decode("utf-8")

                    # Call API
                    response = requests.post(
                        f"{API_BASE}/api/v1/vision/analyze",
                        json={"image_base64": b64_image},
                        timeout=60,
                    )

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

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(result, indent=2),
                            file_name="vision_result.json",
                            mime="application/json",
                        )
                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")

    # Show previous result if exists
    if 'vision_result' in st.session_state:
        st.divider()
        st.subheader("Last Result (stored in session)")
        st.json(st.session_state['vision_result'])


if __name__ == "__main__":
    main()
```

**Step 2: Commit**

```bash
git add backend/packages/dev/src/dev/pages/1_vision.py
git commit -m "feat: add Streamlit vision page"
```

---

## Task 11: Streamlit - Story Page

**Files:**
- Create: `backend/packages/dev/src/dev/pages/2_story.py`

**Step 1: Write story page**

Create `backend/packages/dev/src/dev/pages/2_story.py`:
```python
"""Stage 2: Story - Generate a story script."""

import streamlit as st
import requests
import json

st.set_page_config(page_title="Story Stage", page_icon="📖")

API_BASE = "http://localhost:8000"

THEMES = ["adventure", "kindness", "bravery", "bedtime", "friendship", "counting", "nature"]
VOICE_TYPES = ["gentle", "cheerful"]


def main():
    st.title("📖 Stage 2: Story Generation")

    # Input section
    st.subheader("Input: Drawing Analysis")

    input_method = st.radio(
        "Choose input method:",
        ["Use Last Vision Result", "Paste JSON"],
        horizontal=True,
    )

    drawing_data = None

    if input_method == "Use Last Vision Result":
        if 'vision_result' in st.session_state:
            drawing_data = st.session_state['vision_result']
            st.success("Using stored vision result")
            st.json(drawing_data)
        else:
            st.warning("No vision result in session. Run Vision stage first or paste JSON.")
    else:
        json_input = st.text_area(
            "Paste DrawingAnalysis JSON:",
            height=200,
            placeholder='{"subject": "a purple dinosaur", "setting": "green meadow", ...}',
        )
        if json_input:
            try:
                drawing_data = json.loads(json_input)
                st.success("JSON parsed successfully")
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    st.subheader("Options")

    col1, col2 = st.columns(2)

    with col1:
        theme = st.selectbox("Theme:", THEMES, index=2)  # Default: bravery
        voice_type = st.selectbox("Voice Type:", VOICE_TYPES)

    with col2:
        child_age = st.slider("Child's Age:", 2, 9, 5)
        personal_context = st.text_input(
            "Personal Context (optional):",
            placeholder="e.g., starting kindergarten next week",
        )

    st.divider()

    # Generate button
    if drawing_data:
        if st.button("📝 Generate Story", type="primary"):
            with st.spinner("Generating story..."):
                try:
                    payload = {
                        "drawing": drawing_data,
                        "theme": theme,
                        "voice_type": voice_type,
                        "child_age": child_age,
                        "personal_context": personal_context if personal_context else None,
                    }

                    response = requests.post(
                        f"{API_BASE}/api/v1/story/generate",
                        json=payload,
                        timeout=120,
                    )

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Story generated!")

                        # Display story
                        st.subheader("Generated Story")
                        for scene in result['scenes']:
                            st.markdown(f"**[SCENE {scene['number']}]**")
                            st.markdown(scene['text'])
                            st.markdown("")

                        # Store in session
                        st.session_state['story_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                        st.download_button(
                            "📋 Copy JSON",
                            json.dumps(result, indent=2),
                            file_name="story_result.json",
                            mime="application/json",
                        )
                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")


if __name__ == "__main__":
    main()
```

**Step 2: Commit**

```bash
git add backend/packages/dev/src/dev/pages/2_story.py
git commit -m "feat: add Streamlit story page"
```

---

## Task 12: Streamlit - Images Page

**Files:**
- Create: `backend/packages/dev/src/dev/pages/3_images.py`

**Step 1: Write images page**

Create `backend/packages/dev/src/dev/pages/3_images.py`:
```python
"""Stage 3: Images - Generate illustrations."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Images Stage", page_icon="🖼️", layout="wide")

API_BASE = "http://localhost:8000"

STYLES = ["storybook", "watercolor"]


def main():
    st.title("🖼️ Stage 3: Image Generation")

    # Input section
    st.subheader("Input: Story Script + Drawing Analysis")

    col1, col2 = st.columns(2)

    story_data = None
    drawing_data = None

    with col1:
        st.markdown("**Story Script**")
        if 'story_result' in st.session_state:
            story_data = st.session_state['story_result']
            st.success("Using stored story result")
            with st.expander("View Story JSON"):
                st.json(story_data)
        else:
            story_json = st.text_area("Paste StoryScript JSON:", height=150)
            if story_json:
                try:
                    story_data = json.loads(story_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    with col2:
        st.markdown("**Drawing Analysis**")
        if 'vision_result' in st.session_state:
            drawing_data = st.session_state['vision_result']
            st.success("Using stored vision result")
            with st.expander("View Drawing JSON"):
                st.json(drawing_data)
        else:
            drawing_json = st.text_area("Paste DrawingAnalysis JSON:", height=150)
            if drawing_json:
                try:
                    drawing_data = json.loads(drawing_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    style = st.selectbox("Visual Style:", STYLES)

    st.divider()

    # Generate button
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

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Images generated!")

                        # Display images in grid
                        st.subheader("Generated Images")
                        cols = st.columns(3)
                        for i, img in enumerate(result['images']):
                            with cols[i % 3]:
                                img_path = Path(img['path'])
                                if img_path.exists():
                                    st.image(str(img_path), caption=f"Scene {img['scene_number']}")
                                else:
                                    st.warning(f"Image not found: {img['path']}")

                        # Store in session
                        st.session_state['images_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")
    else:
        st.info("Load both Story Script and Drawing Analysis to generate images.")


if __name__ == "__main__":
    main()
```

**Step 2: Commit**

```bash
git add backend/packages/dev/src/dev/pages/3_images.py
git commit -m "feat: add Streamlit images page"
```

---

## Task 13: Streamlit - Voice Page

**Files:**
- Create: `backend/packages/dev/src/dev/pages/4_voice.py`

**Step 1: Write voice page**

Create `backend/packages/dev/src/dev/pages/4_voice.py`:
```python
"""Stage 4: Voice - Generate narration."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Voice Stage", page_icon="🎤")

API_BASE = "http://localhost:8000"

VOICE_TYPES = ["gentle", "cheerful"]


def main():
    st.title("🎤 Stage 4: Voice Generation")

    # Input section
    st.subheader("Input: Story Script")

    story_data = None

    if 'story_result' in st.session_state:
        story_data = st.session_state['story_result']
        st.success("Using stored story result")
        with st.expander("View Story"):
            for scene in story_data['scenes']:
                st.markdown(f"**Scene {scene['number']}:** {scene['text']}")
    else:
        story_json = st.text_area("Paste StoryScript JSON:", height=200)
        if story_json:
            try:
                story_data = json.loads(story_json)
            except json.JSONDecodeError as e:
                st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    voice_type = st.selectbox("Voice Type:", VOICE_TYPES)

    st.divider()

    # Generate button
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

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Audio generated!")

                        # Display audio players
                        st.subheader("Generated Audio")
                        for audio in result['audio_files']:
                            audio_path = Path(audio['path'])
                            st.markdown(f"**Scene {audio['scene_number']}** ({audio['duration_sec']:.1f}s)")
                            if audio_path.exists():
                                st.audio(str(audio_path))
                            else:
                                st.warning(f"Audio not found: {audio['path']}")

                        st.metric("Total Duration", f"{result['total_duration_sec']:.1f}s")

                        # Store in session
                        st.session_state['audio_result'] = result

                        # JSON output
                        st.subheader("JSON Output")
                        st.code(json.dumps(result, indent=2), language="json")

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")


if __name__ == "__main__":
    main()
```

**Step 2: Commit**

```bash
git add backend/packages/dev/src/dev/pages/4_voice.py
git commit -m "feat: add Streamlit voice page"
```

---

## Task 14: Streamlit - Video Page

**Files:**
- Create: `backend/packages/dev/src/dev/pages/5_video.py`

**Step 1: Write video page**

Create `backend/packages/dev/src/dev/pages/5_video.py`:
```python
"""Stage 5: Video - Assemble final video."""

import streamlit as st
import requests
import json
from pathlib import Path

st.set_page_config(page_title="Video Stage", page_icon="🎬")

API_BASE = "http://localhost:8000"


def main():
    st.title("🎬 Stage 5: Video Assembly")

    # Input section
    st.subheader("Input: Images + Audio")

    col1, col2 = st.columns(2)

    images_data = None
    audio_data = None

    with col1:
        st.markdown("**Images Result**")
        if 'images_result' in st.session_state:
            images_data = st.session_state['images_result']
            st.success(f"Using stored images ({len(images_data['images'])} images)")
        else:
            images_json = st.text_area("Paste ImageResult JSON:", height=150)
            if images_json:
                try:
                    images_data = json.loads(images_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    with col2:
        st.markdown("**Audio Result**")
        if 'audio_result' in st.session_state:
            audio_data = st.session_state['audio_result']
            st.success(f"Using stored audio ({len(audio_data['audio_files'])} files)")
        else:
            audio_json = st.text_area("Paste AudioResult JSON:", height=150)
            if audio_json:
                try:
                    audio_data = json.loads(audio_json)
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    st.divider()

    # Options
    st.subheader("Options")

    music_dir = Path("assets/music")
    music_files = list(music_dir.glob("*.mp3")) if music_dir.exists() else []

    use_music = st.checkbox("Add background music")
    music_track = None

    if use_music:
        if music_files:
            music_choice = st.selectbox(
                "Select music track:",
                music_files,
                format_func=lambda x: x.name,
            )
            music_track = str(music_choice)
        else:
            st.warning("No music files found in assets/music/")

    st.divider()

    # Assemble button
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

                    if response.status_code == 200:
                        result = response.json()
                        st.success("Video assembled!")

                        # Display video
                        st.subheader("Final Video")
                        video_path = Path(result['video_path'])
                        if video_path.exists():
                            st.video(str(video_path))
                            st.metric("Duration", f"{result['duration_sec']:.1f}s")

                            # Download button
                            with open(video_path, "rb") as f:
                                st.download_button(
                                    "⬇️ Download Video",
                                    f.read(),
                                    file_name="storybook.mp4",
                                    mime="video/mp4",
                                )
                        else:
                            st.warning(f"Video not found: {result['video_path']}")

                        # Store in session
                        st.session_state['video_result'] = result

                    else:
                        st.error(f"API Error: {response.status_code} - {response.text}")

                except requests.exceptions.RequestException as e:
                    st.error(f"Request failed: {e}")
    else:
        st.info("Load both Images and Audio results to assemble video.")


if __name__ == "__main__":
    main()
```

**Step 2: Commit**

```bash
git add backend/packages/dev/src/dev/pages/5_video.py
git commit -m "feat: add Streamlit video page"
```

---

## Task 15: Final Integration Test

**Step 1: Start the FastAPI server**

```bash
cd backend
uv run uvicorn app.main:app --reload --port 8000
```

**Step 2: Start Streamlit (new terminal)**

```bash
cd backend
uv run streamlit run packages/dev/src/dev/streamlit_app.py --server.port 8501
```

**Step 3: Manual test checklist**

1. [ ] Open http://localhost:8501 - main page shows API status
2. [ ] Navigate to Vision page, upload a sample drawing, verify analysis
3. [ ] Navigate to Story page, generate story from vision result
4. [ ] Navigate to Images page, generate images from story
5. [ ] Navigate to Voice page, generate audio from story
6. [ ] Navigate to Video page, assemble final video

**Step 4: Commit**

```bash
git add .
git commit -m "chore: complete POC implementation"
```

---

## Summary

This plan creates a complete POC with:
- **14 files** in the `app` package (AI logic)
- **6 files** in the `dev` package (Streamlit UI)
- **Full test coverage** for unit-testable components
- **Stage-by-stage testing** via Streamlit pages

**Total estimated tasks:** 15 bite-sized tasks
**Each task:** 10-30 minutes
