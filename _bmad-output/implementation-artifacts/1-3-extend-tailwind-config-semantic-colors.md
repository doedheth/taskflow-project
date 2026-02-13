# Story 1.3: Extend Tailwind Config with Semantic Colors

Status: done

## Story

As a **developer**,
I want **Tailwind utility classes for design tokens**,
So that **I can use classes like bg-surface and text-text-primary instead of hardcoded colors**.

## Acceptance Criteria

1. **Given** tailwind.config.js is extended
   **When** writing component styles
   **Then** classes like `bg-surface`, `bg-surface-elevated` are available
   **And** classes like `text-text-primary`, `text-text-secondary` are available
   **And** classes like `border-border` are available
   **And** status colors `bg-status-success`, `bg-status-warning`, `bg-status-error` are available

## Tasks / Subtasks

- [x] Task 1: Extend Tailwind config with semantic colors (AC: #1)
  - [x] 1.1: Add surface color tokens (surface, surface-hover, surface-elevated, surface-card)
  - [x] 1.2: Add text color tokens (text-primary, text-secondary, text-muted)
  - [x] 1.3: Add border color tokens (border, border-light, border-subtle)
  - [x] 1.4: Add status color tokens (success, warning, error, info)
  - [x] 1.5: Add dashboard-specific status aliases (operational, maintenance, breakdown)
  - [x] 1.6: Add widget border radius utility

## Dev Notes

### Architecture Requirements

**From Architecture Document:**
- Extend Tailwind config dengan CSS variables untuk semantic color tokens
- CSS vars enable runtime theme switching
- Single source of truth untuk colors

### New Tailwind Classes Available

| Category | Classes Available |
|----------|-------------------|
| Surface | `bg-surface`, `bg-surface-hover`, `bg-surface-elevated`, `bg-surface-card` |
| Text | `text-text-primary`, `text-text-secondary`, `text-text-muted` |
| Border | `border-border`, `border-border-light`, `border-border-subtle` |
| Status | `bg-status-success`, `bg-status-warning`, `bg-status-error`, `bg-status-info` |
| Machine Status | `bg-status-operational`, `bg-status-maintenance`, `bg-status-breakdown` |
| Border Radius | `rounded-widget` |

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Design Token Implementation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- Extended `tailwind.config.js` with semantic colors referencing CSS variables
- All colors now use `var(--color-*)` pattern for automatic theme switching
- Added surface, text, border, and status color categories
- Added dashboard-specific status aliases for machine status (operational, maintenance, breakdown)
- Added `rounded-widget` border radius utility for consistent widget styling
- Primary palette now includes DEFAULT and hover variants using CSS variables

### File List

**Modified:**
- `task-manager-client/tailwind.config.js` - Extended with semantic color tokens

