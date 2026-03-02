---
story_id: '10-4'
title: 'Frontend: Slideshow UI'
epic: 'Epic 10: Dashboard Slideshow'
status: 'in-progress'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 10-4 Frontend: Slideshow UI

Sebagai Supervisor di factory floor, saya ingin melihat dashboard yang berganti secara otomatis (slideshow) di layar TV display sehingga saya dapat memantau berbagai metrik operasional (KPI, Produksi, Maintenance, Downtime, Energi) secara real-time tanpa harus login atau melakukan navigasi manual.

## Acceptance Criteria

- [x] Route `/slideshow` dapat diakses tanpa login.
- [x] Data slideshow di-fetch menggunakan React Query dengan auto-refresh setiap 30 detik.
- [x] Slideshow melakukan rotasi otomatis sesuai durasi yang dikonfigurasi (default 30 detik).
- [x] Typography dioptimalkan untuk TV 55" (Hero numbers: 96px, Headers: 36px).
- [x] Kontrol manual tersedia saat hover (Next, Prev, Pause/Play, Fullscreen).
- [x] Keyboard shortcuts berfungsi (Space: Pause, Arrows: Navigasi, F: Fullscreen).
- [x] Transisi antar slide halus (0.4s fade).
- [x] Error states ditangani (Backend unreachable, Stale data banner).

## Tasks / Subtasks

- [x] **Infrastructure & Hooks**
  - [x] Create `src/hooks/useSlideshowData.ts` (React Query)
  - [x] Create `src/hooks/useSlideshowControls.ts` (State management for timer/nav)
- [x] **Components**
  - [x] Create `src/components/slideshow/slides/*.tsx` for each slide type
  - [x] Create `src/components/slideshow/SlideCarousel.tsx`
  - [x] Create `src/components/slideshow/ErrorScreen.tsx`
- [x] **Page & Route**
  - [x] Create `src/pages/PublicSlideshow.tsx`
  - [x] Register route in `src/App.tsx` (Path: `/slideshow`)

## Dev Notes

### Architecture Requirements
- Reuse existing Recharts widgets from dashboard components.
- Use Tailwind CSS with Design Tokens.
- Follow "Mobile-first" but optimize for "LG" (TV display).

### Technical Specifications
- Transition: `0.4s ease-in-out fade`.
- Typography: `text-8xl` for hero numbers, `text-4xl` for headers.

## Dev Agent Record

### Implementation Plan
1. Implement hooks for data and control logic.
2. Build individual slide components by wrapping existing widgets.
3. Build the carousel with timer logic.
4. Integrate into a new public page.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `task-manager-client/src/hooks/useSlideshowData.ts`
- `task-manager-client/src/hooks/useSlideshowControls.ts`
- `task-manager-client/src/components/slideshow/SlideCarousel.tsx`
- `task-manager-client/src/pages/PublicSlideshow.tsx`

## Change Log
- 2026-01-31: Initial story creation for Epic 10 Story 4.

## Status
done
