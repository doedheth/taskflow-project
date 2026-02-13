---
story_id: '10-1'
title: 'Infrastructure Setup: Redis & Database'
epic: 'Epic 10: Dashboard Slideshow'
status: 'ready-for-dev'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 10-1 Infrastructure Setup: Redis & Database

Sebagai sistem dashboard, saya ingin memiliki infrastruktur Redis untuk caching dan tabel database untuk konfigurasi slideshow sehingga performa TV display tetap optimal dan konfigurasi dapat dikelola secara dinamis.

## Acceptance Criteria

- [ ] Redis service ditambahkan ke `docker-compose.yml` (port 6379).
- [ ] Library `redis` terinstall di backend.
- [ ] `RedisCacheService.ts` diimplementasikan dengan penanganan koneksi yang aman (graceful fallback).
- [ ] Tabel `slideshow_configs` dibuat di database SQLite dengan schema yang sesuai tech-spec.
- [ ] Initial data (5 default slides) di-seed ke dalam tabel `slideshow_configs`.
- [ ] Environment variable `REDIS_URL` ditambahkan ke `.env` dan `.env.example`.

## Tasks / Subtasks

- [ ] **Infrastructure Setup**
  - [ ] Add Redis to `docker-compose.yml`
  - [ ] Install backend dependencies (`redis`, `@types/redis`)
  - [ ] Configure environment variables in `.env` and `.env.example`
- [ ] **Redis Implementation**
  - [ ] Create `src/services/RedisCacheService.ts`
  - [ ] Implement singleton pattern with connection error handling
- [ ] **Database Setup**
  - [ ] Create migration script `database/migrations/010_create_slideshow_configs.sql`
  - [ ] Run migration to create `slideshow_configs` table
  - [ ] Seed initial data: kpi-summary, production, maintenance, downtime, energy

## Dev Notes

### Architecture Requirements
- Redis 7-alpine used in Docker.
- SQLite used as primary database.
- Repository-Service-Controller pattern should be followed.

### Technical Specifications
- Redis TTL: 30 seconds for slideshow data.
- Table Schema: `id`, `slide_type`, `slide_order`, `duration_seconds`, `enabled`, `config_json`, `created_at`, `updated_at`.

## Dev Agent Record

### Implementation Plan
1. Update Docker configuration.
2. Install NPM packages.
3. Implement Redis Service.
4. Execute SQL migrations.

### Debug Log
- (Empty)

### Completion Notes
- (Empty)

## File List
- `docker-compose.yml`
- `task-manager-server/package.json`
- `task-manager-server/.env`
- `task-manager-server/.env.example`
- `task-manager-server/src/services/RedisCacheService.ts`
- `task-manager-server/database/migrations/010_create_slideshow_configs.sql`

## Change Log
- 2026-01-31: Initial story creation for Epic 10.

## Status
in-progress
