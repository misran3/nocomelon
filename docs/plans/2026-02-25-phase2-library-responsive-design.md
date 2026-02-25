# Phase 2 Library Page Responsive Fix Design

> **Date**: 2026-02-25
> **Status**: Approved
> **Purpose**: Make Library page responsive on desktop

---

## Problem Statement

The Library page has the same `max-w-md` constraint as Phase 1 layout components. Additionally, the storybook grid is fixed at 2 columns regardless of screen size.

### Affected Files

| File | Line | Issue |
|------|------|-------|
| `library.tsx` | 35 | `max-w-md mx-auto` - content locked to 448px |
| `library.tsx` | 45 | `grid-cols-2` - fixed 2 columns on all screens |

---

## Solution

### 1. Content Width

Use `CONTENT_WIDTH` constant from utils.ts (created in Phase 1).

### 2. Responsive Grid Columns

| Breakpoint | Columns |
|------------|---------|
| Base | 2 |
| `md:` (768px+) | 3 |
| `lg:` (1024px+) | 4 |

### 3. Bottom Sheet

Keep as-is. Bottom sheet on all screen sizes for consistency and simplicity.

---

## Changes Required

### `frontend/src/pages/library.tsx`

**Line 35** - Add import and use CONTENT_WIDTH:
```tsx
import { CONTENT_WIDTH } from '../lib/utils';
// ...
<main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full`}>
```

**Line 45** - Responsive grid:
```tsx
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```
