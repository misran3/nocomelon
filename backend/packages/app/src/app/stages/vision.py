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

    return result.data
