# Story 1.5: Create Reusable Widget Components

Status: done

## Story

As a **developer**,
I want **reusable widget building blocks (WidgetCard, WidgetSkeleton, WidgetError)**,
So that **all dashboard widgets have consistent appearance and behavior**.

## Acceptance Criteria

1. **Given** a widget needs to be created
   **When** using WidgetCard component
   **Then** consistent card styling with bg-surface-elevated is applied
   **And** rounded corners and proper padding are applied
   **And** optional title prop displays widget header

2. **Given** widget data is loading
   **When** using WidgetSkeleton component
   **Then** animated placeholder matching widget dimensions is displayed

3. **Given** widget data fetch fails
   **When** using WidgetError component
   **Then** user-friendly error message in Indonesian is displayed
   **And** "Coba Lagi" retry button is available
   **And** onRetry callback is invoked when button clicked

## Tasks / Subtasks

- [x] Task 1: Create WidgetCard component (AC: #1)
  - [x] 1.1: Create base card with bg-surface-elevated and border
  - [x] 1.2: Add optional title and subtitle props
  - [x] 1.3: Add colSpan and rowSpan for grid layout control
  - [x] 1.4: Add optional action slot in header

- [x] Task 2: Create WidgetSkeleton component (AC: #2)
  - [x] 2.1: Create animated skeleton with shimmer effect
  - [x] 2.2: Add configurable lines count
  - [x] 2.3: Add optional header skeleton
  - [x] 2.4: Create WidgetSkeletonGrid helper

- [x] Task 3: Create WidgetError component (AC: #3)
  - [x] 3.1: Add error icon with status-error color
  - [x] 3.2: Display title and message in Indonesian
  - [x] 3.3: Add "Coba Lagi" retry button with onRetry callback

- [x] Task 4: Update module exports
  - [x] 4.1: Create widgets/index.ts with all exports
  - [x] 4.2: Update Dashboard/index.ts to export widgets

## Dev Notes

### Component API

**WidgetCard:**
```tsx
<WidgetCard
  title="Status Mesin"
  subtitle="Realtime monitoring"
  colSpan={2}
  action={<button>Refresh</button>}
>
  {/* Widget content */}
</WidgetCard>
```

**WidgetSkeleton:**
```tsx
<WidgetSkeleton lines={4} hasHeader />
<WidgetSkeletonGrid count={4} />
```

**WidgetError:**
```tsx
<WidgetError
  title="Gagal Memuat"
  message="Terjadi kesalahan saat memuat data"
  onRetry={() => refetch()}
/>
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Widget Reusability]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- Created 3 widget building block components
- WidgetCard supports title, subtitle, colSpan, rowSpan, and action props
- WidgetSkeleton has configurable lines and animated shimmer effect
- WidgetError displays Indonesian text with "Coba Lagi" retry button
- All components use semantic Tailwind classes (bg-surface-elevated, text-text-primary, etc.)
- Created widgets/index.ts for clean imports
- Updated Dashboard/index.ts to re-export widget components

### File List

**Created:**
- `task-manager-client/src/pages/Dashboard/widgets/WidgetCard.tsx`
- `task-manager-client/src/pages/Dashboard/widgets/WidgetSkeleton.tsx`
- `task-manager-client/src/pages/Dashboard/widgets/WidgetError.tsx`
- `task-manager-client/src/pages/Dashboard/widgets/index.ts`

**Modified:**
- `task-manager-client/src/pages/Dashboard/index.ts` - Added widget exports

