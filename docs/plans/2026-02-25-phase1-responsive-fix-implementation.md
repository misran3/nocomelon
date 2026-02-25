# Phase 1 Responsive Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix mobile-only layout so content expands appropriately on tablet and desktop screens.

**Architecture:** Add responsive breakpoint classes to expand max-width at larger viewports. Extract width pattern to a constant for DRY reuse across layout components.

**Tech Stack:** Tailwind CSS responsive prefixes (sm:, md:, lg:)

---

## Task 1: Add CONTENT_WIDTH Constant

**Files:**
- Modify: `frontend/src/lib/utils.ts:6`

**Step 1: Add the constant**

Add after the `cn` function:

```typescript
/**
 * Responsive content width classes.
 * Mobile: 448px, sm: 512px, md: 576px, lg: 672px
 */
export const CONTENT_WIDTH = "max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto";
```

**Step 2: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add frontend/src/lib/utils.ts
git commit -m "feat: add CONTENT_WIDTH responsive utility constant"
```

---

## Task 2: Update AppHeader

**Files:**
- Modify: `frontend/src/components/layout/AppHeader.tsx:1,10`

**Step 1: Add import**

Add to imports at line 1:

```typescript
import { CONTENT_WIDTH } from "../../lib/utils";
```

**Step 2: Replace max-w-md**

Change line 10 from:
```tsx
<div className="h-14 flex max-w-md items-center justify-between px-4 mx-auto">
```

To:
```tsx
<div className={`h-14 flex ${CONTENT_WIDTH} items-center justify-between px-4`}>
```

Note: Remove `mx-auto` since it's included in CONTENT_WIDTH.

**Step 3: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add frontend/src/components/layout/AppHeader.tsx
git commit -m "feat: make AppHeader responsive with CONTENT_WIDTH"
```

---

## Task 3: Update WizardLayout

**Files:**
- Modify: `frontend/src/components/layout/WizardLayout.tsx:7,46,56,65`

**Step 1: Add import**

Update line 7 from:
```typescript
import { cn } from '../../lib/utils';
```

To:
```typescript
import { cn, CONTENT_WIDTH } from '../../lib/utils';
```

**Step 2: Update progress bar container (line 46)**

Change from:
```tsx
<div className="max-w-md mx-auto px-4">
```

To:
```tsx
<div className={`${CONTENT_WIDTH} px-4`}>
```

**Step 3: Update main content container (line 56)**

Change from:
```tsx
<div className="max-w-md mx-auto px-4">
```

To:
```tsx
<div className={`${CONTENT_WIDTH} px-4`}>
```

**Step 4: Update action button container (line 65)**

Change from:
```tsx
<div className="max-w-md mx-auto px-4 py-3 flex gap-3">
```

To:
```tsx
<div className={`${CONTENT_WIDTH} px-4 py-3 flex gap-3`}>
```

**Step 5: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add frontend/src/components/layout/WizardLayout.tsx
git commit -m "feat: make WizardLayout responsive with CONTENT_WIDTH"
```

---

## Task 4: Visual Verification

**Step 1: Start dev server**

Run: `cd frontend && npm run dev`

**Step 2: Test mobile view**

- Open browser to http://localhost:5173/upload
- Open DevTools, toggle device toolbar
- Select "iPhone 12 Pro" (390px)
- Verify: Content fills most of width, appropriate padding

**Step 3: Test tablet view**

- In DevTools, select "iPad" (768px)
- Verify: Content is wider (~576px), centered

**Step 4: Test desktop view**

- Disable device toolbar (full desktop width)
- Verify: Content is ~672px max, centered with whitespace on sides

**Step 5: Navigate through wizard**

- Test /upload, /recognize, /customize, /script, /preview
- Verify all pages respond to viewport changes consistently

---

## Verification Checklist

- [ ] `CONTENT_WIDTH` constant exported from utils.ts
- [ ] AppHeader uses CONTENT_WIDTH
- [ ] WizardLayout progress bar uses CONTENT_WIDTH
- [ ] WizardLayout main content uses CONTENT_WIDTH
- [ ] WizardLayout action bar uses CONTENT_WIDTH
- [ ] No TypeScript errors
- [ ] Visual check: mobile (448px), tablet (576px), desktop (672px)
