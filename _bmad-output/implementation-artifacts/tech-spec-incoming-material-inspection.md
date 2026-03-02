---
title: 'Incoming Material Inspection & Reporting'
slug: 'incoming-material-inspection'
created: '2026-02-05'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['React', 'TypeScript', 'Node.js', 'Express', 'SQLite', 'jspdf', 'react-signature-canvas']
files_to_modify: ['task-manager-server/src/database/setup.ts', 'task-manager-client/src/services/api.ts', 'task-manager-server/src/index.ts', 'task-manager-client/src/App.tsx', 'task-manager-client/src/components/Sidebar.tsx']
code_patterns: ['Repository Pattern', 'Functional Components', 'Axios Services', 'OOP Layered Architecture', 'Database Transactions']
test_patterns: ['Jest']
---

# Tech-Spec: Incoming Material Inspection & Reporting

**Created:** 2026-02-05
**Status:** Implementation Complete

## Overview

### Problem Statement
Proses pengecekan bahan baku masuk masih dilakukan secara manual menggunakan kertas, sehingga sulit untuk diarsipkan secara digital dan dikirimkan ke vendor dengan cepat dalam format yang standar.

### Solution
Membangun modul digital untuk mencatat pengecekan kendaraan, kemasan, kuantitas, dan berat material, lengkap dengan fitur tanda tangan digital dan upload foto bukti, serta fitur ekspor PDF yang formatnya identik dengan dokumen fisik asli.

### Scope

**In Scope:**
- Pembuatan Master Data **Supplier/Vendor**.
- Integrasi/Pemanfaatan Master Data **Material/Product**.
- Form input digital untuk 4 dokumen (Kendaraan, Kemasan/Kuantitas, Material QC, Berat).
- Fitur **Digital Signature** (canvas coretan tangan).
- Fitur **Upload Foto** (bukti timbangan).
- Fitur **Generate PDF** dengan layout yang persis contoh gambar.
- Penyimpanan data ke database SQLite.

**Out of Scope:**
- Pengiriman email otomatis (user melakukan download manual).
- Integrasi otomatis ke timbangan digital (input manual dari foto).

---

## Context for Development

### Codebase Patterns
- **Frontend**: Functional components, Tailwind CSS, React Query. API calls di [api.ts](task-manager-client/src/services/api.ts).
- **Backend**: OOP Layered Architecture (Routes -> Controllers -> Services -> Repositories).
- **Database**: SQLite (`sql.js`). Master data produk ada di [ProductRepository.ts](task-manager-server/src/models/ProductRepository.ts).
- **File Upload**: Menggunakan endpoint `/api/upload/image` yang sudah ada dengan optimasi kompresi sisi client.
- **State Persistence**: Menyimpan draf ke `localStorage` (per-user key) untuk mencegah kehilangan data saat form multi-step.

### Files to Reference

| File | Purpose |
| ---- | ------- |
| [ProductRepository.ts](task-manager-server/src/models/ProductRepository.ts) | Reference for material/product data access |
| [db.ts](task-manager-server/src/database/db.ts) | Database connection and execution |
| [upload.ts](task-manager-server/src/routes/upload.ts) | Reference for handling image uploads |
| [ReportController.ts](task-manager-server/src/controllers/ReportController.ts) | Reference for reporting logic |

### Technical Decisions
- **Report Format**: PDF menggunakan `jspdf` dengan koordinat terkalibrasi dan dukungan pagination otomatis untuk item sampling yang panjang.
- **Signature**: Menggunakan `react-signature-canvas` dengan validasi data URL untuk mencegah XSS.
- **Database Schema**: Menggunakan transaksi atomik untuk nested inserts (Inspeksi + Items + Weights).
- **Performance**: Menghindari N+1 query menggunakan `LEFT JOIN` pada list fetch.

## Implementation Plan

### Tasks

#### 1. Database Schema & Security
- [x] Task 1: Update database schema and define RBAC roles.
  - File: `task-manager-server/src/database/setup.ts`
- [x] Task 2: Implement Role-Based Access Control (RBAC) middleware for inspection routes.
  - File: `task-manager-server/src/middleware/auth.ts`

#### 2. Backend Implementation
- [x] Task 3: Create Supplier and Inspection Repositories with concurrency and transaction handling.
  - File: `task-manager-server/src/models/SupplierRepository.ts`, `task-manager-server/src/models/InspectionRepository.ts`
- [x] Task 4: Create Inspection Service & Controllers with safe error handling.
  - File: `task-manager-server/src/services/InspectionService.ts`, `task-manager-server/src/controllers/InspectionController.ts`

#### 3. Frontend - Forms & State
- [x] Task 5: Implement multi-step form with `localStorage` persistence and image compression.
  - File: `task-manager-client/src/pages/IncomingInspection/InspectionForm.tsx`
- [x] Task 6: Implement Digital Signature canvas with validation.

#### 4. Reporting & PDF
- [x] Task 7: Implement PDF report generation with fixed layout calibration, async image loading, and pagination.
  - File: `task-manager-client/src/pages/IncomingInspection/InspectionReportPDF.ts`

### Acceptance Criteria

- [x] AC 1: Given a user on the Inspection page, when they fill out all 4 sections and sign, then the data is successfully saved to the database in a single transaction.
- [x] AC 2: Given a partial entry, when the page is refreshed, then the data is restored from local storage uniquely for that user.
- [x] AC 3: Given a completed inspection, when the user clicks "Download PDF", then a PDF is generated that matches the physical form layout exactly, even with many items.
- [x] AC 4: Given an unauthorized user, when they attempt to access inspection forms, then the system denies access via middleware.

## Additional Context

### Dependencies

- `jspdf`: For PDF generation.
- `react-signature-canvas`: For digital signatures.

### Testing Strategy

- **Manual Testing**: Verify PDF layout against physical images by overlaying or side-by-side comparison.
- **Unit Testing**: Test repository methods for correct SQL execution.

### Notes

- High Priority: Visual fidelity of the PDF is the most critical requirement for the user.
- Security: Ensure only authorized users can perform inspections.
