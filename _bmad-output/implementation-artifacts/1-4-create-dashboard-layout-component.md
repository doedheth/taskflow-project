# Story 1.4: Create DashboardLayout Component

Status: done

## Story

As a **user**,
I want **a consistent dashboard layout across all role variants**,
So that **navigation and structure feel familiar regardless of my role**.

## Acceptance Criteria

1. **Given** user navigates to dashboard
   **When** DashboardLayout renders
   **Then** a header area with user info and theme toggle is displayed
   **And** a main content area with responsive grid is displayed
   **And** layout adapts to screen size (single column mobile, 2 columns tablet, 3-4 columns desktop)
   **And** design tokens are used for all colors (no hardcoded values)

## Tasks / Subtasks

- [x] Task 1: Create DashboardLayout component (AC: #1)
  - [x] 1.1: Create `src/pages/Dashboard/DashboardLayout.tsx`
  - [x] 1.2: Add header area with user info display
  - [x] 1.3: Add theme toggle button with Sun/Moon icons
  - [x] 1.4: Create responsive grid container for widgets
  - [x] 1.5: Use design tokens for all colors (bg-surface, text-text-primary, etc.)

- [x] Task 2: Implement responsive breakpoints (AC: #1)
  - [x] 2.1: Mobile (<640px): Single column layout
  - [x] 2.2: Tablet (640-1024px): 2 columns layout
  - [x] 2.3: Desktop (>1024px): 3-4 columns layout

- [x] Task 3: Add role-specific features (AC: #1)
  - [x] 3.1: Time-based greeting (Selamat Pagi/Siang/Sore/Malam)
  - [x] 3.2: Role-specific subtitle messages
  - [x] 3.3: Create index.ts for module exports

## Dev Notes

### Architecture Requirements

**From Architecture Document:**
- Composition pattern with shared DashboardLayout
- Role-specific configurations
- Mobile-first responsive approach

### Component Structure

```
src/pages/Dashboard/
├── DashboardLayout.tsx       # Shared layout wrapper ✅
├── index.ts                  # Module exports ✅
├── AdminDashboard.tsx        # (Story 1.6)
├── ManagerDashboard.tsx      # (Story 1.6)
├── SupervisorDashboard.tsx   # (Story 1.6)
├── MemberDashboard.tsx       # (Story 1.6)
└── widgets/                  # (Story 1.5)
```

### Responsive Grid Classes

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
  {children}
</div>
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Dashboard Component Structure]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- Created `DashboardLayout.tsx` with header, theme toggle, and responsive grid
- Uses semantic Tailwind classes: `bg-surface-elevated`, `text-text-primary`, `border-border`
- Implements time-based Indonesian greetings (Selamat Pagi/Siang/Sore/Malam)
- Role-specific subtitles for admin, manager, supervisor, and member
- Responsive breakpoints: 1 col (mobile) → 2 cols (sm) → 3 cols (lg) → 4 cols (xl)
- Created `index.ts` for clean module exports
- Created `widgets/` folder for future widget components

### File List

**Created:**
- `task-manager-client/src/pages/Dashboard/DashboardLayout.tsx` - Shared layout component
- `task-manager-client/src/pages/Dashboard/index.ts` - Module exports
- `task-manager-client/src/pages/Dashboard/widgets/` - Widget folder (empty)

