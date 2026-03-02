---
title: 'Solar Energy Monitoring & Comparison Dashboard'
slug: 'solar-energy-monitoring-comparison'
created: '2026-01-27T13:25:00+07:00'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Node.js', 'Express', 'TypeScript', 'sql.js', 'React', 'TanStack Query', 'Recharts', 'node-cron', 'axios']
files_to_modify: 
  - 'task-manager-server/src/index.ts'
  - 'task-manager-server/src/jobs/PredictiveMaintenanceJob.ts'
  - 'task-manager-client/src/services/api.ts'
  - 'task-manager-client/src/pages/Dashboard/index.ts'
  - 'task-manager-server/src/types/common.ts'
code_patterns: ['OOP V2 (Service-Repository-Controller)', 'Cron Job Pattern', 'Axios API client with interceptors', 'React Query / TanStack Query hooks']
test_patterns: ['Jest (Backend)', 'Vitest/React Testing Library (Frontend)']
---

# Tech-Spec: Solar Energy Monitoring & Comparison Dashboard

**Created:** 2026-01-27T13:25:00+07:00

## Overview

### Problem Statement

Dedy perlu memvalidasi akurasi data produksi energi dari Huawei FusionSolar dengan membandingkannya terhadap data pencatatan manual dari kwh meter lokal. Saat ini belum ada sistem yang mengotomatisasi penarikan data Huawei sekaligus menyediakan platform untuk input manual dan perbandingan visual.

### Solution

Membangun modul pendukung di dalam projectSAP yang mencakup:
1. Otomasi penarikan data dari Huawei FusionSolar melalui mekanisme auto-login.
2. Database lokal untuk menyimpan data historis Huawei dan data input manual.
3. Dashboard komparasi menggunakan grafik (charts) untuk melihat selisih (gap) antara data webase dan data lokal.

### Scope

**In Scope:**
- **Backend Automasi:** Service untuk menangani auto-login ke Huawei FusionSolar menggunakan kredensial yang tersimpan.
- **Data Collection:** Cron Job untuk menarik data `energy-balance` setiap 1 jam atau interval tertentu.
- **Database Schema:** Tabel untuk `solar_api_data` (Huawei) dan `solar_manual_data` (KWH Lokal).
- **API Endpoints:** CRUD untuk data manual dan fetching data komparasi.
- **Frontend Dashboard:** Halaman baru dengan grafik komparasi (Line/Bar Chart) menggunakan Recharts.

**Out of Scope:**
- Integrasi IoT Hardware (masih manual input untuk KWH lokal).
- Mobile App implementation (fokus pada Web Dashboard).

## Context for Development

### Codebase Patterns

Pengerjaan mengikuti standar `_bmad-output/project-context.md`:
- **Backend Architecture**: Mengikuti pola V2 OOP (`Routes -> Controllers -> Services -> Repositories`). Logika bisnis diletakkan sepenuhnya di Service.
- **Background Jobs**: Menggunakan `node-cron` yang diinisialisasi di `index.ts` via class job (seperti `PredictiveMaintenanceJob`).
- **Database (sql.js)**: Migrasi dilakukan secara prosedural di `index.ts` menggunakan `db.exec`.
- **Frontend API**: Menggunakan objek singleton di `services/api.ts` yang dibungkus oleh axios instance dengan auth interceptors.
- **Frontend State**: Menggunakan custom hooks (prefix `use...`) yang memanfaatkan React Query untuk server state management.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `task-manager-server/src/index.ts` | Entry point & registrasi routes/jobs. |
| `task-manager-server/src/jobs/PredictiveMaintenanceJob.ts` | Referensi implementasi background job. |
| `task-manager-server/src/services/UserService.ts` | Referensi Service layer V2. |
| `task-manager-server/src/models/UserRepository.ts` | Referensi Repository layer V2. |
| `task-manager-client/src/pages/ProductionKPI.tsx` | Referensi penggunaan Recharts dan filter tanggal. |
| `task-manager-client/src/services/api.ts` | Lokasi penambahan HttpClient endpoints baru. |

### Technical Decisions

1. **Auto-Login Backend**: `SolarService` akan menyimpan kredensial di `solar_config`. Jika request ke Huawei mengembalikan `401`, service akan memicu fungsi `login()` untuk mendapatkan session baru dan mengulang fetch.
2. **Database Schema**: 
    - `solar_energy_stats`: Menyimpan data `xAxis` (waktu), `productPower` (Huawei), dan `manual_kwh` (Input Lokal).
    - `solar_config`: Menyimpan encrypted username, password, stationDn, dan session cookies.
3. **Data Integrity**: Menggunakan `timestamp` sebagai kunci utama perbandingan antara Huawei (per 5 menit) dan Input Manual (biasanya per hari/shift). Dashboard akan melakukan agregrasi harian untuk komparasi apel-ke-apel.
4. **Dashboard Location**: Halaman baru `Solar Dashboard` yang dapat diakses oleh peran `admin` dan `manager`.

## Implementation Plan

### Tasks

#### Phase 1: Persistence & Database
- [x] **Task 1: Database Migration for Solar Data**
  - File: `task-manager-server/src/index.ts`
  - Action: Tambahkan logic `exec()` untuk membuat tabel `solar_config` (menyimpan kredensial & session) dan `solar_energy_data` (menyimpan statistik harian & manual).
  - Notes: Gunakan field `date` sebagai unique index untuk mempermudah perbandingan harian.

#### Phase 2: Backend Logic (Huawei Integration)
- [x] **Task 2: Implement SolarRepository**
  - File: `task-manager-server/src/models/SolarRepository.ts` (Create)
  - Action: Implementasi CRUD untuk data energi harian dan penyimpanan konfigurasi/session menggunakan pola `prepare()`.
- [x] **Task 3: Implement SolarService with Auto-Login**
  - File: `task-manager-server/src/services/SolarService.ts` (Create)
  - Action: Buat fungsi `login()` ke Huawei, `fetchEnergyBalance()` untuk ambil data, dan logic `ensureAuthenticated()` yang menangani auto-refresh session jika mendapat 401.
- [x] **Task 4: Implement SolarController & Routes**
  - File: `task-manager-server/src/controllers/SolarController.ts` & `task-manager-server/src/routes/v2/solar.ts` (Create)
  - Action: Buat endpoint GET `/api/v2/solar/comparison` and POST `/api/v2/solar/manual` (input data manual). Registrasikan di `src/index.ts`.
- [x] **Task 5: Register Background Job**
  - File: `task-manager-server/src/jobs/SolarSyncJob.ts` (Create)
  - Action: Buat job yang berjalan setiap jam untuk sinkronisasi data dari Huawei ke database lokal. Inisialisasi job di `src/index.ts`.

#### Phase 3: Frontend Integration
- [x] **Task 6: Update API Client**
  - File: `task-manager-client/src/services/api.ts`
  - Action: Tambahkan `solarAPI` object dengan method `getComparison` dan `saveManualData`.
- [x] **Task 7: Create SolarDashboard Component**
  - File: `task-manager-client/src/pages/SolarDashboard.tsx` (Create)
  - Action: Implementasi halaman dashboard dengan filter tanggal, Recharts (LineChart) untuk komparasi, dan form untuk input manual KWH meter.
- [x] **Task 8: Add Navigation & Route**
  - File: `task-manager-client/src/App.tsx`
  - Action: Tambahkan rute `<Route path="solar-monitor" element={<SolarDashboard />} />`.

## Acceptance Criteria

- [x] **AC 1: Otomatisasi Login Huawei**
- [x] **AC 2: Pengumpulan Data Historis**
- [x] **AC 3: Input Manual KWH Meter**
- [x] **AC 4: Visualisasi Komparasi (Chart)**

## Additional Context

### Dependencies
- `axios` (untuk API requests).
- `node-cron` (untuk scheduling).
- `recharts` (frontend charting).
