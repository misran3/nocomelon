# Backend-UI Integration Design

> **Date**: 2026-02-25
> **Status**: Approved

## Problem

Frontend uses mock data with `setTimeout` to simulate API calls. Need to connect to real FastAPI backend and add Cognito authentication.

## Solution Overview

1. Create API client module for typed backend calls
2. Add new orchestrated pipeline endpoint for video generation
3. Return S3 keys (not presigned URLs) for Amplify Storage access
4. Add Cognito email/password auth with custom sign-in page

---

## Architecture

### API Flow

```
Frontend                          Backend
────────                          ───────
/recognize page
  └─> api.analyzeDrawing()  ───>  POST /api/v1/vision/analyze
                                    └─> returns run_id + DrawingAnalysis

/script page
  └─> api.generateStory()   ───>  POST /api/v1/story/generate
                                    └─> returns StoryScript

/preview page
  └─> api.generateVideo()   ───>  POST /api/v1/pipeline/generate  [NEW]
                                    └─> runs images → voice → video
                                    └─> returns VideoResult
```

### S3 Key Structure

```
<cognito-sub>/images/<run_id>_scene_<n>.png
<cognito-sub>/audio/<run_id>_scene_<n>.mp3
<cognito-sub>/videos/<run_id>_final.mp4
```

Frontend uses Amplify Storage `getUrl()` with Cognito credentials to access S3.

### Auth Flow

```
┌─────────────┐     Not authenticated     ┌─────────────┐
│  Any Route  │ ─────────────────────────>│  /sign-in   │
└─────────────┘                           └─────────────┘
                                                 │
                                          Amplify signIn()
                                                 │
                                                 ▼
                                          ┌─────────────┐
                                          │  /upload    │
                                          └─────────────┘
```

- All routes protected except `/sign-in`
- Sign-in only (manual account creation via AWS Console)
- Custom sign-in page (no Amplify hosted UI)

---

## Backend Changes

### New DynamoDB Module

```python
# app/database.py
import boto3
from functools import lru_cache
from datetime import datetime, timezone
from app.config import get_settings


class Database:
    def __init__(self):
        settings = get_settings()
        self.dynamodb = boto3.resource('dynamodb', region_name=settings.aws_region)
        self.library_table = self.dynamodb.Table(settings.library_table_name)
        self.checkpoints_table = self.dynamodb.Table(settings.checkpoints_table_name)

    # Library methods
    def get_library(self, user_id: str) -> list[dict]:
        response = self.library_table.query(
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": user_id}
        )
        return response.get("Items", [])

    def save_storybook(self, user_id: str, entry: dict) -> None:
        self.library_table.put_item(Item={"user_id": user_id, **entry})

    def delete_storybook(self, user_id: str, id: str) -> None:
        self.library_table.delete_item(Key={"user_id": user_id, "id": id})

    # Checkpoint methods
    def get_checkpoint(self, user_id: str, run_id: str) -> dict | None:
        response = self.checkpoints_table.get_item(
            Key={"user_id": user_id, "run_id": run_id}
        )
        return response.get("Item")

    def save_checkpoint(self, user_id: str, run_id: str, data: dict) -> None:
        ttl = int((datetime.now(timezone.utc).timestamp()) + 7 * 24 * 3600)
        self.checkpoints_table.put_item(Item={
            "user_id": user_id,
            "run_id": run_id,
            "ttl": ttl,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            **data
        })


@lru_cache
def get_database() -> Database:
    """Get cached Database instance (singleton)."""
    return Database()
```

### New Config Variables

```python
# app/config.py (additions)
library_table_name: str = "nocomeleon-library"
checkpoints_table_name: str = "nocomeleon-checkpoints"
```

### New Endpoint

`POST /api/v1/pipeline/generate`

Orchestrates: images → voice → video in a single call.

**Request:**
```python
class PipelineRequest(BaseModel):
    run_id: str
    story: StoryScript
    drawing: DrawingAnalysis
    style: Style
    voice_type: VoiceType
    user_id: str | None = None
```

**Response:**
```python
class PipelineResponse(BaseModel):
    video: VideoResult
    images: list[GeneratedImage]
```

### Library Endpoints

```python
from app.database import get_database

@app.get("/api/v1/library", response_model=list[LibraryEntry])
async def get_library(user_id: str):
    """Get user's saved storybooks."""
    db = get_database()
    return db.get_library(user_id)

@app.post("/api/v1/library", response_model=LibraryEntry)
async def save_to_library(entry: LibraryEntry, user_id: str):
    """Save storybook to library."""
    db = get_database()
    db.save_storybook(user_id, entry.model_dump())
    return entry

@app.delete("/api/v1/library/{id}")
async def delete_from_library(id: str, user_id: str):
    """Delete storybook from library."""
    db = get_database()
    db.delete_storybook(user_id, id)
    return {"status": "deleted"}
```

### Response Model Updates

Return S3 keys instead of presigned URLs:

```python
# Before
class VideoResult(BaseModel):
    video_path: str          # presigned URL
    duration_sec: float

# After
class VideoResult(BaseModel):
    video_key: str           # S3 key: "<user_id>/videos/<filename>"
    duration_sec: float
    thumbnail_key: str

class GeneratedImage(BaseModel):
    scene_number: int
    key: str                 # S3 key (was: path)

class GeneratedAudio(BaseModel):
    scene_number: int
    key: str                 # S3 key (was: path)
    duration_sec: float
```

---

## Frontend Changes

### New Files

```
frontend/src/
├── api/
│   ├── client.ts           # Base fetch wrapper, VITE_API_URL
│   ├── vision.ts           # analyzeDrawing(imageBase64)
│   ├── story.ts            # generateStory(request)
│   ├── pipeline.ts         # generateVideo(request)
│   └── index.ts            # Re-exports
├── lib/
│   ├── amplify.ts          # Amplify configuration
│   └── storage.ts          # getS3Url(key) wrapper
├── pages/
│   └── sign-in.tsx         # Custom sign-in form
└── components/auth/
    └── AuthGuard.tsx       # Redirects if not authenticated
```

### Type Updates

```typescript
// Before
export interface VideoResult {
  video_path: string;
  duration_sec: number;
  thumbnail: string;
}

// After
export interface VideoResult {
  video_key: string;
  duration_sec: number;
  thumbnail_key: string;
}

export interface GeneratedImage {
  scene_number: number;
  key: string;
}

export interface PipelineRequest {
  run_id: string;
  story: StoryScript;
  drawing: DrawingAnalysis;
  style: Style;
  voice_type: VoiceType;
  user_id?: string;
}

export interface PipelineResponse {
  video: VideoResult;
  images: GeneratedImage[];
}
```

### Environment Variables

```
VITE_API_URL=http://localhost:8000
```

### Loading States

Simple spinner for all API calls. No complex progress tracking.

---

## Configuration

### Amplify Config (frontend)

```typescript
// lib/amplify.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
    }
  },
  Storage: {
    S3: {
      bucket: import.meta.env.VITE_S3_BUCKET,
      region: import.meta.env.VITE_AWS_REGION,
    }
  }
});
```

### New Environment Variables

```
VITE_API_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_S3_BUCKET=nocomelon-assets
VITE_AWS_REGION=us-east-1
```

---

## Files to Modify

### Backend
- `app/main.py` - Add pipeline endpoint
- `app/models.py` - Update response models (path → key)
- `app/stages/images.py` - Return S3 key instead of presigned URL
- `app/stages/voice.py` - Return S3 key instead of presigned URL
- `app/stages/video.py` - Return S3 key instead of presigned URL

### Frontend
- `src/types/index.ts` - Update types
- `src/pages/recognize.tsx` - Call real API
- `src/pages/script.tsx` - Call real API (story generation)
- `src/pages/preview.tsx` - Call real API (pipeline)
- `src/App.tsx` - Add AuthGuard, sign-in route
- `src/lib/mock-data.ts` - Keep for fallback/testing only

---

## Infrastructure Changes (Terraform)

### New Cognito Resources

Add to `infrastructure/main.tf`:

```hcl
# ------------------------------------------------------------------------------
# Cognito User Pool
# ------------------------------------------------------------------------------
resource "aws_cognito_user_pool" "main" {
  name = "${var.app_name}-users"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = false
    require_uppercase = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }
}

# ------------------------------------------------------------------------------
# Cognito App Client (no secret for SPA)
# ------------------------------------------------------------------------------
resource "aws_cognito_user_pool_client" "app" {
  name         = "${var.app_name}-app"
  user_pool_id = aws_cognito_user_pool.main.id

  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  generate_secret = false
}

# ------------------------------------------------------------------------------
# Cognito Identity Pool (for S3 access via Amplify)
# ------------------------------------------------------------------------------
resource "aws_cognito_identity_pool" "main" {
  identity_pool_name               = "${var.app_name}-identity"
  allow_unauthenticated_identities = false

  cognito_identity_providers {
    client_id               = aws_cognito_user_pool_client.app.id
    provider_name           = aws_cognito_user_pool.main.endpoint
    server_side_token_check = false
  }
}

# ------------------------------------------------------------------------------
# IAM Role for Cognito Authenticated Users
# ------------------------------------------------------------------------------
resource "aws_iam_role" "cognito_authenticated" {
  name = "${var.app_name}-cognito-authenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = "cognito-identity.amazonaws.com"
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "cognito-identity.amazonaws.com:aud" = aws_cognito_identity_pool.main.id
        }
        "ForAnyValue:StringLike" = {
          "cognito-identity.amazonaws.com:amr" = "authenticated"
        }
      }
    }]
  })
}

# S3 access scoped to user's prefix
resource "aws_iam_role_policy" "cognito_s3_access" {
  name = "${var.app_name}-cognito-s3"
  role = aws_iam_role.cognito_authenticated.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.assets.arn}/$${cognito-identity.amazonaws.com:sub}/*"
      },
      {
        Effect = "Allow"
        Action = "s3:ListBucket"
        Resource = aws_s3_bucket.assets.arn
        Condition = {
          StringLike = {
            "s3:prefix" = "$${cognito-identity.amazonaws.com:sub}/*"
          }
        }
      }
    ]
  })
}

# Attach role to identity pool
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.cognito_authenticated.arn
  }
}
```

### New Outputs

Add to `infrastructure/outputs.tf`:

```hcl
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  description = "Cognito App Client ID"
  value       = aws_cognito_user_pool_client.app.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.main.id
}
```

### DynamoDB Tables

```hcl
# ------------------------------------------------------------------------------
# DynamoDB - Library Table
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "library" {
  name         = "${var.app_name}-library"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "id"
    type = "S"
  }
}

# ------------------------------------------------------------------------------
# DynamoDB - Checkpoints Table
# ------------------------------------------------------------------------------
resource "aws_dynamodb_table" "checkpoints" {
  name         = "${var.app_name}-checkpoints"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"
  range_key    = "run_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "run_id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}
```

**Library Table Schema:**
| Attribute | Type | Description |
|-----------|------|-------------|
| user_id (PK) | String | Cognito sub |
| id (SK) | String | Storybook UUID |
| title | String | Story title |
| thumbnail_key | String | S3 key |
| video_key | String | S3 key |
| duration_sec | Number | Video duration |
| style | String | storybook/watercolor |
| created_at | String | ISO timestamp |

**Checkpoints Table Schema:**
| Attribute | Type | Description |
|-----------|------|-------------|
| user_id (PK) | String | Cognito sub |
| run_id (SK) | String | Pipeline run ID |
| current_stage | String | vision/story/images/voice/video/complete |
| drawing_analysis | Map | JSON |
| story_script | Map | JSON |
| image_result | Map | JSON |
| audio_result | Map | JSON |
| video_result | Map | JSON |
| error | String | Error message (nullable) |
| created_at | String | ISO timestamp |
| updated_at | String | ISO timestamp |
| ttl | Number | Unix timestamp for auto-delete (7 days) |

### ECS Task DynamoDB Access

Add to `aws_iam_role_policy.ecs_task_s3`:

```hcl
resource "aws_iam_role_policy" "ecs_task_dynamodb" {
  name = "${var.app_name}-dynamodb-access"
  role = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ]
      Resource = [
        aws_dynamodb_table.library.arn,
        aws_dynamodb_table.checkpoints.arn
      ]
    }]
  })
}
```

### New Outputs

Add to `infrastructure/outputs.tf`:

```hcl
output "dynamodb_library_table" {
  description = "DynamoDB Library table name"
  value       = aws_dynamodb_table.library.name
}

output "dynamodb_checkpoints_table" {
  description = "DynamoDB Checkpoints table name"
  value       = aws_dynamodb_table.checkpoints.name
}
```

### Files to Modify

- `infrastructure/main.tf` - Add Cognito resources, DynamoDB tables
- `infrastructure/outputs.tf` - Add Cognito and DynamoDB outputs
