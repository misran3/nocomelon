# Infinite Loop Fix and Checkpoint Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix infinite API call loops in script.tsx/preview.tsx and add checkpoints to all pipeline stages.

**Architecture:** Stabilize React hook references with useCallback/useMemo, add useRef guards to prevent duplicate API calls, extend backend to save checkpoints from stage 1 (vision) onward.

**Tech Stack:** React 18, TypeScript, Vitest, FastAPI, DynamoDB

---

## Phase 1: Fix Critical Bugs (Foundation)

This phase fixes the infinite loop by stabilizing function references and adding execution guards.

---

### Task 1: Memoize setter functions in use-wizard-state

**Files:**
- Modify: `frontend/src/hooks/use-wizard-state.tsx`

**Step 1: Add useCallback import**

Change line 1 from:
```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
```
to:
```typescript
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
```

**Step 2: Wrap setRunId with useCallback**

Change lines 68-70 from:
```typescript
const setRunId = (run_id: string | null) => {
  setState((prev) => ({ ...prev, run_id }));
};
```
to:
```typescript
const setRunId = useCallback((run_id: string | null) => {
  setState((prev) => ({ ...prev, run_id }));
}, []);
```

**Step 3: Wrap setDrawing with useCallback**

Change lines 72-74 from:
```typescript
const setDrawing = (drawing: File | null) => {
  setState((prev) => ({ ...prev, drawing }));
};
```
to:
```typescript
const setDrawing = useCallback((drawing: File | null) => {
  setState((prev) => ({ ...prev, drawing }));
}, []);
```

**Step 4: Wrap setAnalysis with useCallback**

Change lines 76-78 from:
```typescript
const setAnalysis = (analysis: DrawingAnalysis | null) => {
  setState((prev) => ({ ...prev, analysis }));
};
```
to:
```typescript
const setAnalysis = useCallback((analysis: DrawingAnalysis | null) => {
  setState((prev) => ({ ...prev, analysis }));
}, []);
```

**Step 5: Wrap setCustomization with useCallback**

Change lines 80-85 from:
```typescript
const setCustomization = (customization: Partial<WizardState['customization']>) => {
  setState((prev) => ({
    ...prev,
    customization: { ...prev.customization, ...customization },
  }));
};
```
to:
```typescript
const setCustomization = useCallback((customization: Partial<WizardState['customization']>) => {
  setState((prev) => ({
    ...prev,
    customization: { ...prev.customization, ...customization },
  }));
}, []);
```

**Step 6: Wrap setScript with useCallback**

Change lines 87-89 from:
```typescript
const setScript = (script: StoryScript | null) => {
  setState((prev) => ({ ...prev, script }));
};
```
to:
```typescript
const setScript = useCallback((script: StoryScript | null) => {
  setState((prev) => ({ ...prev, script }));
}, []);
```

**Step 7: Wrap setVideo with useCallback**

Change lines 91-93 from:
```typescript
const setVideo = (video: VideoResult | null) => {
  setState((prev) => ({ ...prev, video }));
};
```
to:
```typescript
const setVideo = useCallback((video: VideoResult | null) => {
  setState((prev) => ({ ...prev, video }));
}, []);
```

**Step 8: Wrap resetWizard with useCallback**

Change lines 95-98 from:
```typescript
const resetWizard = () => {
  setState(initialState);
  localStorage.removeItem('nocomelon-wizard-state');
};
```
to:
```typescript
const resetWizard = useCallback(() => {
  setState(initialState);
  localStorage.removeItem('nocomelon-wizard-state');
}, []);
```

**Step 9: Memoize context provider value**

Change lines 101-112 from:
```typescript
return (
  <WizardContext.Provider
    value={{
      state,
      setRunId,
      setDrawing,
      setAnalysis,
      setCustomization,
      setScript,
      setVideo,
      resetWizard,
    }}
  >
```
to:
```typescript
const contextValue = useMemo(() => ({
  state,
  setRunId,
  setDrawing,
  setAnalysis,
  setCustomization,
  setScript,
  setVideo,
  resetWizard,
}), [state, setRunId, setDrawing, setAnalysis, setCustomization, setScript, setVideo, resetWizard]);

return (
  <WizardContext.Provider value={contextValue}>
```

**Step 10: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 11: Run existing tests**

Run: `cd frontend && npx vitest run`
Expected: All 34 tests pass

**Step 12: Commit**

```bash
git add frontend/src/hooks/use-wizard-state.tsx
git commit -m "fix: memoize wizard state setters to prevent infinite re-renders"
```

---

### Task 2: Add useRef guard to script.tsx

**Files:**
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Add useRef import**

Change line 1 from:
```typescript
import { useState, useEffect } from 'react';
```
to:
```typescript
import { useState, useEffect, useRef } from 'react';
```

**Step 2: Add hasFetched ref**

After line 18 (`const [isLoading, setIsLoading] = useState(true);`), add:
```typescript
const hasFetched = useRef(false);
```

**Step 3: Add guard check in useEffect**

Change lines 20-47 from:
```typescript
useEffect(() => {
  document.title = 'NoComelon | Script';
  if (!state.analysis || !state.customization.style) {
    navigate('/customize', { replace: true });
    return;
  }

  async function fetchStory() {
    // ...
  }

  fetchStory();
}, [state.analysis, state.customization, navigate, setScript]);
```
to:
```typescript
useEffect(() => {
  document.title = 'NoComelon | Script';
  if (!state.analysis || !state.customization.style) {
    navigate('/customize', { replace: true });
    return;
  }

  // Guard: only fetch once, or if script already exists
  if (hasFetched.current || state.script) {
    if (state.script) {
      setScenes(state.script.scenes);
      setIsLoading(false);
    }
    return;
  }
  hasFetched.current = true;

  async function fetchStory() {
    try {
      const script = await generateStory({
        drawing: state.analysis!,
        theme: state.customization.theme,
        voice_type: state.customization.voice,
        child_age: state.customization.age,
        personal_context: state.customization.personalContext || undefined,
      });
      setScenes(script.scenes);
      setScript(script);
    } catch (error) {
      toast.error('Failed to generate story');
      console.error('Failed to generate story:', error);
    } finally {
      setIsLoading(false);
    }
  }

  fetchStory();
}, [state.analysis, state.customization, state.script, navigate, setScript]);
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/script.tsx
git commit -m "fix: add useRef guard to prevent duplicate story API calls"
```

---

### Task 3: Add useRef guard to preview.tsx

**Files:**
- Modify: `frontend/src/pages/preview.tsx`

**Step 1: Add useRef import**

Change line 1 from:
```typescript
import { useEffect, useState } from 'react';
```
to:
```typescript
import { useEffect, useState, useRef } from 'react';
```

**Step 2: Add hasStartedPipeline ref**

After line 32 (`const [error, setError] = useState<string | null>(null);`), add:
```typescript
const hasStartedPipeline = useRef(false);
```

**Step 3: Add guard check in useEffect**

Change lines 38-74 to add the guard after the existing `if (state.video)` check:

```typescript
useEffect(() => {
  document.title = 'NoComelon | Preview';
  if (!state.script || !state.analysis || !state.run_id) {
    navigate('/script', { replace: true });
    return;
  }

  // If video already exists, just show it
  if (state.video) {
    setIsGenerating(false);
    return;
  }

  // Guard: only start pipeline once
  if (hasStartedPipeline.current) {
    return;
  }
  hasStartedPipeline.current = true;

  async function runPipeline() {
    try {
      const request: PipelineRequest = {
        run_id: state.run_id!,
        story: state.script!,
        drawing: state.analysis!,
        style: state.customization.style,
        voice_type: state.customization.voice,
        user_id: user?.userId,
      };
      const response = await generateVideo(request);
      setVideo(response.video);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to generate video';
      setError(message);
      toast.error('Failed to generate video');
      console.error('Pipeline error:', e);
    } finally {
      setIsGenerating(false);
    }
  }

  runPipeline();
}, [state.script, state.analysis, state.run_id, state.video, state.customization, user, navigate, setVideo]);
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/preview.tsx
git commit -m "fix: add useRef guard to prevent duplicate pipeline API calls"
```

---

### Task 4: Verify infinite loop is fixed

**Step 1: Start the dev server**

Run: `cd frontend && npm run dev`

**Step 2: Open browser and test the flow**

1. Sign in
2. Upload an image
3. Navigate to /script
4. Open browser DevTools → Network tab
5. Verify only ONE call to `/api/v1/story/generate`
6. Navigate to /preview
7. Verify only ONE call to `/api/v1/pipeline/generate`

**Step 3: Check ECS logs**

Run: `aws logs tail /ecs/nocomeleon --since 5m --format short 2>&1 | grep -E "POST.*story|POST.*pipeline"`

Expected: Only 1 POST to each endpoint per navigation (not 14+)

**Step 4: Stop dev server and commit verification**

No code changes needed. If issues found, return to Tasks 1-3.

---

## Phase 2: Code Quality Improvements

This phase improves script.tsx with DRY refactoring, error handling, and null checks.

---

### Task 5: Extract DRY helper and add error state to script.tsx

**Files:**
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Add error state**

After line 18, add:
```typescript
const [error, setError] = useState<string | null>(null);
```

**Step 2: Create shared generateStoryRequest helper**

After the state declarations (around line 21), add:
```typescript
const generateStoryRequest = useCallback(() => {
  if (!state.analysis) return null;
  return {
    drawing: state.analysis,
    theme: state.customization.theme,
    voice_type: state.customization.voice,
    child_age: state.customization.age,
    personal_context: state.customization.personalContext || undefined,
  };
}, [state.analysis, state.customization]);
```

**Step 3: Create shared doGenerateStory helper**

After generateStoryRequest, add:
```typescript
const doGenerateStory = useCallback(async () => {
  const request = generateStoryRequest();
  if (!request) {
    setError('Missing drawing analysis');
    return null;
  }

  setError(null);
  const script = await generateStory(request);
  setScenes(script.scenes);
  setScript(script);
  return script;
}, [generateStoryRequest, setScript]);
```

**Step 4: Update useEffect to use helper**

Replace the fetchStory function in useEffect with:
```typescript
async function fetchStory() {
  try {
    await doGenerateStory();
  } catch (err) {
    setError('Failed to generate story. Please try again.');
    console.error('Failed to generate story:', err);
  } finally {
    setIsLoading(false);
  }
}
```

**Step 5: Update handleRegenerate to use helper**

Replace handleRegenerate with:
```typescript
const handleRegenerate = async () => {
  setIsRegenerating(true);
  try {
    await doGenerateStory();
  } catch (err) {
    setError('Failed to regenerate story. Please try again.');
    console.error('Failed to regenerate story:', err);
  } finally {
    setIsRegenerating(false);
  }
};
```

**Step 6: Add error UI**

Before the `if (isLoading)` check (around line 84), add:
```typescript
if (error && !isLoading && !isRegenerating) {
  return (
    <WizardLayout
      currentStep={4}
      actionLabel="Create Video"
      actionDisabled={true}
      onAction={() => {}}
    >
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={handleRegenerate}>
          Try Again
        </Button>
      </div>
    </WizardLayout>
  );
}
```

**Step 7: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 8: Run tests**

Run: `cd frontend && npx vitest run`
Expected: All tests pass

**Step 9: Commit**

```bash
git add frontend/src/pages/script.tsx
git commit -m "refactor: extract DRY helper for story generation and add error state"
```

---

### Task 6: Add explicit null checks to preview.tsx

**Files:**
- Modify: `frontend/src/pages/preview.tsx`

**Step 1: Add explicit null checks before API call**

In the runPipeline function, change from:
```typescript
const request: PipelineRequest = {
  run_id: state.run_id!,
  story: state.script!,
  drawing: state.analysis!,
  // ...
};
```
to:
```typescript
// Explicit null checks (defense-in-depth)
if (!state.run_id || !state.script || !state.analysis) {
  setError('Missing required data. Please start over.');
  setIsGenerating(false);
  return;
}

const request: PipelineRequest = {
  run_id: state.run_id,
  story: state.script,
  drawing: state.analysis,
  style: state.customization.style,
  voice_type: state.customization.voice,
  user_id: user?.userId,
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/pages/preview.tsx
git commit -m "refactor: add explicit null checks before pipeline API call"
```

---

## Phase 3: Backend Checkpoint Enhancement

This phase adds checkpoints to stages 1-2 (vision and story) so users don't lose progress.

---

### Task 7: Add user_id to VisionRequest model

**Files:**
- Modify: `backend/packages/app/src/app/models.py`

**Step 1: Update VisionRequest**

Change lines 117-119 from:
```python
class VisionRequest(BaseModel):
    """Request to analyze a drawing."""
    image_base64: str
```
to:
```python
class VisionRequest(BaseModel):
    """Request to analyze a drawing."""
    image_base64: str
    user_id: str | None = None
```

**Step 2: Verify Python syntax**

Run: `cd backend/packages/app && python -c "from src.app.models import VisionRequest; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/models.py
git commit -m "feat: add user_id to VisionRequest for checkpoint support"
```

---

### Task 8: Add user_id to StoryRequest model

**Files:**
- Modify: `backend/packages/app/src/app/models.py`

**Step 1: Update StoryRequest**

Change lines 122-128 from:
```python
class StoryRequest(BaseModel):
    """Request to generate a story."""
    drawing: DrawingAnalysis
    theme: Theme
    personal_context: str | None = None
    voice_type: VoiceType
    child_age: int = Field(ge=2, le=9)
```
to:
```python
class StoryRequest(BaseModel):
    """Request to generate a story."""
    drawing: DrawingAnalysis
    theme: Theme
    personal_context: str | None = None
    voice_type: VoiceType
    child_age: int = Field(ge=2, le=9)
    user_id: str | None = None
    run_id: str | None = None
```

**Step 2: Verify Python syntax**

Run: `cd backend/packages/app && python -c "from src.app.models import StoryRequest; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/models.py
git commit -m "feat: add user_id and run_id to StoryRequest for checkpoint support"
```

---

### Task 9: Save checkpoint in vision endpoint

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Update api_analyze_drawing**

Change lines 95-103 from:
```python
@app.post("/api/v1/vision/analyze", response_model=VisionResponse)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        run_id = uuid.uuid4().hex[:8]
        drawing = await analyze_drawing(request.image_base64)
        return VisionResponse(run_id=run_id, drawing=drawing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```
to:
```python
@app.post("/api/v1/vision/analyze", response_model=VisionResponse)
async def api_analyze_drawing(request: VisionRequest):
    """Stage 1: Analyze a drawing."""
    try:
        run_id = uuid.uuid4().hex[:8]
        drawing = await analyze_drawing(request.image_base64)

        # Save checkpoint if user is authenticated
        if request.user_id:
            db = get_database()
            db.save_checkpoint(request.user_id, run_id, {
                "current_stage": "vision",
                "drawing_analysis": drawing.model_dump(),
            })

        return VisionResponse(run_id=run_id, drawing=drawing)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Verify Python syntax**

Run: `cd backend/packages/app && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat: save checkpoint after vision analysis"
```

---

### Task 10: Save checkpoint in story endpoint

**Files:**
- Modify: `backend/packages/app/src/app/main.py`

**Step 1: Update api_generate_story**

Change lines 106-118 from:
```python
@app.post("/api/v1/story/generate", response_model=StoryScript)
async def api_generate_story(request: StoryRequest):
    """Stage 2: Generate a story."""
    try:
        return await generate_story(
            drawing=request.drawing,
            theme=request.theme,
            child_age=request.child_age,
            voice_type=request.voice_type,
            personal_context=request.personal_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```
to:
```python
@app.post("/api/v1/story/generate", response_model=StoryScript)
async def api_generate_story(request: StoryRequest):
    """Stage 2: Generate a story."""
    try:
        story = await generate_story(
            drawing=request.drawing,
            theme=request.theme,
            child_age=request.child_age,
            voice_type=request.voice_type,
            personal_context=request.personal_context,
        )

        # Save checkpoint if user is authenticated
        if request.user_id and request.run_id:
            db = get_database()
            db.save_checkpoint(request.user_id, request.run_id, {
                "current_stage": "story",
                "drawing_analysis": request.drawing.model_dump(),
                "story_script": story.model_dump(),
            })

        return story
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Step 2: Verify Python syntax**

Run: `cd backend/packages/app && python -c "from src.app.main import app; print('OK')"`
Expected: OK

**Step 3: Commit**

```bash
git add backend/packages/app/src/app/main.py
git commit -m "feat: save checkpoint after story generation"
```

---

### Task 11: Update frontend vision API to pass user_id

**Files:**
- Modify: `frontend/src/api/vision.ts`

**Step 1: Read current file**

Run: `cat frontend/src/api/vision.ts`

**Step 2: Update analyzeDrawing function**

Add user_id parameter. Change from:
```typescript
export async function analyzeDrawing(imageBase64: string): Promise<VisionResponse> {
  return apiRequest<VisionResponse>('/api/v1/vision/analyze', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
}
```
to:
```typescript
export async function analyzeDrawing(imageBase64: string, userId?: string): Promise<VisionResponse> {
  return apiRequest<VisionResponse>('/api/v1/vision/analyze', {
    method: 'POST',
    body: JSON.stringify({
      image_base64: imageBase64,
      user_id: userId,
    }),
  });
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors (may have unused parameter warning, that's OK)

**Step 4: Commit**

```bash
git add frontend/src/api/vision.ts
git commit -m "feat: pass user_id to vision API for checkpoint support"
```

---

### Task 12: Update frontend story API to pass user_id and run_id

**Files:**
- Modify: `frontend/src/api/story.ts`

**Step 1: Read current file**

Run: `cat frontend/src/api/story.ts`

**Step 2: Update StoryRequest interface**

Add user_id and run_id to the interface:
```typescript
export interface StoryRequest {
  drawing: DrawingAnalysis;
  theme: Theme;
  voice_type: VoiceType;
  child_age: number;
  personal_context?: string;
  user_id?: string;
  run_id?: string;
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/api/story.ts
git commit -m "feat: add user_id and run_id to story API request"
```

---

### Task 13: Update recognize.tsx to pass user_id

**Files:**
- Modify: `frontend/src/pages/recognize.tsx`

**Step 1: Add useAuth import**

After line 3, add:
```typescript
import { useAuth } from '../hooks/use-auth';
```

**Step 2: Get user from useAuth**

After line 13 (`const { state, setAnalysis, setRunId } = useWizardState();`), add:
```typescript
const { user } = useAuth();
```

**Step 3: Pass user_id to analyzeDrawing**

Change line 51 from:
```typescript
const response = await analyzeDrawing(base64);
```
to:
```typescript
const response = await analyzeDrawing(base64, user?.userId);
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/recognize.tsx
git commit -m "feat: pass user_id to vision API from recognize page"
```

---

### Task 14: Update script.tsx to pass user_id and run_id

**Files:**
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Add useAuth import (if not present)**

Ensure the import exists:
```typescript
import { useAuth } from '../hooks/use-auth';
```

**Step 2: Get user and run_id**

Update the hook destructuring:
```typescript
const { state, setScript } = useWizardState();
const { user } = useAuth();
```

**Step 3: Update generateStoryRequest to include user_id and run_id**

Update the helper:
```typescript
const generateStoryRequest = useCallback(() => {
  if (!state.analysis) return null;
  return {
    drawing: state.analysis,
    theme: state.customization.theme,
    voice_type: state.customization.voice,
    child_age: state.customization.age,
    personal_context: state.customization.personalContext || undefined,
    user_id: user?.userId,
    run_id: state.run_id || undefined,
  };
}, [state.analysis, state.customization, state.run_id, user?.userId]);
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/script.tsx
git commit -m "feat: pass user_id and run_id to story API from script page"
```

---

### Task 15: Verify checkpoints are saved

**Step 1: Start backend locally or use deployed endpoint**

**Step 2: Test the flow**

1. Sign in
2. Upload an image
3. Check DynamoDB for checkpoint after vision:
   ```bash
   aws dynamodb scan --table-name nocomeleon-checkpoints --limit 5
   ```
4. Continue to script page
5. Check DynamoDB for updated checkpoint after story:
   ```bash
   aws dynamodb scan --table-name nocomeleon-checkpoints --limit 5
   ```

Expected: Checkpoint entries with `current_stage: "vision"` then `current_stage: "story"`

**Step 3: Commit verification notes (if needed)**

No code changes. If issues found, return to Tasks 7-14.

---

## Phase 4: Test Coverage

This phase adds tests for the bug fixes and new functionality.

---

### Task 16: Fix act() warnings in existing tests

**Files:**
- Modify: `frontend/src/__tests__/WizardLayout.test.tsx`

**Step 1: Add waitFor import**

Change the testing-library import from:
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
```
to:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
```

**Step 2: Wrap renders in act where async state updates occur**

The act warnings come from AuthProvider's async `checkAuth()`. Update the mock to be synchronous:

Change the aws-amplify/auth mock from:
```typescript
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('No user')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  confirmSignIn: vi.fn(),
}));
```
to:
```typescript
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockImplementation(() => Promise.reject(new Error('No user'))),
  signIn: vi.fn().mockResolvedValue({ isSignedIn: false }),
  signOut: vi.fn().mockResolvedValue(undefined),
  confirmSignIn: vi.fn().mockResolvedValue({ isSignedIn: false }),
}));
```

**Step 3: Make renderWithRouter async**

Change from:
```typescript
function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}
```
to:
```typescript
async function renderWithRouter(ui: React.ReactElement) {
  const result = render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
  // Wait for auth state to settle
  await waitFor(() => {});
  return result;
}
```

**Step 4: Update all test cases to use await**

Change all `renderWithRouter(...)` calls to `await renderWithRouter(...)` and make test functions async.

Example:
```typescript
it('renders children correctly', async () => {
  await renderWithRouter(
    <WizardLayout ...>
```

**Step 5: Run tests to verify warnings are gone**

Run: `cd frontend && npx vitest run 2>&1 | grep -i "act"`
Expected: No act() warnings

**Step 6: Commit**

```bash
git add frontend/src/__tests__/WizardLayout.test.tsx
git commit -m "test: fix act() warnings in WizardLayout tests"
```

---

### Task 17: Add tests for use-wizard-state hook

**Files:**
- Create: `frontend/src/__tests__/use-wizard-state.test.tsx`

**Step 1: Create the test file**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizardState } from '../hooks/use-wizard-state';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <WizardProvider>{children}</WizardProvider>
);

describe('useWizardState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('setter reference stability', () => {
    it('setRunId maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetRunId = result.current.setRunId;

      // Trigger a re-render by updating state
      act(() => {
        result.current.setRunId('test-id');
      });

      rerender();

      // setRunId should be the same reference
      expect(result.current.setRunId).toBe(firstSetRunId);
    });

    it('setScript maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetScript = result.current.setScript;

      act(() => {
        result.current.setScript({ scenes: [], total_scenes: 0 });
      });

      rerender();

      expect(result.current.setScript).toBe(firstSetScript);
    });

    it('setVideo maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetVideo = result.current.setVideo;

      act(() => {
        result.current.setVideo({
          video_key: 'test-key',
          duration_sec: 30,
          thumbnail_key: 'thumb-key',
        });
      });

      rerender();

      expect(result.current.setVideo).toBe(firstSetVideo);
    });
  });

  describe('state updates', () => {
    it('setRunId updates state correctly', () => {
      const { result } = renderHook(() => useWizardState(), { wrapper });

      act(() => {
        result.current.setRunId('abc123');
      });

      expect(result.current.state.run_id).toBe('abc123');
    });

    it('resetWizard clears all state', () => {
      const { result } = renderHook(() => useWizardState(), { wrapper });

      // Set some state
      act(() => {
        result.current.setRunId('test');
        result.current.setScript({ scenes: [], total_scenes: 0 });
      });

      // Reset
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.state.run_id).toBeNull();
      expect(result.current.state.script).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nocomelon-wizard-state');
    });
  });
});
```

**Step 2: Run the new tests**

Run: `cd frontend && npx vitest run src/__tests__/use-wizard-state.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add frontend/src/__tests__/use-wizard-state.test.tsx
git commit -m "test: add tests for use-wizard-state hook reference stability"
```

---

### Task 18: Add tests for script.tsx API call behavior

**Files:**
- Create: `frontend/src/__tests__/script.test.tsx`

**Step 1: Create the test file**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import ScriptPage from '../pages/script';
import { WizardProvider } from '../hooks/use-wizard-state';
import { AuthProvider } from '../hooks/use-auth';
import * as storyApi from '../api/story';

// Mock react-router
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock aws-amplify/auth
vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: vi.fn().mockRejectedValue(new Error('No user')),
  signIn: vi.fn(),
  signOut: vi.fn(),
  confirmSignIn: vi.fn(),
}));

// Mock the story API
vi.mock('../api/story', () => ({
  generateStory: vi.fn(),
}));

// Mock localStorage with wizard state
const mockWizardState = {
  run_id: 'test-run-id',
  analysis: {
    subject: 'A cat',
    setting: 'Garden',
    mood: 'Happy',
    details: [],
    colors: ['orange'],
  },
  customization: {
    style: 'storybook',
    theme: 'adventure',
    voice: 'gentle',
    age: 4,
    personalContext: '',
  },
  script: null,
  video: null,
};

function renderWithProviders() {
  // Set up localStorage mock before render
  vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(mockWizardState));
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});

  return render(
    <MemoryRouter>
      <AuthProvider>
        <WizardProvider>
          <ScriptPage />
        </WizardProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ScriptPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storyApi.generateStory as ReturnType<typeof vi.fn>).mockResolvedValue({
      scenes: [{ number: 1, text: 'Test scene' }],
      total_scenes: 1,
    });
  });

  it('calls generateStory API only once on mount', async () => {
    renderWithProviders();

    await waitFor(() => {
      expect(storyApi.generateStory).toHaveBeenCalledTimes(1);
    });

    // Wait a bit more to ensure no additional calls
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(storyApi.generateStory).toHaveBeenCalledTimes(1);
  });

  it('does not call API when script already exists in state', async () => {
    // Override mock to include existing script
    const stateWithScript = {
      ...mockWizardState,
      script: { scenes: [{ number: 1, text: 'Existing' }], total_scenes: 1 },
    };
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(stateWithScript));

    render(
      <MemoryRouter>
        <AuthProvider>
          <WizardProvider>
            <ScriptPage />
          </WizardProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Review your story')).toBeInTheDocument();
    });

    expect(storyApi.generateStory).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run the tests**

Run: `cd frontend && npx vitest run src/__tests__/script.test.tsx`
Expected: All tests pass

**Step 3: Commit**

```bash
git add frontend/src/__tests__/script.test.tsx
git commit -m "test: add tests for script page API call behavior"
```

---

## Verification Checklist

After completing all phases:

- [ ] TypeScript compiles without errors: `cd frontend && npx tsc --noEmit`
- [ ] All tests pass: `cd frontend && npx vitest run`
- [ ] Infinite loop fixed: `/api/v1/story/generate` called only once per page load
- [ ] Checkpoints saved: DynamoDB has entries after vision and story stages
- [ ] Backend syntax OK: `python -c "from src.app.main import app"`

---

## Rollback Plan

If issues arise after deployment:

1. **Revert frontend changes**: `git revert HEAD~N` (where N is number of commits)
2. **Revert backend changes**: Redeploy previous Docker image
3. **Clear localStorage**: Users may need to clear localStorage if wizard state format changed

