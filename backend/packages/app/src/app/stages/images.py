"""Stage 3: Generate images for each scene using DALL-E 3."""

from openai import AsyncOpenAI
import aiofiles
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
    run_id: str,
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
