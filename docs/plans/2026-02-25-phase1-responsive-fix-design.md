# Phase 1 Responsive Fix Design

> **Date**: 2026-02-25
> **Status**: Approved
> **Purpose**: Fix mobile-only layout to be properly responsive on desktop

---

## Problem Statement

The original implementation misinterpreted "mobile-first" as "mobile-only". All layout components use hardcoded `max-w-md` (448px) with no responsive breakpoints, causing desktop to show a narrow strip in the center of the screen.

### Affected Files

| File | Line | Issue |
|------|------|-------|
| `AppHeader.tsx` | 10 | `max-w-md mx-auto` - header content locked to 448px |
| `WizardLayout.tsx` | 46 | `max-w-md mx-auto` - progress bar locked to 448px |
| `WizardLayout.tsx` | 56 | `max-w-md mx-auto` - main content locked to 448px |
| `WizardLayout.tsx` | 65 | `max-w-md mx-auto` - action button bar locked to 448px |

---

## Solution

### Approach: Breakpoint-Scaled Max-Width

Use Tailwind's responsive prefixes to expand content width at larger breakpoints while maintaining centered layout.

### Responsive Width Pattern

```
max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto
```

| Breakpoint | Max-Width | Pixels | Screen Size |
|------------|-----------|--------|-------------|
| Base | `max-w-md` | 448px | Mobile (< 640px) |
| `sm:` | `max-w-lg` | 512px | Large phone/small tablet (640px+) |
| `md:` | `max-w-xl` | 576px | Tablet (768px+) |
| `lg:` | `max-w-2xl` | 672px | Desktop (1024px+) |

### DRY Implementation

Extract to `src/lib/utils.ts`:

```typescript
export const CONTENT_WIDTH = "max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto";
```

Use in all 4 locations to ensure consistency and single source of truth.

---

## Changes Required

### 1. `src/lib/utils.ts`
Add `CONTENT_WIDTH` constant.

### 2. `src/components/layout/AppHeader.tsx`
Replace line 10's `max-w-md mx-auto` with `{CONTENT_WIDTH}`.

### 3. `src/components/layout/WizardLayout.tsx`
Replace all 3 instances of `max-w-md mx-auto`:
- Line 46 (progress bar container)
- Line 56 (main content)
- Line 65 (action button bar)

---

## Visual Result

```
Mobile (< 640px)        Tablet (768px+)         Desktop (1024px+)
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐
│ ┌─────────────┐ │     │  ┌───────────┐  │     │   ┌─────────────┐   │
│ │   448px     │ │     │  │   576px   │  │     │   │    672px    │   │
│ │   content   │ │     │  │  content  │  │     │   │   content   │   │
│ └─────────────┘ │     │  └───────────┘  │     │   └─────────────┘   │
└─────────────────┘     └─────────────────┘     └─────────────────────┘
```

---

## Alternatives Considered

1. **Container Queries**: More precise but adds complexity
2. **CSS Custom Properties**: Central control but mixes paradigms with Tailwind

Breakpoint classes chosen for being Tailwind-native and easy to maintain.
