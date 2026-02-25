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

### Files to Modify

- `infrastructure/main.tf` - Add Cognito resources
- `infrastructure/outputs.tf` - Add Cognito outputs
