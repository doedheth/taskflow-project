---
story_id: '10-2'
title: 'Backend: Public Slideshow API'
epic: 'Epic 10: Dashboard Slideshow'
status: 'ready-for-dev'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 10-2 Backend: Public Slideshow API

Sebagai sistem TV display, saya ingin memiliki endpoint API publik yang menyediakan data dashboard teragregasi (KPI, Produksi, Maintenance, Downtime, Energi) dengan performa tinggi melalui caching Redis sehingga data dapat ditampilkan tanpa autentikasi JWT di jaringan internal.

## Acceptance Criteria

- [x] Interface `SlideConfig`, `SlideData`, and `SlideshowResponse` didefinisikan di `src/types/slideshow.ts`.
- [x] `SlideshowConfigRepository.ts` mengimplementasikan akses data ke tabel `slideshow_configs`.
- [x] Middleware `publicAccess.ts` mengizinkan akses tanpa JWT untuk endpoint tertentu.
- [x] `SlideshowService.ts` mengagregasi data dari berbagai report service (KPI, Production, Maintenance, Downtime, Energy).
- [x] `SlideshowService.ts` menggunakan `RedisCacheService` untuk menyimpan hasil agregasi selama 30 detik.
- [x] `PublicDashboardController.ts` menangani request `GET /api/dashboard/slideshow`.
- [x] Route `v2/public-dashboard` didaftarkan dan dapat diakses tanpa token.

## Tasks / Subtasks

- [x] **Data Access & Types**
  - [x] Create `src/types/slideshow.ts`
  - [x] Create `src/repositories/SlideshowConfigRepository.ts`
- [x] **Middleware & Security**
  - [x] Create `src/middleware/publicAccess.ts`
- [x] **Business Logic (Aggregation & Caching)**
  - [x] Create `src/services/SlideshowService.ts`
  - [x] Implement `getSlideshowData()` with Redis logic
- [x] **API Layer**
  - [x] Create `src/controllers/v2/PublicDashboardController.ts`
  - [x] Create `src/routes/v2/publicDashboard.ts`
  - [x] Register routes in `src/index.ts`

## Dev Notes

### Architecture Requirements
- Follow Repository-Service-Controller pattern.
- Reuse existing `ReportService`, `EnergyService`, `ProductionService`, etc.
- No business logic in controllers.

### Technical Specifications
- Cache Key: `slideshow:data`
- Cache TTL: 30 seconds.
- Endpoint: `GET /api/v2/dashboard/slideshow` (Public).

## Dev Agent Record

### Implementation Plan
1. Define types.
2. Implement repository for config access.
3. Implement public access middleware.
4. Implement service to aggregate data from multiple existing services.
5. Implement controller and expose route.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `task-manager-server/src/types/slideshow.ts`
- `task-manager-server/src/repositories/SlideshowConfigRepository.ts`
- `task-manager-server/src/middleware/publicAccess.ts`
- `task-manager-server/src/services/SlideshowService.ts`
- `task-manager-server/src/controllers/v2/PublicDashboardController.ts`
- `task-manager-server/src/routes/v2/publicDashboard.ts`
- `task-manager-server/src/index.ts`

## Change Log
- 2026-01-31: Initial story creation for Epic 10 Story 2.

## Status
done
