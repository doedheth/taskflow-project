---
story_id: '11-5'
title: 'SPK Frontend Components and Forms'
epic: 'Epic 11: SPK Production Order System'
status: 'done'
created_at: '2026-01-31'
updated_at: '2026-01-31'
---

# Story: 11-5 SPK Frontend Components and Forms

Sebagai pengguna (PPIC/Manajer), saya ingin memiliki antarmuka pengguna untuk mengelola Produk dan SPK sehingga saya dapat melakukan operasional harian secara digital dan efisien.

## Acceptance Criteria

- [x] Komponen `SPKStatusBadge` menampilkan warna yang sesuai dengan status SPK.
- [x] Komponen `ProductPicker` memungkinkan pencarian produk secara real-time dengan auto-fill spesifikasi.
- [x] Halaman `ProductList` mengelola master data produk (Tambah, Edit, Aktifkan/Nonaktifkan).
- [x] Halaman `SPKList` menampilkan dashboard SPK dengan ringkasan status dan filter.
- [x] Halaman `SPKForm` mendukung pembuatan dan pengeditan SPK dengan baris item produk dinamis.
- [x] Halaman `SPKDetail` menampilkan rincian lengkap SPK, log penolakan, dan aksi workflow (Approve/Reject).
- [x] Implementasi cetak dan unduh PDF menggunakan `@react-pdf/renderer` yang sesuai format perusahaan.

## Tasks / Subtasks

- [x] **Common Components**
  - [x] Create `src/components/SPK/SPKStatusBadge.tsx`
  - [x] Create `src/components/SPK/ProductPicker.tsx`
- [x] **Product Management**
  - [x] Create `src/pages/Products/ProductList.tsx`
- [x] **SPK Operations**
  - [x] Create `src/pages/SPK/SPKList.tsx`
  - [x] Create `src/pages/SPK/SPKForm.tsx`
  - [x] Create `src/pages/SPK/SPKDetail.tsx`
- [x] **Output & Export**
  - [x] Create `src/components/SPK/SPKPdfDocument.tsx`
  - [x] Integrate PDF generation in `SPKDetail.tsx`

## Status
done
