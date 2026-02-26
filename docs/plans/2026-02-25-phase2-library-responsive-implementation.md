# Phase 2 Library Page Responsive Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Library page responsive with expanding content width and grid columns.

**Architecture:** Reuse CONTENT_WIDTH from Phase 1, add responsive grid column classes.

**Tech Stack:** Tailwind CSS responsive prefixes

---

## Task 1: Update Library Page

**Files:**
- Modify: `frontend/src/pages/library.tsx:1,35,45`

**Step 1: Add CONTENT_WIDTH import**

Add to imports after line 9:

```typescript
import { CONTENT_WIDTH } from '../lib/utils';
```

**Step 2: Replace max-w-md (line 35)**

Change from:
```tsx
<main className="flex-1 pt-20 px-4 pb-24 max-w-md mx-auto w-full">
```

To:
```tsx
<main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full`}>
```

Note: Remove `mx-auto` since it's included in CONTENT_WIDTH.

**Step 3: Add responsive grid columns (line 45)**

Change from:
```tsx
<div className="grid grid-cols-2 gap-4">
```

To:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

**Step 4: Verify no TypeScript errors**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add frontend/src/pages/library.tsx
git commit -m "feat: make Library page responsive with grid columns"
```

---

## Task 2: Visual Verification

**Step 1: Navigate to Library**

Open: http://localhost:5173/library

**Step 2: Test mobile view**

- DevTools → iPhone 12 Pro (390px)
- Verify: 2 columns, content fills width

**Step 3: Test tablet view**

- DevTools → iPad (768px)
- Verify: 3 columns, wider content

**Step 4: Test desktop view**

- Full width (1200px+)
- Verify: 4 columns, 672px max content width

---

## Verification Checklist

- [ ] CONTENT_WIDTH imported and used
- [ ] Grid shows 2 cols on mobile
- [ ] Grid shows 3 cols on tablet (768px+)
- [ ] Grid shows 4 cols on desktop (1024px+)
- [ ] No TypeScript errors
