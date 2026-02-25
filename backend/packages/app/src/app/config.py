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

    # AWS/S3 Configuration
    aws_region: str = "us-east-1"
    s3_bucket_name: str | None = None

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

    # S3 Storage
    @property
    def use_s3(self) -> bool:
        """Return True if S3 storage is configured."""
        return self.s3_bucket_name is not None

    def get_storage(self):
        """Get S3Storage instance if configured."""
        if not self.use_s3:
            return None
        from app.storage import S3Storage
        return S3Storage(
            bucket_name=self.s3_bucket_name,
            region=self.aws_region
        )


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
