"""Configuration management."""

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
