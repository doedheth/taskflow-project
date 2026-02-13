---
story_id: '11-3'
title: 'SPK Backend Services and Routes'
epic: 'Epic 11: SPK Production Order System'
status: 'done'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-3 SPK Backend Services and Routes

Sebagai pengembang, saya ingin memiliki layanan bisnis (Service) dan endpoint API (Routes) untuk sistem SPK sehingga logika alur kerja (seperti approval dan integrasi jadwal) dapat dijalankan dengan benar dan diakses oleh frontend.

## Acceptance Criteria

- [x] `ProductService.ts` menangani validasi bisnis produk (seperti pengecekan kode unik).
- [x] `SPKService.ts` mengimplementasikan logika alur kerja: `submit`, `approve`, `reject`, dan `cancel`.
- [x] Alur approval SPK secara otomatis membuat atau menghubungkan entitas ke `production_schedule` (Shift Planner).
- [x] Endpoint API v2 untuk Produk dan SPK terdaftar di `src/index.ts`.
- [x] Middleware `auth` dan `managerOrAdmin` diterapkan untuk melindungi aksi sensitif (approve/manage products).

## Tasks / Subtasks

- [x] **Service Layer**
  - [x] Implement `ProductService.ts` with validation hooks
  - [x] Implement `SPKService.ts` with state transition logic
- [x] **API Layer**
  - [x] Implement `ProductController.ts` and `SPKController.ts`
  - [x] Create routes in `src/routes/v2/`
  - [x] Register routes in `src/index.ts`

## Status
done
