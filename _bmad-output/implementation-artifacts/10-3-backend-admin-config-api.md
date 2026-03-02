---
story_id: '10-3'
title: 'Backend: Admin Config API'
epic: 'Epic 10: Dashboard Slideshow'
status: 'in-progress'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 10-3 Backend: Admin Config API

Sebagai Administrator, saya ingin memiliki endpoint API untuk mengelola konfigurasi slideshow (mengurutkan, mengaktifkan/menonaktifkan, mengubah durasi) sehingga tampilan monitoring wall dapat disesuaikan tanpa perlu mengubah kode.

## Acceptance Criteria

- [x] `AdminSlideshowController.ts` mengimplementasikan endpoint untuk mendapatkan semua konfigurasi.
- [x] Endpoint `PATCH /api/v2/dashboard/admin/slideshow/config/:id` mengizinkan pembaruan `enabled`, `duration_seconds`, dan `slide_order`.
- [x] Endpoint `POST /api/v2/dashboard/admin/slideshow/reorder` mengizinkan pembaruan urutan banyak slide sekaligus (bulk update).
- [x] Semua endpoint admin dilindungi oleh middleware `auth` dan `adminOnly`.
- [x] Setiap pembaruan konfigurasi memicu invalidasi cache Redis `slideshow:data`.

## Tasks / Subtasks

- [x] **Controller Layer**
  - [x] Create `src/controllers/AdminSlideshowController.ts`
  - [x] Implement `getConfigs`, `updateConfig`, and `reorderSlides`
- [x] **Route Layer**
  - [x] Create `src/routes/v2/admin-slideshow.ts`
  - [x] Register routes in `src/index.ts`
- [x] **Validation & Testing**
  - [x] Create `tests/controllers/AdminSlideshowController.test.ts`

## Dev Notes

### Architecture Requirements
- Follow Repository-Service-Controller pattern.
- Secure with existing auth middleware.
- Bulk reorder should ideally be done in a transaction.

### Technical Specifications
- Routes:
  - `GET /api/v2/dashboard/admin/slideshow/config`
  - `PATCH /api/v2/dashboard/admin/slideshow/config/:id`
  - `POST /api/v2/dashboard/admin/slideshow/reorder`

## Dev Agent Record

### Implementation Plan
1. Implement controller using `slideshowService`.
2. Define admin routes with proper middleware.
3. Hook up routes in `index.ts`.
4. Verify with integration tests.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `task-manager-server/src/controllers/AdminSlideshowController.ts`
- `task-manager-server/src/routes/v2/admin-slideshow.ts`
- `task-manager-server/src/index.ts`

## Change Log
- 2026-01-31: Initial story creation for Epic 10 Story 3.

## Status
done
