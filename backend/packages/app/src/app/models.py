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


class VisionResponse(BaseModel):
    """Response from vision analysis including run_id."""
    run_id: str
    drawing: DrawingAnalysis


# Stage 2: Story Output
class Scene(BaseModel):
    """A single scene in the story."""
    number: int
    text: str


class StoryScript(BaseModel):
    """Complete story script with scenes."""
    title: str | None = Field(default=None, description="Creative, child-friendly story title")
    scenes: list[Scene]
    total_scenes: int


# Stage 3: Images Output
class GeneratedImage(BaseModel):
    """A generated image for a scene."""
    scene_number: int
    key: str  # S3 key


class ImageResult(BaseModel):
    """Result of image generation stage."""
    images: list[GeneratedImage]


# Stage 4: Voice Output
class GeneratedAudio(BaseModel):
    """Generated audio for a scene."""
    scene_number: int
    key: str  # S3 key
    duration_sec: float


class AudioResult(BaseModel):
    """Result of voice generation stage."""
    audio_files: list[GeneratedAudio]
    total_duration_sec: float


# Stage 5: Video Output
class VideoResult(BaseModel):
    """Result of video assembly stage."""
    video_key: str  # S3 key
    duration_sec: float
    thumbnail_key: str  # S3 key


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
    user_id: str | None = None


class StoryRequest(BaseModel):
    """Request to generate a story."""
    drawing: DrawingAnalysis
    theme: Theme
    personal_context: str | None = None
    voice_type: VoiceType
    child_age: int = Field(ge=3, le=7)
    user_id: str | None = None
    run_id: str | None = None


class ImagesRequest(BaseModel):
    """Request to generate images."""
    run_id: str
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style
    user_id: str | None = None


class VoiceRequest(BaseModel):
    """Request to generate voice audio."""
    run_id: str
    story: StoryScript
    voice_type: VoiceType
    user_id: str | None = None


class VideoRequest(BaseModel):
    """Request to assemble video."""
    run_id: str
    images: ImageResult
    audio: AudioResult
    music_track: str | None = None
    user_id: str | None = None


# Library Models
class LibraryEntry(BaseModel):
    """A saved storybook in the library."""
    id: str
    title: str
    thumbnail_key: str
    video_key: str
    duration_sec: float
    style: Style
    created_at: str


# Pipeline Models
class PipelineRequest(BaseModel):
    """Request to run full video pipeline."""
    run_id: str
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style
    voice_type: VoiceType
    user_id: str | None = None


class PipelineResponse(BaseModel):
    """Response from video pipeline."""
    video: VideoResult
    images: list[GeneratedImage]
