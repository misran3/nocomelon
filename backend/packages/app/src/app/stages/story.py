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
- Create a creative, engaging title for the story (e.g., "Dino's Big Adventure" not just "A Dinosaur")
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
