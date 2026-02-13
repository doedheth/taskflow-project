---
story_id: '11-6'
title: 'SPK Integration and Polish'
epic: 'Epic 11: SPK Production Order System'
status: 'done'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-6 SPK Integration and Polish

Sebagai pengguna, saya ingin sistem SPK terintegrasi dengan fitur TaskFlow lainnya (seperti Shift Planner) sehingga data produksi konsisten di seluruh aplikasi.

## Acceptance Criteria

- [x] Link ke SPK terkait ditampilkan di modal pengeditan jadwal di `ProductionSchedule.tsx`.
- [x] Sidebar diperbarui dengan menu "SPK" dan "Master Produk".
- [x] Fitur cetak/unduh PDF di halaman detail SPK berfungsi dengan baik.
- [x] Navigasi antar modul (Shift Planner <-> SPK) berjalan lancar.
- [x] Dokumentasi teknis diperbarui.

## Tasks / Subtasks

- [x] **Integration**
  - [x] Add `RelatedSPKList` to `ProductionSchedule.tsx`
  - [x] Update Sidebar navigation menu
- [x] **Final Polish**
  - [x] Verify PDF layout and data mapping
  - [x] Final E2E testing of the complete flow

## Status
done
