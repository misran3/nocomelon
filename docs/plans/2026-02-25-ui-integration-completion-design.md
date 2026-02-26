# UI-Backend Integration Completion Design

> **Date**: 2026-02-25
> **Status**: Approved
> **Predecessor**: `2026-02-25-backend-ui-integration-design.md` (Phases 1-4 partial)

## Problem

The original backend-UI integration plan (Phases 1-4) was partially implemented. Only `recognize.tsx` is connected to the backend API. The remaining pages (`script.tsx`, `preview.tsx`, `library.tsx`) still use mock data and localStorage.

### Gaps Identified

1. **script.tsx** - Uses `MOCK_STORY`, not connected to story API
2. **preview.tsx** - Uses `MOCK_VIDEO`, not connected to pipeline API
3. **library.tsx** - Uses localStorage via `useLibrary` hook, not connected to library API
4. **run_id not tracked** - Vision API returns `run_id` but it's discarded
5. **Type mismatches** - Frontend uses `video_path`/`thumbnail` (URLs), backend returns `video_key`/`thumbnail_key` (S3 keys)
6. **S3 URL resolution** - No mechanism to convert S3 keys to presigned URLs

---

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Loading UX for pipeline | Simple spinner | Matches current mock behavior, 30-120s is acceptable wait |
| Library storage | Pure API (no localStorage) | Single source of truth, no sync issues |
| S3 URL resolution | On-demand in components | Lazy loading, URLs generated only when needed |
| Type strategy | Strict alignment with backend | No confusion between frontend/backend types |
| Storybook ID | Use `run_id` | Already unique per session, no extra generation needed |

---

## Type System Alignment

### Backend Types (canonical, in `models.py`)

```python
class VideoResult(BaseModel):
    video_key: str        # S3 key
    duration_sec: float
    thumbnail_key: str    # S3 key

class LibraryEntry(BaseModel):
    id: str
    title: str
    thumbnail_key: str    # S3 key
    video_key: str        # S3 key
    duration_sec: float
    style: Style
    created_at: str       # ISO timestamp
```

### Frontend Types (updated to match)

```typescript
// types/index.ts

export interface VideoResult {
  video_key: string;       // S3 key
  duration_sec: number;
  thumbnail_key: string;   // S3 key
}

export interface LibraryEntry {
  id: string;
  title: string;
  thumbnail_key: string;   // S3 key
  video_key: string;       // S3 key
  duration_sec: number;
  style: Style;
  created_at: string;      // ISO timestamp
}

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

**Removed:** `StorybookEntry` (replaced by `LibraryEntry`)

---

## Data Flow

```
/recognize (vision API)
    └─> POST /api/v1/vision/analyze
    └─> Returns { run_id, drawing }
    └─> Store run_id + analysis in WizardState

/customize (no API call)
    └─> User selects style, theme, voice, age
    └─> run_id preserved in state

/script (story API)
    └─> POST /api/v1/story/generate
    └─> Sends { drawing, theme, voice_type, child_age, personal_context }
    └─> Returns { scenes, total_scenes }
    └─> Store script in WizardState

/preview (pipeline API)
    └─> POST /api/v1/pipeline/generate
    └─> Sends { run_id, story, drawing, style, voice_type, user_id }
    └─> Returns { video: VideoResult, images: [...] }
    └─> Store video in WizardState

Save to library (library API)
    └─> POST /api/v1/library?user_id={userId}
    └─> Sends LibraryEntry (id = run_id)
    └─> Persists to DynamoDB
```

---

## S3 URL Resolution

### useS3Url Hook

On-demand resolution of S3 keys to presigned URLs using Amplify Storage.

```typescript
// hooks/use-s3-url.ts

import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

export function useS3Url(key: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setUrl(null);
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
          setError(e.message);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [key]);

  return { url, isLoading, error };
}
```

### Usage Pattern

```typescript
// In components that display S3 assets
const { url: thumbnailUrl, isLoading } = useS3Url(entry.thumbnail_key);

return isLoading ? <Skeleton /> : <img src={thumbnailUrl} />;
```

---

## useLibrary Hook Rewrite

Replace localStorage-based implementation with pure API.

```typescript
// hooks/use-library.ts

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getLibrary, saveToLibrary, deleteFromLibrary, LibraryEntry } from '../api';

export function useLibrary() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    async function fetchLibrary() {
      try {
        const data = await getLibrary(user.userId);
        setLibrary(data);
      } catch (e) {
        setError('Failed to load library');
      } finally {
        setIsLoading(false);
      }
    }
    fetchLibrary();
  }, [user]);

  const addStorybook = async (entry: LibraryEntry) => {
    await saveToLibrary(entry, user!.userId);
    setLibrary(prev => [entry, ...prev]);
  };

  const removeStorybook = async (id: string) => {
    await deleteFromLibrary(id, user!.userId);
    setLibrary(prev => prev.filter(item => item.id !== id));
  };

  return { library, isLoading, error, addStorybook, removeStorybook };
}
```

**Key changes from current implementation:**
- Requires `useAuth()` for user ID
- Returns `isLoading` and `error` states
- `addStorybook` and `removeStorybook` are async
- No localStorage, no mock data fallback

---

## Page Changes

### recognize.tsx

Already connected to vision API. Add `run_id` storage:

```typescript
const response = await analyzeDrawing(base64);
setRunId(response.run_id);  // NEW
setFormData({ ... });
```

### script.tsx

Replace mock with API:

```typescript
// Remove: import { MOCK_STORY } from '../lib/mock-data';
// Add:
import { generateStory } from '../api';

// On mount and regenerate:
const script = await generateStory({
  drawing: state.analysis!,
  theme: state.customization.theme,
  voice_type: state.customization.voice,
  child_age: state.customization.age,
  personal_context: state.customization.personalContext || undefined,
});
setScenes(script.scenes);
setScript(script);
```

### preview.tsx

Replace mock with pipeline API:

```typescript
// Remove: import { MOCK_VIDEO } from '../lib/mock-data';
// Add:
import { generateVideo, PipelineRequest } from '../api';
import { useS3Url } from '../hooks/use-s3-url';

// S3 URL resolution
const { url: videoUrl } = useS3Url(state.video?.video_key);
const { url: posterUrl } = useS3Url(state.video?.thumbnail_key);

// On mount (if no video yet):
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

// Save handler:
const entry: LibraryEntry = {
  id: state.run_id!,  // Use run_id as storybook ID
  title: state.analysis?.subject || 'My Storybook',
  thumbnail_key: state.video!.thumbnail_key,
  video_key: state.video!.video_key,
  duration_sec: state.video!.duration_sec,
  style: state.customization.style,
  created_at: new Date().toISOString(),
};
await addStorybook(entry);
```

### library.tsx

Handle loading/error states:

```typescript
const { library, isLoading, error, removeStorybook } = useLibrary();

if (isLoading) return <LibrarySkeleton />;
if (error) return <ErrorState message={error} onRetry={() => window.location.reload()} />;

// Delete is now async:
onDelete={async (id) => {
  await removeStorybook(id);
  toast.success('Storybook deleted');
}}
```

---

## Component Changes

### StorybookCard.tsx

```typescript
import { LibraryEntry } from '../../types';  // Changed from StorybookEntry
import { useS3Url } from '../../hooks/use-s3-url';

interface StorybookCardProps {
  storybook: LibraryEntry;
  onClick: () => void;
}

export function StorybookCard({ storybook, onClick }: StorybookCardProps) {
  const { url: thumbnailUrl, isLoading } = useS3Url(storybook.thumbnail_key);
  // ...
}
```

### StorybookSheet.tsx

```typescript
import { LibraryEntry } from '../../types';  // Changed from StorybookEntry
import { useS3Url } from '../../hooks/use-s3-url';

interface StorybookSheetProps {
  storybook: LibraryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;  // Now async
}

export function StorybookSheet({ ... }: StorybookSheetProps) {
  const { url: videoUrl } = useS3Url(storybook?.video_key);
  const { url: thumbnailUrl } = useS3Url(storybook?.thumbnail_key);
  // ...
}
```

---

## Error Handling

**Pattern for all API calls:**
```typescript
try {
  const result = await apiCall();
  // success handling
} catch (error) {
  toast.error('User-friendly message');
  // Optionally set error state for UI
}
```

**Loading states:**
- Each page manages `isLoading` state
- Show `<Skeleton>` during loading
- Disable action buttons while loading

**Error recovery:**
- Toast for transient errors
- Error state + retry button for critical failures (library won't load)

---

## File Manifest

### Files to Create (1)

| File | Purpose |
|------|---------|
| `hooks/use-s3-url.ts` | On-demand S3 key → presigned URL resolution |

### Files to Modify (9)

| File | Changes |
|------|---------|
| `types/index.ts` | Update VideoResult, replace StorybookEntry with LibraryEntry, add run_id to WizardState |
| `hooks/use-wizard-state.tsx` | Add run_id field and setRunId method |
| `hooks/use-library.ts` | Rewrite: pure API, async methods, loading/error states |
| `pages/recognize.tsx` | Store run_id from vision response |
| `pages/script.tsx` | Replace mock with generateStory() API |
| `pages/preview.tsx` | Replace mock with generateVideo() API, use S3 URLs, async save |
| `pages/library.tsx` | Handle loading/error states, async delete |
| `components/library/StorybookCard.tsx` | Use LibraryEntry, add useS3Url |
| `components/library/StorybookSheet.tsx` | Use LibraryEntry, add useS3Url, async delete |

### Files to Delete (1)

| File | Reason |
|------|--------|
| `lib/mock-data.ts` | No longer needed, all data from API |

### Dependencies to Add

None.
