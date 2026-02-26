# Async API + API Gateway Design

**Date:** 2026-02-25
**Status:** Approved

## Problem

1. Frontend calls backend over HTTP, but Amplify serves frontend over HTTPS → Mixed content blocked
2. Long-running AI endpoints (60-180s for pipeline) exceed typical HTTP timeouts
3. No progress feedback during processing
4. localStorage checkpoints disconnected from DynamoDB - no resume on refresh

## Solution

Convert all AI endpoints to async pattern + add API Gateway for HTTPS.

## Architecture

```
┌─────────────────────┐     HTTPS      ┌─────────────────────┐
│  Amplify Frontend   │ ─────────────▶ │    API Gateway      │
│  (HTTPS)            │                │    (REST API)       │
└─────────────────────┘                └─────────────────────┘
                                                │
                                                │ HTTP (VPC Link)
                                                ▼
                                       ┌─────────────────────┐
                                       │       ALB           │
                                       └─────────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────────┐
                                       │   ECS (FastAPI)     │
                                       │   - Submit jobs     │
                                       │   - Poll status     │
                                       │   - Background tasks│
                                       └─────────────────────┘
                                                │
                                                ▼
                                       ┌─────────────────────┐
                                       │    DynamoDB         │
                                       │  (checkpoints =     │
                                       │   job status)       │
                                       └─────────────────────┘
```

## API Changes

### Current (Synchronous)

```
POST /api/v1/vision/analyze → waits 5-10s → returns analysis
POST /api/v1/story/generate → waits 10-15s → returns story
POST /api/v1/pipeline/generate → waits 60-180s → returns video
```

### New (Asynchronous)

```
POST /api/v1/vision/analyze → returns immediately → { run_id, status: "processing" }
POST /api/v1/story/generate → returns immediately → { run_id, status: "processing" }
POST /api/v1/pipeline/generate → returns immediately → { run_id, status: "processing" }

GET /api/v1/jobs/{run_id}/status → returns current checkpoint state
```

## Backend Implementation

### Async Endpoint Pattern

```python
@app.post("/api/v1/vision/analyze")
async def analyze_vision_endpoint(request: VisionRequest):
    # Initialize checkpoint
    db.save_checkpoint(request.user_id, request.run_id, {
        "status": "processing",
        "current_stage": "vision",
    })

    # Start background task (fire and forget)
    asyncio.create_task(process_vision(request))

    # Return immediately
    return {"run_id": request.run_id, "status": "processing"}

async def process_vision(request: VisionRequest):
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
            "error": str(e),
        })
```

### Status Endpoint

```python
@app.get("/api/v1/jobs/{run_id}/status")
async def get_job_status(run_id: str, user_id: str = Query(...)):
    checkpoint = db.get_checkpoint(user_id, run_id)
    if not checkpoint:
        raise HTTPException(404, "Job not found")
    return checkpoint
```

### Checkpoint Schema

```python
{
    "user_id": str,
    "run_id": str,
    "status": "processing" | "complete" | "error",
    "current_stage": "vision" | "vision_complete" | "story" | "story_complete" |
                     "images" | "images_complete" | "voice" | "voice_complete" |
                     "video" | "video_complete",
    "error": str | None,

    # Stage results (populated as stages complete)
    "drawing_analysis": dict | None,
    "story_script": dict | None,
    "images": list | None,
    "audio": dict | None,
    "video": dict | None,

    "updated_at": str,
    "ttl": int,  # 7-day expiry
}
```

## Frontend Implementation

### Polling Pattern

```typescript
// api/jobs.ts
export async function getJobStatus(runId: string, userId: string): Promise<JobStatus> {
  return apiRequest<JobStatus>(`/api/v1/jobs/${runId}/status?user_id=${userId}`);
}

// hooks/use-job-polling.ts
export function useJobPolling(runId: string | null, userId: string | null) {
  const [status, setStatus] = useState<JobStatus | null>(null);

  useEffect(() => {
    if (!runId || !userId) return;

    const poll = setInterval(async () => {
      try {
        const data = await getJobStatus(runId, userId);
        setStatus(data);
        if (data.status === 'complete' || data.status === 'error') {
          clearInterval(poll);
        }
      } catch (e) {
        console.error('Poll failed:', e);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [runId, userId]);

  return status;
}
```

### Page Updates

```typescript
// pages/recognize.tsx - Before
const result = await analyzeDrawing(request);
setAnalysis(result);

// pages/recognize.tsx - After
await submitVisionAnalysis(request);  // Returns immediately
// useJobPolling hook handles the rest
```

### Remove localStorage

```typescript
// hooks/use-wizard-state.tsx
// DELETE: localStorage.getItem/setItem calls
// ADD: Fetch checkpoint from DynamoDB on mount

useEffect(() => {
  if (userId && runId) {
    getJobStatus(runId, userId).then(checkpoint => {
      if (checkpoint) {
        // Restore state from checkpoint
        setAnalysis(checkpoint.drawing_analysis);
        setScript(checkpoint.story_script);
        // etc.
      }
    });
  }
}, [userId, runId]);
```

### Progress Display

Show current stage text during polling:

```typescript
const STAGE_LABELS = {
  'vision': 'Analyzing your drawing...',
  'story': 'Writing your story...',
  'images': 'Creating illustrations...',
  'voice': 'Recording narration...',
  'video': 'Assembling your storybook...',
};

// In component
{status?.status === 'processing' && (
  <div className="flex items-center gap-2">
    <Spinner />
    <span>{STAGE_LABELS[status.current_stage]}</span>
  </div>
)}
```

## Infrastructure (Terraform)

### API Gateway

```hcl
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
}

resource "aws_api_gateway_deployment" "main" {
  rest_api_id = aws_api_gateway_rest_api.api.id

  depends_on = [aws_api_gateway_integration.proxy]
}

resource "aws_api_gateway_stage" "prod" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  deployment_id = aws_api_gateway_deployment.main.id
  stage_name    = "prod"
}
```

### Update deploy-frontend.sh

```bash
# Change from ALB URL to API Gateway URL
export VITE_API_URL="https://$(terraform -chdir=$INFRA_DIR output -raw api_gateway_url)"
```

## Error Handling

### Backend Errors

- Catch exceptions in background tasks
- Save error state to checkpoint: `{ status: "error", error: "..." }`
- Frontend sees error on next poll

### Network Errors During Poll

- Frontend retries polling (already in a loop)
- If persistent failures, show "Connection lost, retrying..."

### Partial Completion

- Checkpoints save after each stage
- If job fails at stage 3, stages 1-2 results preserved
- User can potentially restart from last checkpoint (future enhancement)

## Testing

1. Unit tests for async endpoint behavior
2. Integration test: submit job, poll until complete
3. Test error states: force failure at each stage
4. Test page refresh: verify checkpoint restore works
5. Test concurrent requests: multiple users running jobs

## Migration Path

1. Deploy API Gateway (no breaking changes)
2. Add status endpoint (additive)
3. Convert endpoints one at a time (vision → story → pipeline)
4. Update frontend pages one at a time
5. Remove localStorage after all pages updated
