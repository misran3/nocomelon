# Remove Back Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove footer back button and use progress bar circles for step navigation.

**Architecture:** Add step-to-route mapping in WizardLayout, wire up onStepClick to navigate, remove back button UI and onBack prop.

**Tech Stack:** React, react-router useNavigate

---

## Task 1: Add Step Routes and Wire Up Navigation

**Files:**
- Modify: `frontend/src/components/layout/WizardLayout.tsx`

**Step 1: Add STEP_ROUTES constant and handleStepClick**

After the imports (around line 8), add:

```typescript
const STEP_ROUTES = [
  '/upload',
  '/recognize',
  '/customize',
  '/script',
  '/preview',
  '/library'
] as const;
```

Inside the component, add handler before the return statement:

```typescript
const handleStepClick = (step: number) => {
  const route = STEP_ROUTES[step - 1];
  if (route) {
    navigate(route);
  }
};
```

**Step 2: Pass onStepClick to ProgressBar**

Change line ~47 from:
```tsx
<ProgressBar currentStep={currentStep} totalSteps={6} />
```

To:
```tsx
<ProgressBar currentStep={currentStep} totalSteps={6} onStepClick={handleStepClick} />
```

**Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/components/layout/WizardLayout.tsx
git commit -m "feat: wire up progress bar step navigation"
```

---

## Task 2: Remove Back Button and onBack Prop

**Files:**
- Modify: `frontend/src/components/layout/WizardLayout.tsx`

**Step 1: Remove onBack from props interface**

Change WizardLayoutProps (around line 9-18) from:
```typescript
interface WizardLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  actionLabel: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction: () => void;
  onBack?: () => void;
  showProgress?: boolean;
}
```

To:
```typescript
interface WizardLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  actionLabel: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction: () => void;
  showProgress?: boolean;
}
```

**Step 2: Remove onBack from destructuring**

Change the destructuring (around line 20-29) to remove `onBack`:
```typescript
export default function WizardLayout({
  children,
  currentStep,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  showProgress = true,
}: WizardLayoutProps) {
```

**Step 3: Remove handleBack function**

Delete the handleBack function (around lines 32-38):
```typescript
// DELETE THIS:
const handleBack = () => {
  if (onBack) {
    onBack();
  } else {
    navigate(-1);
  }
};
```

**Step 4: Remove back button from footer**

Delete the back button JSX in the footer (around lines 69-79):
```tsx
// DELETE THIS ENTIRE BLOCK:
{onBack && (
  <Button
    variant="ghost"
    size="icon"
    onClick={handleBack}
    className="shrink-0"
  >
    <ArrowLeft className="h-5 w-5" />
    <span className="sr-only">Back</span>
  </Button>
)}
```

**Step 5: Remove unused ArrowLeft import**

Change line 3 from:
```typescript
import { ArrowLeft, Loader2 } from 'lucide-react';
```

To:
```typescript
import { Loader2 } from 'lucide-react';
```

**Step 6: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add frontend/src/components/layout/WizardLayout.tsx
git commit -m "feat: remove back button from footer"
```

---

## Task 3: Remove onBack Props from Page Components

**Files:**
- Modify: `frontend/src/pages/recognize.tsx`
- Modify: `frontend/src/pages/script.tsx`

**Step 1: Update recognize.tsx**

Find and remove the `onBack` prop from WizardLayout (around line 67):

Change from:
```tsx
<WizardLayout
  currentStep={2}
  actionLabel="Looks Good!"
  onAction={handleAction}
  showProgress={true}
  onBack={() => navigate('/upload')}
>
```

To:
```tsx
<WizardLayout
  currentStep={2}
  actionLabel="Looks Good!"
  onAction={handleAction}
  showProgress={true}
>
```

**Step 2: Update script.tsx**

Find and remove the `onBack` prop from WizardLayout (around line 87):

Change from:
```tsx
<WizardLayout
  currentStep={4}
  actionLabel="Create Video"
  actionDisabled={isRegenerating}
  onAction={handleAction}
  onBack={() => navigate('/customize')}
>
```

To:
```tsx
<WizardLayout
  currentStep={4}
  actionLabel="Create Video"
  actionDisabled={isRegenerating}
  onAction={handleAction}
>
```

**Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/pages/recognize.tsx frontend/src/pages/script.tsx
git commit -m "refactor: remove onBack props from page components"
```

---

## Task 4: Update Tests

**Files:**
- Modify: `frontend/src/__tests__/WizardLayout.test.tsx`

**Step 1: Remove back button tests**

Delete the "Back button" describe block (tests for onBack behavior).

**Step 2: Add step navigation test**

Add new test for step click navigation:

```typescript
describe('Step navigation', () => {
  it('navigates to step route when completed step is clicked', () => {
    render(
      <WizardLayout currentStep={3} actionLabel="Next" onAction={vi.fn()}>
        <div>Content</div>
      </WizardLayout>
    );

    // Click step 1 (completed)
    const step1Button = screen.getByRole('button', { name: /step 1/i });
    fireEvent.click(step1Button);

    expect(mockNavigate).toHaveBeenCalledWith('/upload');
  });
});
```

**Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/__tests__/WizardLayout.test.tsx
git commit -m "test: update WizardLayout tests for step navigation"
```

---

## Verification Checklist

- [ ] STEP_ROUTES constant added
- [ ] handleStepClick wired to ProgressBar
- [ ] Back button removed from footer
- [ ] onBack prop removed from WizardLayoutProps
- [ ] ArrowLeft import removed
- [ ] onBack removed from recognize.tsx
- [ ] onBack removed from script.tsx
- [ ] Tests updated
- [ ] No TypeScript errors
