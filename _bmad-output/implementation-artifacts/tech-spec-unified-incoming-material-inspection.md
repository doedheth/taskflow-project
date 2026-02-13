---
title: 'Unified Incoming Material Inspection System'
slug: 'unified-incoming-material-inspection'
created: '2026-02-07'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'jspdf', 'react-signature-canvas']
files_to_modify: ['task-manager-server/src/database/setup.ts', 'task-manager-client/src/types/inspection.ts', 'task-manager-server/src/models/InspectionRepository.ts', 'task-manager-client/src/pages/IncomingInspection/InspectionForm.tsx', 'task-manager-client/src/utils/inspectionPdf.ts']
code_patterns: ['Multi-step Form', 'Excel-like Grid Input', 'Coordinate-based PDF Generation']
test_patterns: []
---

# Tech-Spec: Unified Incoming Material Inspection System

**Created:** 2026-02-07
**Status:** Implementation Complete

## Overview

### Problem Statement
Sistem inspeksi saat ini belum sepenuhnya mencakup detail parameter kualitas (QC) dan keamanan pangan yang ada pada form fisik asli. Selain itu, layout PDF yang dihasilkan perlu ditingkatkan agar identik dengan dokumen cetak untuk keperluan audit dan arsip vendor.

### Solution
Membangun modul inspeksi terpadu yang mencakup:
1. Pengecekan Kendaraan & Kedatangan.
2. Pemeriksaan Kemasan & Kuantitas (dengan input sampling 20 batch).
3. Inspeksi QC Material (Kualitas & Keamanan Pangan).
4. Lampiran Berat Timbangan (dengan grid foto bukti).
5. Mesin PDF dengan layout presisi tinggi.

### Scope

**In Scope:**
- Form input multi-step untuk 4 kategori dokumen utama.
- Input tabel sampling batch (20 baris) dengan UI yang efisien (excel-like).
- Fitur Digital Signature (Checker, Driver, Supervisor).
- Grid galeri foto (3x3) untuk lampiran bukti timbangan.
- Generate PDF dengan layout 1:1 sesuai contoh gambar.
- Penyimpanan data terstruktur ke database SQLite.

**Out of Scope:**
- Integrasi IoT/Timbangan digital otomatis.
- Workflow approval email otomatis.

---

## Context for Development

### Technical Preferences
- **Frontend**: Tetap menggunakan pattern Functional Components dengan Tailwind CSS. Untuk input tabel yang panjang, gunakan optimasi state agar tidak lag.
- **Backend**: Mengikuti OOP Layered Architecture yang sudah ada. Perlu penyesuaian skema database untuk menampung parameter QC yang baru (lebih dari 20 parameter baru).
- **PDF Generation**: Menggunakan `jspdf` dengan penekanan pada koordinat absolut untuk mereplikasi desain form fisik.

### Investigation Notes
- Kode yang ada di `InspectionForm.tsx` akan dijadikan referensi utama untuk logika transisi step dan penyimpanan draf.
- Perlu penambahan tabel baru atau kolom pada SQLite untuk menyimpan hasil pengecekan fungsional, CoA, visual, dan keamanan pangan.

---

## Implementation Plan

### Tasks

#### 1. Database & Types Update
- [x] **Task 1: Update SQLite Schema**
  - File: `task-manager-server/src/database/setup.ts`
  - Action: Tambahkan tabel `inspection_qc_params` untuk menyimpan hasil pengecekan fungsional, CoA, visual, dan keamanan pangan (24+ parameter sesuai gambar). Tambahkan kolom `supervisor_signature` pada `incoming_inspections`.
- [x] **Task 2: Update Shared Types**
  - File: `task-manager-client/src/types/inspection.ts`
  - Action: Update interface `Inspection` dan `CreateInspectionDTO` untuk mencakup parameter baru.

#### 2. Backend Logic
- [x] **Task 3: Update Repository Methods**
  - File: `task-manager-server/src/models/InspectionRepository.ts`
  - Action: Update method `create` dan `findWithDetails` untuk menangani penyimpanan dan pengambilan data QC terpadu.

#### 3. Frontend - High Fidelity Forms
- [x] **Task 4: Implement Excel-like Sampling Grid**
  - File: `task-manager-client/src/pages/IncomingInspection/InspectionForm.tsx`
  - Action: Ganti tabel sampling sederhana dengan grid 20 baris (layout 2 kolom seperti gambar 1). Implementasi auto-tab dan keyboard navigation.
- [x] **Task 5: Implement QC Comprehensive Form**
  - File: `task-manager-client/src/pages/IncomingInspection/InspectionForm.tsx`
  - Action: Buat komponen input untuk parameter Kualitas (Berat, Joint, Creasing, CoA, Visual) dan Keamanan Pangan (Material, Kendaraan) sesuai gambar 2.
- [x] **Task 6: Implement 3x3 Photo Grid for Weights**
  - File: `task-manager-client/src/pages/IncomingInspection/InspectionForm.tsx`
  - Action: Ubah list timbangan menjadi layout grid 3 kolom untuk lampiran berat sesuai gambar 3.

#### 4. Reporting & High Precision PDF
- [x] **Task 7: Rebuild PDF Engine with Coordinate Calibration**
  - File: `task-manager-client/src/utils/inspectionPdf.ts`
  - Action: Implementasi layout PDF absolut menggunakan `doc.line()`, `doc.rect()`, dan `doc.text()` dengan koordinat presisi agar hasilnya 1:1 dengan form fisik. Ganti `jspdf-autotable` dengan custom grid drawing untuk kontrol penuh.

### Acceptance Criteria

- [x] **AC 1: Data Fidelity**
  - Given user di halaman form, when mengisi 20 baris sampling batch, then data tersimpan secara atomik ke database.
- [x] **AC 2: UI Precision**
  - Given form QC Material, when dibuka, then urutan parameter pengecekan (Kualitas & Keamanan Pangan) sama persis dengan urutan pada gambar 2.
- [x] **AC 3: PDF Layout Accuracy**
  - Given laporan inspeksi selesai, when diunduh ke PDF, then layout garis, tabel, dan posisi teks di PDF identik dengan scan dokumen fisik.
- [x] **AC 4: Photo Attachment Grid**
  - Given lampiran berat timbangan, when di-generate ke PDF, then foto-foto tampil dalam format grid 3x3 dengan label No Batch dan Berat di bawah masing-masing foto.

---

## Additional Context

### Dependencies
- `jspdf`: Core library untuk pembuatan PDF.
- `react-signature-canvas`: Untuk penangkapan tanda tangan (ditambah 1 field untuk Supervisor).

### Testing Strategy
- **Visual Comparison**: Bandingkan output PDF side-by-side dengan gambar referensi yang diberikan user.
- **Data Integrity**: Verifikasi penyimpanan parameter QC yang kompleks melalui SQLite browser.

### Notes
- **Performance**: Grid input 20 baris x 3 kolom mungkin berat di perangkat low-end. Gunakan `React.memo` atau `useMemo` untuk baris tabel.
- **Risk**: Kalibrasi koordinat PDF memerlukan beberapa kali iterasi untuk mencapai hasil 1:1.
