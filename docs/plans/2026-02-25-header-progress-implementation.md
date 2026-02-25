# AppHeader & ProgressBar Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make header responsive with desktop navigation and add numbered step indicators with labels to progress bar.

**Architecture:** Update ProgressBar to show step numbers inside circles with labels below, connected by lines. Update AppHeader to show inline nav links on desktop (md+) and hamburger dropdown on mobile.

**Tech Stack:** React, Tailwind CSS responsive classes, shadcn/ui DropdownMenu, react-router Link

---

## Task 1: Add Step Labels Constant

**Files:**
- Modify: `frontend/src/lib/mock-data.ts`

**Step 1: Add STEP_LABELS constant**

Add at end of file:

```typescript
/**
 * Step labels for the wizard progress bar
 */
export const STEP_LABELS = [
  'Upload',
  'Recognize',
  'Customize',
  'Script',
  'Preview',
  'Save'
] as const;
```

**Step 2: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/lib/mock-data.ts
git commit -m "feat: add STEP_LABELS constant for progress bar"
```

---

## Task 2: Redesign ProgressBar Component

**Files:**
- Modify: `frontend/src/components/layout/ProgressBar.tsx`

**Step 1: Rewrite ProgressBar with numbered circles, labels, and connecting lines**

Replace entire file with:

```tsx
import { cn } from '../../lib/utils';
import { STEP_LABELS } from '../../lib/mock-data';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, totalSteps = 6, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isLast = step === totalSteps;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isCompleted && onStepClick?.(step)}
                  disabled={!isCompleted}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                    isCompleted && "bg-secondary text-secondary-foreground cursor-pointer hover:opacity-80",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "border-2 border-gray-300 text-gray-400 cursor-default"
                  )}
                  type="button"
                  aria-label={`Step ${step}: ${STEP_LABELS[i]}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {step}
                </button>
                {/* Label - hidden on mobile, visible on md+ */}
                <span
                  className={cn(
                    "hidden md:block mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-secondary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {STEP_LABELS[i]}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    step < currentStep ? "bg-secondary" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressBar;
```

**Step 2: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/layout/ProgressBar.tsx
git commit -m "feat: redesign ProgressBar with numbered circles and labels"
```

---

## Task 3: Update WizardLayout Progress Bar Container

**Files:**
- Modify: `frontend/src/components/layout/WizardLayout.tsx:45-49`

**Step 1: Adjust padding for new progress bar size**

The progress bar is now taller (circles + labels). Update the container:

Find:
```tsx
<div className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 border-b">
```

Change to:
```tsx
<div className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 md:py-4 border-b">
```

**Step 2: Update main content padding to account for taller progress bar**

Find the pt-[108px] value in the main element and update:

```tsx
className={cn("flex-1 pb-24 overflow-y-auto", showProgress ? "pt-[116px] md:pt-[140px]" : "pt-16")}
```

**Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/components/layout/WizardLayout.tsx
git commit -m "feat: adjust WizardLayout spacing for new progress bar"
```

---

## Task 4: Redesign AppHeader Component

**Files:**
- Modify: `frontend/src/components/layout/AppHeader.tsx`

**Step 1: Rewrite AppHeader with responsive navigation**

Replace entire file with:

```tsx
import { Menu, Library, LogOut } from "lucide-react";
import { Link } from "react-router";
import { Button } from "../ui/button";
import { CONTENT_WIDTH } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { toast } from "sonner";

export default function AppHeader() {
  const handleSignOut = () => {
    toast("Sign out coming soon");
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className={`h-14 flex ${CONTENT_WIDTH} items-center justify-between px-4`}>
        {/* Logo - clickable link to home */}
        <Link to="/" className="font-bold text-primary text-lg hover:opacity-80 transition-opacity">
          NoComelon
        </Link>

        {/* Desktop Navigation (md+) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/library"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Library
          </Link>
          <button
            onClick={handleSignOut}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign Out
          </button>
        </nav>

        {/* Mobile Menu (< md) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link to="/library" className="flex items-center gap-2">
                <Library className="h-4 w-4" />
                Library
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
```

**Step 2: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/components/layout/AppHeader.tsx
git commit -m "feat: redesign AppHeader with responsive navigation"
```

---

## Task 5: Visual Verification

**Step 1: Start dev server**

Run: `cd frontend && npm run dev`

**Step 2: Test ProgressBar on mobile**

- Open http://localhost:5173/upload
- DevTools → iPhone 12 Pro (390px)
- Verify: Numbered circles (1-6), connecting lines, NO labels visible
- Click a completed step → should navigate back

**Step 3: Test ProgressBar on desktop**

- Disable device toolbar
- Verify: Numbered circles with labels below each
- Current step highlighted with ring effect

**Step 4: Test AppHeader on mobile**

- DevTools → iPhone 12 Pro
- Verify: Logo + hamburger menu
- Click hamburger → dropdown with Library, Sign Out
- Click Logo → navigates to /upload

**Step 5: Test AppHeader on desktop**

- Full width
- Verify: Logo + "Library" + "Sign Out" inline
- Click Library → /library
- Click Sign Out → toast "Sign out coming soon"

---

## Verification Checklist

- [ ] STEP_LABELS exported from mock-data.ts
- [ ] ProgressBar shows numbered circles
- [ ] ProgressBar shows labels on md+ screens
- [ ] ProgressBar has connecting lines
- [ ] Completed steps are clickable
- [ ] Current step has ring highlight
- [ ] AppHeader logo links to /
- [ ] Desktop shows inline nav links
- [ ] Mobile shows dropdown menu
- [ ] Sign Out shows toast
- [ ] No TypeScript errors
