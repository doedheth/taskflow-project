# Story 1.2: Create Design Tokens CSS Variables

Status: done

## Story

As a **user**,
I want **consistent colors across the application**,
So that **light mode and dark mode display correctly without visual inconsistencies**.

## Acceptance Criteria

1. **Given** the application loads
   **When** viewing any page in light mode
   **Then** all surfaces use --color-surface token (white background)
   **And** all text uses --color-text-primary and --color-text-secondary tokens
   **And** all borders use --color-border token

2. **Given** user toggles to dark mode
   **When** the .dark class is applied to root
   **Then** all design tokens automatically switch to dark values
   **And** no hardcoded colors remain visible

## Tasks / Subtasks

- [x] Task 1: Define CSS custom properties for design tokens (AC: #1, #2)
  - [x] 1.1: Add :root CSS variables for light mode colors
  - [x] 1.2: Add .dark CSS variables for dark mode colors
  - [x] 1.3: Define surface tokens (surface, surface-elevated, surface-card)
  - [x] 1.4: Define text tokens (text-primary, text-secondary, text-muted)
  - [x] 1.5: Define border tokens (border, border-subtle)
  - [x] 1.6: Define status tokens (success, warning, error, info)

- [x] Task 2: Verify existing theme toggle works with new tokens (AC: #2)
  - [x] 2.1: Check ThemeContext for dark mode class application
  - [x] 2.2: Test token switching when theme changes

- [x] Task 3: Document token usage (AC: #1, #2)
  - [x] 3.1: Add comments in CSS file explaining each token category

## Dev Notes

### Architecture Requirements

**From Architecture Document:**
- Extend Tailwind config dengan CSS variables untuk semantic color tokens
- CSS vars enable runtime theme switching
- Single source of truth untuk colors

**Design Token Categories:**
1. **Surface** - Backgrounds (surface, surface-elevated, surface-card)
2. **Text** - Typography colors (primary, secondary, muted)
3. **Border** - Dividers and outlines
4. **Status** - Semantic colors (success, warning, error, info)

### Technical Implementation Guide

**CSS Variables to Add (globals.css or index.css):**
```css
:root {
  /* Surface tokens */
  --color-surface: #ffffff;
  --color-surface-elevated: #f9fafb;
  --color-surface-card: #ffffff;

  /* Text tokens */
  --color-text: #111827;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #9ca3af;

  /* Border tokens */
  --color-border: #e5e7eb;
  --color-border-subtle: #f3f4f6;

  /* Status tokens */
  --color-status-success: #22c55e;
  --color-status-warning: #f59e0b;
  --color-status-error: #ef4444;
  --color-status-info: #3b82f6;

  /* Interactive tokens */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
}

.dark {
  /* Surface tokens */
  --color-surface: #0f172a;
  --color-surface-elevated: #1e293b;
  --color-surface-card: #1e293b;

  /* Text tokens */
  --color-text: #f8fafc;
  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  /* Border tokens */
  --color-border: #334155;
  --color-border-subtle: #1e293b;

  /* Status tokens remain same for consistency */
  --color-status-success: #22c55e;
  --color-status-warning: #f59e0b;
  --color-status-error: #ef4444;
  --color-status-info: #3b82f6;

  /* Interactive tokens */
  --color-primary: #3b82f6;
  --color-primary-hover: #60a5fa;
}
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Design Token Implementation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]

## Dev Agent Record

### Agent Model Used

gemini-claude-opus-4-5-thinking

### Debug Log References

N/A

### Completion Notes List

- Design tokens already existed in `index.css` - enhanced with additional tokens
- Added missing tokens: `--color-surface-card`, `--color-border-subtle`, `--color-text-primary`
- Added info status tokens: `--color-info`, `--color-info-light`
- Added dashboard-specific status aliases: `--color-status-operational`, `--color-status-maintenance`, `--color-status-breakdown`
- Organized CSS with clear section comments for each token category
- ThemeContext already properly applies `.light` and `.dark` classes to root element
- Existing utility classes (`.text-theme`, `.bg-theme-surface`, `.border-theme`) already use these tokens

### File List

**Modified:**
- `task-manager-client/src/index.css` - Enhanced design tokens with additional variables and documentation

