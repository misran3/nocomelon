# NoComelon UI Design Specification

> **Date**: 2026-02-22
> **Status**: Approved
> **Purpose**: Master spec for VibeFlow to build the NoComelon frontend
> **Tech Stack**: React + Vite + Tailwind CSS + shadcn/ui + react-router

---

## 1. Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Aesthetic** | Playful & Colorful (simple) | Friendly for parents, not childish, not flashy |
| **Navigation** | Linear Wizard Flow | Matches product spec, easy for VibeFlow |
| **Customization** | Single form page | Consolidates 4 wizard steps into 1 |
| **Device target** | Mobile-first | Primary use case is phone |
| **Data source** | Mock data (no backend) | Frontend-only for hackathon |
| **State management** | React Context + localStorage | Persists across refresh |
| **Forms** | react-hook-form + zod | Type-safe validation |

---

## 2. Design System

### Color Palette

```css
:root {
  --primary: #FF6B6B;           /* Coral - buttons, accents */
  --primary-hover: #FF5252;     /* Button hover */
  --secondary: #4ECDC4;         /* Teal - success, secondary actions */
  --accent: #FFE66D;            /* Sunny Yellow - highlights */
  --background: #FAFAFA;        /* Page background */
  --surface: #FFFFFF;           /* Cards, inputs */
  --text: #2D3748;              /* Body text */
  --text-muted: #718096;        /* Secondary text */
  --border: #E2E8F0;            /* Borders, dividers */
}
```

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| H1 | Inter | 28px | 700 |
| H2 | Inter | 22px | 600 |
| H3 | Inter | 18px | 600 |
| Body | Inter | 16px | 400 |
| Small | Inter | 14px | 400 |
| Caption | Inter | 12px | 500 |

### Spacing Scale

Tailwind default: `4, 8, 12, 16, 24, 32, 48, 64` (px)

### Border Radius

- Buttons/Inputs: `8px` (rounded-lg)
- Cards: `12px` (rounded-xl)
- Images: `16px` (rounded-2xl)

---

## 3. Page Structure

### Routes

| Route | Page | Pipeline Stage |
|-------|------|----------------|
| `/` | Redirect to `/upload` | - |
| `/upload` | Upload Drawing | (input) |
| `/recognize` | Confirm AI Interpretation | Vision |
| `/customize` | Style/Theme/Voice/Age Form | Story config |
| `/script` | Review Story Script | Story output |
| `/preview` | Watch Final Video | Images + Voice + Video |
| `/library` | Saved Storybooks | (output) |

### Layout Structure

```
+-----------------------------+
|  App Header (fixed top)     |  56px - Logo + menu
+-----------------------------+
|  Progress Bar               |  Wizard steps (not on /library)
+-----------------------------+
|                             |
|      Page Content           |  Scrollable area
|      (varies per page)      |
|                             |
+-----------------------------+
|  Action Button (fixed bot)  |  Primary CTA
+-----------------------------+
```

### Navigation Rules

1. **Forward**: Only via primary action button (validates current step)
2. **Back**: Via progress bar tap OR browser back
3. **State persistence**: All form data saved to localStorage on each step

---

## 4. Shared Components

### Layout Components

| Component | Purpose |
|-----------|---------|
| `<AppHeader>` | Fixed header with logo (left), hamburger menu (right) |
| `<WizardLayout>` | Wraps wizard pages with progress bar + action button slot |
| `<ProgressBar>` | 6 steps, current=primary color, completed=secondary |

### Feature Components

| Component | Used In | Purpose |
|-----------|---------|---------|
| `<ImageUploader>` | Upload | Drag/drop + tap for camera/gallery |
| `<StylePicker>` | Customize | 2-column grid of style cards |
| `<ThemePicker>` | Customize | Grid of theme icons |
| `<VoicePicker>` | Customize | Radio buttons with audio preview |
| `<AgePicker>` | Customize | Segmented control (2-9) |
| `<SceneEditor>` | Script | Editable scene card with textarea |
| `<VideoPlayer>` | Preview, Library | Video player with controls |
| `<StorybookCard>` | Library | Thumbnail + title grid item |
| `<StorybookSheet>` | Library | Bottom sheet with video + actions |

---

## 5. Page Specifications

### Page 1: Upload (`/upload`)

**Purpose**: Parent uploads their child's drawing

**UI Layout**:
```
[Header]
[Progress: Step 1 of 6]

Heading: "Upload your child's drawing"
Subtext: "Take a photo or choose from camera roll"

[Upload Zone]
- Dashed border, tap to open camera/gallery
- After upload: shows image preview
- Tap preview to replace

[Action Button: "Analyze Drawing"]
- Disabled until image uploaded
```

**States**:
- Empty (no image)
- Image selected (show preview)
- Loading (uploading)

**Mock Data**: None required

---

### Page 2: Recognize (`/recognize`)

**Purpose**: Show AI interpretation, parent confirms or edits

**UI Layout**:
```
[Header]
[Progress: Step 2 of 6]

[Drawing thumbnail - 120x120]

Section: "We see..."

[Editable Card]
- Subject: [input field]
- Setting: [textarea]
- Mood: [input field]

Colors: [color chips - display only]

[Action Button: "Looks Good!"]
```

**States**:
- Loading (analyzing skeleton)
- Ready (form populated)
- Editing (user typing)

**Mock Data**:
```typescript
interface DrawingAnalysis {
  subject: string;      // "a purple dinosaur"
  setting: string;      // "standing in a green field with flowers"
  details: string[];    // ["big friendly eyes", "spiky back"]
  mood: string;         // "happy and playful"
  colors: string[];     // ["purple", "green", "yellow"]
}
```

---

### Page 3: Customize (`/customize`)

**Purpose**: Single form for all story customization

**UI Layout**:
```
[Header]
[Progress: Step 3 of 6]

Heading: "Customize your story"

--- Visual Style ---
[2-column grid]
- Storybook card (selected = primary border)
- Watercolor card

--- Theme ---
[Horizontal scrollable or wrap grid]
- Adventure, Kindness, Bravery, Bedtime,
  Friendship, Counting, Nature

--- Personal Touch (optional) ---
[Textarea placeholder: "e.g., nervous about swim lessons"]

--- Narrator Voice ---
[Radio buttons with play icon]
- Gentle Storyteller (warm, calm)
- Cheerful Narrator (bright, energetic)

--- Child's Age ---
[Segmented control: 2-9]

[Action Button: "Generate Story"]
- Disabled until all required fields selected
```

**States**:
- Empty (nothing selected)
- Partially complete
- Complete (button enabled)

**Mock Data**:
```typescript
const STYLES = [
  { id: 'storybook', label: 'Storybook', icon: '📖' },
  { id: 'watercolor', label: 'Watercolor', icon: '🎨' },
];

const THEMES = [
  { id: 'adventure', label: 'Adventure', icon: '🗺️' },
  { id: 'kindness', label: 'Kindness', icon: '💝' },
  { id: 'bravery', label: 'Bravery', icon: '🦁' },
  { id: 'bedtime', label: 'Bedtime', icon: '🌙' },
  { id: 'friendship', label: 'Friendship', icon: '🤝' },
  { id: 'counting', label: 'Counting', icon: '🔢' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
];

const VOICES = [
  { id: 'gentle', label: 'Gentle Storyteller', description: 'Warm, calm — good for bedtime' },
  { id: 'cheerful', label: 'Cheerful Narrator', description: 'Bright, energetic — good for younger kids' },
];
```

**Form Validation** (zod schema):
```typescript
const customizeSchema = z.object({
  style: z.enum(['storybook', 'watercolor']),
  theme: z.enum(['adventure', 'kindness', 'bravery', 'bedtime', 'friendship', 'counting', 'nature']),
  voice: z.enum(['gentle', 'cheerful']),
  age: z.number().min(2).max(9),
  personalContext: z.string().optional(),
});
```

---

### Page 4: Script (`/script`)

**Purpose**: Parent reviews and edits story script

**UI Layout**:
```
[Header]
[Progress: Step 4 of 6]

Heading: "Review your story"
Subtext: "Edit any text below"

[Scene Cards - scrollable list]
Each card:
- Scene number label
- Editable textarea with scene text

[Secondary Button: "Regenerate Story"]

[Action Button: "Create Video"]
```

**States**:
- Loading (generating skeleton)
- Ready (scenes displayed)
- Editing (user typing)
- Regenerating (secondary button loading)

**Mock Data**:
```typescript
interface Scene {
  number: number;
  text: string;
}

interface StoryScript {
  scenes: Scene[];
  total_scenes: number;
}

const MOCK_STORY: StoryScript = {
  scenes: [
    { number: 1, text: "Once upon a time, there was a little purple dinosaur named Dino who lived in a beautiful green meadow." },
    { number: 2, text: "One sunny morning, Dino heard exciting news — tomorrow was his first day at Dinosaur School!" },
    { number: 3, text: "\"What if the other dinosaurs don't like me?\" Dino worried, his tail drooping." },
    { number: 4, text: "But then Dino remembered what his mama always said: \"Being brave doesn't mean not being scared. It means trying anyway.\"" },
    { number: 5, text: "The next day, Dino took a deep breath and walked through the school gates..." },
    { number: 6, text: "And guess what? He made three new friends before lunchtime! Dino learned that sometimes the scariest things turn into the best adventures." },
  ],
  total_scenes: 6,
};
```

---

### Page 5: Preview (`/preview`)

**Purpose**: Parent watches final video, saves or discards

**UI Layout**:
```
[Header]
[Progress: Step 5 of 6]

Heading: "Preview your storybook"

[Video Player - 16:9 aspect ratio]
- Play/pause controls
- Progress bar
- Fullscreen option

Title: "Dino's First Day"
Metadata: "1:15 • Storybook style"

[Secondary Button: "Try different look"]

[Action Button: "Save to Library"]
[Text Button: "Discard" - destructive]
```

**States**:
- Loading (generating progress animation)
- Ready (video loaded)
- Playing
- Finished (show replay)

**Mock Data**:
```typescript
interface VideoResult {
  video_path: string;
  duration_sec: number;
  thumbnail: string;
}

const MOCK_VIDEO: VideoResult = {
  video_path: '/videos/sample-storybook.mp4',
  duration_sec: 75,
  thumbnail: '/videos/thumbnail.png',
};
```

---

### Page 6: Library (`/library`)

**Purpose**: View saved storybooks, replay, share

**UI Layout**:
```
[Header]
(No progress bar - outside wizard)

Heading: "Your Storybooks"
Badge: "3 stories"

[2-column Grid]
- StorybookCard for each saved storybook
- Empty slot with "+" icon = create new

[Empty State - if no storybooks]
- Illustration
- "Create your first story" CTA
```

**StorybookCard**:
- Thumbnail image
- Title
- Duration

**StorybookSheet (on card tap)**:
- Video player
- Metadata (date, style)
- "Play Full Screen" button
- "Share with Family" button (copies link, shows toast)
- "Delete" button (confirmation dialog)

**Mock Data**:
```typescript
interface StorybookEntry {
  id: string;
  title: string;
  thumbnail: string;
  duration_sec: number;
  style: 'storybook' | 'watercolor';
  createdAt: Date;
}

const MOCK_LIBRARY: StorybookEntry[] = [
  {
    id: '1',
    title: "Dino's First Day",
    thumbnail: '/thumbnails/dino.png',
    duration_sec: 75,
    style: 'storybook',
    createdAt: new Date('2026-02-22'),
  },
  {
    id: '2',
    title: "Luna's Adventure",
    thumbnail: '/thumbnails/luna.png',
    duration_sec: 68,
    style: 'watercolor',
    createdAt: new Date('2026-02-20'),
  },
];
```

---

## 6. Component Architecture

### Directory Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui (exists)
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── WizardLayout.tsx
│   │   └── ProgressBar.tsx
│   ├── upload/
│   │   └── ImageUploader.tsx
│   ├── customize/
│   │   ├── StylePicker.tsx
│   │   ├── ThemePicker.tsx
│   │   ├── VoicePicker.tsx
│   │   └── AgePicker.tsx
│   ├── script/
│   │   └── SceneEditor.tsx
│   ├── preview/
│   │   └── VideoPlayer.tsx
│   └── library/
│       ├── StorybookCard.tsx
│       └── StorybookSheet.tsx
├── pages/
│   ├── upload.tsx
│   ├── recognize.tsx
│   ├── customize.tsx
│   ├── script.tsx
│   ├── preview.tsx
│   └── library.tsx
├── hooks/
│   ├── use-wizard-state.ts
│   └── use-library.ts
├── lib/
│   ├── mock-data.ts
│   └── utils.ts
└── types/
    └── index.ts
```

### State Management

```typescript
// Wizard state context
interface WizardState {
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

// Persisted to localStorage on every change
```

---

## 7. Code Quality Guidelines

### React Anti-Patterns to Avoid

| Anti-Pattern | How to Avoid |
|--------------|--------------|
| Prop drilling | Use React Context for wizard state |
| God components | Pages <150 lines, extract logic to hooks |
| Inline functions in JSX | Use `useCallback` or named functions |
| State in wrong component | Lift to nearest common ancestor |
| Missing keys | Use stable IDs, never array index |
| Direct DOM manipulation | Use refs only when necessary |
| Unnecessary re-renders | `React.memo` for list items |

### Single Responsibility Principle

- `ImageUploader` → Handles upload interaction only
- `StylePicker` → Renders style options only
- `WizardLayout` → Renders layout chrome only
- `useWizardState` → Manages wizard data only

### Component Contracts

Each component receives props and emits events:

```typescript
// Example: StylePicker
interface StylePickerProps {
  value: Style | null;
  onChange: (style: Style) => void;
}
```

---

## 8. Mock Assets Required

| Asset | Path | Description |
|-------|------|-------------|
| Sample video | `/videos/sample-storybook.mp4` | 60-90 sec storybook video |
| Video thumbnail | `/videos/thumbnail.png` | 16:9 preview image |
| Library thumbnails | `/thumbnails/*.png` | 2-3 sample storybook covers |
| Voice samples | `/audio/gentle.mp3`, `/audio/cheerful.mp3` | 5-10 sec voice clips |
| Style previews | `/previews/storybook.png`, `/previews/watercolor.png` | Style example images |

---

## 9. VibeFlow Build Order

Build in this order for incremental testing:

1. **Foundation**: Design system (colors in CSS), AppHeader
2. **Page 6: Library** (simpler, no wizard state needed)
3. **Page 1: Upload** + ImageUploader
4. **Page 2: Recognize** (depends on upload)
5. **Page 3: Customize** (most complex form)
6. **Page 4: Script** (depends on customize)
7. **Page 5: Preview** (depends on script)
8. **Integration**: WizardLayout, ProgressBar, state persistence

---

## 10. Out of Scope

- Backend API integration
- Authentication/user accounts
- Real AI generation
- Payment/subscription
- Sharing functionality (mock only)
- Push notifications
- Offline support
