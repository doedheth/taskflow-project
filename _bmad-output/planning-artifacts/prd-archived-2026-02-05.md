---
stepsCompleted: [1, 2, 3, 4, 6, 7, 8, 9, 10, 11]
inputDocuments:
  - docs/PM_INTEGRATION_ANALYSIS.md
  - docs/PRESENTASI_TASKFLOW.md
  - _bmad-output/architecture.md
  - _bmad-output/data-models.md
workflowType: 'prd'
lastStep: 11
workflowComplete: true
documentCounts:
  briefs: 0
  research: 0
  projectDocs: 4
projectType: brownfield
lastEdited: '2026-01-29'
editHistory:
  - date: '2026-01-29'
    changes: 'Refinement: Removed technical leakage, condensed journeys, and fixed duplicate requirements.'
---

# Product Requirements Document - projectSAP (TaskFlow)

**Author:** Dedy
**Date:** 2025-12-31 (Updated: 2026-01-29)

## Executive Summary

TaskFlow adalah sistem manajemen terintegrasi untuk pabrik yang sudah berjalan dengan fitur Task Management, Maintenance, Production, dan AI Integration. Enhancement ini berfokus pada **personalisasi dashboard berbasis role**, **konsistensi design system**, dan **otomasi validasi data energi solar** untuk meningkatkan produktivitas pengguna.

**Masalah yang Dipecahkan:**
- Dashboard saat ini menampilkan informasi yang sama untuk semua user, menyebabkan **context switching** dan waktu terbuang untuk mencari informasi relevan.
- Inkonsistensi tema (terutama light mode) mengganggu user experience.
- Tampilan mobile/responsive belum optimal.
- Proses validasi data produksi energi solar dari Huawei FusionSolar terhadap data lokal masih manual, lambat, dan rawan human error.

**Solusi:**
- Dashboard yang menampilkan widget sesuai kebutuhan role masing-masing user.
- Perbaikan design system dengan **design tokens** untuk konsistensi warna dan styling.
- Optimasi responsive design untuk penggunaan mobile.
- Modul Monitoring Solar untuk otomasi penarikan data eksternal dan komparasi visual dengan data meter fisik untuk validasi gap produksi.

**Measurable Impact:**
- Mengurangi waktu untuk menemukan tugas prioritas dari ~2 menit menjadi <10 detik.
- Meningkatkan konsistensi visual di seluruh aplikasi.
- Meningkatkan usability di perangkat mobile.
- Mengurangi waktu validasi data energi dari ~30 menit/hari menjadi <2 menit.

## Project Classification

| Aspek | Detail |
|-------|--------|
| **Technical Type** | Interactive Web Application (SPA) |
| **Domain** | Manufacturing Operations Management |
| **Complexity** | Medium |
| **Project Context** | Brownfield - system enhancement |

**Scope Enhancement:**

1. **Role-based Dashboard Personalization**: Widget cerdas untuk Admin, Manager, Supervisor, dan Technician.
2. **Design System Consistency**: Standarisasi tema (light/dark) menggunakan design tokens.
3. **Mobile Optimization**: Pendekatan mobile-first untuk operasional lapangan.
4. **Automated Energy Monitoring & Analytics**: Integrasi Huawei FusionSolar dan PLN Induk (via Webhook) dengan data meter fisik untuk kalkulasi revenue real-time.

## Success Criteria

### User Success

| Role | Kriteria Sukses | Measurable Outcome |
|------|-----------------|-------------------|
| **Supervisor/Manager** | Memantau status mesin dan beban energi (PLN vs Solar) secara real-time. | Status mesin dan load terpadu visible di dashboard. |
| **Admin (Energy)** | Memvalidasi akurasi data Huawei & PLN terhadap data lokal secara otomatis. | Visualisasi gap terlihat jelas; akurasi data >95%. |
| **Finance/Management** | Mendapatkan laporan penghematan biaya listrik (Net Revenue) secara real-time. | Dashboard menampilkan angka penghematan hari ini. |
| **Semua User** | Pengalaman visual yang konsisten di seluruh aplikasi. | 0 inkonsistensi warna pada audit tema. |

### Business & Technical Success

- **Energy Accuracy**: Selisih data Huawei/PLN vs Lokal <5%.
- **Revenue Clarity**: Kalkulasi biaya PLN (BP/LBP) dan penghematan solar tersedia secara real-time.
- **Power Quality**: Notifikasi otomatis jika Power Factor (PF) PLN drop di bawah 0.85.
- **Efficiency**: Penurunan waktu validasi energi dari ~30 menit menjadi <2 menit.
- **Performance**: Dashboard load time <2 detik; Render grafik <1 detik.
- **Reliability**: Webhook PLN memiliki uptime 99.9% dan sinkronisasi harian berhasil 99%.

## Product Scope (MVP)

**1. Role-based Dashboard Content**
- Manager/Supervisor: Widget status mesin, ringkasan performa tim, beban energi terpadu (PLN vs Solar).
- Technician/Member: "My Day" view dengan tugas prioritas & WO assigned.
- Admin: Kesehatan sistem, aktivitas pengguna, log energi terpadu.

**2. Solar Energy Monitoring & Validation**
- Autentikasi otomatis & sinkronisasi harian data Huawei.
- Grafik komparasi adaptif (Area untuk harian, Bar untuk akumulasi).
- Kalkulasi estimasi produksi solar.

**3. PLN Induk Automation & Revenue Analytics**
- Webhook endpoint untuk data PLN Induk (BP, LBP, TOT, VARH, PF).
- Kalkulasi biaya PLN harian (skema WBP/LWBP).
- Dashboard "Net Revenue" (Savings) real-time.
- Monitoring Power Factor (PF) & alert system.

**4. Foundation & Design System**
- Penerapan design tokens (CSS variables) untuk konsistensi visual.
- Perbaikan total tema light mode dan dark mode.
- Komponen UI reusable.

**5. Responsive Design**
- Dashboard dioptimalkan untuk mobile (360px) hingga desktop (1920px).
- Target area interaksi minimal 44x44px untuk penggunaan lapangan.

## User Scenarios & Capability Requirements

| Persona | Skenario Utama | Kapabilitas yang Diperlukan | Dampak Terukur |
| :--- | :--- | :--- | :--- |
| **Supervisor (Pak Budi)** | Briefing pagi & kontrol operasional real-time. | Status mesin terpadu, ringkasan WO kemarin, workload tim. | Briefing: 15m → 2m. |
| **Teknisi (Andi)** | Penentuan prioritas kerja harian via HP. | Daftar tugas "My Day", pengingat PM, mobile-optimized UI. | 50% reduce repetitive questions. |
| **Manajer (Bu Ratna)** | Pengawasan strategis & monitoring KPI. | Ringkasan KPI (MTTR, Compliance), peringatan downtime kritis. | Laporan instan tanpa rekonsiliasi. |
| **Admin (Dedy)** | Validasi data energi & konfigurasi sistem. | Grafik komparasi (Huawei/PLN vs Lokal), gap analysis, auto-sync. | Validasi: 30m → 2m. Akurasi >95%. |
| **Finance/Management** | Pemantauan penghematan energi (Savings). | Dashboard Net Revenue real-time & kalkulasi biaya PLN. | Visibilitas penghematan detik ini. |

## Functional Requirements

### Dashboard & Operational Control
- FR1: System menampilkan dashboard berbeda berdasarkan peran pengguna (Role-based).
- FR2: System melakukan navigasi otomatis ke dashboard yang relevan setelah login.
- FR3: Supervisor memantau status semua mesin (operational/maintenance/breakdown) di satu widget.
- FR4: Technician melihat prioritas tugas harian dan Work Orders yang ditugaskan.
- FR5: Manager memantau KPI utama (MTTR, PM Compliance) dan peringkat performa tim.
- FR6: System menampilkan peringatan kritis untuk mesin dengan downtime tinggi.

### Solar Energy Monitoring & Validation
- FR7: System melakukan autentikasi otomatis ke sistem monitoring surya eksternal.
- FR8: System melakukan sinkronisasi data energi harian setiap 1 jam tanpa campur tangan manual.
- FR9: System menyimpan riwayat data eksternal dan data lokal dalam basis data terpusat.
- FR10: Dashboard menampilkan angka akumulasi "Today Yield" secara menonjol di atas grafik utama.
- FR11: System menampilkan grafik komparasi antara data eksternal (Huawei) dan data lokal.
- FR12: System menghitung estimasi pendapatan harian (Revenue) berdasarkan harga per kWh yang dapat dikonfigurasi.
- FR13: System menampilkan daya produksi aktual (real-time kW) dengan pembaruan setiap 15 detik.
- FR14: System melakukan konversi satuan otomatis (kWh ke MWh) untuk data akumulasi besar.
- FR15: System mengoptimalkan komunikasi API dengan menggunakan kembali sesi aktif (cookie-first).

### PLN Induk Automation & Revenue Analytics
- FR20: System menyediakan Webhook endpoint untuk menerima data meter PLN Induk secara real-time.
- FR21: System memproses data meter PLN mencakup Waktu Beban Puncak (BP), Luar Waktu Beban Puncak (LBP), Total (TOT), dan Power Factor (PF).
- FR22: System menghitung estimasi biaya PLN harian berdasarkan skema tarif WBP dan LWBP yang dikonfigurasi.
- FR23: Dashboard menampilkan "Net Revenue" (Savings) secara real-time dengan membandingkan konsumsi PLN terhadap kontribusi Solar.
- FR24: System memberikan notifikasi otomatis jika Power Factor (PF) PLN berada di bawah ambang batas 0.85.

### Design & Accessibility
- FR16: System menerapkan design tokens untuk menjamin konsistensi warna di seluruh aplikasi.
- FR17: User beralih antara mode terang (light) dan gelap (dark) dengan palet warna terstandarisasi.
- FR18: Layout dashboard adaptif untuk layar desktop, tablet, dan perangkat seluler.
- FR19: System menyediakan pemeriksaan ejaan (spell-check) dasar pada input teks kritikal.

## Non-Functional Requirements

### Performance & Reliability
- Dashboard Initial Load < 3 detik.
- Dashboard Interactive < 2 detik.
- Render grafik < 1 detik untuk data 30 hari.
- Dashboard Availability: 99% uptime selama jam operasional (06:00-22:00).
- Sync Reliability: 99% tingkat keberhasilan sinkronisasi harian.

### Security & Accessibility
- Autentikasi berbasis token dengan penegakan izin berbasis peran (RBAC).
- Member hanya mengakses data pribadi, Supervisor mengakses data tim.
- Pencegahan XSS pada seluruh input pengguna.
- Kepatuhan aksesibilitas: Kontras warna 4.5:1 dan target sentuh 44px.

### Maintainability
- Arsitektur berbasis komponen (reusable widgets).
- Penggunaan design tokens terpusat untuk kemudahan manajemen tema.
- Dokumentasi kode inline untuk logika integrasi yang kompleks.
