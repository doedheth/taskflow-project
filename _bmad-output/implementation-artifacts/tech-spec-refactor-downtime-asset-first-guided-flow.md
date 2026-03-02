---
title: 'Refactor Downtime: Asset-First Guided Flow'
slug: 'refactor-downtime-asset-first-guided-flow'
created: '2026-02-24'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18 + TS', 'Vite', 'Tailwind', 'Express 4 + TS', 'SQLite (sql.js)']
files_to_modify: [
  'task-manager-client/src/pages/DowntimeTracker.tsx',
  'task-manager-client/src/components/maintenance/AssetCardGrid.tsx',
  'task-manager-client/src/components/maintenance/FailureCategoryPicker.tsx',
  'task-manager-client/src/components/maintenance/FailureCodePicker.tsx',
  'task-manager-client/src/services/api-v2.ts',
  'task-manager-client/src/components/maintenance/index.ts'
]
code_patterns: [
  'Functional React components',
  'Modal-based forms with Tailwind UI',
  'Downtime classification auto-detection via /downtime/check-schedule',
  'Per-asset failure codes via assetsAPI.getFailureCodesByAsset(assetId)',
  'Generate & create failure code when missing',
  'AIWritingAssistant for optional keterangan'
]
test_patterns: [
  'Frontend interaction tests (if framework configured)',
  'Service call verification via mock adapters'
]
---

# Tech-Spec: Refactor Downtime: Asset-First Guided Flow

**Created:** 2026-02-24

## Overview

### Problem Statement

Operator kesulitan saat membuat log downtime karena harus mengetik keterangan panjang di awal. Alur saat ini tidak memandu pilihan secara bertahap untuk mengurangi beban input. Dibutuhkan pengalaman “guided flow” yang menempatkan pemilihan Asset di depan dengan UI kartu yang dapat diklik, menampilkan sub-kategori relevan, lalu memilih Failure Code dan menambahkan keterangan singkat di akhir.

### Solution

Refactor alur “Log Breakdown/PM” pada halaman Downtime (maintenance) menjadi wizard 3 langkah yang terstruktur dan minim pengetikan:
- Langkah 1: Asset Picker — grid kartu asset dengan informasi ringkas dan pencarian.
- Langkah 2: Kategori & Failure Codes — pilih kategori (berdasarkan Failure Code category) lalu pilih Failure Code spesifik.
- Langkah 3: Ringkasan & Mulai — tampilkan klasifikasi otomatis (berdasarkan /downtime/check-schedule + downtime_type), opsi keterangan singkat (AI assisted), dan konfirmasi “Mulai Downtime”.

Produksi (ProductionDowntime) tetap seperti sekarang. Fokus refactor pada flow maintenance di DowntimeTracker.

### Scope

**In Scope:**
- Menambahkan wizard modal “Asset-First Guided Flow” pada DowntimeTracker.
- Komponen UI: AssetCardGrid, FailureCategoryPicker, FailureCodePicker, SummaryStep.
- Integrasi ke downtimeAPI.create() dan assetsAPI.getFailureCodes().
- Mempertahankan auto-klasifikasi via /downtime/check-schedule untuk maintenance.

**Out of Scope:**
- Perubahan pada backend schema/model.
- Perubahan pada halaman ProductionDowntime dan quick actions.
- Manajemen master Failure Codes di halaman settings.

## Context for Development

### Codebase Patterns

- Halaman Downtime saat ini terbagi: DowntimeTracker (maintenance) dan ProductionDowntime (produksi).
- Pengambilan data menggunakan api-v2.ts (axios) dengan interceptor token.
- UI menggunakan Tailwind; modal dan kartu sudah digunakan di berbagai halaman.
- Klasifikasi maintenance otomatis melalui downtimeAPI.checkSchedule() pada saat pemilihan asset dan jenis downtime.
- Failure Code tersedia via assetsAPI.getFailureCodes() dan ditampilkan dalam dropdown pada flow lama; backend juga menyediakan by-asset dan generate code untuk mendukung sub/sub kategori per-asset.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| task-manager-client/src/pages/DowntimeTracker.tsx | Halaman utama maintenance downtime, tombol “Log Breakdown/PM” dan modal start/end |
| task-manager-client/src/pages/ProductionDowntime.tsx | Referensi pola UI kartu dan ringkasan produksi |
| task-manager-client/src/services/api-v2.ts | downtimeAPI.getAll/getActive/checkSchedule/create; perlu extend: assetsAPI.getFailureCodesByAsset, createFailureCode, generateFailureCode |
| task-manager-client/src/types/index.ts | Tipe Asset, FailureCode, DowntimeLog |
| task-manager-client/src/components/AIWritingAssistant.tsx | Bantuan AI untuk keterangan singkat |
| _bmad-output/project-context.md | Aturan implementasi dan konvensi proyek |
| task-manager-server/src/routes/v2/assets.ts | Endpoint GET /assets/failure-codes/by-asset/:assetId, GET /assets/failure-codes/generate/:category, POST /assets/failure-codes |
| task-manager-server/src/controllers/AssetController.ts | Handler endpoints terkait Failure Code |
| task-manager-server/src/models/AssetRepository.ts | Logika prioritas failure codes per asset |

### Technical Decisions

- Menggunakan modal wizard dengan state lokal terkelola per langkah.
- Grid kartu asset menggunakan Tailwind grid dan kartu interaktif.
- Sub-kategori mengikuti komponen spesifik per-asset: gunakan assetsAPI.getFailureCodesByAsset(assetId) untuk memprioritaskan kategori relevan, lalu izinkan operator memilih kategori dan kode.
- Operator dapat menambahkan sub-sub kategori bila belum ada dengan membuat Failure Code baru: gunakan assetsAPI.getFailureCodes.generate(category) untuk prefill code, lalu POST /assets/failure-codes dengan category + description.
- Menjaga pemisahan “maintenance vs production”: tombol Log di DowntimeTracker memicu wizard baru; ProductionDowntime tidak berubah.
- Aksesibilitas: navigasi keyboard antar kartu, fokus ring jelas, ukuran target sentuh memadai.
- UX Micro-interactions: daftar aset menampilkan “Terakhir dipakai” di atas, kartu menyorot saat fokus/hover, tombol “Mulai” disable hingga pilihan lengkap, toast sukses/error yang jelas.
- Validasi: penanganan error jaringan saat generate/create failure code dengan opsi retry tanpa kehilangan input.

## Implementation Plan

### Tasks

- [ ] Task 1: Extend Assets API client for per-asset categories & code creation
  - File: `task-manager-client/src/services/api-v2.ts`
  - Action: Tambahkan methods:
    - `assetsAPI.getFailureCodesByAsset(assetId: number)` → GET `/assets/failure-codes/by-asset/:assetId`
    - `assetsAPI.generateFailureCode(category: string)` → GET `/assets/failure-codes/generate/:category`
    - `assetsAPI.createFailureCode(data: { code?: string; category: string; description: string })` → POST `/assets/failure-codes`
  - Notes: Ikuti pola axios & interceptor yang sudah ada.
- [ ] Task 2: Buat AssetCardGrid (Langkah 1 wizard)
  - File: `task-manager-client/src/components/maintenance/AssetCardGrid.tsx`
  - Action: Komponen grid kartu:
    - Props: `assets: Asset[]`, `onSelect(asset: Asset)`, `recentAssetIds?: number[]`
    - Fitur: pencarian, penyorotan fokus/hover, keyboard navigation, render info ringkas (asset_code, name, status badge)
  - File: `task-manager-client/src/components/maintenance/index.ts`
  - Action: Export `AssetCardGrid`.
- [ ] Task 3: Buat FailureCategoryPicker (Langkah 2a wizard)
  - File: `task-manager-client/src/components/maintenance/FailureCategoryPicker.tsx`
  - Action: Komponen chips kategori:
    - Props: `failureCodes: FailureCode[]`, `selected: string | null`, `onSelect(category: string)`
    - Derive kategori unik dari `failureCodes` (by asset)
- [ ] Task 4: Buat FailureCodePicker + flow “Tambah Sub-Sub Kategori” (Langkah 2b)
  - File: `task-manager-client/src/components/maintenance/FailureCodePicker.tsx`
  - Action: Daftar Failure Code terfilter kategori; tombol “+ Tambah Sub-Sub Kategori”:
    - Generate code via `assetsAPI.generateFailureCode(category)`
    - Tampilkan form deskripsi; simpan via `assetsAPI.createFailureCode({ code, category, description })`
    - Update daftar lokal dan auto-select kode baru; tampilkan toast sukses/error
- [ ] Task 5: Refactor start modal → Wizard 3 langkah di DowntimeTracker
  - File: `task-manager-client/src/pages/DowntimeTracker.tsx`
  - Action:
    - Ganti modal start lama dengan modal wizard:
      1) AssetCardGrid → set asset terpilih + panggil `downtimeAPI.checkSchedule(assetId)`
      2) FailureCategoryPicker → FailureCodePicker per-asset
      3) SummaryStep → tampilkan auto-klasifikasi (badge KPI), AIWritingAssistant, tombol “Mulai”
    - Kirim `downtimeAPI.create({ asset_id, downtime_type, classification_id (auto), failure_code_id, start_time: now, reason? })`
    - Pertahankan End Downtime modal seperti saat ini
- [ ] Task 6: Validasi UI & aksesibilitas
  - File: `task-manager-client/src/pages/DowntimeTracker.tsx` (wizard)
  - Action: Disable tombol “Mulai” hingga asset & failure code valid; fokus ring jelas; ukuran target sentuh ≥44px; tampilkan toast error untuk kegagalan jaringan generate/create code
- [ ] Task 7: QA manual & polish
  - File: `task-manager-client` (umum)
  - Action: Uji responsivitas, keyboard nav, happy path & edge cases (tanpa keterangan, tanpa failure code, pembuatan code baru, error jaringan). Refresh data setelah create agar daftar aktif terupdate.

### Acceptance Criteria

- [ ] AC 1: Given pengguna klik “Log Breakdown/PM”, when wizard terbuka, then langkah 1 menampilkan grid kartu asset yang dapat diklik dan bisa dicari.
- [ ] AC 2: Given asset dipilih, when masuk langkah 2, then tampil chip sub-kategori per-asset (from by-asset codes) dan daftar kode relevan tanpa perlu mengetik.
- [ ] AC 3: Given kategori dipilih namun belum ada kode tepat, when klik “+ Tambah Sub-Sub Kategori”, then sistem generate code otomatis, pengguna isi deskripsi, simpan, dan kode baru otomatis terpilih.
- [ ] AC 4: Given kode terpilih, when lanjut ke ringkasan, then tampil badge auto-klasifikasi (KPI/Non-KPI) dan field keterangan opsional dengan AI assistance.
- [ ] AC 5: Given ringkasan valid, when klik “Mulai Downtime”, then dibuat log downtime dengan asset_id, downtime_type, classification_id otomatis, failure_code_id dipilih, start_time now; UI memperbarui daftar aktif.
- [ ] AC 6: Given belum lengkap pemilihan, when kondisi invalid, then tombol “Mulai” disabled dan ada pesan bantu.
- [ ] AC 7: Given terjadi error jaringan pada generate/create code, when submit, then muncul toast error dan pengguna bisa retry tanpa kehilangan input.
- [ ] AC 8: UX: Operator dapat menyelesaikan logging tanpa mengetik panjang; total langkah ≤ 3, klik ≤ 5 pada happy path.

## Additional Context

### Dependencies

- downtimeAPI.checkSchedule(), downtimeAPI.create()
- assetsAPI.getFailureCodesByAsset(assetId), assetsAPI.generateFailureCode(category), assetsAPI.createFailureCode(data)
- AIWritingAssistant untuk keterangan opsional.

### Testing Strategy

- Verifikasi service calls dengan mock axios (jika tersedia).
- Uji manual end-to-end pada browser: pemilihan asset → kategori → kode → mulai.
- Pastikan klasifikasi otomatis konsisten dengan flow lama.

### Notes

- “Sub-kategori mesin” dipetakan ke Failure Code category (mekanikal/elektrikal/lainnya). Jika di masa depan tersedia struktur sub-komponen per asset, picker dapat diperluas untuk memfilter berdasarkan metadata asset.
