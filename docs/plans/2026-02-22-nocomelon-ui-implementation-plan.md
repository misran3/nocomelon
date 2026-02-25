# NoComelon UI Implementation Plan (VibeFlow)

> **For VibeFlow:** Execute these prompts in order. Each prompt is self-contained and builds on the previous.

**Goal:** Build a mobile-first parent-facing app with 6 pages (Upload, Recognize, Customize, Script, Preview, Library) using mock data.

**Reference:** See `docs/plans/2026-02-22-nocomelon-ui-design.md` for complete design spec.

**Tech Stack:** React + Vite + Tailwind CSS + shadcn/ui + react-router

---

## Phase 1: Foundation (Design System + Core Layout)

### Task 1.1: Update Color Palette

**VibeFlow Prompt:**
```
Update the color scheme in src/index.css to create a playful but simple children's app theme:

Light mode colors (HSL format):
- --primary: coral (#FF6B6B) = 0 100% 71%
- --primary-foreground: white = 0 0% 100%
- --secondary: teal (#4ECDC4) = 174 64% 56%
- --secondary-foreground: dark text = 222 84% 4.9%
- --accent: sunny yellow (#FFE66D) = 47 100% 71%
- --background: light gray (#FAFAFA) = 0 0% 98%
- --card: white (#FFFFFF) = 0 0% 100%
- --muted-foreground: gray (#718096) = 215 16% 52%
- --border: light border (#E2E8F0) = 214 32% 91%

Keep dark mode as-is for now. Update --radius to 0.5rem.
```

**Expected:** index.css has playful coral/teal/yellow palette.

---

### Task 1.2: Create Types File

**VibeFlow Prompt:**
```
Create src/types/index.ts with TypeScript interfaces for the app:

1. DrawingAnalysis: subject (string), setting (string), details (string[]), mood (string), colors (string[])

2. Scene: number (number), text (string)

3. StoryScript: scenes (Scene[]), total_scenes (number)

4. VideoResult: video_path (string), duration_sec (number), thumbnail (string)

5. StorybookEntry: id (string), title (string), thumbnail (string), duration_sec (number), style ('storybook' | 'watercolor'), createdAt (Date)

6. Style enum: 'storybook' | 'watercolor'

7. Theme enum: 'adventure' | 'kindness' | 'bravery' | 'bedtime' | 'friendship' | 'counting' | 'nature'

8. VoiceType enum: 'gentle' | 'cheerful'

9. WizardState interface containing: drawing (File | null), analysis (DrawingAnalysis | null), customization object (style, theme, voice, age, personalContext), script (StoryScript | null), video (VideoResult | null)

Export all types.
```

**Expected:** src/types/index.ts exists with all interfaces.

---

### Task 1.3: Create Mock Data File

**VibeFlow Prompt:**
```
Create src/lib/mock-data.ts with mock data constants:

1. MOCK_ANALYSIS: DrawingAnalysis for a purple dinosaur in a green field with big friendly eyes, spiky back, happy and playful mood, purple/green/yellow colors

2. STYLES array: two objects with id, label, icon (emoji) for 'storybook' and 'watercolor'

3. THEMES array: seven objects with id, label, icon (emoji) for adventure, kindness, bravery, bedtime, friendship, counting, nature

4. VOICES array: two objects with id, label, description for 'gentle' (warm, calm - good for bedtime) and 'cheerful' (bright, energetic - good for younger kids)

5. MOCK_STORY: StoryScript with 6 scenes about a dinosaur named Dino going to his first day of Dinosaur School, learning about bravery

6. MOCK_VIDEO: VideoResult with path '/videos/sample-storybook.mp4', 75 seconds, thumbnail

7. MOCK_LIBRARY: array of 2-3 StorybookEntry objects with different titles, dates, styles

Import types from '../types'.
```

**Expected:** src/lib/mock-data.ts exists with complete mock data.

---

### Task 1.4: Create Wizard State Hook

**VibeFlow Prompt:**
```
Create src/hooks/use-wizard-state.ts:

Create a React Context and hook for managing wizard state across pages:

1. WizardContext using createContext
2. WizardProvider component that:
   - Uses useState for WizardState
   - Loads from localStorage on mount (key: 'nocomelon-wizard-state')
   - Saves to localStorage whenever state changes (useEffect)
   - Provides state and setter functions: setDrawing, setAnalysis, setCustomization, setScript, setVideo, resetWizard

3. useWizardState hook that throws if used outside provider

Export WizardProvider and useWizardState.
```

**Expected:** src/hooks/use-wizard-state.ts with context provider and hook.

---

### Task 1.5: Create Library Hook

**VibeFlow Prompt:**
```
Create src/hooks/use-library.ts:

Create a hook for managing the storybook library:

1. Uses useState for StorybookEntry[] array
2. Loads from localStorage on mount (key: 'nocomelon-library')
3. Saves to localStorage when library changes
4. Provides functions: addStorybook, removeStorybook, getStorybook (by id)
5. Initialize with MOCK_LIBRARY from mock-data.ts if localStorage is empty

Export useLibrary hook.
```

**Expected:** src/hooks/use-library.ts with CRUD operations.

---

### Task 1.6: Create AppHeader Component

**VibeFlow Prompt:**
```
Create src/components/layout/AppHeader.tsx:

A fixed header component for the app:

1. Height: 56px (h-14)
2. Background: white with subtle bottom shadow
3. Position: fixed top, full width, z-50
4. Left side: App name "NoComelon" in primary color, font-bold
5. Right side: Hamburger menu icon button (Menu from lucide-react)
6. Mobile-first styling with max-w-md mx-auto for content
7. Uses shadcn Button for the menu (variant="ghost", size="icon")

The menu button doesn't need to do anything yet (onClick can be empty).
```

**Expected:** src/components/layout/AppHeader.tsx renders a fixed header.

---

### Task 1.7: Create ProgressBar Component

**VibeFlow Prompt:**
```
Create src/components/layout/ProgressBar.tsx:

A step indicator component showing wizard progress:

Props:
- currentStep: number (1-6)
- totalSteps: number (default 6)
- onStepClick?: (step: number) => void

UI:
1. Horizontal row of 6 circles (dots)
2. Completed steps (< currentStep): filled with secondary color (teal)
3. Current step: filled with primary color (coral), slightly larger
4. Future steps: gray border only
5. Completed steps are clickable (calls onStepClick)
6. Use flex with gap-2, centered
7. Each dot is 10px (w-2.5 h-2.5), current is 12px (w-3 h-3)
8. Add transition-all for smooth animations
```

**Expected:** src/components/layout/ProgressBar.tsx renders clickable step indicators.

---

### Task 1.8: Create WizardLayout Component

**VibeFlow Prompt:**
```
Create src/components/layout/WizardLayout.tsx:

A layout wrapper for wizard pages:

Props:
- children: React.ReactNode (page content)
- currentStep: number (1-6)
- actionLabel: string (button text like "Next" or "Generate")
- actionDisabled?: boolean
- actionLoading?: boolean
- onAction: () => void
- onBack?: () => void
- showProgress?: boolean (default true)

UI Structure:
1. Fixed AppHeader at top
2. ProgressBar below header (if showProgress)
3. Scrollable content area with padding (pt-20 for header space, pb-24 for button space)
4. Fixed bottom action bar with primary Button
5. Content wrapper: max-w-md mx-auto px-4
6. Button uses full width, rounded-xl, h-12

Use react-router's useNavigate for onBack to handle browser back.
```

**Expected:** src/components/layout/WizardLayout.tsx wraps pages with consistent chrome.

---

### Task 1.9: Update App.tsx with Routes

**VibeFlow Prompt:**
```
Update src/App.tsx to add all routes:

Import the WizardProvider from use-wizard-state hook.

Create placeholder page components inline for now (just return <div>Page Name</div>):
- UploadPage at /upload
- RecognizePage at /recognize
- CustomizePage at /customize
- ScriptPage at /script
- PreviewPage at /preview
- LibraryPage at /library

Wrap Routes in WizardProvider.

Add redirect from / to /upload using Navigate component.

Keep the NotFound route at the end.
```

**Expected:** App.tsx has all routes defined, / redirects to /upload.

---

## Phase 2: Library Page (Simplest Full Page)

### Task 2.1: Create StorybookCard Component

**VibeFlow Prompt:**
```
Create src/components/library/StorybookCard.tsx:

A card component for displaying a storybook in the library grid:

Props:
- storybook: StorybookEntry
- onClick: () => void

UI:
1. Card with aspect-square container
2. Thumbnail image fills the card (object-cover, rounded-xl)
3. Gradient overlay at bottom (black to transparent, going up)
4. Title text overlaid at bottom left (white, font-medium, truncate)
5. Duration badge at bottom right (white text, small)
6. Format duration as M:SS (e.g., 75 seconds = "1:15")
7. Entire card is clickable
8. Add hover:scale-[1.02] transition for feedback

Use placeholder gray div if thumbnail doesn't load.
```

**Expected:** src/components/library/StorybookCard.tsx renders a clickable thumbnail card.

---

### Task 2.2: Create StorybookSheet Component

**VibeFlow Prompt:**
```
Create src/components/library/StorybookSheet.tsx:

A bottom sheet for viewing storybook details:

Props:
- storybook: StorybookEntry | null
- open: boolean
- onOpenChange: (open: boolean) => void
- onDelete: (id: string) => void

Uses shadcn Sheet component (side="bottom").

Content:
1. Title as SheetTitle
2. Video player placeholder (gray rectangle with play icon, 16:9 aspect ratio)
3. Metadata row: date (formatted nicely) + style badge
4. Three buttons stacked:
   - "Play Full Screen" (primary variant, full width)
   - "Share with Family" (outline variant, copies mock link, shows toast "Link copied!")
   - "Delete" (ghost variant, destructive color, shows confirm dialog first)

Use date-fns to format the date (format: "MMM d, yyyy").
Use sonner toast for the share feedback.
```

**Expected:** src/components/library/StorybookSheet.tsx renders a detail sheet with actions.

---

### Task 2.3: Create Library Page

**VibeFlow Prompt:**
```
Create src/pages/library.tsx (replace the placeholder):

The library page showing saved storybooks:

1. Uses useLibrary hook to get storybooks
2. No WizardLayout (this is outside the wizard flow)
3. Has AppHeader at top
4. Page title "Your Storybooks" with count badge
5. 2-column grid of StorybookCard components
6. Last grid slot is "Create New" card with + icon, navigates to /upload
7. Empty state: If no storybooks, show centered message with illustration emoji and "Create your first story" button

State:
- selectedStorybook: StorybookEntry | null
- sheetOpen: boolean

When card clicked, set selectedStorybook and open sheet.
Sheet onDelete removes from library and closes sheet.
```

**Expected:** /library shows grid of storybooks, clicking opens detail sheet.

---

## Phase 3: Upload Page

### Task 3.1: Create ImageUploader Component

**VibeFlow Prompt:**
```
Create src/components/upload/ImageUploader.tsx:

A component for uploading images:

Props:
- value: File | null
- onChange: (file: File | null) => void

UI States:

Empty state:
1. Dashed border container (rounded-2xl, border-2 border-dashed)
2. Centered content: camera icon (large), "Tap to upload" text, "or drag and drop" subtext
3. Border color: muted, hover: primary
4. Height: 300px

Has image state:
1. Show image preview (object-contain, rounded-2xl)
2. Small "x" button in top-right corner to remove
3. Tap image to replace

Functionality:
1. Hidden file input (accept="image/*")
2. Clicking the container triggers file input
3. Support drag and drop (onDragOver, onDrop)
4. Use FileReader to create preview URL
5. Compress large images (if > 2MB, resize to max 1200px width)
```

**Expected:** src/components/upload/ImageUploader.tsx handles image upload with preview.

---

### Task 3.2: Create Upload Page

**VibeFlow Prompt:**
```
Create src/pages/upload.tsx (replace the placeholder):

The first page where parent uploads a drawing:

1. Uses WizardLayout with currentStep=1
2. Uses useWizardState to get/set drawing

Content:
1. Heading: "Upload your child's drawing" (text-2xl, font-bold, text-center)
2. Subtext: "Take a photo or choose from camera roll" (text-muted-foreground, text-center)
3. ImageUploader component
4. Action button: "Analyze Drawing"
5. Button disabled if no image selected

On action:
1. Save drawing to wizard state (setDrawing)
2. Navigate to /recognize
```

**Expected:** /upload shows image uploader, navigating to /recognize when done.

---

## Phase 4: Recognize Page

### Task 4.1: Create Recognize Page

**VibeFlow Prompt:**
```
Create src/pages/recognize.tsx (replace the placeholder):

The page showing AI interpretation of the drawing:

1. Uses WizardLayout with currentStep=2
2. Uses useWizardState to get/set analysis
3. If no drawing in state, redirect to /upload

Content:
1. Small thumbnail of uploaded drawing (100x100, rounded-xl, centered)
2. Section label: "We see..." (font-semibold)
3. Editable card with form fields:
   - Subject (Input component)
   - Setting (Textarea component, 2 rows)
   - Mood (Input component)
4. Read-only color chips showing detected colors (rounded pills, bg matches color name)
5. Action button: "Looks Good!"

Initial values:
- Load from MOCK_ANALYSIS (mock-data.ts)
- Store edits in local form state

On action:
1. Save analysis to wizard state (setAnalysis)
2. Navigate to /customize

Add a 1-second fake "analyzing" loading state on mount (skeleton placeholders).
```

**Expected:** /recognize shows editable AI interpretation, navigates to /customize.

---

## Phase 5: Customize Page (Most Complex)

### Task 5.1: Create StylePicker Component

**VibeFlow Prompt:**
```
Create src/components/customize/StylePicker.tsx:

A 2-column grid for selecting visual style:

Props:
- value: string | null
- onChange: (styleId: string) => void
- options: Array<{id: string, label: string, icon: string}>

UI:
1. 2-column grid with gap-3
2. Each option is a card (rounded-xl, p-4)
3. Card contains: large emoji icon (text-4xl), label below (font-medium)
4. Unselected: border-2 border-muted
5. Selected: border-2 border-primary, bg-primary/5
6. Add transition-all, hover:border-primary/50

Cards are clickable, clicking calls onChange with the id.
```

**Expected:** src/components/customize/StylePicker.tsx renders selectable style cards.

---

### Task 5.2: Create ThemePicker Component

**VibeFlow Prompt:**
```
Create src/components/customize/ThemePicker.tsx:

A grid for selecting story theme:

Props:
- value: string | null
- onChange: (themeId: string) => void
- options: Array<{id: string, label: string, icon: string}>

UI:
1. Flex wrap container with gap-2
2. Each option is a pill/chip (rounded-full, px-3 py-2)
3. Chip contains: emoji icon + label (text-sm)
4. Unselected: bg-muted
5. Selected: bg-primary text-primary-foreground
6. Add transition-all, hover:bg-muted/80

Chips are clickable, clicking calls onChange with the id.
Horizontally scrollable on mobile if needed (overflow-x-auto).
```

**Expected:** src/components/customize/ThemePicker.tsx renders selectable theme chips.

---

### Task 5.3: Create VoicePicker Component

**VibeFlow Prompt:**
```
Create src/components/customize/VoicePicker.tsx:

Radio group for selecting narrator voice:

Props:
- value: string | null
- onChange: (voiceId: string) => void
- options: Array<{id: string, label: string, description: string}>

UI:
1. Vertical stack of radio options (use shadcn RadioGroup)
2. Each option shows:
   - Radio button on left
   - Label (font-medium) and description (text-sm, text-muted-foreground)
   - Play button icon on right (Volume2 from lucide-react)
3. Play button shows toast "Voice preview coming soon" when clicked
4. Selected option has subtle background highlight

Use space-y-3 for spacing between options.
```

**Expected:** src/components/customize/VoicePicker.tsx renders voice radio options.

---

### Task 5.4: Create AgePicker Component

**VibeFlow Prompt:**
```
Create src/components/customize/AgePicker.tsx:

Segmented control for selecting child's age:

Props:
- value: number | null
- onChange: (age: number) => void
- min?: number (default 2)
- max?: number (default 9)

UI:
1. Horizontal row of number buttons (2 through 9)
2. Each button is a small square (w-10 h-10, rounded-lg)
3. Unselected: bg-muted, text-muted-foreground
4. Selected: bg-primary, text-primary-foreground
5. Use flex with gap-2
6. Add transition-all, hover effect

Buttons are clickable, clicking calls onChange with the number.
```

**Expected:** src/components/customize/AgePicker.tsx renders age selector buttons.

---

### Task 5.5: Create Customize Page

**VibeFlow Prompt:**
```
Create src/pages/customize.tsx (replace the placeholder):

The customization form page:

1. Uses WizardLayout with currentStep=3
2. Uses useWizardState to get/set customization
3. If no analysis in state, redirect to /recognize
4. Uses react-hook-form with zod validation

Form sections (each with a label):
1. "Visual Style" - StylePicker with STYLES from mock-data
2. "Theme" - ThemePicker with THEMES from mock-data
3. "Personal Touch (optional)" - Textarea for personal context
4. "Narrator Voice" - VoicePicker with VOICES from mock-data
5. "Child's Age" - AgePicker

Validation (zod):
- style: required
- theme: required
- voice: required
- age: required (number 2-9)
- personalContext: optional string

Action button: "Generate Story"
Button disabled until form is valid.

On action:
1. Save customization to wizard state
2. Navigate to /script

Add space-y-6 between sections. Use shadcn Label for section labels.
```

**Expected:** /customize shows complete form, validates, navigates to /script.

---

## Phase 6: Script Page

### Task 6.1: Create SceneEditor Component

**VibeFlow Prompt:**
```
Create src/components/script/SceneEditor.tsx:

An editable card for a single story scene:

Props:
- scene: Scene
- onChange: (text: string) => void

UI:
1. Card container (rounded-xl, p-4, bg-card, border)
2. Header: "Scene {number}" label (text-sm, font-medium, text-muted-foreground)
3. Textarea for the scene text (border-none, bg-transparent, resize-none)
4. Auto-grow textarea height based on content
5. Character count in bottom-right (text-xs, text-muted-foreground)

Textarea should be 3 rows minimum, grow as needed.
On text change, call onChange with new text.
```

**Expected:** src/components/script/SceneEditor.tsx renders an editable scene card.

---

### Task 6.2: Create Script Page

**VibeFlow Prompt:**
```
Create src/pages/script.tsx (replace the placeholder):

The script review page:

1. Uses WizardLayout with currentStep=4
2. Uses useWizardState to get/set script
3. If no customization in state, redirect to /customize

Content:
1. Heading: "Review your story" (text-2xl, font-bold)
2. Subtext: "Edit any text below" (text-muted-foreground)
3. List of SceneEditor cards (one per scene from MOCK_STORY)
4. Secondary button at bottom: "Regenerate Story" (outline variant)
5. Action button: "Create Video"

State:
- scenes: Scene[] (initialized from MOCK_STORY)
- isRegenerating: boolean

On scene edit: update local scenes state.
On regenerate: set isRegenerating true, wait 1.5s, reset to MOCK_STORY, set false.

On action:
1. Save script (scenes) to wizard state
2. Navigate to /preview

Add space-y-4 between scene cards.
```

**Expected:** /script shows editable scenes, can regenerate, navigates to /preview.

---

## Phase 7: Preview Page

### Task 7.1: Create VideoPlayer Component

**VibeFlow Prompt:**
```
Create src/components/preview/VideoPlayer.tsx:

A video player wrapper component:

Props:
- src: string
- poster?: string
- onEnded?: () => void

UI:
1. 16:9 aspect ratio container (aspect-video)
2. Rounded corners (rounded-2xl)
3. Native HTML5 video element with controls
4. Poster image shows before playing
5. Background: black (for letterboxing)

If src doesn't exist or errors:
- Show placeholder with play icon and "Video preview" text
- Gray background

Add onEnded callback for when video finishes.
```

**Expected:** src/components/preview/VideoPlayer.tsx renders a video player.

---

### Task 7.2: Create Preview Page

**VibeFlow Prompt:**
```
Create src/pages/preview.tsx (replace the placeholder):

The video preview page:

1. Uses WizardLayout with currentStep=5
2. Uses useWizardState to get/set video and reset wizard
3. Uses useLibrary to add storybook
4. If no script in state, redirect to /script

Content:
1. Heading: "Preview your storybook" (text-xl, font-bold)
2. VideoPlayer component (using MOCK_VIDEO path)
3. Generated title: "Dino's First Day" (text-lg, font-semibold)
4. Metadata: duration formatted + style badge (text-sm, text-muted-foreground)
5. Secondary button: "Try different look" (outline)
6. Action button: "Save to Library"
7. Text button below: "Discard" (text-destructive)

State:
- isGenerating: boolean (show loading skeleton on mount for 2s)

On save:
1. Add to library (create StorybookEntry from wizard state)
2. Reset wizard state
3. Navigate to /library

On discard:
1. Show confirm dialog "Are you sure? This will delete your storybook."
2. If confirmed: reset wizard, navigate to /upload

Format duration as M:SS.
```

**Expected:** /preview shows video, can save to library or discard.

---

## Phase 8: Integration & Polish

### Task 8.1: Add Loading States

**VibeFlow Prompt:**
```
Add loading skeleton states to pages:

1. In /recognize: Show Skeleton components for 1.5s on mount before showing content
2. In /script: Show Skeleton for scene cards during regeneration
3. In /preview: Show generating animation (pulsing card with "Creating your storybook..." text) for 2s on mount

Use shadcn Skeleton component.
Add smooth fade transitions when content appears (animate-in fade-in).
```

**Expected:** Pages have appropriate loading states.

---

### Task 8.2: Add Empty States

**VibeFlow Prompt:**
```
Add empty state to Library page:

When library is empty (no storybooks):

1. Center content vertically
2. Large emoji illustration (combine book + sparkle emoji)
3. Heading: "No storybooks yet"
4. Subtext: "Upload a drawing to create your first story"
5. Primary button: "Create Story" -> navigates to /upload

Use flex flex-col items-center justify-center min-h-[60vh].
```

**Expected:** Empty library shows helpful empty state with CTA.

---

### Task 8.3: Add Navigation Guards

**VibeFlow Prompt:**
```
Add navigation guards to wizard pages:

In each wizard page, check if previous steps are complete:

1. /recognize: If no drawing in wizard state, redirect to /upload
2. /customize: If no analysis in wizard state, redirect to /recognize
3. /script: If no customization in wizard state, redirect to /customize
4. /preview: If no script in wizard state, redirect to /script

Use useEffect with useNavigate to handle redirects on mount.
Show nothing (return null) while checking.
```

**Expected:** Users can't skip ahead in the wizard without completing previous steps.

---

### Task 8.4: Add Toast Notifications

**VibeFlow Prompt:**
```
Add toast feedback throughout the app:

1. Upload page: Show error toast if image upload fails
2. Library page: Show success toast "Link copied!" when share is clicked
3. Library page: Show success toast "Storybook deleted" after delete confirm
4. Preview page: Show success toast "Saved to library!" after saving

Use sonner's toast function.
Configure Toaster in main.tsx with position="bottom-center" and expand={true}.
```

**Expected:** User actions provide toast feedback.

---

### Task 8.5: Mobile Polish

**VibeFlow Prompt:**
```
Polish mobile experience:

1. Add safe-area padding for iOS notch (pt-safe, pb-safe using Tailwind safe-area plugin, or manually add env(safe-area-inset-*))
2. Ensure all touch targets are at least 44x44px
3. Add overscroll-none to prevent bounce on iOS
4. Test that fixed bottom button doesn't overlap content
5. Add momentum scrolling (-webkit-overflow-scrolling: touch)

Focus on /customize page since it has the most content.
```

**Expected:** App feels native on mobile devices.

---

### Task 8.6: Final Route Cleanup

**VibeFlow Prompt:**
```
Final cleanup of App.tsx:

1. Move all page components to separate files in src/pages/ (should already be done)
2. Use lazy loading for pages: React.lazy(() => import('./pages/upload'))
3. Wrap routes in Suspense with loading fallback (centered spinner)
4. Ensure 404 page works for unknown routes
5. Add page titles using document.title or a custom hook

Test all routes work correctly.
```

**Expected:** Routes use lazy loading, unknown routes show 404.

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `/upload` - Can upload image, shows preview, button enables
- [ ] `/recognize` - Shows mock analysis, can edit fields, navigates forward
- [ ] `/customize` - All pickers work, form validates, button enables when complete
- [ ] `/script` - Scenes display, can edit text, regenerate works
- [ ] `/preview` - Video area shows, save adds to library, discard confirms and resets
- [ ] `/library` - Shows saved storybooks, can view details, share copies link, delete works
- [ ] Navigation - Progress bar updates, can go back, state persists on refresh
- [ ] Mobile - Looks good on 375px width, touch targets work, no horizontal scroll

---

## Mock Assets Needed

Create these placeholder files:

```
public/
├── videos/
│   ├── sample-storybook.mp4  (any short video, or placeholder)
│   └── thumbnail.png          (16:9 image)
├── thumbnails/
│   ├── dino.png               (square image)
│   └── luna.png               (square image)
└── audio/
    ├── gentle.mp3             (short audio clip)
    └── cheerful.mp3           (short audio clip)
```

If no real assets available, components should handle missing files gracefully with placeholders.
