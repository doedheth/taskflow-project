---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
workflowType: 'epics-and-stories'
project_name: 'projectSAP'
user_name: 'Dedy'
date: '2026-01-29'
totalEpics: 8
totalStories: 47
totalFRs: 19
frCoverage: '100%'
lastUpdated: '2026-01-29 - Sync with refined PRD and Solar module integration'
---

# projectSAP - Epic Breakdown

## Overview

Dokumen ini berisi rincian Epic dan Story untuk projectSAP (Enhancement TaskFlow), yang mendekomposisi kebutuhan dari PRD ke dalam story yang dapat diimplementasikan dengan fokus pada personalisasi dashboard, konsistensi sistem desain, dan pemantauan energi surya.

## Requirements Inventory

### Functional Requirements (Refined)

**Dashboard & Operational Control (FR1-FR6)**
- FR1: Dashboard berbeda berdasarkan peran pengguna (Role-based).
- FR2: Navigasi otomatis ke dashboard yang relevan setelah login.
- FR3: Supervisor memantau status semua mesin di satu widget.
- FR4: Technician melihat prioritas tugas harian dan Work Orders.
- FR5: Manager memantau KPI utama dan peringkat performa tim.
- FR6: Peringatan kritis untuk mesin dengan downtime tinggi.

**Solar Energy Monitoring & Validation (FR7-FR15)**
- FR7: Autentikasi otomatis ke sistem monitoring surya eksternal.
- FR8: Sinkronisasi data energi harian setiap 1 jam.
- FR9: Penyimpanan riwayat data eksternal dan lokal dalam basis data terpusat.
- FR10: Tampilan angka akumulasi "Today Yield" yang menonjol.
- FR11: Grafik komparasi antara data eksternal (Huawei) dan data lokal.
- FR12: Estimasi pendapatan harian (Revenue) berbasis harga kWh.
- FR13: Daya produksi aktual (real-time kW) dengan pembaruan setiap 15 detik.
- FR14: Konversi satuan otomatis (kWh ke MWh).
- FR15: Optimasi komunikasi API dengan penggunaan kembali sesi aktif.

**Design & Accessibility (FR16-FR19)**
- FR16: Penerapan design tokens untuk konsistensi visual.
- FR17: Switcher mode terang (light) dan gelap (dark).
- FR18: Layout dashboard adaptif (Desktop/Tablet/Mobile).
- FR19: Pemeriksaan ejaan (spell-check) dasar.

## FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2,3,4,5 | Role-based dashboard content |
| FR2 | Epic 1 | Auto-render dashboard after login |
| FR3 | Epic 2 | Machine status visibility for Supervisor |
| FR4 | Epic 3 | Task/WO visibility for Technician |
| FR5 | Epic 4 | KPI/Performance for Manager |
| FR6 | Epic 4 | Critical alerts |
| FR7 | Epic 8 | Huawei auto-login |
| FR8 | Epic 8 | Hourly data sync |
| FR9 | Epic 8 | Centralized data storage |
| FR10 | Epic 8 | Today Yield prominent display |
| FR11 | Epic 8 | Comparison chart |
| FR12 | Epic 8 | Revenue estimation |
| FR13 | Epic 8 | Real-time production (kW) |
| FR14 | Epic 8 | Smart unit conversion |
| FR15 | Epic 8 | Session reuse optimization |
| FR20 | Epic 9 | PLN Webhook endpoint |
| FR21 | Epic 9 | PLN metrics processing (BP/LBP) |
| FR22 | Epic 9 | PLN daily cost calculation |
| FR23 | Epic 9 | Net Revenue Dashboard |
| FR24 | Epic 9 | Power Factor alert system |
| FR16 | Epic 1 | Design tokens implementation |
| FR17 | Epic 1 | Light/Dark mode switcher |
| FR18 | Epic 1,2,3,4,5 | Adaptive layout |
| FR19 | Epic 6 | Basic spell-check |

**Coverage: 19/19 FRs (100%)**

## Epic List

### Epic 1: Foundation - Infrastructure & Design System
Menyediakan fondasi teknis berupa sistem desain yang konsisten dan infrastruktur data fetching untuk seluruh dashboard.
**FRs covered:** FR2, FR16, FR17, FR18

### Epic 2: Supervisor Dashboard - Operational Control
Memberikan visibilitas penuh bagi Supervisor terhadap status mesin dan beban kerja tim secara real-time.
**FRs covered:** FR1, FR3, FR18

### Epic 3: Member Dashboard - Personal Productivity
Meningkatkan produktivitas teknisi dengan tampilan agenda harian yang fokus dan terprioritasi.
**FRs covered:** FR1, FR4, FR18

### Epic 4: Manager Dashboard - Executive Oversight
Memudahkan Manajer dalam pengambilan keputusan melalui ringkasan KPI dan peringatan operasional kritis.
**FRs covered:** FR1, FR5, FR6, FR18

### Epic 5: Admin Dashboard - System Management
Menyediakan alat bagi Admin untuk memantau kesehatan sistem dan konfigurasi.
**FRs covered:** FR1, FR18

### Epic 6: Data Quality - Text Assistance
Meningkatkan kualitas input data melalui bantuan pemeriksaan ejaan dasar.
**FRs covered:** FR19

### Epic 7: AI Integration - Intelligent Operations (Growth Phase)
Pemanfaatan AI untuk analisis root cause, prediksi kegagalan mesin, dan rekomendasi cerdas.
**Status:** Post-MVP

### Epic 8: Solar Analytics - Energy Performance
Automasi validasi data energi surya dan pemantauan produksi secara real-time.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15

### Epic 9: PLN Induk Metrics & Net Revenue
Otomasi pencatatan meter PLN Induk melalui webhook dan kalkulasi penghematan biaya energi (Net Revenue) secara real-time.
**FRs covered:** FR20, FR21, FR22, FR23, FR24

---

## Epic 8 Detail: Solar Analytics

**Goal:** Dedy (Admin) dapat memvalidasi akurasi data Huawei FusionSolar dengan komparasi harian terhadap data meter melalui dashboard otomatis.

### Story 8.1: Database Migration for Solar Data
Implementasi skema basis data untuk menyimpan data API Huawei dan data meter eksternal.

### Story 8.2: Implement Solar Service with Session Reuse
Pengembangan layanan backend yang menangani autentikasi Huawei dengan strategi cookie-first (hanya login jika sesi berakhir).

### Story 8.3: Real-time Power Monitoring (kW)
Tampilan daya produksi aktual dalam kW yang diperbarui secara otomatis setiap 15 detik.

### Story 8.4: Unified Energy Trend Visualization
Grafik terpadu yang menggabungkan data Huawei dan data lokal dalam satu visualisasi (Area/Bar) dengan konversi satuan dinamis (MWh).

### Story 8.5: Solar Revenue Estimation
Kalkulasi estimasi pendapatan dalam IDR berdasarkan total yield dan harga energi yang dapat dikonfigurasi.

### Story 8.6: Webhook Integration Strategy
Penyediaan endpoint untuk menerima data meter lokal secara otomatis (menggantikan input manual).

### Story 8.7: Targeted Full Screen Mode
Fitur tampilan layar penuh khusus untuk area grafik guna keperluan monitoring di layar besar.

---

## Epic 9 Detail: PLN Induk Metrics & Net Revenue

**Goal:** Mengotomasi pencatatan meter PLN Induk untuk mendapatkan visibilitas biaya dan penghematan energi (Net Revenue) secara real-time.

### Story 9.1: Database Schema for PLN Metrics
Implementasi tabel `pln_metrics` untuk menyimpan data historis BP, LBP, Total, VARH, dan Power Factor.

### Story 9.2: PLN Induk Webhook Integration
Pengembangan endpoint `POST /api/v2/energy/webhook/pln` untuk menerima data otomatis dari Power Meter lapangan.

### Story 9.3: Real-time Power Factor Monitoring & Alert
Implementasi monitoring PF secara real-time dengan sistem peringatan otomatis jika nilai di bawah 0.85.

### Story 9.4: Net Revenue (Savings) Calculation Engine
Pengembangan mesin kalkulasi yang membandingkan biaya pemakaian PLN terhadap kontribusi penghematan dari Solar Panel.

### Story 9.5: Integrated Energy Load Dashboard
Tampilan visual terpadu di dashboard yang menunjukkan beban total pabrik yang disuplai oleh PLN vs Solar.

---

_Updated: 2026-01-29 | Source: Refined PRD v2_
