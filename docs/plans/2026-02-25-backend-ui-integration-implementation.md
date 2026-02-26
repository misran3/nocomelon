# Backend-UI Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect frontend to backend APIs with Cognito auth and DynamoDB persistence.

**Architecture:** Phased rollout - infrastructure first, then auth, then API integration. Each phase is independently testable before proceeding.

**Tech Stack:** Terraform, AWS Cognito, DynamoDB, FastAPI, React, AWS Amplify

---

## Phase 1: Infrastructure (Terraform)

**Manual Test:** Verify resources exist in AWS Console after `terraform apply`

---

### Task 1.1: Add Cognito User Pool

**Files:**
- Modify: `infrastructure/main.tf`

**Step 1: Add Cognito User Pool resource**

Add after the CloudWatch Logs section (~line 83):

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
```

**Step 2: Add Cognito App Client**

```hcl
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
```

**Step 3: Commit**

```bash
git add infrastructure/main.tf
git commit -m "infra: add Cognito User Pool and App Client"
```

---

### Task 1.2: Add Cognito Identity Pool

**Files:**
- Modify: `infrastructure/main.tf`

**Step 1: Add Identity Pool resource**

```hcl
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
```

**Step 2: Add IAM Role for authenticated users**

```hcl
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
```

**Step 3: Add S3 access policy scoped to user prefix**

```hcl
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
        Effect   = "Allow"
        Action   = "s3:ListBucket"
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
```

**Step 4: Attach role to Identity Pool**

```hcl
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated" = aws_iam_role.cognito_authenticated.arn
  }
}
```

**Step 5: Commit**

```bash
git add infrastructure/main.tf
git commit -m "infra: add Cognito Identity Pool with S3 access"
```

---

### Task 1.3: Add DynamoDB Tables

**Files:**
- Modify: `infrastructure/main.tf`

**Step 1: Add Library table**

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
```

**Step 2: Add Checkpoints table**

```hcl
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

**Step 3: Add ECS task DynamoDB access policy**

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

**Step 4: Commit**

```bash
git add infrastructure/main.tf
git commit -m "infra: add DynamoDB tables for library and checkpoints"
```

---

### Task 1.4: Add Terraform Outputs

**Files:**
- Modify: `infrastructure/outputs.tf`

**Step 1: Add Cognito outputs**

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

**Step 2: Add DynamoDB outputs**

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

**Step 3: Commit**

```bash
git add infrastructure/outputs.tf
git commit -m "infra: add Cognito and DynamoDB outputs"
```

---

### Task 1.5: Apply Terraform

**Step 1: Validate Terraform**

Run: `cd infrastructure && terraform validate`
Expected: Success

**Step 2: Plan changes**

Run: `terraform plan`
Expected: Shows new resources to create (Cognito, DynamoDB)

**Step 3: Apply changes**

Run: `terraform apply`
Expected: Resources created successfully

**Step 4: Note output values**

Run: `terraform output`
Expected: Shows cognito_user_pool_id, cognito_client_id, etc.

Save these values for Phase 2.

---

### Phase 1 Manual Test

1. Open AWS Console → Cognito → User Pools → Verify `nocomeleon-users` exists
2. Open AWS Console → Cognito → Identity Pools → Verify `nocomeleon-identity` exists
3. Open AWS Console → DynamoDB → Tables → Verify `nocomeleon-library` and `nocomeleon-checkpoints` exist
4. Create a test user manually in Cognito User Pool (for Phase 2 testing)

---

## Phase 2: Frontend Auth (Amplify)

**Manual Test:** Sign in with test user, verify auth state, sign out

---

### Task 2.1: Install Amplify Dependencies

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install Amplify packages**

Run: `cd frontend && npm install aws-amplify`

**Step 2: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add aws-amplify dependency"
```

---

### Task 2.2: Add Amplify Configuration

**Files:**
- Create: `frontend/src/lib/amplify.ts`
- Modify: `frontend/src/main.tsx`

**Step 1: Create Amplify config file**

```typescript
// frontend/src/lib/amplify.ts
import { Amplify } from 'aws-amplify';

export function configureAmplify() {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
        identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      }
    },
    Storage: {
      S3: {
        bucket: import.meta.env.VITE_S3_BUCKET,
        region: import.meta.env.VITE_AWS_REGION,
      }
    }
  });
}
```

**Step 2: Update main.tsx to configure Amplify**

At the top of `frontend/src/main.tsx`, add:

```typescript
import { configureAmplify } from './lib/amplify';

configureAmplify();
```

**Step 3: Create .env.example**

Create `frontend/.env.example`:

```
VITE_API_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_COGNITO_IDENTITY_POOL_ID=us-east-1:xxxxx
VITE_S3_BUCKET=nocomeleon-assets-xxxxx
VITE_AWS_REGION=us-east-1
```

**Step 4: Create actual .env.local with Terraform output values**

Create `frontend/.env.local` with actual values from `terraform output`.

**Step 5: Add .env.local to .gitignore if not already**

**Step 6: Commit**

```bash
git add frontend/src/lib/amplify.ts frontend/src/main.tsx frontend/.env.example
git commit -m "feat: add Amplify configuration"
```

---

### Task 2.3: Create Auth Context

**Files:**
- Create: `frontend/src/hooks/use-auth.tsx`

**Step 1: Create auth hook with context**

```typescript
// frontend/src/hooks/use-auth.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentUser, signIn, signOut, AuthUser } from 'aws-amplify/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/use-auth.tsx
git commit -m "feat: add auth context and useAuth hook"
```

---

### Task 2.4: Create AuthGuard Component

**Files:**
- Create: `frontend/src/components/auth/AuthGuard.tsx`

**Step 1: Create AuthGuard**

```typescript
// frontend/src/components/auth/AuthGuard.tsx
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../hooks/use-auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/auth/AuthGuard.tsx
git commit -m "feat: add AuthGuard component"
```

---

### Task 2.5: Create Sign-In Page

**Files:**
- Create: `frontend/src/pages/sign-in.tsx`

**Step 1: Create sign-in page**

```typescript
// frontend/src/pages/sign-in.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../hooks/use-auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/upload';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Sign in failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary">NoComelon</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/sign-in.tsx
git commit -m "feat: add sign-in page"
```

---

### Task 2.6: Wire Up Auth in App

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: Import new components**

Add imports at top:

```typescript
import { AuthProvider } from './hooks/use-auth';
import { AuthGuard } from './components/auth/AuthGuard';
const SignInPage = lazy(() => import('./pages/sign-in'));
```

**Step 2: Update App component**

Wrap with AuthProvider and add AuthGuard:

```typescript
export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route
            path="/*"
            element={
              <AuthGuard>
                <WizardProvider>
                  <Routes>
                    <Route path="/" element={<Navigate to="/upload" replace />} />
                    <Route path="/upload" element={<UploadPage />} />
                    <Route path="/recognize" element={<RecognizePage />} />
                    <Route path="/customize" element={<CustomizePage />} />
                    <Route path="/script" element={<ScriptPage />} />
                    <Route path="/preview" element={<PreviewPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </WizardProvider>
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
```

**Step 3: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: wire up auth provider and guards"
```

---

### Task 2.7: Add Sign Out to Header

**Files:**
- Modify: `frontend/src/components/layout/AppHeader.tsx`

**Step 1: Update sign out handler**

Replace the mock `handleSignOut` with real logout:

```typescript
import { useAuth } from '../../hooks/use-auth';
import { useNavigate } from 'react-router';

// Inside component:
const { logout } = useAuth();
const navigate = useNavigate();

const handleSignOut = async () => {
  await logout();
  navigate('/sign-in');
};
```

**Step 2: Commit**

```bash
git add frontend/src/components/layout/AppHeader.tsx
git commit -m "feat: wire up real sign out in header"
```

---

### Phase 2 Manual Test

1. Run: `cd frontend && npm run dev`
2. Open http://localhost:5173
3. Verify: Redirected to /sign-in
4. Enter test user credentials (created in Phase 1)
5. Verify: Redirected to /upload after successful login
6. Click Sign Out in header
7. Verify: Redirected back to /sign-in
8. Try accessing /upload directly while signed out
9. Verify: Redirected to /sign-in

---

## Phase 3: Backend API Changes

**Manual Test:** Test endpoints with curl/Postman

---

### Task 3.1: Add Database Module

**Files:**
- Create: `backend/packages/app/src/app/database.py`

**Step 1: Create database module**

```python
# backend/packages/app/src/app/database.py
"""DynamoDB database abstraction."""

import boto3
from functools import lru_cache
from datetime import datetime, timezone
from typing import Any

from app.config import get_settings


class Database:
    """DynamoDB client for library and checkpoints."""

    def __init__(self) -> None:
        settings = get_settings()
        self.dynamodb = boto3.resource("dynamodb", region_name=settings.aws_region)
        self.library_table = self.dynamodb.Table(settings.library_table_name)
        self.checkpoints_table = self.dynamodb.Table(settings.checkpoints_table_name)

    # Library methods
    def get_library(self, user_id: str) -> list[dict[str, Any]]:
        """Get all storybooks for a user."""
        response = self.library_table.query(
            KeyConditionExpression="user_id = :uid",
            ExpressionAttributeValues={":uid": user_id},
        )
        return response.get("Items", [])

    def get_storybook(self, user_id: str, storybook_id: str) -> dict[str, Any] | None:
        """Get a single storybook."""
        response = self.library_table.get_item(
            Key={"user_id": user_id, "id": storybook_id}
        )
        return response.get("Item")

    def save_storybook(self, user_id: str, entry: dict[str, Any]) -> None:
        """Save a storybook to the library."""
        self.library_table.put_item(Item={"user_id": user_id, **entry})

    def delete_storybook(self, user_id: str, storybook_id: str) -> None:
        """Delete a storybook from the library."""
        self.library_table.delete_item(Key={"user_id": user_id, "id": storybook_id})

    # Checkpoint methods
    def get_checkpoint(self, user_id: str, run_id: str) -> dict[str, Any] | None:
        """Get a pipeline checkpoint."""
        response = self.checkpoints_table.get_item(
            Key={"user_id": user_id, "run_id": run_id}
        )
        return response.get("Item")

    def save_checkpoint(self, user_id: str, run_id: str, data: dict[str, Any]) -> None:
        """Save a pipeline checkpoint with 7-day TTL."""
        ttl = int(datetime.now(timezone.utc).timestamp() + 7 * 24 * 3600)
        self.checkpoints_table.put_item(
            Item={
                "user_id": user_id,
                "run_id": run_id,
                "ttl": ttl,
                "updated_at": datetime.now(timezone.utc).isoformat(),
                **data,
            }
        )

    def delete_checkpoint(self, user_id: str, run_id: str) -> None:
        """Delete a pipeline checkpoint."""
        self.checkpoints_table.delete_item(Key={"user_id": user_id, "run_id": run_id})


@lru_cache
def get_database() -> Database:
    """Get cached Database instance (singleton)."""
    return Database()
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/database.py
git commit -m "feat: add DynamoDB database module"
```

---

### Task 3.2: Update Config for DynamoDB

**Files:**
- Modify: `backend/packages/app/src/app/config.py`

**Step 1: Add DynamoDB table name settings**

Add to Settings class:

```python
# DynamoDB Tables
library_table_name: str = "nocomeleon-library"
checkpoints_table_name: str = "nocomeleon-checkpoints"
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/config.py
git commit -m "feat: add DynamoDB table config"
```

---

### Task 3.3: Update Models for S3 Keys

**Files:**
- Modify: `backend/packages/app/src/app/models.py`

**Step 1: Update GeneratedImage**

Change `path` to `key`:

```python
class GeneratedImage(BaseModel):
    """A generated image for a scene."""
    scene_number: int
    key: str  # S3 key
```

**Step 2: Update GeneratedAudio**

Change `path` to `key`:

```python
class GeneratedAudio(BaseModel):
    """Generated audio for a scene."""
    scene_number: int
    key: str  # S3 key
    duration_sec: float
```

**Step 3: Update VideoResult**

Change `video_path` to `video_key`, add `thumbnail_key`:

```python
class VideoResult(BaseModel):
    """Result of video assembly stage."""
    video_key: str  # S3 key
    duration_sec: float
    thumbnail_key: str  # S3 key
```

**Step 4: Add LibraryEntry model**

```python
class LibraryEntry(BaseModel):
    """A saved storybook in the library."""
    id: str
    title: str
    thumbnail_key: str
    video_key: str
    duration_sec: float
    style: Style
    created_at: str
```

**Step 5: Add PipelineRequest and PipelineResponse**

```python
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
```

**Step 6: Commit**

```bash
git add backend/packages/app/src/app/models.py
git commit -m "feat: update models for S3 keys and library"
```

---

### Task 3.4: Update Stages to Return S3 Keys

**Files:**
- Modify: `backend/packages/app/src/app/stages/images.py`
- Modify: `backend/packages/app/src/app/stages/voice.py`
- Modify: `backend/packages/app/src/app/stages/video.py`

**Step 1: Update images.py**

Change line ~79-81 from:

```python
s3_key = storage.build_s3_key(user_id, "images", filename)
storage.upload_bytes(image_bytes, s3_key)
image_location = storage.generate_presigned_url(s3_key)
```

To:

```python
s3_key = storage.build_s3_key(user_id, "images", filename)
storage.upload_bytes(image_bytes, s3_key)
image_location = s3_key  # Return key, not presigned URL
```

Also update the GeneratedImage to use `key=` instead of `path=`:

```python
images.append(GeneratedImage(
    scene_number=scene.number,
    key=image_location,
))
```

**Step 2: Update voice.py**

Similar change at line ~73-76:

```python
s3_key = storage.build_s3_key(user_id, "audio", filename)
storage.upload_bytes(audio_bytes, s3_key)
audio_location = s3_key  # Return key, not presigned URL
```

And update GeneratedAudio:

```python
audio_files.append(GeneratedAudio(
    scene_number=scene.number,
    key=audio_location,
    duration_sec=duration_sec,
))
```

**Step 3: Update video.py**

Change line ~161-165:

```python
s3_key = storage.build_s3_key(user_id, "videos", output_filename)
storage.upload_file(str(temp_output_path), s3_key)
video_location = s3_key  # Return key, not presigned URL

# Generate thumbnail
thumbnail_filename = f"{run_id}_thumb.jpg"
thumbnail_key = storage.build_s3_key(user_id, "videos", thumbnail_filename)
# ... generate thumbnail and upload ...
```

Update VideoResult:

```python
return VideoResult(
    video_key=video_location,
    duration_sec=duration,
    thumbnail_key=thumbnail_key,
)
```

**Step 4: Commit**

```bash
git add backend/packages/app/src/app/stages/
git commit -m "feat: return S3 keys instead of presigned URLs"
```

---

### Task 3.5: Add Library Endpoints

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add imports**

```python
from app.database import get_database
from app.models import LibraryEntry
```

**Step 2: Add library endpoints**

```python
@app.get("/api/v1/library", response_model=list[LibraryEntry])
async def api_get_library(user_id: str):
    """Get user's saved storybooks."""
    db = get_database()
    items = db.get_library(user_id)
    return [LibraryEntry(**item) for item in items]


@app.post("/api/v1/library", response_model=LibraryEntry)
async def api_save_to_library(entry: LibraryEntry, user_id: str):
    """Save storybook to library."""
    db = get_database()
    db.save_storybook(user_id, entry.model_dump())
    return entry


@app.delete("/api/v1/library/{storybook_id}")
async def api_delete_from_library(storybook_id: str, user_id: str):
    """Delete storybook from library."""
    db = get_database()
    db.delete_storybook(user_id, storybook_id)
    return {"status": "deleted"}
```

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat: add library CRUD endpoints"
```

---

### Task 3.6: Add Pipeline Endpoint

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add pipeline endpoint**

```python
from app.models import PipelineRequest, PipelineResponse

@app.post("/api/v1/pipeline/generate", response_model=PipelineResponse)
async def api_generate_pipeline(request: PipelineRequest):
    """Run full video generation pipeline (images → voice → video)."""
    db = get_database()
    user_id = request.user_id
    run_id = request.run_id

    try:
        # Stage 3: Generate images
        db.save_checkpoint(user_id, run_id, {"current_stage": "images"})
        image_result = await generate_images(
            story=request.story,
            drawing=request.drawing,
            style=request.style,
            run_id=run_id,
            user_id=user_id,
        )

        # Stage 4: Generate voice
        db.save_checkpoint(user_id, run_id, {
            "current_stage": "voice",
            "image_result": image_result.model_dump(),
        })
        audio_result = await generate_audio(
            story=request.story,
            voice_type=request.voice_type,
            run_id=run_id,
            user_id=user_id,
        )

        # Stage 5: Assemble video
        db.save_checkpoint(user_id, run_id, {
            "current_stage": "video",
            "image_result": image_result.model_dump(),
            "audio_result": audio_result.model_dump(),
        })
        video_result = await assemble_video(
            images=image_result,
            audio=audio_result,
            run_id=run_id,
            user_id=user_id,
        )

        # Mark complete
        db.save_checkpoint(user_id, run_id, {
            "current_stage": "complete",
            "video_result": video_result.model_dump(),
        })

        return PipelineResponse(
            video=video_result,
            images=image_result.images,
        )

    except Exception as e:
        db.save_checkpoint(user_id, run_id, {
            "current_stage": "error",
            "error": str(e),
        })
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat: add orchestrated pipeline endpoint"
```

---

### Phase 3 Manual Test

1. Start backend: `cd backend/packages/app && uv run uvicorn app.main:app --reload`
2. Test health: `curl http://localhost:8000/health`
3. Test library (empty): `curl "http://localhost:8000/api/v1/library?user_id=test"`
4. Verify: Returns `[]`

---

## Phase 4: Frontend API Integration

**Manual Test:** Full flow works with real backend

---

### Task 4.1: Create API Client

**Files:**
- Create: `frontend/src/api/client.ts`

**Step 1: Create base client**

```typescript
// frontend/src/api/client.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new ApiError(response.status, error.detail || 'Request failed');
  }

  return response.json();
}
```

**Step 2: Commit**

```bash
git add frontend/src/api/client.ts
git commit -m "feat: add API client base"
```

---

### Task 4.2: Add API Functions

**Files:**
- Create: `frontend/src/api/vision.ts`
- Create: `frontend/src/api/story.ts`
- Create: `frontend/src/api/pipeline.ts`
- Create: `frontend/src/api/library.ts`
- Create: `frontend/src/api/index.ts`

**Step 1: Create vision.ts**

```typescript
// frontend/src/api/vision.ts
import { apiRequest } from './client';
import { DrawingAnalysis } from '../types';

export interface VisionResponse {
  run_id: string;
  drawing: DrawingAnalysis;
}

export async function analyzeDrawing(imageBase64: string): Promise<VisionResponse> {
  return apiRequest<VisionResponse>('/api/v1/vision/analyze', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}
```

**Step 2: Create story.ts**

```typescript
// frontend/src/api/story.ts
import { apiRequest } from './client';
import { DrawingAnalysis, StoryScript, Theme, VoiceType } from '../types';

export interface StoryRequest {
  drawing: DrawingAnalysis;
  theme: Theme;
  voice_type: VoiceType;
  child_age: number;
  personal_context?: string;
}

export async function generateStory(request: StoryRequest): Promise<StoryScript> {
  return apiRequest<StoryScript>('/api/v1/story/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
```

**Step 3: Create pipeline.ts**

```typescript
// frontend/src/api/pipeline.ts
import { apiRequest } from './client';
import { DrawingAnalysis, StoryScript, Style, VoiceType } from '../types';

export interface PipelineRequest {
  run_id: string;
  story: StoryScript;
  drawing: DrawingAnalysis;
  style: Style;
  voice_type: VoiceType;
  user_id?: string;
}

export interface GeneratedImage {
  scene_number: number;
  key: string;
}

export interface VideoResult {
  video_key: string;
  duration_sec: number;
  thumbnail_key: string;
}

export interface PipelineResponse {
  video: VideoResult;
  images: GeneratedImage[];
}

export async function generateVideo(request: PipelineRequest): Promise<PipelineResponse> {
  return apiRequest<PipelineResponse>('/api/v1/pipeline/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
```

**Step 4: Create library.ts**

```typescript
// frontend/src/api/library.ts
import { apiRequest } from './client';
import { Style } from '../types';

export interface LibraryEntry {
  id: string;
  title: string;
  thumbnail_key: string;
  video_key: string;
  duration_sec: number;
  style: Style;
  created_at: string;
}

export async function getLibrary(userId: string): Promise<LibraryEntry[]> {
  return apiRequest<LibraryEntry[]>(`/api/v1/library?user_id=${userId}`);
}

export async function saveToLibrary(entry: LibraryEntry, userId: string): Promise<LibraryEntry> {
  return apiRequest<LibraryEntry>(`/api/v1/library?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function deleteFromLibrary(id: string, userId: string): Promise<void> {
  await apiRequest(`/api/v1/library/${id}?user_id=${userId}`, {
    method: 'DELETE',
  });
}
```

**Step 5: Create index.ts**

```typescript
// frontend/src/api/index.ts
export * from './vision';
export * from './story';
export * from './pipeline';
export * from './library';
export { ApiError } from './client';
```

**Step 6: Commit**

```bash
git add frontend/src/api/
git commit -m "feat: add API client functions"
```

---

### Task 4.3: Add S3 Storage Helper

**Files:**
- Create: `frontend/src/lib/storage.ts`

**Step 1: Create storage helper**

```typescript
// frontend/src/lib/storage.ts
import { getUrl } from 'aws-amplify/storage';

export async function getS3Url(key: string): Promise<string> {
  const { url } = await getUrl({ key });
  return url.toString();
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/storage.ts
git commit -m "feat: add S3 storage helper"
```

---

### Task 4.4: Update Recognize Page

**Files:**
- Modify: `frontend/src/pages/recognize.tsx`

**Step 1: Import API and update to use real API**

Replace mock data usage with real API call:

```typescript
import { analyzeDrawing } from '../api';
import { toast } from 'sonner';

// In useEffect, replace setTimeout mock with:
useEffect(() => {
  async function analyze() {
    if (!state.drawing) {
      navigate('/upload', { replace: true });
      return;
    }

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const response = await analyzeDrawing(base64);
        setFormData({
          subject: response.drawing.subject,
          setting: response.drawing.setting,
          mood: response.drawing.mood,
        });
        setAnalyzing(false);
      };
      reader.readAsDataURL(state.drawing);
    } catch (error) {
      toast.error('Failed to analyze drawing');
      setAnalyzing(false);
    }
  }

  analyze();
}, [state.drawing, navigate]);
```

**Step 2: Commit**

```bash
git add frontend/src/pages/recognize.tsx
git commit -m "feat: connect recognize page to vision API"
```

---

### Phase 4 Manual Test

1. Start backend and frontend
2. Sign in
3. Upload an image
4. Verify: Real API call to /api/v1/vision/analyze
5. Verify: Analysis results display

---

## Phase 5: Library Persistence

**Manual Test:** Save a storybook, refresh, verify it persists

---

### Task 5.1: Update Library Page

**Files:**
- Modify: `frontend/src/pages/library.tsx`

Replace localStorage-based `useLibrary` with API calls.

(Detailed implementation follows same pattern as Phase 4)

---

### Task 5.2: Update Preview Page Save

**Files:**
- Modify: `frontend/src/pages/preview.tsx`

Update save handler to call library API instead of localStorage.

---

### Phase 5 Manual Test

1. Complete full flow to preview
2. Click "Save to Library"
3. Verify: Saved to DynamoDB (check AWS Console)
4. Refresh page
5. Go to /library
6. Verify: Storybook appears from DynamoDB

---

## Verification Checklist

### Phase 1: Infrastructure
- [ ] Cognito User Pool created
- [ ] Cognito Identity Pool created
- [ ] DynamoDB tables created
- [ ] Test user created in Cognito

### Phase 2: Frontend Auth
- [ ] Sign-in page works
- [ ] AuthGuard redirects unauthenticated users
- [ ] Sign out works
- [ ] Session persists on refresh

### Phase 3: Backend API
- [ ] Database module works
- [ ] Library endpoints work
- [ ] Pipeline endpoint works
- [ ] S3 keys returned (not presigned URLs)

### Phase 4: Frontend API Integration
- [ ] Vision API connected
- [ ] Story API connected
- [ ] Pipeline API connected

### Phase 5: Library Persistence
- [ ] Save to library persists to DynamoDB
- [ ] Library loads from DynamoDB
- [ ] Delete from library works
