# Remove Back Button - Use Progress Bar Navigation

> **Date**: 2026-02-25
> **Status**: Approved

## Problem

Footer has redundant back arrow button. Progress bar circles are already clickable for completed steps - should use that for navigation instead.

## Solution

1. Remove footer back button from WizardLayout
2. Remove `onBack` prop from WizardLayoutProps
3. Wire up `onStepClick` to navigate to step routes
4. Remove `onBack` prop from all page components

## Step-to-Route Mapping

| Step | Route |
|------|-------|
| 1 | /upload |
| 2 | /recognize |
| 3 | /customize |
| 4 | /script |
| 5 | /preview |
| 6 | /library |

## Files to Modify

- `WizardLayout.tsx` - Remove back button, add step navigation
- `recognize.tsx` - Remove onBack prop
- `customize.tsx` - Remove onBack prop
- `script.tsx` - Remove onBack prop
- `preview.tsx` - Remove onBack prop (if present)
