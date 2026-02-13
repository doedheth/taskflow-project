---
story_id: '10-5'
title: 'Frontend: Admin Config UI'
epic: 'Epic 10: Dashboard Slideshow'
status: 'in-progress'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 10-5 Frontend: Admin Config UI

Sebagai Administrator, saya ingin memiliki antarmuka pengguna untuk mengelola konfigurasi slideshow sehingga saya dapat mengatur urutan slide, mengaktifkan/menonaktifkan slide tertentu, dan menyesuaikan durasi tayang setiap slide melalui dashboard admin.

## Acceptance Criteria

- [x] Halaman `/admin/slideshow-config` tersedia bagi pengguna dengan role `admin`.
- [x] Menampilkan daftar semua slide dalam bentuk tabel atau list yang dapat diurutkan (drag-and-drop).
- [x] Urutan slide diperbarui secara real-time di database setelah drag-and-drop selesai.
- [x] Toggle tersedia untuk mengaktifkan/menonaktifkan slide.
- [x] Input field tersedia untuk mengubah durasi slide (validasi: 10-120 detik).
- [x] Menggunakan library `@hello-pangea/dnd` untuk fungsionalitas drag-and-drop.
- [x] Feedback visual (toast/loading state) ditampilkan saat pembaruan berhasil atau gagal.

## Tasks / Subtasks

- [x] **Infrastructure & Hooks**
  - [x] Create `src/hooks/useSlideshowConfig.ts` (React Query for Admin CRUD)
- [x] **Components**
  - [x] Create `src/pages/admin/AdminSlideshowConfig.tsx`
  - [x] Implement Draggable List using `@hello-pangea/dnd`
- [x] **Integration**
  - [x] Register route in `src/App.tsx` with admin protection
  - [x] Add link to Admin Slideshow Config in Sidebar or Admin menu

## Dev Notes

### Architecture Requirements
- Use React Query for state management and mutations.
- Follow existing Admin page patterns.
- Ensure type safety for SlideConfig.

### Technical Specifications
- Library: `@hello-pangea/dnd`.
- Validation: Duration between 10 and 120 seconds.

## Dev Agent Record

### Implementation Plan
1. Create a specialized hook for admin slideshow config.
2. Build the admin page with a list that supports drag-and-drop.
3. Implement toggle and duration editing with immediate auto-save or "Save" button.
4. Secure the route and verify functionality.

### Debug Log
- Replaced `react-beautiful-dnd` with `@hello-pangea/dnd` for better React 18 support and maintenance.
- Implemented optimistic UI updates in the drag-and-drop handler for smoother UX.

### Completion Notes
- Admin UI for slideshow configuration is fully functional. Admins can now manage the monitoring wall display directly from the browser.

## File List
- `task-manager-client/src/hooks/useSlideshowConfig.ts`
- `task-manager-client/src/pages/admin/AdminSlideshowConfig.tsx`
- `task-manager-client/src/App.tsx`
- `task-manager-client/src/components/Sidebar.tsx`

## Change Log
- 2026-01-31: Initial story creation for Epic 10 Story 5.
- 2026-01-31: Implementation completed.

## Status
done
