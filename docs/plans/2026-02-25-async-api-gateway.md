# Async API + API Gateway Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert synchronous AI endpoints to async pattern with polling, add API Gateway for HTTPS.

**Architecture:** Endpoints return immediately and process in background using asyncio.create_task(). DynamoDB checkpoints serve as job status. Frontend polls GET /api/v1/jobs/{run_id}/status until complete. API Gateway provides HTTPS via VPC Link to ALB.

**Tech Stack:** FastAPI, asyncio, DynamoDB, Terraform (API Gateway, VPC Link), React, TypeScript

---

## Phase 1: Infrastructure

### Task 1: Add API Gateway Terraform Resources

**Files:**
- Modify: `infrastructure/main.tf` (append after Amplify section)
- Modify: `infrastructure/outputs.tf` (append new output)

**Step 1: Add API Gateway resources to main.tf**

Append after the Amplify section (~line 545):

```hcl
# ------------------------------------------------------------------------------
# API Gateway (HTTPS frontend for ALB)
# ------------------------------------------------------------------------------
resource "aws_api_gateway_rest_api" "api" {
  name = "${var.app_name}-api"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_vpc_link" "main" {
  name        = "${var.app_name}-vpc-link"
  target_arns = [aws_lb.app.arn]
}

resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method

  type                    = "HTTP_PROXY"
  integration_http_method = "ANY"
  uri                     = "http://${aws_lb.app.dns_name}/{proxy}"
  connection_type         = "VPC_LINK"
  connection_id           = aws_api_gateway_vpc_link.main.id

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

resource "aws_api_gateway_method_response" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.proxy.id
  http_method = aws_api_gateway_method.proxy.http_method
  status_code = "200"
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.proxy.id,
      aws_api_gateway_method.proxy.id,
      aws_api_gateway_integration.proxy.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "prod"
}
```

**Step 2: Add output to outputs.tf**

Append to `infrastructure/outputs.tf`:

```hcl
output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.prod.invoke_url
}
```

**Step 3: Validate Terraform**

Run: `terraform -chdir=infrastructure validate`
Expected: `Success! The configuration is valid.`

**Step 4: Commit**

```bash
git add infrastructure/main.tf infrastructure/outputs.tf
git commit -m "feat(infra): add API Gateway with VPC Link to ALB"
```

---

### Task 2: Update deploy-frontend.sh for API Gateway

**Files:**
- Modify: `deploy-frontend.sh`

**Step 1: Change VITE_API_URL to use API Gateway**

In `deploy-frontend.sh`, change line ~16 from:

```bash
export VITE_API_URL="http://$(terraform -chdir=$INFRA_DIR output -raw alb_dns_name)"
```

To:

```bash
export VITE_API_URL="$(terraform -chdir=$INFRA_DIR output -raw api_gateway_url)"
```

Note: API Gateway URL already includes https://, so remove the "http://" prefix.

**Step 2: Verify script syntax**

Run: `bash -n deploy-frontend.sh`
Expected: No output (success)

**Step 3: Commit**

```bash
git add deploy-frontend.sh
git commit -m "fix: use API Gateway URL instead of ALB in deploy script"
```

---

## Phase 2: Backend - Status Endpoint

### Task 3: Add get_checkpoint method to Database class

**Files:**
- Modify: `backend/packages/app/src/app/database.py`

**Step 1: Add get_checkpoint method**

Add after `save_checkpoint` method (~line 75):

```python
def get_checkpoint(self, user_id: str, run_id: str) -> dict[str, Any] | None:
    """Get a pipeline checkpoint by user_id and run_id."""
    response = self.checkpoints_table.get_item(
        Key={"user_id": user_id, "run_id": run_id}
    )
    return response.get("Item")
```

**Step 2: Commit**

```bash
git add backend/packages/app/src/app/database.py
git commit -m "feat(backend): add get_checkpoint method to Database class"
```

---

### Task 4: Add job status endpoint

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Add Pydantic model for status response**

Add after existing models (around line 45):

```python
class JobStatusResponse(BaseModel):
    user_id: str
    run_id: str
    status: str  # "processing", "complete", "error"
    current_stage: str | None = None
    error: str | None = None
    drawing_analysis: dict | None = None
    story_script: dict | None = None
    images: list | None = None
    video: dict | None = None
    updated_at: str | None = None
```

**Step 2: Add status endpoint**

Add after existing endpoints (around line 280):

```python
@app.get("/api/v1/jobs/{run_id}/status")
async def get_job_status(run_id: str, user_id: str = Query(...)) -> JobStatusResponse:
    """Get the status of an async job by polling the checkpoint."""
    checkpoint = db.get_checkpoint(user_id, run_id)
    if not checkpoint:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        user_id=checkpoint.get("user_id", user_id),
        run_id=checkpoint.get("run_id", run_id),
        status=checkpoint.get("status", "processing"),
        current_stage=checkpoint.get("current_stage"),
        error=checkpoint.get("error"),
        drawing_analysis=checkpoint.get("drawing_analysis"),
        story_script=checkpoint.get("story_script"),
        images=checkpoint.get("images"),
        video=checkpoint.get("video"),
        updated_at=checkpoint.get("updated_at"),
    )
```

**Step 3: Add Query import if missing**

At top of file, ensure:

```python
from fastapi import FastAPI, HTTPException, Query
```

**Step 4: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat(backend): add GET /api/v1/jobs/{run_id}/status endpoint"
```

---

## Phase 3: Backend - Convert Endpoints to Async

### Task 5: Convert vision endpoint to async

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Create background task function**

Add before the vision endpoint (around line 90):

```python
async def process_vision_background(request: VisionRequest):
    """Background task to process vision analysis."""
    try:
        result = await analyze_drawing(request.image_base64)
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "complete",
            "current_stage": "vision_complete",
            "drawing_analysis": result.model_dump(),
        })
    except Exception as e:
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "error",
            "current_stage": "vision",
            "error": str(e),
        })
```

**Step 2: Modify the vision endpoint**

Change the existing vision endpoint to:

```python
@app.post("/api/v1/vision/analyze")
async def analyze_vision(request: VisionRequest):
    """Analyze a drawing asynchronously. Poll /api/v1/jobs/{run_id}/status for results."""
    if not request.user_id or not request.run_id:
        raise HTTPException(status_code=400, detail="user_id and run_id are required")

    # Initialize checkpoint
    db.save_checkpoint(request.user_id, request.run_id, {
        "status": "processing",
        "current_stage": "vision",
    })

    # Start background task
    asyncio.create_task(process_vision_background(request))

    # Return immediately
    return {"run_id": request.run_id, "status": "processing", "current_stage": "vision"}
```

**Step 3: Add asyncio import**

At top of file:

```python
import asyncio
```

**Step 4: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat(backend): convert vision endpoint to async with background processing"
```

---

### Task 6: Convert story endpoint to async

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Create background task function**

Add before the story endpoint:

```python
async def process_story_background(request: StoryRequest):
    """Background task to process story generation."""
    try:
        story = await generate_story(
            drawing_analysis=request.drawing,
            style=request.style,
            theme=request.theme,
            age_group=request.age_group,
            personal_context=request.personal_context,
        )
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "complete",
            "current_stage": "story_complete",
            "drawing_analysis": request.drawing.model_dump(),
            "story_script": story.model_dump(),
        })
    except Exception as e:
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "error",
            "current_stage": "story",
            "error": str(e),
        })
```

**Step 2: Modify the story endpoint**

Change to:

```python
@app.post("/api/v1/story/generate")
async def generate_story_endpoint(request: StoryRequest):
    """Generate a story asynchronously. Poll /api/v1/jobs/{run_id}/status for results."""
    if not request.user_id or not request.run_id:
        raise HTTPException(status_code=400, detail="user_id and run_id are required")

    # Initialize checkpoint
    db.save_checkpoint(request.user_id, request.run_id, {
        "status": "processing",
        "current_stage": "story",
        "drawing_analysis": request.drawing.model_dump(),
    })

    # Start background task
    asyncio.create_task(process_story_background(request))

    # Return immediately
    return {"run_id": request.run_id, "status": "processing", "current_stage": "story"}
```

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat(backend): convert story endpoint to async with background processing"
```

---

### Task 7: Convert pipeline endpoint to async

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Create background task function**

Add before the pipeline endpoint:

```python
async def process_pipeline_background(request: PipelineRequest):
    """Background task to process full video pipeline."""
    try:
        # Stage: Images
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "processing",
            "current_stage": "images",
            "drawing_analysis": request.drawing.model_dump(),
            "story_script": request.story.model_dump(),
        })
        images = await generate_images(request.story, request.drawing, request.style)

        # Stage: Voice
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "processing",
            "current_stage": "voice",
            "drawing_analysis": request.drawing.model_dump(),
            "story_script": request.story.model_dump(),
            "images": [{"scene_number": img.scene_number, "key": img.key} for img in images],
        })
        audio = await generate_audio(request.story, request.voice_type)

        # Stage: Video
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "processing",
            "current_stage": "video",
            "drawing_analysis": request.drawing.model_dump(),
            "story_script": request.story.model_dump(),
            "images": [{"scene_number": img.scene_number, "key": img.key} for img in images],
        })
        video = await assemble_video(images, audio, request.user_id, request.run_id)

        # Complete
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "complete",
            "current_stage": "video_complete",
            "drawing_analysis": request.drawing.model_dump(),
            "story_script": request.story.model_dump(),
            "images": [{"scene_number": img.scene_number, "key": img.key} for img in images],
            "video": video.model_dump(),
        })

    except Exception as e:
        db.save_checkpoint(request.user_id, request.run_id, {
            "status": "error",
            "error": str(e),
        })
```

**Step 2: Modify the pipeline endpoint**

Change to:

```python
@app.post("/api/v1/pipeline/generate")
async def generate_video_pipeline(request: PipelineRequest):
    """Generate video asynchronously. Poll /api/v1/jobs/{run_id}/status for results."""
    if not request.user_id or not request.run_id:
        raise HTTPException(status_code=400, detail="user_id and run_id are required")

    # Initialize checkpoint
    db.save_checkpoint(request.user_id, request.run_id, {
        "status": "processing",
        "current_stage": "images",
        "drawing_analysis": request.drawing.model_dump(),
        "story_script": request.story.model_dump(),
    })

    # Start background task
    asyncio.create_task(process_pipeline_background(request))

    # Return immediately
    return {"run_id": request.run_id, "status": "processing", "current_stage": "images"}
```

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat(backend): convert pipeline endpoint to async with background processing"
```

---

## Phase 4: Frontend - API Client

### Task 8: Add job status API client

**Files:**
- Create: `frontend/src/api/jobs.ts`
- Modify: `frontend/src/api/index.ts`

**Step 1: Create jobs.ts**

```typescript
import { apiRequest } from './client';

export interface JobStatus {
  user_id: string;
  run_id: string;
  status: 'processing' | 'complete' | 'error';
  current_stage: string | null;
  error: string | null;
  drawing_analysis: Record<string, unknown> | null;
  story_script: Record<string, unknown> | null;
  images: Array<{ scene_number: number; key: string }> | null;
  video: Record<string, unknown> | null;
  updated_at: string | null;
}

export async function getJobStatus(runId: string, userId: string): Promise<JobStatus> {
  return apiRequest<JobStatus>(`/api/v1/jobs/${runId}/status?user_id=${userId}`);
}
```

**Step 2: Export from index.ts**

Add to `frontend/src/api/index.ts`:

```typescript
export * from './jobs';
```

**Step 3: Commit**

```bash
git add frontend/src/api/jobs.ts frontend/src/api/index.ts
git commit -m "feat(frontend): add job status API client"
```

---

### Task 9: Create useJobPolling hook

**Files:**
- Create: `frontend/src/hooks/use-job-polling.ts`

**Step 1: Create the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { getJobStatus, JobStatus } from '@/api/jobs';

interface UseJobPollingOptions {
  onComplete?: (status: JobStatus) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
}

export function useJobPolling(
  runId: string | null,
  userId: string | null,
  options: UseJobPollingOptions = {}
) {
  const { onComplete, onError, pollInterval = 2000 } = options;
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    if (runId && userId) {
      setIsPolling(true);
    }
  }, [runId, userId]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling || !runId || !userId) return;

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await getJobStatus(runId, userId);
        setStatus(data);

        if (data.status === 'complete') {
          setIsPolling(false);
          onComplete?.(data);
        } else if (data.status === 'error') {
          setIsPolling(false);
          onError?.(data.error || 'Unknown error');
        } else {
          timeoutId = setTimeout(poll, pollInterval);
        }
      } catch (e) {
        console.error('Poll failed:', e);
        // Continue polling on network errors
        timeoutId = setTimeout(poll, pollInterval);
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPolling, runId, userId, pollInterval, onComplete, onError]);

  return { status, isPolling, startPolling, stopPolling };
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/use-job-polling.ts
git commit -m "feat(frontend): add useJobPolling hook for async job status"
```

---

## Phase 5: Frontend - Update Pages

### Task 10: Update recognize page for async

**Files:**
- Modify: `frontend/src/pages/recognize.tsx`

**Step 1: Import new hook and update logic**

Add imports:

```typescript
import { useJobPolling } from '@/hooks/use-job-polling';
```

**Step 2: Replace synchronous call with polling**

Replace the `handleAnalyze` function logic. After `analyzeDrawing` is called, instead of waiting for result, start polling:

```typescript
const handleAnalyze = async () => {
  if (!drawing) return;
  setIsAnalyzing(true);
  setError(null);

  try {
    const base64 = await fileToBase64(drawing);
    // This now returns immediately
    await analyzeDrawing(base64, user?.userId, runId);
    // Start polling
    startPolling();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Analysis failed');
    setIsAnalyzing(false);
  }
};
```

**Step 3: Add polling hook with callbacks**

```typescript
const { status, isPolling, startPolling } = useJobPolling(runId, user?.userId, {
  onComplete: (data) => {
    if (data.drawing_analysis) {
      setAnalysis(data.drawing_analysis as DrawingAnalysis);
      setIsAnalyzing(false);
    }
  },
  onError: (err) => {
    setError(err);
    setIsAnalyzing(false);
  },
});
```

**Step 4: Show current stage during polling**

```typescript
{isPolling && status?.current_stage && (
  <p className="text-sm text-muted-foreground">
    {status.current_stage === 'vision' ? 'Analyzing your drawing...' : 'Processing...'}
  </p>
)}
```

**Step 5: Commit**

```bash
git add frontend/src/pages/recognize.tsx
git commit -m "feat(frontend): update recognize page for async polling"
```

---

### Task 11: Update script page for async

**Files:**
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Add imports and polling hook**

Similar pattern to Task 10 - add `useJobPolling` hook, replace synchronous `generateStory` with submit + poll pattern.

**Step 2: Update handleGenerate**

```typescript
const handleGenerate = async () => {
  setIsGenerating(true);
  setError(null);

  try {
    await generateStory(request);  // Returns immediately
    startPolling();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Story generation failed');
    setIsGenerating(false);
  }
};
```

**Step 3: Add polling callbacks**

```typescript
const { status, isPolling, startPolling } = useJobPolling(runId, user?.userId, {
  onComplete: (data) => {
    if (data.story_script) {
      setScript(data.story_script as StoryScript);
      setIsGenerating(false);
    }
  },
  onError: (err) => {
    setError(err);
    setIsGenerating(false);
  },
});
```

**Step 4: Commit**

```bash
git add frontend/src/pages/script.tsx
git commit -m "feat(frontend): update script page for async polling"
```

---

### Task 12: Update preview page for async

**Files:**
- Modify: `frontend/src/pages/preview.tsx`

**Step 1: Add imports and polling hook**

Same pattern - add `useJobPolling`, update `handleGenerate`.

**Step 2: Show stage progress**

```typescript
const STAGE_LABELS: Record<string, string> = {
  'images': 'Creating illustrations...',
  'voice': 'Recording narration...',
  'video': 'Assembling your storybook...',
};

{isPolling && status?.current_stage && (
  <div className="flex items-center gap-2">
    <Loader2 className="h-4 w-4 animate-spin" />
    <span>{STAGE_LABELS[status.current_stage] || 'Processing...'}</span>
  </div>
)}
```

**Step 3: Commit**

```bash
git add frontend/src/pages/preview.tsx
git commit -m "feat(frontend): update preview page for async polling with stage display"
```

---

## Phase 6: Frontend - Remove localStorage

### Task 13: Remove localStorage from wizard state

**Files:**
- Modify: `frontend/src/hooks/use-wizard-state.tsx`

**Step 1: Remove localStorage save/restore**

Delete the useEffect that saves to localStorage (~lines 56-62).
Delete the initial state restoration from localStorage (~lines 36-48).

**Step 2: Add checkpoint restore on mount**

Replace with DynamoDB checkpoint fetch:

```typescript
const restoreFromCheckpoint = useCallback(async () => {
  if (!runId || !userId) return;

  try {
    const checkpoint = await getJobStatus(runId, userId);
    if (checkpoint && checkpoint.status === 'complete') {
      if (checkpoint.drawing_analysis) {
        dispatch({ type: 'SET_ANALYSIS', payload: checkpoint.drawing_analysis as DrawingAnalysis });
      }
      if (checkpoint.story_script) {
        dispatch({ type: 'SET_SCRIPT', payload: checkpoint.story_script as StoryScript });
      }
      if (checkpoint.video) {
        dispatch({ type: 'SET_VIDEO', payload: checkpoint.video as VideoResult });
      }
    }
  } catch (e) {
    console.error('Failed to restore checkpoint:', e);
  }
}, [runId, userId]);

useEffect(() => {
  restoreFromCheckpoint();
}, [restoreFromCheckpoint]);
```

**Step 3: Commit**

```bash
git add frontend/src/hooks/use-wizard-state.tsx
git commit -m "refactor(frontend): replace localStorage with DynamoDB checkpoint restore"
```

---

## Phase 7: Apply & Test

### Task 14: Apply Terraform changes

**Files:** None (runtime)

**Step 1: Plan**

Run: `terraform -chdir=infrastructure plan`
Expected: Shows API Gateway resources to add

**Step 2: Apply**

Run: `terraform -chdir=infrastructure apply`
Expected: Creates API Gateway, VPC Link, deployment, stage

**Step 3: Verify**

Run: `terraform -chdir=infrastructure output api_gateway_url`
Expected: Shows URL like `https://abc123.execute-api.us-east-1.amazonaws.com/prod`

---

### Task 15: Deploy and test

**Files:** None (runtime)

**Step 1: Deploy backend**

Run: `./deploy.sh`

**Step 2: Deploy frontend**

Run: `./deploy-frontend.sh`

**Step 3: Test in browser**

1. Open Amplify URL
2. Upload a drawing
3. Verify vision analysis completes (should see "Analyzing..." then result)
4. Generate story (should see "Writing story..." then result)
5. Generate video (should see stage progress: "Creating illustrations..." → "Recording..." → "Assembling...")
6. Verify no mixed content errors in console

---

## Verification Checklist

After all tasks:

- [ ] `terraform -chdir=infrastructure validate` passes
- [ ] API Gateway deployed and accessible
- [ ] Backend endpoints return immediately with `status: processing`
- [ ] GET /api/v1/jobs/{run_id}/status returns checkpoint data
- [ ] Frontend polls and shows current stage
- [ ] Page refresh restores state from DynamoDB
- [ ] No localStorage usage remaining
- [ ] No mixed content errors
- [ ] Full pipeline completes successfully
