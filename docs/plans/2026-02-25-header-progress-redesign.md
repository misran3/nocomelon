# AppHeader & ProgressBar Redesign

> **Date**: 2026-02-25
> **Status**: Approved
> **Purpose**: Make header responsive for desktop and add clear step indicators to progress bar

---

## Problem Statement

1. **AppHeader**: Mobile-only design with hamburger menu everywhere. Awkward on desktop.
2. **ProgressBar**: Just dots with no numbers or labels. Hard to tell current step at a glance.

---

## Solution

### 1. ProgressBar Redesign

**New Visual Design:**
```
Desktop:
   ①─────②─────③─────④─────⑤─────⑥
 Upload  Recognize  Customize  Script  Preview  Save

Mobile (labels hidden or abbreviated):
   ①───②───③───④───⑤───⑥
```

**Step States:**
| State | Circle | Label | Line |
|-------|--------|-------|------|
| Completed | Secondary color, filled, number inside | Muted text | Secondary color |
| Current | Primary color, filled, number inside | Bold primary text | Gray |
| Future | Gray border, number inside | Muted text | Gray |

**Props (unchanged interface):**
- `currentStep: number`
- `totalSteps?: number` (default 6)
- `onStepClick?: (step: number) => void`

**New internal data:**
```typescript
const STEP_LABELS = ['Upload', 'Recognize', 'Customize', 'Script', 'Preview', 'Save'];
```

**Responsive behavior:**
- Mobile: Show numbers in circles, hide labels (or show abbreviated)
- Desktop (md+): Show full labels below circles

---

### 2. AppHeader Redesign

**Mobile (< md):**
```
┌────────────────────────────────┐
│  NoComelon          [≡ Menu]   │
└────────────────────────────────┘
```
- Hamburger opens dropdown/sheet with: Library, Sign Out

**Desktop (md+):**
```
┌────────────────────────────────────────────┐
│  NoComelon              Library  Sign Out  │
└────────────────────────────────────────────┘
```
- Inline text links, no hamburger

**Interactions:**
- "NoComelon" logo: Link to `/` (upload page)
- "Library": Link to `/library`
- "Sign Out": Placeholder, shows toast "Sign out coming soon"

**Implementation:**
- Use Tailwind `hidden md:flex` for desktop nav
- Use `md:hidden` for hamburger
- Use shadcn DropdownMenu for mobile menu

---

## Files to Modify

| File | Changes |
|------|---------|
| `ProgressBar.tsx` | Add step numbers inside circles, add labels below, add connecting lines |
| `AppHeader.tsx` | Add Link wrapper to logo, add desktop nav, add mobile dropdown menu |

---

## Visual Mockup

### ProgressBar States
```
Completed:  (2)  ← teal filled, clickable
Current:    (3)  ← coral filled, larger
Future:     (4)  ← gray border only
```

### Connecting Lines
```
(1)───(2)───(3)───(4)───(5)───(6)
 ↑     ↑     ↑     ↑
teal  teal  gray  gray
```
