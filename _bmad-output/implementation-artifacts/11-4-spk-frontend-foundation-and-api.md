---
story_id: '11-4'
title: 'SPK Frontend Foundation and API'
epic: 'Epic 11: SPK Production Order System'
status: 'done'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-4 SPK Frontend Foundation and API

Sebagai pengembang, saya ingin memiliki fondasi frontend berupa tipe data, layanan API, dan hooks untuk sistem SPK sehingga pengembangan antarmuka pengguna dapat dilakukan dengan cepat dan konsisten.

## Acceptance Criteria

- [x] Tipe data SPK didefinisikan di `client/src/types/spk.ts` dan diekspor melalui `src/types/index.ts`.
- [x] Layanan API untuk Produk dan SPK ditambahkan ke `client/src/services/api.ts`.
- [x] Hook React Query `useProducts` dan `useSPK` diimplementasikan dengan query keys yang tepat.
- [x] Mendukung operasi CRUD (Create, Read, Update, Delete) serta aksi spesifik (Submit, Approve, Reject, Cancel, Duplicate).

## Tasks / Subtasks

- [x] **Types & API**
  - [x] Create `src/types/spk.ts`
  - [x] Update `src/types/index.ts` to export SPK types
  - [x] Add `productsAPI` and `spkAPI` to `src/services/api.ts`
- [x] **React Query Hooks**
  - [x] Create `src/hooks/useProducts.ts`
  - [x] Create `src/hooks/useSPK.ts`

## Status
done
