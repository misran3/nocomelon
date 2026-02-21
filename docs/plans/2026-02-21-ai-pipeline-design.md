# NoComelon AI Pipeline Design

> **Date**: 2026-02-21
> **Status**: Approved
> **Scope**: End-to-end AI pipeline feasibility for MVP (happiest path only)

---

## 1. Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Architecture** | Fully pluggable providers | Swap between dev stack (Bedrock) and demo stack (OpenAI + ElevenLabs) |
| **Provider abstraction** | No abstraction layer | Separate implementations per provider, redundancy acceptable for faster dev |
| **Visual fidelity** | Loose inspiration | AI generates frames "inspired by" drawing, not style transfer |
| **Animation level** | Static images + crossfades | Ken Burns effects cut for MVP simplicity |
| **Image styles** | Storybook + Watercolor only | Reduced from 4 to 2 for MVP |
| **Voice options** | 2 voices (gentle + cheerful) | Reduced from 4 to 2 for MVP |
| **Age-based pacing** | Skipped for MVP | Fixed 1.0x speech rate for all ages |
| **Audio mixing** | Fixed 15% music volume | No audio ducking for MVP |
| **Confidence scores** | Scrapped | Always show interpretation to parent for confirmation |
| **Pipeline architecture** | Functional + checkpointed | Each step is pure function, state persisted to database |

---

## 2. Provider Stacks

### Development Stack (AWS Bedrock)
- **Vision/Text**: Claude 3.5 Sonnet
- **Images**: Stable Diffusion XL
- **Voice**: Amazon Polly (Neural)
- **Cost**: ~$0.10/storybook

### Demo Stack (OpenAI + ElevenLabs)
- **Vision/Text**: GPT-4o
- **Images**: DALL-E 3
- **Voice**: ElevenLabs Turbo v2.5
- **Cost**: ~$0.85/storybook

---

## 3. Pipeline Architecture

### Flow Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Parent uploads │     │  Vision API     │     │  Story LLM      │
│  drawing photo  │────▶│  analyzes       │────▶│  generates      │
│                 │     │  drawing        │     │  script         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  Parent reviews │◀────│  Script with    │
                        │  & approves     │     │  scene breaks   │
                        │  script         │     │                 │
                        └─────────────────┘     └─────────────────┘
                                │
                                ▼ (approved)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Image Gen API  │     │  Voice API      │     │  FFmpeg         │
│  creates 4-8    │────▶│  narrates       │────▶│  assembles      │
│  frames         │     │  script         │     │  final video    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Functional Step Definitions

```typescript
// Step 1: Analyze drawing
analyzeDrawing(
  input: { imageData: Buffer },
  context: { provider: 'openai' | 'bedrock' }
) → DrawingAnalysisResult

// Step 2: Generate story (depends on step 1)
generateStory(
  input: { theme, age, voiceType, personalContext },
  prev: DrawingAnalysisResult,
  context: { provider: 'openai' | 'bedrock' }
) → StoryScriptResult

// Step 3: Generate images (depends on step 2)
generateImages(
  input: { style },
  prev: { drawing: DrawingAnalysisResult, story: StoryScriptResult },
  context: { provider: 'dalle' | 'sdxl' }
) → GeneratedImagesResult

// Step 4: Generate audio (depends on step 2)
generateAudio(
  prev: StoryScriptResult,
  context: { provider: 'elevenlabs' | 'polly' }
) → GeneratedAudioResult

// Step 5: Assemble video (depends on step 3 + 4)
assembleVideo(
  prev: { images: GeneratedImagesResult, audio: GeneratedAudioResult }
) → FinalVideoResult
```

### Checkpointing

Pipeline state is persisted to database after each step:

```typescript
interface PipelineState {
  id: string;
  userId: string;
  drawingAnalysis?: DrawingAnalysisResult;
  storyScript?: StoryScriptResult;
  generatedImages?: GeneratedImagesResult;
  generatedAudio?: GeneratedAudioResult;
  finalVideo?: FinalVideoResult;
  currentStep: 'analysis' | 'story' | 'images' | 'audio' | 'video' | 'complete';
  failedAt?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Benefits:
- Resume on failure (load checkpoint, continue from last step)
- Debug individual steps (inspect checkpoint JSON)
- Test in isolation (mock previous step outputs)
- Provider swapping (pass different context without changing logic)

---

## 4. Stage Details

### Stage 1: Drawing Analysis (Vision)

**Input**: JPEG/PNG image of child's drawing

**Output**:
```json
{
  "subject": "a purple dinosaur",
  "setting": "standing in a green field with flowers",
  "details": ["big friendly eyes", "spiky back", "short arms"],
  "mood": "happy and playful",
  "colors": ["purple", "green", "yellow"]
}
```

**Prompt Strategy**:
```
You are analyzing a child's drawing. Your job is to identify:
1. The main subject (character, animal, object)
2. The setting or background
3. Notable details that make this drawing unique
4. The apparent mood/emotion
5. Primary colors used

Be generous in interpretation — assume the child meant to draw
something coherent even if the execution is imperfect. A scribble
with eyes is probably a creature. Describe what the child likely
INTENDED, not what it literally looks like.

Output as JSON: {subject, setting, details[], mood, colors[]}
```

**Parent Confirmation**: Always show interpretation for parent to confirm or edit. No confidence scores.

---

### Stage 2: Story Generation

**Input**:
```json
{
  "drawing": { "subject": "purple dinosaur", "setting": "green field", ... },
  "style": "storybook",
  "theme": "bravery",
  "personalContext": "starting kindergarten next week",
  "voiceType": "gentle_storyteller",
  "childAge": 5
}
```

**Output** (scene-tagged script):
```
[SCENE 1]
Once upon a time, there was a little purple dinosaur named Dino who lived in a beautiful green meadow.

[SCENE 2]
One sunny morning, Dino heard exciting news — tomorrow was his first day at Dinosaur School!

[SCENE 3]
"What if the other dinosaurs don't like me?" Dino worried, his tail drooping.

[SCENE 4]
But then Dino remembered what his mama always said: "Being brave doesn't mean not being scared. It means trying anyway."

[SCENE 5]
The next day, Dino took a deep breath and walked through the school gates...

[SCENE 6]
And guess what? He made three new friends before lunchtime!

[END]
Dino learned that sometimes the scariest things turn into the best adventures.
```

**Age Adaptation** (content only, not speech rate):

| Age | Vocabulary | Sentences | Story Beats |
|-----|------------|-----------|-------------|
| 2-3 | Simple nouns/verbs | 5-7 words max | 3-4 scenes |
| 4-5 | Basic adjectives | 8-12 words | 5-6 scenes |
| 6-7 | Richer vocabulary | 12-15 words | 6-7 scenes |
| 8-9 | Age-appropriate | 15-20 words | 7-8 scenes |

**Content Guardrails** (baked into prompt):
```
CONTENT RULES (non-negotiable):
- No violence, conflict, or scary imagery
- No death, illness, or loss
- No villains or antagonists
- Characters solve problems through kindness, not confrontation
- All emotions are validated, all endings are positive
- No mention of real-world dangers (strangers, accidents)
```

---

### Stage 3: Image Generation

**Input** (per scene):
```json
{
  "sceneNumber": 1,
  "sceneText": "Once upon a time, there was a little purple dinosaur...",
  "characterDescription": "a friendly purple dinosaur with big eyes and spiky back",
  "style": "storybook"
}
```

**Style Prompt Templates**:

| Style | Base Prompt Modifier |
|-------|---------------------|
| **Storybook** | "children's book illustration, warm colors, soft lighting, hand-painted feel, cozy atmosphere" |
| **Watercolor** | "watercolor painting, soft edges, dreamy, pastel tones, artistic, ethereal" |

**Full Prompt Construction**:
```
[Style modifier] of [scene description].
The main character is [character description from drawing].
Child-friendly, safe for young children, no scary elements.
```

**Negative Prompts** (for SD XL):
```
violence, weapons, blood, scary, dark, horror, realistic,
photorealistic, adult content, inappropriate, frightening
```

**Character Consistency**: Include character description in every scene prompt. Accept slight variation between frames (acceptable for storybook format).

---

### Stage 4: Voice Synthesis

**Voice Options** (MVP):

| Voice ID | ElevenLabs | Polly |
|----------|------------|-------|
| `gentle_storyteller` | Rachel | Joanna (Neural) |
| `cheerful_narrator` | Josh | Matthew (Neural) |

**Generation Strategy**: Scene-by-scene
- Generate audio for each `[SCENE N]` block separately
- Get precise timing for each scene (needed for video assembly)
- Concatenate into final audio

**Speech Rate**: Fixed 1.0x for all ages (MVP simplification)

---

### Stage 5: Video Assembly (FFmpeg)

**Input**:
```
images/scene_1.png (1024x1024)
images/scene_2.png (1024x1024)
...
audio/scene_1.mp3 (8.2 seconds)
audio/scene_2.mp3 (7.5 seconds)
...
audio/background_music.mp3 (pre-selected, looping)
```

**Output**:
```
storybook_final.mp4 (1080p, 60-90 seconds, H.264)
```

**Video Effects** (MVP):
- Static images displayed for scene audio duration
- 0.5s crossfade between scenes
- No Ken Burns (zoom/pan) effects

**Audio Mixing** (MVP):
- Narration: 100% volume
- Background music: Fixed 15% volume (no ducking)

**Output Specs**:
- Resolution: 1920x1080 (letterboxed if source is square)
- Codec: H.264
- Audio: AAC 128kbps
- Format: MP4

---

## 5. Error Handling

| Stage | Failure Mode | Handling |
|-------|--------------|----------|
| **Drawing Upload** | File too large, wrong format | Client-side validation. Compress if needed. |
| **Vision API** | API timeout, rate limit | Retry 2x with exponential backoff. |
| **Story Gen** | Content filter triggered | Regenerate with adjusted prompt. |
| **Image Gen** | Content filter rejection | Retry 2x. |
| **Voice API** | API timeout | Retry 2x. Strip special characters. |
| **FFmpeg** | Processing failure | Log error, prompt user retry. |

**Checkpoint Resume**: On any failure, save state to database. User can retry from last successful step.

---

## 6. Content Safety

**Layer 1: Prompt Engineering**
- All prompts explicitly request child-safe content
- Negative prompts for inappropriate content

**Layer 2: Provider Filters**
- DALL-E 3 and SD XL have built-in content filters
- ElevenLabs filters inappropriate text

**Layer 3: Parent Review**
- Parent sees script before images are generated
- Parent previews final video before saving

---

## 7. Cost Estimation

### Development Stack (AWS Bedrock)
| Stage | Provider | Cost |
|-------|----------|------|
| Vision | Claude 3.5 Sonnet | ~$0.01 |
| Story | Claude 3.5 Sonnet | ~$0.02 |
| Images (6 frames) | SD XL | ~$0.06 |
| Voice | Amazon Polly | ~$0.01 |
| **Total** | | **~$0.10/storybook** |

### Demo Stack (OpenAI + ElevenLabs)
| Stage | Provider | Cost |
|-------|----------|------|
| Vision | GPT-4o | ~$0.02 |
| Story | GPT-4o | ~$0.03 |
| Images (6 frames) | DALL-E 3 | ~$0.48 |
| Voice | ElevenLabs | ~$0.30 |
| **Total** | | **~$0.85/storybook** |

### Budget Capacity
- $100 OpenAI credits → ~115 demo storybooks
- AWS free tier → ~1000 dev storybooks
- ElevenLabs free tier → ~5-10 storybooks

---

## 8. Out of Scope (MVP)

The following are explicitly excluded from MVP:

- Ken Burns (zoom/pan) video effects
- Audio ducking
- Pixar-style and Anime art styles
- Age-based speech rate adjustment
- Confidence scores for drawing interpretation
- AI-generated music
- Provider abstraction layer (use separate implementations instead)
