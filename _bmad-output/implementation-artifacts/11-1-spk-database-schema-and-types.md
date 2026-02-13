---
story_id: '11-1'
title: 'SPK Database Schema and Types'
epic: 'Epic 11: SPK Production Order System'
status: 'in-progress'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-1 SPK Database Schema and Types

Sebagai pengembang, saya ingin mendefinisikan skema basis data dan tipe data untuk sistem SPK sehingga data produk dan perintah kerja dapat disimpan secara terstruktur dan konsisten di seluruh aplikasi.

## Acceptance Criteria

- [ ] Tabel `products` dibuat dengan kolom: `id`, `code` (unique), `name`, `material`, `weight_gram`, `default_packaging`, `is_active`, `created_at`, `updated_at`.
- [ ] Tabel `spk_headers` dibuat dengan kolom: `id`, `spk_number` (unique), `asset_id`, `production_date`, `production_schedule_id` (FK), `status` (draft, pending, approved, rejected, cancelled), `created_by`, `approved_by`, `created_at`, `submitted_at`, `approved_at`, `rejection_reason`, `notes`.
- [ ] Tabel `spk_line_items` dibuat dengan kolom: `id`, `spk_header_id` (FK), `sequence`, `product_id`, `quantity`, `packaging_type`, `packaging_confirmed`, `remarks`.
- [ ] Indeks dibuat untuk `spk_number`, `asset_id`, `production_date`, dan `product_id`.
- [ ] Tipe data TypeScript (Interfaces/Enums) didefinisikan di backend (`src/types/spk.ts`) dan frontend (`src/types/spk.ts`).

## Tasks / Subtasks

- [ ] **Database Migration**
  - [ ] Create `task-manager-server/src/database/migrations/add_spk_tables.ts`
  - [ ] Implement tables creation and indexing logic
  - [ ] Run migration using `ts-node`
- [ ] **Data Types Definitions**
  - [ ] Create `task-manager-server/src/types/spk.ts` (Backend)
  - [ ] Create `task-manager-client/src/types/spk.ts` (Frontend)
  - [ ] Export SPK types in centralized type files
- [ ] **Initial Verification**
  - [ ] Verify tables exist in SQLite database

## Dev Notes

### Architecture Requirements
- Gunakan `BaseRepository` pattern.
- Relasi `spk_headers` ke `production_schedule` bersifat opsional (nullable FK).
- Gunakan snake_case untuk kolom database.

### Technical Specifications
- SPK Number Format: `SPK-{YYYYMMDD}-{ASSET_CODE}-{SEQ}`.
- Status Workflow: `draft` -> `pending` -> `approved`/`rejected`.

## Dev Agent Record

### Implementation Plan
1. Create and run the SQL migration.
2. Define backend types.
3. Define frontend types and hook up to `src/types/index.ts`.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `task-manager-server/src/database/migrations/add_spk_tables.ts`
- `task-manager-server/src/types/spk.ts`
- `task-manager-client/src/types/spk.ts`

## Change Log
- 2026-01-31: Initial story creation.

## Status
in-progress
