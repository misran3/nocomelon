# UI Integration Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete the UI-backend integration by connecting script.tsx, preview.tsx, and library.tsx to real APIs with strict type alignment.

**Architecture:** Update frontend types to match backend exactly, add run_id tracking through wizard flow, create useS3Url hook for on-demand URL resolution, rewrite useLibrary hook for pure API access.

**Tech Stack:** React, TypeScript, AWS Amplify Storage, FastAPI backend

---

## Task 1: Update Types for Backend Alignment

**Files:**
- Modify: `frontend/src/types/index.ts`

**Step 1: Update VideoResult interface**

Change from URL-based to S3 key-based:

```typescript
export interface VideoResult {
  video_key: string;       // S3 key (was video_path)
  duration_sec: number;
  thumbnail_key: string;   // S3 key (was thumbnail)
}
```

**Step 2: Replace StorybookEntry with LibraryEntry**

Remove StorybookEntry and add LibraryEntry to match backend:

```typescript
export interface LibraryEntry {
  id: string;
  title: string;
  thumbnail_key: string;   // S3 key
  video_key: string;       // S3 key
  duration_sec: number;
  style: Style;
  created_at: string;      // ISO timestamp (not Date)
}
```

**Step 3: Add run_id to WizardState**

```typescript
export interface WizardState {
  run_id: string | null;   // NEW: from vision API
  drawing: File | null;
  analysis: DrawingAnalysis | null;
  customization: {
    style: Style;
    theme: Theme;
    voice: VoiceType;
    age: number;
    personalContext: string;
  };
  script: StoryScript | null;
  video: VideoResult | null;
}
```

**Step 4: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Errors in files that used old types (expected, will fix in subsequent tasks)

**Step 5: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: align frontend types with backend (VideoResult, LibraryEntry, run_id)"
```

---

## Task 2: Update WizardState Hook

**Files:**
- Modify: `frontend/src/hooks/use-wizard-state.tsx`

**Step 1: Add run_id to initial state**

Update initialState:

```typescript
const initialState: WizardState = {
  run_id: null,           // NEW
  drawing: null,
  analysis: null,
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
```

**Step 2: Add setRunId to context type**

```typescript
interface WizardContextType {
  state: WizardState;
  setRunId: (runId: string | null) => void;  // NEW
  setDrawing: (drawing: File | null) => void;
  setAnalysis: (analysis: DrawingAnalysis | null) => void;
  setCustomization: (customization: Partial<WizardState['customization']>) => void;
  setScript: (script: StoryScript | null) => void;
  setVideo: (video: VideoResult | null) => void;
  resetWizard: () => void;
}
```

**Step 3: Implement setRunId function**

Add inside WizardProvider:

```typescript
const setRunId = (run_id: string | null) => {
  setState((prev) => ({ ...prev, run_id }));
};
```

**Step 4: Add setRunId to provider value**

```typescript
<WizardContext.Provider
  value={{
    state,
    setRunId,        // NEW
    setDrawing,
    setAnalysis,
    setCustomization,
    setScript,
    setVideo,
    resetWizard,
  }}
>
```

**Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: Fewer errors (wizard state issues resolved)

**Step 6: Commit**

```bash
git add frontend/src/hooks/use-wizard-state.tsx
git commit -m "feat: add run_id tracking to wizard state"
```

---

## Task 3: Create useS3Url Hook

**Files:**
- Create: `frontend/src/hooks/use-s3-url.ts`

**Step 1: Create the hook file**

```typescript
import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

export function useS3Url(key: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getUrl({ key })
      .then(({ url }) => {
        if (!cancelled) {
          setUrl(url.toString());
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to get URL');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { url, isLoading, error };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No new errors

**Step 3: Commit**

```bash
git add frontend/src/hooks/use-s3-url.ts
git commit -m "feat: add useS3Url hook for S3 key to presigned URL resolution"
```

---

## Task 4: Rewrite useLibrary Hook

**Files:**
- Modify: `frontend/src/hooks/use-library.ts`

**Step 1: Replace entire file contents**

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getLibrary, saveToLibrary, deleteFromLibrary } from '../api';
import { LibraryEntry } from '../types';

export function useLibrary() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchLibrary() {
      try {
        const data = await getLibrary(user!.userId);
        setLibrary(data);
        setError(null);
      } catch (e) {
        setError('Failed to load library');
        console.error('Failed to load library:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLibrary();
  }, [user]);

  const addStorybook = async (entry: LibraryEntry) => {
    if (!user) throw new Error('Not authenticated');
    await saveToLibrary(entry, user.userId);
    setLibrary((prev) => [entry, ...prev]);
  };

  const removeStorybook = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await deleteFromLibrary(id, user.userId);
    setLibrary((prev) => prev.filter((item) => item.id !== id));
  };

  const getStorybook = (id: string) => {
    return library.find((item) => item.id === id);
  };

  return {
    library,
    isLoading,
    error,
    addStorybook,
    removeStorybook,
    getStorybook,
  };
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors in use-library.ts

**Step 3: Commit**

```bash
git add frontend/src/hooks/use-library.ts
git commit -m "feat: rewrite useLibrary hook for pure API access"
```

---

## Task 5: Update recognize.tsx to Store run_id

**Files:**
- Modify: `frontend/src/pages/recognize.tsx`

**Step 1: Add setRunId to destructured hook**

Change line ~13:

```typescript
const { state, setAnalysis, setRunId } = useWizardState();
```

**Step 2: Store run_id after API response**

In the analyze function, after receiving response (around line 51-58), add setRunId call:

```typescript
const response = await analyzeDrawing(base64);
setRunId(response.run_id);  // NEW: store run_id
setFormData({
  subject: response.drawing.subject,
  setting: response.drawing.setting,
  mood: response.drawing.mood,
});
setColors(response.drawing.colors);
setDetails(response.drawing.details);
setAnalyzing(false);
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/pages/recognize.tsx
git commit -m "feat: store run_id from vision API in wizard state"
```

---

## Task 6: Update script.tsx to Use Story API

**Files:**
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Update imports**

Remove mock import, add API import:

```typescript
// Remove this line:
// import { MOCK_STORY } from '../lib/mock-data';

// Add this import:
import { generateStory } from '../api';
import { toast } from 'sonner';
```

**Step 2: Initialize scenes as empty array**

Change line ~15:

```typescript
const [scenes, setScenes] = useState<Scene[]>([]);
```

**Step 3: Replace useEffect with API call**

Replace the useEffect (lines ~19-32) with:

```typescript
useEffect(() => {
  document.title = 'NoComelon | Script';
  if (!state.analysis || !state.customization.style) {
    navigate('/customize', { replace: true });
    return;
  }

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
}, [state.analysis, state.customization, navigate, setScript]);
```

**Step 4: Replace handleRegenerate with API call**

Replace handleRegenerate function (lines ~34-40):

```typescript
const handleRegenerate = async () => {
  setIsRegenerating(true);
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
    toast.error('Failed to regenerate story');
    console.error('Failed to regenerate story:', error);
  } finally {
    setIsRegenerating(false);
  }
};
```

**Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/pages/script.tsx
git commit -m "feat: connect script page to story generation API"
```

---

## Task 7: Update preview.tsx to Use Pipeline API

**Files:**
- Modify: `frontend/src/pages/preview.tsx`

**Step 1: Update imports**

```typescript
// Remove:
// import { MOCK_VIDEO } from '../lib/mock-data';

// Add:
import { generateVideo, PipelineRequest } from '../api';
import { useAuth } from '../hooks/use-auth';
import { useS3Url } from '../hooks/use-s3-url';
import { LibraryEntry } from '../types';
```

**Step 2: Add hooks and state**

After existing hooks, add:

```typescript
const { user } = useAuth();
const [error, setError] = useState<string | null>(null);

// S3 URL resolution for video playback
const { url: videoUrl, isLoading: videoUrlLoading } = useS3Url(state.video?.video_key);
const { url: posterUrl } = useS3Url(state.video?.thumbnail_key);
```

**Step 3: Replace useEffect with pipeline API**

Replace the useEffect (lines ~30-45):

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

**Step 4: Replace handleSave with LibraryEntry**

```typescript
const handleSave = async () => {
  if (!state.video || !state.run_id) return;

  const entry: LibraryEntry = {
    id: state.run_id,
    title: state.analysis?.subject || 'My Storybook',
    thumbnail_key: state.video.thumbnail_key,
    video_key: state.video.video_key,
    duration_sec: state.video.duration_sec,
    style: state.customization.style,
    created_at: new Date().toISOString(),
  };

  try {
    await addStorybook(entry);
    toast.success('Saved to library!');
    resetWizard();
    navigate('/library');
  } catch (e) {
    toast.error('Failed to save to library');
    console.error('Save error:', e);
  }
};
```

**Step 5: Update guard check**

```typescript
if (!state.script || !state.run_id) return null;
```

**Step 6: Add error state rendering**

After the isGenerating skeleton, add error handling:

```typescript
if (error) {
  return (
    <WizardLayout
      currentStep={5}
      actionLabel="Save to Library"
      actionDisabled={true}
      onAction={() => {}}
    >
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button variant="outline" onClick={() => navigate('/script')}>
          Go Back to Script
        </Button>
      </div>
    </WizardLayout>
  );
}
```

**Step 7: Update video player to use S3 URLs**

Replace MOCK_VIDEO references with state.video and resolved URLs:

```typescript
const minutes = Math.floor((state.video?.duration_sec || 0) / 60);
const seconds = ((state.video?.duration_sec || 0) % 60).toString().padStart(2, '0');

// In render:
<VideoPlayer
  src={videoUrl || ''}
  poster={posterUrl || ''}
/>
```

**Step 8: Update title display**

```typescript
<p className="text-lg font-semibold">{state.analysis?.subject || 'My Storybook'}</p>
```

**Step 9: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 10: Commit**

```bash
git add frontend/src/pages/preview.tsx
git commit -m "feat: connect preview page to pipeline API with S3 URL resolution"
```

---

## Task 8: Update library.tsx for Loading/Error States

**Files:**
- Modify: `frontend/src/pages/library.tsx`

**Step 1: Update imports**

```typescript
// Change StorybookEntry to LibraryEntry
import { LibraryEntry } from '../types';
```

**Step 2: Update useLibrary destructuring**

```typescript
const { library, isLoading, error, removeStorybook } = useLibrary();
```

**Step 3: Update selectedStory state type**

```typescript
const [selectedStory, setSelectedStory] = useState<LibraryEntry | null>(null);
```

**Step 4: Update handleStoryClick parameter type**

```typescript
const handleStoryClick = (story: LibraryEntry) => {
  setSelectedStory(story);
  setSheetOpen(true);
};
```

**Step 5: Add loading state render**

After the useEffect, add:

```typescript
if (isLoading) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full`}>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      </main>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full flex flex-col items-center justify-center`}>
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </main>
    </div>
  );
}
```

**Step 6: Update onDelete to be async**

```typescript
onDelete={async (id) => {
  await removeStorybook(id);
  setSheetOpen(false);
  toast.success('Storybook deleted');
}}
```

**Step 7: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add frontend/src/pages/library.tsx
git commit -m "feat: add loading/error states to library page"
```

---

## Task 9: Update StorybookCard Component

**Files:**
- Modify: `frontend/src/components/library/StorybookCard.tsx`

**Step 1: Update imports**

```typescript
import { LibraryEntry } from '../../types';
import { useS3Url } from '../../hooks/use-s3-url';
import { Skeleton } from '../ui/skeleton';
```

**Step 2: Update interface**

```typescript
interface StorybookCardProps {
  storybook: LibraryEntry;
  onClick: () => void;
}
```

**Step 3: Add S3 URL resolution**

Inside the component:

```typescript
export function StorybookCard({ storybook, onClick }: StorybookCardProps) {
  const { url: thumbnailUrl, isLoading } = useS3Url(storybook.thumbnail_key);

  const minutes = Math.floor(storybook.duration_sec / 60);
  const seconds = (storybook.duration_sec % 60).toString().padStart(2, '0');

  // ... rest of component
}
```

**Step 4: Update image rendering**

Replace the image element with loading state:

```typescript
{isLoading ? (
  <Skeleton className="absolute inset-0" />
) : (
  <img
    src={thumbnailUrl || ''}
    alt={storybook.title}
    className="w-full h-full object-cover"
  />
)}
```

**Step 5: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/components/library/StorybookCard.tsx
git commit -m "feat: update StorybookCard to use LibraryEntry and S3 URLs"
```

---

## Task 10: Update StorybookSheet Component

**Files:**
- Modify: `frontend/src/components/library/StorybookSheet.tsx`

**Step 1: Update imports**

```typescript
import { LibraryEntry } from '../../types';
import { useS3Url } from '../../hooks/use-s3-url';
```

**Step 2: Update interface**

```typescript
interface StorybookSheetProps {
  storybook: LibraryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;
}
```

**Step 3: Add S3 URL resolution and delete state**

```typescript
export function StorybookSheet({ storybook, open, onOpenChange, onDelete }: StorybookSheetProps) {
  const { url: videoUrl } = useS3Url(storybook?.video_key);
  const { url: thumbnailUrl } = useS3Url(storybook?.thumbnail_key);
  const [isDeleting, setIsDeleting] = useState(false);

  // ...
}
```

**Step 4: Add async delete handler**

```typescript
const handleDelete = async () => {
  if (!storybook) return;
  setIsDeleting(true);
  try {
    await onDelete(storybook.id);
  } finally {
    setIsDeleting(false);
  }
};
```

**Step 5: Update video player props**

```typescript
<VideoPlayer src={videoUrl || ''} poster={thumbnailUrl || ''} />
```

**Step 6: Update date formatting**

Change from `storybook.createdAt` (Date) to `storybook.created_at` (string):

```typescript
<p>{new Date(storybook.created_at).toLocaleDateString()}</p>
```

**Step 7: Update delete button**

```typescript
<Button
  variant="destructive"
  onClick={handleDelete}
  disabled={isDeleting}
>
  {isDeleting ? 'Deleting...' : 'Delete'}
</Button>
```

**Step 8: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 9: Commit**

```bash
git add frontend/src/components/library/StorybookSheet.tsx
git commit -m "feat: update StorybookSheet to use LibraryEntry and S3 URLs"
```

---

## Task 11: Delete Mock Data File

**Files:**
- Delete: `frontend/src/lib/mock-data.ts`

**Step 1: Verify no remaining imports**

Run: `cd frontend && grep -r "mock-data" src/`
Expected: No results (all imports removed in previous tasks)

**Step 2: Delete the file**

```bash
rm frontend/src/lib/mock-data.ts
```

**Step 3: Verify TypeScript compiles**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove mock data file (all data now from API)"
```

---

## Task 12: Final Verification

**Step 1: Run full TypeScript check**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 2: Run linter**

Run: `cd frontend && npm run lint`
Expected: No errors (or only pre-existing warnings)

**Step 3: Start dev server**

Run: `cd frontend && npm run dev`
Expected: Server starts without errors

**Step 4: Manual test checklist**

1. Sign in
2. Upload an image → verify analyze API called, run_id stored
3. Continue to script → verify story API called
4. Continue to preview → verify pipeline API called, video displays
5. Save to library → verify library API called
6. Go to library → verify entries load from API
7. Delete a storybook → verify delete API called

**Step 5: Commit any fixes**

If any issues found, fix and commit.

---

## Verification Checklist

- [ ] Types aligned: VideoResult, LibraryEntry, WizardState.run_id
- [ ] run_id flows: recognize → stored → preview → pipeline request
- [ ] script.tsx: calls generateStory API
- [ ] preview.tsx: calls generateVideo API, uses S3 URLs
- [ ] library.tsx: loading/error states, async delete
- [ ] StorybookCard: uses LibraryEntry, resolves S3 URL
- [ ] StorybookSheet: uses LibraryEntry, resolves S3 URLs, async delete
- [ ] mock-data.ts: deleted
- [ ] TypeScript: no errors
- [ ] Manual test: full flow works
