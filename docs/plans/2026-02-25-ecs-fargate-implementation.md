# ECS Fargate Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy NoComelon FastAPI backend to AWS ECS Fargate with S3 storage for generated assets.

**Architecture:** Single ECS Fargate task behind public ALB, S3 bucket for file storage, Secrets Manager for API keys. Uses default VPC for simplicity.

**Tech Stack:** Terraform 1.x, AWS Provider 6.33.0, Python 3.12, FastAPI, boto3, Docker

---

## Task 1: Create Infrastructure Directory and Terraform Variables

**Files:**
- Create: `infrastructure/variables.tf`
- Create: `infrastructure/terraform.tfvars.example`

**Step 1: Create infrastructure directory**

```bash
mkdir -p infrastructure
```

**Step 2: Create variables.tf**

```hcl
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name (used for resource naming)"
  type        = string
  default     = "nocomeleon"
}

variable "container_port" {
  description = "Port the container listens on"
  type        = number
  default     = 8000
}

variable "container_cpu" {
  description = "CPU units for the container (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "container_memory" {
  description = "Memory for the container in MB"
  type        = number
  default     = 1024
}

variable "health_check_path" {
  description = "Health check endpoint path"
  type        = string
  default     = "/health"
}
```

**Step 3: Create terraform.tfvars.example**

```hcl
aws_region       = "us-east-1"
app_name         = "nocomeleon"
container_port   = 8000
container_cpu    = 512
container_memory = 1024
health_check_path = "/health"
```

**Step 4: Commit**

```bash
git add infrastructure/variables.tf infrastructure/terraform.tfvars.example
git commit -m "feat(infra): add terraform variables"
```

---

## Task 2: Create Main Terraform Configuration

**Files:**
- Create: `infrastructure/main.tf`

**Step 1: Create main.tf with provider and data sources**

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "6.33.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Use default VPC for simplicity
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

# ------------------------------------------------------------------------------
# ECR Repository
# ------------------------------------------------------------------------------
resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = false
  }
}

# ------------------------------------------------------------------------------
# S3 Bucket for Assets
# ------------------------------------------------------------------------------
resource "aws_s3_bucket" "assets" {
  bucket        = "${var.app_name}-assets-${local.account_id}"
  force_destroy = true
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ------------------------------------------------------------------------------
# Secrets Manager
# ------------------------------------------------------------------------------
resource "aws_secretsmanager_secret" "openai_api_key" {
  name                    = "${var.app_name}/openai-api-key"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret" "elevenlabs_api_key" {
  name                    = "${var.app_name}/elevenlabs-api-key"
  recovery_window_in_days = 0
}

# ------------------------------------------------------------------------------
# CloudWatch Logs
# ------------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/${var.app_name}"
  retention_in_days = 7
}

# ------------------------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name        = "${var.app_name}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Traffic from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ------------------------------------------------------------------------------
# Application Load Balancer
# ------------------------------------------------------------------------------
resource "aws_lb" "app" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = data.aws_subnets.default.ids
}

resource "aws_lb_target_group" "app" {
  name        = "${var.app_name}-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.app.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ------------------------------------------------------------------------------
# IAM Roles
# ------------------------------------------------------------------------------
resource "aws_iam_role" "ecs_execution" {
  name = "${var.app_name}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.app_name}-secrets-access"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "secretsmanager:GetSecretValue"
      ]
      Resource = [
        aws_secretsmanager_secret.openai_api_key.arn,
        aws_secretsmanager_secret.elevenlabs_api_key.arn
      ]
    }]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  name = "${var.app_name}-s3-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ]
      Resource = [
        aws_s3_bucket.assets.arn,
        "${aws_s3_bucket.assets.arn}/*"
      ]
    }]
  })
}

# ------------------------------------------------------------------------------
# ECS Cluster
# ------------------------------------------------------------------------------
resource "aws_ecs_cluster" "app" {
  name = "${var.app_name}-cluster"
}

# ------------------------------------------------------------------------------
# ECS Task Definition
# ------------------------------------------------------------------------------
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.container_cpu
  memory                   = var.container_memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name  = var.app_name
    image = "${aws_ecr_repository.app.repository_url}:latest"

    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]

    environment = [
      { name = "AWS_REGION", value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.assets.id },
      { name = "DATA_DIR", value = "/tmp/data" }
    ]

    secrets = [
      {
        name      = "OPENAI_API_KEY"
        valueFrom = aws_secretsmanager_secret.openai_api_key.arn
      },
      {
        name      = "ELEVENLABS_API_KEY"
        valueFrom = aws_secretsmanager_secret.elevenlabs_api_key.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.app.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ecs"
      }
    }

    essential = true
  }])
}

# ------------------------------------------------------------------------------
# ECS Service
# ------------------------------------------------------------------------------
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.app.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = data.aws_subnets.default.ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = var.app_name
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.app]
}
```

**Step 2: Commit**

```bash
git add infrastructure/main.tf
git commit -m "feat(infra): add main terraform configuration"
```

---

## Task 3: Create Terraform Outputs

**Files:**
- Create: `infrastructure/outputs.tf`

**Step 1: Create outputs.tf**

```hcl
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.app.dns_name
}

output "alb_url" {
  description = "URL to access the application"
  value       = "http://${aws_lb.app.dns_name}"
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.app.repository_url
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for assets"
  value       = aws_s3_bucket.assets.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.app.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.app.name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for container logs"
  value       = aws_cloudwatch_log_group.app.name
}

output "openai_secret_arn" {
  description = "ARN of the OpenAI API key secret (add value manually)"
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

output "elevenlabs_secret_arn" {
  description = "ARN of the ElevenLabs API key secret (add value manually)"
  value       = aws_secretsmanager_secret.elevenlabs_api_key.arn
}
```

**Step 2: Commit**

```bash
git add infrastructure/outputs.tf
git commit -m "feat(infra): add terraform outputs"
```

---

## Task 4: Create Dockerfile

**Files:**
- Create: `backend/packages/app/Dockerfile`

**Step 1: Create Dockerfile**

```dockerfile
FROM python:3.12-slim

# Install FFmpeg and system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Set working directory
WORKDIR /app

# Copy dependency files
COPY pyproject.toml .
COPY .python-version .

# Install dependencies
RUN uv sync --no-dev --frozen

# Copy application code
COPY src/ src/

# Create data directory
RUN mkdir -p /tmp/data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV DATA_DIR=/tmp/data

# Expose port
EXPOSE 8000

# Run the application
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 2: Create .dockerignore**

```
__pycache__
*.pyc
*.pyo
.pytest_cache
.git
.gitignore
tests/
*.md
.env
.venv
```

**Step 3: Commit**

```bash
git add backend/packages/app/Dockerfile backend/packages/app/.dockerignore
git commit -m "feat(app): add dockerfile for ecs deployment"
```

---

## Task 5: Add boto3 Dependency

**Files:**
- Modify: `backend/packages/app/pyproject.toml`

**Step 1: Add boto3 to dependencies**

Add `"boto3>=1.38.0"` to the dependencies list in pyproject.toml.

**Step 2: Commit**

```bash
git add backend/packages/app/pyproject.toml
git commit -m "feat(app): add boto3 dependency for s3 storage"
```

---

## Task 6: Create S3 Storage Module

**Files:**
- Create: `backend/packages/app/src/app/storage.py`
- Create: `backend/packages/app/tests/test_storage.py`

**Step 1: Write failing test for storage module**

```python
"""Tests for S3 storage module."""

import pytest
from unittest.mock import MagicMock, patch, AsyncMock
from app.storage import S3Storage


class TestS3Storage:
    """Tests for S3Storage class."""

    def test_get_user_prefix_returns_correct_path(self):
        """User prefix should include user_id and subfolder."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")
        prefix = storage.get_user_prefix("user123", "images")
        assert prefix == "user123/images"

    def test_get_user_prefix_default_user(self):
        """Default user_id should be 'test'."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")
        prefix = storage.get_user_prefix(subfolder="audio")
        assert prefix == "test/audio"

    def test_build_s3_key(self):
        """S3 key should combine prefix and filename."""
        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")
        key = storage.build_s3_key("user123", "images", "scene_1.png")
        assert key == "user123/images/scene_1.png"

    @patch("app.storage.boto3")
    def test_upload_file(self, mock_boto3):
        """Upload should call S3 put_object with correct params."""
        mock_client = MagicMock()
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")
        storage.upload_bytes(b"test data", "user123/images/test.png")

        mock_client.put_object.assert_called_once_with(
            Bucket="test-bucket",
            Key="user123/images/test.png",
            Body=b"test data"
        )

    @patch("app.storage.boto3")
    def test_generate_presigned_url(self, mock_boto3):
        """Should generate presigned URL with correct expiration."""
        mock_client = MagicMock()
        mock_client.generate_presigned_url.return_value = "https://presigned-url"
        mock_boto3.client.return_value = mock_client

        storage = S3Storage(bucket_name="test-bucket", region="us-east-1")
        url = storage.generate_presigned_url("user123/videos/final.mp4", expires_in=3600)

        assert url == "https://presigned-url"
        mock_client.generate_presigned_url.assert_called_once()
```

**Step 2: Run test to verify it fails**

```bash
cd backend/packages/app && uv run pytest tests/test_storage.py -v
```

Expected: FAIL - module not found

**Step 3: Create storage.py implementation**

```python
"""S3 storage module for asset management."""

from pathlib import Path
from typing import BinaryIO

import boto3
from botocore.exceptions import ClientError


class S3Storage:
    """Handle S3 operations for user assets."""

    DEFAULT_USER_ID = "test"

    def __init__(self, bucket_name: str, region: str = "us-east-1"):
        """
        Initialize S3 storage.

        Args:
            bucket_name: S3 bucket name
            region: AWS region
        """
        self.bucket_name = bucket_name
        self.region = region
        self._client = None

    @property
    def client(self):
        """Lazy-load S3 client."""
        if self._client is None:
            self._client = boto3.client("s3", region_name=self.region)
        return self._client

    def get_user_prefix(
        self, user_id: str | None = None, subfolder: str = ""
    ) -> str:
        """
        Build S3 prefix for a user.

        Args:
            user_id: User identifier (Cognito sub). Defaults to 'test'.
            subfolder: Subfolder within user directory (images, audio, videos)

        Returns:
            S3 prefix string
        """
        user = user_id or self.DEFAULT_USER_ID
        if subfolder:
            return f"{user}/{subfolder}"
        return user

    def build_s3_key(
        self, user_id: str | None, subfolder: str, filename: str
    ) -> str:
        """
        Build full S3 key for a file.

        Args:
            user_id: User identifier
            subfolder: Subfolder (images, audio, videos)
            filename: File name

        Returns:
            Full S3 key
        """
        prefix = self.get_user_prefix(user_id, subfolder)
        return f"{prefix}/{filename}"

    def upload_bytes(self, data: bytes, s3_key: str) -> str:
        """
        Upload bytes to S3.

        Args:
            data: Bytes to upload
            s3_key: S3 key for the object

        Returns:
            S3 URI of uploaded object
        """
        self.client.put_object(
            Bucket=self.bucket_name,
            Key=s3_key,
            Body=data
        )
        return f"s3://{self.bucket_name}/{s3_key}"

    def upload_file(self, local_path: Path | str, s3_key: str) -> str:
        """
        Upload a local file to S3.

        Args:
            local_path: Path to local file
            s3_key: S3 key for the object

        Returns:
            S3 URI of uploaded object
        """
        self.client.upload_file(str(local_path), self.bucket_name, s3_key)
        return f"s3://{self.bucket_name}/{s3_key}"

    def download_file(self, s3_key: str, local_path: Path | str) -> Path:
        """
        Download a file from S3.

        Args:
            s3_key: S3 key of the object
            local_path: Local path to save file

        Returns:
            Path to downloaded file
        """
        local = Path(local_path)
        local.parent.mkdir(parents=True, exist_ok=True)
        self.client.download_file(self.bucket_name, s3_key, str(local))
        return local

    def generate_presigned_url(
        self, s3_key: str, expires_in: int = 3600
    ) -> str:
        """
        Generate a presigned URL for downloading.

        Args:
            s3_key: S3 key of the object
            expires_in: URL expiration in seconds (default 1 hour)

        Returns:
            Presigned URL string
        """
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket_name, "Key": s3_key},
            ExpiresIn=expires_in
        )

    def delete_object(self, s3_key: str) -> None:
        """
        Delete an object from S3.

        Args:
            s3_key: S3 key of the object to delete
        """
        self.client.delete_object(Bucket=self.bucket_name, Key=s3_key)
```

**Step 4: Run tests to verify they pass**

```bash
cd backend/packages/app && uv run pytest tests/test_storage.py -v
```

Expected: PASS

**Step 5: Commit**

```bash
git add backend/packages/app/src/app/storage.py backend/packages/app/tests/test_storage.py
git commit -m "feat(app): add s3 storage module with tests"
```

---

## Task 7: Update Config for S3 Settings

**Files:**
- Modify: `backend/packages/app/src/app/config.py`

**Step 1: Add S3 configuration fields**

Update config.py to include:
- `aws_region: str = "us-east-1"`
- `s3_bucket_name: str | None = None`
- Method to get S3Storage instance

```python
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

    # AWS Settings
    aws_region: str = "us-east-1"
    s3_bucket_name: str | None = None

    # Paths (local fallback for development)
    data_dir: Path = Path("./data")

    # Derived paths (for local development)
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

    @property
    def use_s3(self) -> bool:
        """Check if S3 storage is configured."""
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
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/config.py
git commit -m "feat(app): add s3 configuration to settings"
```

---

## Task 8: Update Images Stage for S3

**Files:**
- Modify: `backend/packages/app/src/app/stages/images.py`

**Step 1: Update images.py to upload to S3 when configured**

Key changes:
1. Accept `user_id` parameter
2. Write to temp file first
3. Upload to S3 if configured
4. Return S3 key or presigned URL instead of local path

```python
"""Stage 3: Generate images for each scene using DALL-E 3."""

import tempfile
from pathlib import Path

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
    user_id: str | None = None,
) -> ImageResult:
    """
    Generate images for each scene in the story.

    Args:
        story: The story script with scenes
        drawing: Original drawing analysis (for character description)
        style: Visual style to use
        run_id: Unique run identifier
        user_id: User identifier for S3 path (Cognito sub)

    Returns:
        ImageResult with paths/URLs to generated images
    """
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.openai_api_key)
    storage = settings.get_storage()

    # Ensure local output directory exists (for temp files or local dev)
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

        # Download the image
        image_url = response.data[0].url
        filename = f"{run_id}_scene_{scene.number}.png"

        async with httpx.AsyncClient() as http_client:
            img_response = await http_client.get(image_url)
            image_bytes = img_response.content

        # Upload to S3 or save locally
        if storage:
            s3_key = storage.build_s3_key(user_id, "images", filename)
            storage.upload_bytes(image_bytes, s3_key)
            # Return presigned URL for access
            path_or_url = storage.generate_presigned_url(s3_key)
        else:
            # Local development fallback
            image_path = settings.images_dir / filename
            async with aiofiles.open(image_path, "wb") as f:
                await f.write(image_bytes)
            path_or_url = str(image_path)

        images.append(GeneratedImage(
            scene_number=scene.number,
            path=path_or_url,
        ))

    return ImageResult(images=images)
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/stages/images.py
git commit -m "feat(app): update images stage for s3 support"
```

---

## Task 9: Update Voice Stage for S3

**Files:**
- Modify: `backend/packages/app/src/app/stages/voice.py`

**Step 1: Update voice.py to upload to S3 when configured**

```python
"""Stage 4: Generate voice narration using ElevenLabs."""

import io
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
VOICE_IDS = {
    VoiceType.GENTLE: "EXAVITQu4vr4xnSDxMaL",  # Rachel - warm, calm
    VoiceType.CHEERFUL: "TxGEqnHWrfWFTfGW9XjX",  # Josh - playful
}


async def generate_audio(
    story: StoryScript,
    voice_type: VoiceType,
    run_id: str,
    user_id: str | None = None,
) -> AudioResult:
    """
    Generate audio narration for each scene.

    Args:
        story: The story script with scenes
        voice_type: Type of narrator voice
        run_id: Unique run identifier
        user_id: User identifier for S3 path (Cognito sub)

    Returns:
        AudioResult with paths/URLs to audio files and durations
    """
    settings = get_settings()
    client = AsyncElevenLabs(api_key=settings.elevenlabs_api_key)
    storage = settings.get_storage()

    # Ensure local output directory exists
    settings.audio_dir.mkdir(parents=True, exist_ok=True)

    audio_files = []
    total_duration = 0.0
    voice_id = VOICE_IDS[voice_type]

    for scene in story.scenes:
        filename = f"{run_id}_scene_{scene.number}.mp3"

        # Generate the audio (returns async generator)
        audio_generator = client.text_to_speech.convert(
            voice_id=voice_id,
            text=scene.text,
            model_id="eleven_turbo_v2_5",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.75,
            ),
        )

        # Collect audio bytes
        audio_buffer = io.BytesIO()
        async for chunk in audio_generator:
            audio_buffer.write(chunk)
        audio_bytes = audio_buffer.getvalue()

        # Upload to S3 or save locally
        if storage:
            s3_key = storage.build_s3_key(user_id, "audio", filename)
            storage.upload_bytes(audio_bytes, s3_key)
            path_or_url = storage.generate_presigned_url(s3_key)
        else:
            # Local development fallback
            audio_path = settings.audio_dir / filename
            async with aiofiles.open(audio_path, "wb") as f:
                await f.write(audio_bytes)
            path_or_url = str(audio_path)

        # Get duration (approximate based on text length, ~150 words/min)
        word_count = len(scene.text.split())
        duration_sec = (word_count / 150) * 60

        audio_files.append(GeneratedAudio(
            scene_number=scene.number,
            path=path_or_url,
            duration_sec=duration_sec,
        ))
        total_duration += duration_sec

    return AudioResult(
        audio_files=audio_files,
        total_duration_sec=total_duration,
    )
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/stages/voice.py
git commit -m "feat(app): update voice stage for s3 support"
```

---

## Task 10: Update Video Stage for S3

**Files:**
- Modify: `backend/packages/app/src/app/stages/video.py`

**Step 1: Update video.py to upload final video to S3**

This is the most complex update - video assembly still needs local temp files for FFmpeg, but the final output goes to S3.

```python
"""Stage 5: Assemble final video using FFmpeg."""

import subprocess
import tempfile
from pathlib import Path
import httpx

from app.models import (
    ImageResult,
    AudioResult,
    VideoResult,
)
from app.config import get_settings


async def assemble_video(
    images: ImageResult,
    audio: AudioResult,
    run_id: str,
    user_id: str | None = None,
    music_track: str | None = None,
) -> VideoResult:
    """
    Assemble images and audio into final video.

    Args:
        images: Generated images from Stage 3
        audio: Generated audio from Stage 4
        run_id: Unique run identifier
        user_id: User identifier for S3 path (Cognito sub)
        music_track: Optional path to background music

    Returns:
        VideoResult with path/URL to final video
    """
    settings = get_settings()
    storage = settings.get_storage()

    # Ensure output directory exists
    settings.videos_dir.mkdir(parents=True, exist_ok=True)

    # Create temp directory for working files
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        # Download images and audio from URLs/S3 to temp files
        local_images = []
        local_audio = []

        async with httpx.AsyncClient() as http_client:
            # Download images
            for i, img in enumerate(images.images):
                local_img = temp_path / f"image_{i}.png"
                if img.path.startswith("http"):
                    response = await http_client.get(img.path)
                    local_img.write_bytes(response.content)
                else:
                    # Local path
                    local_img = Path(img.path)
                local_images.append(local_img)

            # Download audio
            for i, aud in enumerate(audio.audio_files):
                local_aud = temp_path / f"audio_{i}.mp3"
                if aud.path.startswith("http"):
                    response = await http_client.get(aud.path)
                    local_aud.write_bytes(response.content)
                else:
                    # Local path
                    local_aud = Path(aud.path)
                local_audio.append(local_aud)

        # Create concat file for images with durations
        concat_file = temp_path / "images.txt"
        with open(concat_file, "w") as f:
            for img, aud in zip(local_images, audio.audio_files):
                f.write(f"file '{img.resolve()}'\n")
                f.write(f"duration {aud.duration_sec}\n")
            # Add last image again (FFmpeg concat requirement)
            if local_images:
                f.write(f"file '{local_images[-1].resolve()}'\n")

        # Concatenate all audio files
        audio_concat_file = temp_path / "audio.txt"
        with open(audio_concat_file, "w") as f:
            for aud_path in local_audio:
                f.write(f"file '{aud_path.resolve()}'\n")

        # Merge audio files
        merged_audio = temp_path / "merged.mp3"
        subprocess.run([
            'ffmpeg', '-y', '-f', 'concat', '-safe', '0',
            '-i', str(audio_concat_file),
            '-c', 'copy', str(merged_audio)
        ], check=True, capture_output=True)

        # Build output path
        output_file = temp_path / f"{run_id}_final.mp4"

        # Build FFmpeg command
        if music_track and Path(music_track).exists():
            # With background music at 15% volume
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0', '-i', str(concat_file),
                '-i', str(merged_audio),
                '-i', music_track,
                '-filter_complex', '[1:a][2:a]amix=inputs=2:duration=first:weights=1 0.15[a]',
                '-map', '0:v', '-map', '[a]',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k',
                '-shortest',
                str(output_file)
            ]
        else:
            # Without background music
            cmd = [
                'ffmpeg', '-y',
                '-f', 'concat', '-safe', '0', '-i', str(concat_file),
                '-i', str(merged_audio),
                '-map', '0:v', '-map', '1:a',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '128k',
                '-shortest',
                str(output_file)
            ]

        # Run FFmpeg
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"FFmpeg failed: {result.stderr}")

        # Get video duration
        probe_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', str(output_file)
        ]
        probe_result = subprocess.run(probe_cmd, capture_output=True, text=True)
        duration = float(probe_result.stdout.strip()) if probe_result.stdout.strip() else audio.total_duration_sec

        # Upload to S3 or copy to local output
        if storage:
            filename = f"{run_id}_final.mp4"
            s3_key = storage.build_s3_key(user_id, "videos", filename)
            storage.upload_file(output_file, s3_key)
            path_or_url = storage.generate_presigned_url(s3_key, expires_in=86400)  # 24 hours
        else:
            # Local development fallback
            final_path = settings.videos_dir / f"{run_id}_final.mp4"
            output_file.rename(final_path)
            path_or_url = str(final_path)

    return VideoResult(
        video_path=path_or_url,
        duration_sec=duration,
    )
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/stages/video.py
git commit -m "feat(app): update video stage for s3 support"
```

---

## Task 11: Update API Endpoints for user_id

**Files:**
- Modify: `backend/packages/app/src/app/models.py`
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add user_id to request models**

Add `user_id: str | None = None` to ImagesRequest, VoiceRequest, and VideoRequest.

**Step 2: Update main.py endpoints to pass user_id**

Update the three endpoints to pass request.user_id to the stage functions.

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/models.py backend/packages/app/src/app/main.py
git commit -m "feat(app): add user_id parameter to api endpoints"
```

---

## Task 12: Add .gitignore for Terraform

**Files:**
- Create: `infrastructure/.gitignore`

**Step 1: Create infrastructure .gitignore**

```
# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
terraform.tfvars
*.tfvars
!terraform.tfvars.example

# IDE
.idea/
*.swp
*.swo
```

**Step 2: Commit**

```bash
git add infrastructure/.gitignore
git commit -m "chore(infra): add terraform gitignore"
```

---

## Task 13: Final Integration Test

**Step 1: Validate Terraform configuration**

```bash
cd infrastructure && terraform init && terraform validate
```

Expected: "Success! The configuration is valid."

**Step 2: Build Docker image locally**

```bash
cd backend/packages/app && docker build -t nocomeleon-app .
```

Expected: Build completes successfully

**Step 3: Commit any final changes and push**

```bash
git push origin HEAD
```

---

## Deployment Checklist (Manual Steps After Implementation)

1. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in values
2. Run `terraform apply` to create infrastructure
3. Add API keys to Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value --secret-id nocomeleon/openai-api-key --secret-string "your-openai-key"
   aws secretsmanager put-secret-value --secret-id nocomeleon/elevenlabs-api-key --secret-string "your-elevenlabs-key"
   ```
4. Build and push Docker image:
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin <ecr-url>
   docker build -t nocomeleon-app backend/packages/app/
   docker tag nocomeleon-app:latest <ecr-url>:latest
   docker push <ecr-url>:latest
   ```
5. Force new deployment:
   ```bash
   aws ecs update-service --cluster nocomeleon-cluster --service nocomeleon-service --force-new-deployment
   ```
6. Get ALB URL from Terraform outputs:
   ```bash
   terraform output alb_url
   ```
