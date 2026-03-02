---
title: 'SPK Production Order System - Layer di atas Shift Planner'
slug: 'spk-production-order-system'
created: '2026-01-16'
status: 'ready-for-dev'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['React 18.3.1', 'TypeScript 5.6.3', 'Vite 5.4.10', 'TailwindCSS 3.4.14', 'React Query v5.x', 'Axios 1.7.7', 'Express 4.21.1', 'SQLite (sql.js)', 'JWT', '@react-pdf/renderer']
files_to_modify: ['src/services/api.ts', 'src/types/index.ts', 'src/App.tsx']
code_patterns: ['BaseService/BaseRepository', 'Layered Architecture (Routes→Controllers→Services→Repositories)', 'React Query hooks', 'Named API exports']
test_patterns: ['Jest', 'Co-located test files', '__tests__ folders']
---

# Tech-Spec: SPK Production Order System - Layer di atas Shift Planner

**Created:** 2026-01-16

## Overview

### Problem Statement

Sistem jadwal produksi saat ini (`ProductionSchedule.tsx`) berfungsi sebagai shift planner sederhana (scheduled/no_order/holiday/maintenance_window) yang **terintegrasi erat dengan sistem Downtime auto-classification dan OEE Reports**. Namun, shift planner ini tidak sesuai dengan kebutuhan operasional perusahaan yang menggunakan form **Surat Perintah Kerja (SPK)** dengan detail lengkap seperti:

- Urutan produksi per mesin
- Spesifikasi produk (Nama Cap, Material, Berat)
- Jumlah order dengan jenis kemasan (BOX/NICTAINER/ZAK)
- Keterangan packaging detail
- Workflow approval (PPIC membuat, Production Manager approve)
- Nomor dokumen dan format cetak standar

**Pain Points dari User (Focus Group):**

| User | Pain Point | Impact |
|------|------------|--------|
| PPIC | Input berulang - ketik ulang material/berat setiap kali | Waktu terbuang, typo |
| PPIC | Tidak ada fitur copy dari minggu lalu (70% jadwal mirip) | Inefficient |
| PPIC | Tidak tahu status approval | Harus tanya manual |
| Prod Mgr | Tidak ada overview dashboard | Buka satu-satu SPK |
| Prod Mgr | Tidak ada warning konflik/capacity | Masalah di produksi |
| Prod Mgr | Susah cari SPK historical | Referensi lambat |

### Solution

Menambahkan **SPK Production Order System** sebagai **layer terpisah di atas Shift Planner** yang sudah ada. Pendekatan ini menjaga integrasi Downtime/OEE tetap berfungsi sambil menambah fitur SPK untuk kebutuhan operasional.

**Arsitektur Coexistence:**
```
┌─────────────────────────────────────────────────┐
│ SPK Production Order (NEW - detail SPK)         │
│ - Master Produk, Line Items, Approval           │
│ - Links to Shift Planner via production_schedule_id │
└────────────────────┬────────────────────────────┘
                     │ references
┌────────────────────▼────────────────────────────┐
│ Shift Planner (EXISTING - tetap jalan)          │
│ - scheduled/no_order/holiday/maintenance_window │
│ - Digunakan oleh Downtime auto-classification   │
└────────────────────┬────────────────────────────┘
                     │ used by
┌────────────────────▼────────────────────────────┐
│ Downtime & OEE Reports (EXISTING - tidak diubah)│
└─────────────────────────────────────────────────┘
```

**Fitur SPK yang ditambahkan:**

1. **Master Data Produk** - Database produk dengan spesifikasi lengkap (auto-fill)
2. **SPK Management** - CRUD untuk Surat Perintah Kerja dengan multi-line items
3. **Approval Workflow** - PPIC create → Production Manager approve dengan status tracking
4. **Dashboard View** - Overview semua SPK per tanggal untuk Production Manager
5. **Copy/Duplicate** - Salin SPK dari periode sebelumnya
6. **Print/Export PDF** - Output sesuai format form perusahaan (client-side)
7. **Link ke Shift Planner** - SPK bisa mereferensi production_schedule_id untuk integrasi

### Scope

**In Scope (MVP - Phase 1):**
- Master Data Produk (code, name, material, weight_gram, default_packaging)
- Product picker dengan search dan recent items
- SPK Header (spk_number, asset_id, production_date, status, created_by, approved_by, **production_schedule_id**)
- SPK Line Items (sequence, product_id, quantity, packaging_type, packaging_confirmed, remarks)
- SPK Numbering: `SPK-{YYYYMMDD}-{ASSET_CODE}-{SEQ}`
- Status workflow: draft → pending → approved/rejected/cancelled
- Dashboard view untuk Production Manager (semua SPK hari ini)
- Copy/Duplicate SPK dari periode sebelumnya
- Quick approve/reject dengan komentar
- Search dan filter SPK historical
- Print/Export PDF client-side (@react-pdf/renderer)
- **Integrasi dengan Shift Planner** - SPK referensi production_schedule existing
- Update API endpoints
- Update UI components (tanpa menghapus Shift Planner existing)

**Out of Scope (Phase 2+):**
- Conflict detection (mold/resource sharing)
- Capacity warning per mesin
- Push notifications untuk approval
- Versioning untuk revisi SPK
- Mobile app
- Integrasi ERP external
- Laporan produksi aktual vs plan
- Multi-plant support

## Context for Development

### User Journeys

**PPIC Daily Flow:**
1. Buat SPK baru ATAU copy dari periode lalu
2. Pilih mesin dan tanggal produksi
3. Tambah line items (pilih produk dari master, auto-fill specs)
4. Submit untuk approval (status: pending)
5. Tunggu approval atau revisi jika ditolak

**Production Manager Daily Flow:**
1. Buka dashboard SPK hari ini
2. Review SPK per mesin
3. Approve atau Reject dengan komentar
4. Monitor status sepanjang hari

### Codebase Patterns

**Backend Architecture (Layered OOP):**
```
Routes → Controllers → Services → Repositories → Database
```

- **BaseRepository** (`src/models/BaseRepository.ts`): Abstract class dengan CRUD operations, pagination, transactions
- **BaseService** (`src/services/BaseService.ts`): Abstract class dengan validation hooks, error classes (NotFoundError, ValidationError, etc.)
- **Routes**: Express routers dengan middleware (auth, validation)
- **Database**: SQLite via `sql.js`, accessed through `db.prepare().run/get/all()`

**Frontend Architecture:**
- **API Pattern**: Named exports in `api.ts` (e.g., `maintenanceAPI`, `ticketsAPI`)
- **Hooks Pattern**: Custom hooks for data fetching (e.g., `useDashboardKPI`)
- **React Query**: Server state management with query keys `['namespace', 'feature', params]`
- **Types**: Centralized in `src/types/index.ts`

**Existing Production Schedule Pattern (tetap dipertahankan):**
- Current API: `maintenanceAPI.getProductionSchedule()`, `createProductionSchedule()`, etc.
- Current routes: `/maintenance/production-schedule`
- Current component: `ProductionSchedule.tsx` (1065 lines) - **TETAP ADA untuk Downtime/OEE**
- Digunakan oleh: `DowntimeRepository.classifyDowntime()`, `ReportRepository`

### Files to Reference

| File | Purpose |
| ---- | ------- |
| `task-manager-server/src/models/BaseRepository.ts` | Base class for new repositories |
| `task-manager-server/src/services/BaseService.ts` | Base class for new services + error classes |
| `task-manager-server/src/routes/maintenance.ts` | Current production schedule routes (will be deprecated) |
| `task-manager-client/src/pages/ProductionSchedule.tsx` | Component to be replaced |
| `task-manager-client/src/services/api.ts` | API service patterns to follow |
| `task-manager-client/src/types/index.ts` | Type definition patterns |
| `_bmad-output/project-context.md` | Coding standards and rules |

### Files to Create

**Backend - New Files:**

| File | Purpose |
| ---- | ------- |
| `src/models/ProductRepository.ts` | Master product data access |
| `src/models/SPKRepository.ts` | SPK header + line items data access |
| `src/services/ProductService.ts` | Product business logic |
| `src/services/SPKService.ts` | SPK business logic + approval workflow |
| `src/controllers/ProductController.ts` | Product HTTP handlers |
| `src/controllers/SPKController.ts` | SPK HTTP handlers |
| `src/routes/v2/products.ts` | Product API routes |
| `src/routes/v2/spk.ts` | SPK API routes |
| `src/database/migrations/add_spk_tables.ts` | Database migration |
| `src/types/spk.ts` | SPK type definitions |

**Frontend - New Files:**

| File | Purpose |
| ---- | ------- |
| `src/pages/SPK/SPKList.tsx` | SPK list/dashboard view |
| `src/pages/SPK/SPKForm.tsx` | Create/Edit SPK form |
| `src/pages/SPK/SPKDetail.tsx` | View SPK detail + approval actions |
| `src/pages/Products/ProductList.tsx` | Master product list |
| `src/pages/Products/ProductForm.tsx` | Create/Edit product modal |
| `src/components/SPK/SPKPdfDocument.tsx` | PDF template using @react-pdf/renderer |
| `src/components/SPK/SPKStatusBadge.tsx` | Status indicator component |
| `src/components/SPK/ProductPicker.tsx` | Searchable product selector |
| `src/hooks/useSPK.ts` | SPK data hooks |
| `src/hooks/useProducts.ts` | Product data hooks |

**Files to Modify (Existing):**

| File | Changes |
| ---- | ------- |
| `src/services/api.ts` | Add `spkAPI`, `productsAPI` exports |
| `src/types/index.ts` | Export SPK types |
| `src/App.tsx` | Add new routes for /spk and /products (keep existing routes) |
| `src/components/Sidebar.tsx` | Add "SPK" and "Master Produk" menu items (keep Production Schedule) |
| `src/pages/ProductionSchedule.tsx` | Add link to related SPK if exists |

**Files NOT to Remove:**

| File | Reason |
| ---- | ------- |
| `src/pages/ProductionSchedule.tsx` | **TETAP ADA** - Digunakan oleh Downtime auto-classification dan OEE Reports |
| `production_schedule` table | **TETAP ADA** - FK dari spk_headers.production_schedule_id |

### Technical Decisions (ADRs)

#### ADR-001: Database Schema untuk SPK

**Status:** Approved

**Decision:** Gunakan 3 tabel terpisah (normalized):

```sql
-- Master Data Produk
CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- e.g., "TUTUP-S120-BIRU"
  name TEXT NOT NULL,               -- e.g., "TUTUP BOTOL BIRU MUDA SOLID S.120 @5000"
  material TEXT,                    -- e.g., "HDPE 6070 + LLDPE ASRENE UF 1810 T"
  weight_gram REAL,                 -- e.g., 1.80
  default_packaging TEXT,           -- e.g., "BOX"
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- SPK Header
CREATE TABLE spk_headers (
  id INTEGER PRIMARY KEY,
  spk_number TEXT UNIQUE NOT NULL,  -- e.g., "SPK-20260115-SACMI3-001"
  asset_id INTEGER NOT NULL,
  production_date TEXT NOT NULL,
  production_schedule_id INTEGER,   -- Link ke shift planner existing (untuk integrasi Downtime/OEE)
  status TEXT DEFAULT 'draft',      -- draft, pending, approved, rejected, cancelled
  created_by INTEGER NOT NULL,
  approved_by INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  submitted_at TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (production_schedule_id) REFERENCES production_schedule(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- SPK Line Items
CREATE TABLE spk_line_items (
  id INTEGER PRIMARY KEY,
  spk_header_id INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  packaging_type TEXT,              -- BOX, NICTAINER, ZAK, KARUNG
  packaging_confirmed INTEGER DEFAULT 0,
  remarks TEXT,
  FOREIGN KEY (spk_header_id) REFERENCES spk_headers(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**Consequences:**
- ✅ Normalized, query-friendly
- ✅ Produk bisa di-reuse tanpa duplikasi
- ✅ Line items bisa di-reorder dengan sequence
- ✅ Integrasi dengan Downtime/OEE via production_schedule_id
- ⚠️ Perlu JOIN untuk get full SPK data

---

#### ADR-002: SPK Numbering

**Status:** Approved

**Decision:** Format `SPK-{YYYYMMDD}-{ASSET_CODE}-{SEQ}`

Example: `SPK-20260115-SACMI3-001`

**Implementation:**
```typescript
function generateSPKNumber(assetCode: string, productionDate: string, existingCount: number): string {
  const dateStr = productionDate.replace(/-/g, '');
  const seq = String(existingCount + 1).padStart(3, '0');
  return `SPK-${dateStr}-${assetCode}-${seq}`;
}
```

**Consequences:**
- ✅ Unique per tanggal per mesin
- ✅ Sortable by date
- ✅ Human readable

---

#### ADR-003: Approval Workflow

**Status:** Approved

**Decision:** Simple status enum dengan audit fields

```typescript
enum SPKStatus {
  DRAFT = 'draft',           // PPIC sedang input
  PENDING = 'pending',       // Submitted, menunggu approval
  APPROVED = 'approved',     // Production Manager approved
  REJECTED = 'rejected',     // Ditolak, perlu revisi
  CANCELLED = 'cancelled'    // Dibatalkan
}

// Valid transitions
const validTransitions = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'rejected'],
  approved: ['cancelled'],
  rejected: ['draft'],  // Re-edit after rejection
  cancelled: []
};
```

**Consequences:**
- ✅ Simple to implement
- ✅ Clear state transitions
- ⚠️ No complex workflow engine (acceptable for MVP)

---

#### ADR-004: PDF Generation

**Status:** Approved

**Decision:** Client-side menggunakan `@react-pdf/renderer`

**Consequences:**
- ✅ No server-side complexity
- ✅ Instant preview
- ✅ Works offline
- ⚠️ Larger client bundle (~500KB)

---

#### ADR-005: UI Components

**Status:** Approved

**Decisions:**
1. **SPK List View** - Tabel dengan filter tanggal, mesin, status. Quick actions untuk approve/reject
2. **SPK Create/Edit** - Form dengan inline line items (not wizard)
3. **Product Picker** - Searchable combobox dengan recent items di atas
4. **Status Badges** - Warna per status:
   - `draft` → Gray
   - `pending` → Yellow/Orange
   - `approved` → Green
   - `rejected` → Red
   - `cancelled` → Gray strikethrough

---

#### ADR-006: Strategi Integrasi dengan Shift Planner

**Status:** Approved

**Context:**
Sistem `production_schedule` existing terintegrasi dengan:
- **DowntimeRepository.classifyDowntime()** - menentukan apakah downtime terjadi saat scheduled production
- **ReportRepository** - data OEE dan production reports

Menghapus/mengganti `production_schedule` akan merusak fitur-fitur ini.

**Decision:** Implementasi SPK sebagai **layer terpisah** yang coexist dengan Shift Planner:

```
SPK System (NEW)          Shift Planner (EXISTING)
├── products              ├── production_schedule (tetap)
├── spk_headers ────────────► production_schedule_id (FK optional)
│   └── production_schedule_id
└── spk_line_items        Downtime System (EXISTING)
                          └── classifyDowntime() tetap pakai production_schedule
```

**Workflow:**
1. PPIC buat SPK draft
2. Saat submit/approve, sistem bisa auto-create/link ke production_schedule jika belum ada
3. Atau PPIC bisa manual pilih production_schedule yang sudah ada
4. Downtime auto-classification tetap jalan via production_schedule

**Implementation Notes:**
```typescript
// SPKService.ts - saat approve SPK, pastikan ada production_schedule
async approveSPK(id: number, userId: number) {
  const spk = await this.repository.findById(id);

  // Jika belum ada link ke production_schedule, auto-create
  if (!spk.production_schedule_id) {
    const schedule = await productionScheduleRepository.findOrCreate({
      asset_id: spk.asset_id,
      date: spk.production_date,
      status: 'scheduled'  // Default scheduled karena ada SPK approved
    });
    await this.repository.update(id, { production_schedule_id: schedule.id });
  }

  // Lanjut approve flow...
}
```

**Consequences:**
- ✅ Tidak merusak Downtime auto-classification
- ✅ Tidak merusak OEE Reports
- ✅ SPK dan Shift Planner bisa dipakai bersamaan
- ✅ Migrasi gradual - tidak perlu big bang
- ⚠️ Dua UI untuk manage jadwal (SPK + Shift Planner) - bisa membingungkan user
- ⚠️ Perlu dokumentasi kapan pakai SPK vs Shift Planner

## Implementation Plan

### Tasks

#### Phase 1: Database & Backend Foundation

- [ ] **Task 1.1: Create Database Migration**
  - File: `task-manager-server/src/database/migrations/add_spk_tables.ts`
  - Action: Create migration script with `products`, `spk_headers`, `spk_line_items` tables and indexes
  - Notes: Follow existing migration pattern in `migrations/` folder. Include `runMigration()` function

- [ ] **Task 1.2: Create Backend Types**
  - File: `task-manager-server/src/types/spk.ts`
  - Action: Define TypeScript interfaces: `Product`, `SPKHeader`, `SPKLineItem`, `SPKStatus`, `CreateSPKDTO`, `UpdateSPKDTO`
  - Notes: Export all types for use in Repository and Service layers

- [ ] **Task 1.3: Create Product Repository**
  - File: `task-manager-server/src/models/ProductRepository.ts`
  - Action: Extend `BaseRepository`, implement `create()`, `update()`, `findByCode()`, `search(query: string)`
  - Notes: Follow pattern from `AssetRepository.ts`

- [ ] **Task 1.4: Create SPK Repository**
  - File: `task-manager-server/src/models/SPKRepository.ts`
  - Action: Implement CRUD for SPK headers with line items. Methods: `create()`, `update()`, `findWithLineItems()`, `findByDateRange()`, `findByAsset()`, `findByStatus()`, `duplicateSPK()`
  - Notes: Use transactions when creating/updating header + line items together

#### Phase 2: Backend Services & Routes

- [ ] **Task 2.1: Create Product Service**
  - File: `task-manager-server/src/services/ProductService.ts`
  - Action: Extend `BaseService`, add validation for unique code, search functionality
  - Notes: Simple CRUD with validation

- [ ] **Task 2.2: Create SPK Service**
  - File: `task-manager-server/src/services/SPKService.ts`
  - Action: Implement business logic:
    - `generateSPKNumber(assetCode, productionDate)` - auto-generate unique SPK number
    - `createSPK(dto, userId)` - create header + line items
    - `updateSPK(id, dto, userId)` - only if status is 'draft'
    - `submitSPK(id, userId)` - change status to 'pending'
    - `approveSPK(id, userId)` - change status to 'approved', set approved_by
    - `rejectSPK(id, userId, reason)` - change status to 'rejected', set rejection_reason
    - `cancelSPK(id, userId)` - change status to 'cancelled'
    - `duplicateSPK(sourceId, newDate, userId)` - copy SPK to new date
  - Notes: Validate state transitions per ADR-003. Check user role for approve/reject

- [ ] **Task 2.3: Create Product Routes**
  - File: `task-manager-server/src/routes/v2/products.ts`
  - Action: Create Express router with endpoints:
    - `GET /api/v2/products` - list with search, pagination
    - `GET /api/v2/products/:id` - get by ID
    - `POST /api/v2/products` - create (admin/manager only)
    - `PUT /api/v2/products/:id` - update (admin/manager only)
    - `DELETE /api/v2/products/:id` - soft delete (admin only)
  - Notes: Use `auth` and `managerOrAdmin` middleware

- [ ] **Task 2.4: Create SPK Routes**
  - File: `task-manager-server/src/routes/v2/spk.ts`
  - Action: Create Express router with endpoints:
    - `GET /api/v2/spk` - list with filters (date, asset, status)
    - `GET /api/v2/spk/dashboard` - today's SPK summary by asset
    - `GET /api/v2/spk/:id` - get full SPK with line items
    - `POST /api/v2/spk` - create new SPK
    - `PUT /api/v2/spk/:id` - update draft SPK
    - `POST /api/v2/spk/:id/submit` - submit for approval
    - `POST /api/v2/spk/:id/approve` - approve (manager only)
    - `POST /api/v2/spk/:id/reject` - reject (manager only)
    - `POST /api/v2/spk/:id/cancel` - cancel
    - `POST /api/v2/spk/:id/duplicate` - copy to new date
    - `DELETE /api/v2/spk/:id` - delete draft only
  - Notes: Use validation middleware for request body

- [ ] **Task 2.5: Register Routes in App**
  - File: `task-manager-server/src/index.ts` or `app.ts`
  - Action: Import and register `/api/v2/products` and `/api/v2/spk` routes
  - Notes: Add after existing route registrations

#### Phase 3: Frontend Types & API

- [ ] **Task 3.1: Create Frontend Types**
  - File: `task-manager-client/src/types/spk.ts`
  - Action: Define interfaces matching backend: `Product`, `SPKHeader`, `SPKLineItem`, `SPKWithItems`, `SPKStatus`, `SPKDashboardItem`
  - Notes: Export types

- [ ] **Task 3.2: Update Types Index**
  - File: `task-manager-client/src/types/index.ts`
  - Action: Add `export * from './spk'`
  - Notes: Keep existing exports

- [ ] **Task 3.3: Add API Functions**
  - File: `task-manager-client/src/services/api.ts`
  - Action: Add `productsAPI` and `spkAPI` objects with all CRUD methods
  - Notes: Follow existing pattern (e.g., `ticketsAPI`)

- [ ] **Task 3.4: Create Product Hooks**
  - File: `task-manager-client/src/hooks/useProducts.ts`
  - Action: Create React Query hooks:
    - `useProducts(search?)` - list products
    - `useProduct(id)` - get single product
    - `useCreateProduct()` - mutation
    - `useUpdateProduct()` - mutation
    - `useDeleteProduct()` - mutation
  - Notes: Use query keys `['products', ...]`

- [ ] **Task 3.5: Create SPK Hooks**
  - File: `task-manager-client/src/hooks/useSPK.ts`
  - Action: Create React Query hooks:
    - `useSPKList(filters)` - list with filters
    - `useSPKDashboard(date?)` - dashboard data
    - `useSPK(id)` - get single SPK with items
    - `useCreateSPK()` - mutation
    - `useUpdateSPK()` - mutation
    - `useSubmitSPK()` - mutation
    - `useApproveSPK()` - mutation
    - `useRejectSPK()` - mutation
    - `useCancelSPK()` - mutation
    - `useDuplicateSPK()` - mutation
  - Notes: Use query keys `['spk', ...]`. Invalidate list on mutations

#### Phase 4: Frontend Components

- [ ] **Task 4.1: Create SPK Status Badge**
  - File: `task-manager-client/src/components/SPK/SPKStatusBadge.tsx`
  - Action: Create badge component with color per status (draft=gray, pending=yellow, approved=green, rejected=red, cancelled=gray-strikethrough)
  - Notes: Use Tailwind classes

- [ ] **Task 4.2: Create Product Picker**
  - File: `task-manager-client/src/components/SPK/ProductPicker.tsx`
  - Action: Searchable combobox for selecting products. Show code, name, material. Auto-fill weight_gram and default_packaging on selection
  - Notes: Use existing combobox pattern or create new with search debounce

- [ ] **Task 4.3: Create SPK PDF Document**
  - File: `task-manager-client/src/components/SPK/SPKPdfDocument.tsx`
  - Action: Create PDF template using @react-pdf/renderer matching company form:
    - Header: Logo, "SURAT PERINTAH KERJA", document number, revision, date
    - Title: "JADWAL PRODUKSI SCREW CAP"
    - Table: Mesin, No, Nama Cap, Material, Berat, Qty, Keterangan
    - Footer: Dibuat Oleh (PPIC), Diterima Oleh (Production Mgr)
  - Notes: Install @react-pdf/renderer first. Match paper size A4

- [ ] **Task 4.4: Create Product List Page**
  - File: `task-manager-client/src/pages/Products/ProductList.tsx`
  - Action: Table with search, create/edit modal, columns: Code, Name, Material, Weight, Packaging, Actions
  - Notes: Admin/manager access only

- [ ] **Task 4.5: Create Product Form Modal**
  - File: `task-manager-client/src/pages/Products/ProductForm.tsx`
  - Action: Modal form for create/edit product with fields: code, name, material, weight_gram, default_packaging
  - Notes: Validation for required fields

- [ ] **Task 4.6: Create SPK List Page**
  - File: `task-manager-client/src/pages/SPK/SPKList.tsx`
  - Action: Dashboard view with:
    - Filters: date range, asset, status
    - Table: SPK Number, Date, Asset, Status, Items Count, Created By, Actions
    - Quick actions: View, Edit (draft), Approve/Reject (pending), Print, Duplicate
    - Summary cards at top: Total, Pending, Approved, Rejected
  - Notes: Default to today's date. Manager sees all, PPIC sees own

- [ ] **Task 4.7: Create SPK Form Page**
  - File: `task-manager-client/src/pages/SPK/SPKForm.tsx`
  - Action: Create/Edit form with:
    - Header: Asset picker, Production Date
    - Line Items table: Add row, Product Picker, Quantity, Packaging Type, Confirmed checkbox, Remarks, Remove row, Reorder
    - Actions: Save Draft, Submit, Cancel
  - Notes: Dynamic rows with react-hook-form useFieldArray

- [ ] **Task 4.8: Create SPK Detail Page**
  - File: `task-manager-client/src/pages/SPK/SPKDetail.tsx`
  - Action: Read-only view with:
    - Header info: SPK Number, Date, Asset, Status, Created By/At, Approved By/At
    - Line Items table
    - Actions: Approve, Reject (with reason modal), Cancel, Print PDF, Duplicate
  - Notes: Approval actions for manager only

#### Phase 5: Integration & Navigation

- [ ] **Task 5.1: Update App Routes**
  - File: `task-manager-client/src/App.tsx`
  - Action: Add routes:
    - `/spk` → SPKList
    - `/spk/new` → SPKForm
    - `/spk/:id` → SPKDetail
    - `/spk/:id/edit` → SPKForm
    - `/products` → ProductList
  - Notes: Remove or redirect old `/production-schedule` route

- [ ] **Task 5.2: Update Sidebar Navigation**
  - File: `task-manager-client/src/components/Sidebar.tsx`
  - Action: Replace "Production Schedule" with "SPK" menu item. Add "Master Produk" under Settings/Master Data section
  - Notes: Update icon and label

- [ ] **Task 5.3: Install PDF Library**
  - Command: `cd task-manager-client && npm install @react-pdf/renderer`
  - Notes: May need to add Vite config for pdf worker

- [ ] **Task 5.4: Run Database Migration**
  - Command: `cd task-manager-server && node src/database/migrations/add_spk_tables.js`
  - Notes: Verify tables created correctly

- [ ] **Task 5.5: Update Shift Planner Integration**
  - File: `task-manager-client/src/pages/ProductionSchedule.tsx`
  - Action: Tambahkan link/button ke SPK terkait jika ada. Tidak dihapus - tetap dipakai untuk Downtime/OEE
  - Notes: ProductionSchedule.tsx tetap ada dan berfungsi. Hanya tambahkan integrasi dengan SPK

### Acceptance Criteria

#### Master Data Produk

- [ ] **AC-P1**: Given user is admin/manager, when they open `/products`, then they see a table of all active products with columns: Code, Name, Material, Weight, Packaging
- [ ] **AC-P2**: Given user is admin/manager, when they click "Add Product" and fill in required fields (code, name), then a new product is created and appears in the list
- [ ] **AC-P3**: Given a product exists, when user edits and saves, then the product is updated and changes reflect immediately
- [ ] **AC-P4**: Given a product is in use by SPK line items, when user tries to delete, then the system prevents deletion and shows error message
- [ ] **AC-P5**: Given user types in search box, when they enter 3+ characters, then products are filtered by code or name (case-insensitive)

#### SPK CRUD

- [ ] **AC-S1**: Given PPIC user is on `/spk/new`, when they select asset, date, and add line items, then they can save as draft
- [ ] **AC-S2**: Given SPK is saved, when it's created, then SPK number is auto-generated in format `SPK-YYYYMMDD-ASSETCODE-SEQ`
- [ ] **AC-S3**: Given SPK is in draft status, when PPIC edits and saves, then changes are persisted
- [ ] **AC-S4**: Given SPK is in pending/approved status, when PPIC tries to edit, then edit is blocked with message "Cannot edit SPK that is not in draft status"
- [ ] **AC-S5**: Given user selects a product in line item, when product is selected, then weight and default packaging are auto-filled
- [ ] **AC-S6**: Given user is adding line items, when they add multiple rows, then sequence numbers are auto-assigned (1, 2, 3, ...)
- [ ] **AC-S7**: Given user is editing line items, when they reorder rows, then sequence numbers are updated accordingly

#### SPK Workflow

- [ ] **AC-W1**: Given SPK is in draft, when PPIC clicks "Submit", then status changes to "pending" and submitted_at is set
- [ ] **AC-W2**: Given SPK is in pending, when Manager clicks "Approve", then status changes to "approved", approved_by and approved_at are set
- [ ] **AC-W3**: Given SPK is in pending, when Manager clicks "Reject" and enters reason, then status changes to "rejected" and rejection_reason is saved
- [ ] **AC-W4**: Given SPK is rejected, when PPIC opens it, then they see rejection reason and can edit to resubmit
- [ ] **AC-W5**: Given SPK is rejected, when PPIC clicks "Edit", then status changes back to "draft"
- [ ] **AC-W6**: Given SPK is approved, when user tries to cancel, then confirmation dialog appears and status changes to "cancelled"
- [ ] **AC-W7**: Given invalid transition (e.g., draft → approved directly), when API is called, then 400 error is returned with message

#### SPK Dashboard & List

- [ ] **AC-D1**: Given user opens `/spk`, when page loads, then they see today's SPKs by default with summary cards (Total, Pending, Approved, Rejected)
- [ ] **AC-D2**: Given user changes date filter, when new date is selected, then list updates to show SPKs for that date
- [ ] **AC-D3**: Given user filters by status "pending", when filter is applied, then only pending SPKs are shown
- [ ] **AC-D4**: Given user is PPIC (role: supervisor), when viewing list, then they see only their own created SPKs
- [ ] **AC-D5**: Given user is Manager, when viewing list, then they see all SPKs and can approve/reject

#### Duplicate SPK

- [ ] **AC-DUP1**: Given an existing SPK, when user clicks "Duplicate" and selects new date, then a new draft SPK is created with same asset and line items
- [ ] **AC-DUP2**: Given SPK is duplicated, when new SPK is created, then it gets a new SPK number for the new date
- [ ] **AC-DUP3**: Given SPK is duplicated, when viewing the new SPK, then all line items are copied with same products, quantities, packaging

#### PDF Export

- [ ] **AC-PDF1**: Given SPK detail page, when user clicks "Print/Export PDF", then PDF is generated matching company form layout
- [ ] **AC-PDF2**: Given PDF is generated, when viewing it, then it shows: header (SURAT PERINTAH KERJA), SPK number, date, table with all line items, footer (Dibuat Oleh, Diterima Oleh)
- [ ] **AC-PDF3**: Given PDF is generated, when downloaded, then filename is `SPK-{spk_number}.pdf`

#### Error Handling

- [ ] **AC-E1**: Given user submits SPK with no line items, when they click submit, then validation error "SPK must have at least one line item" is shown
- [ ] **AC-E2**: Given user enters duplicate product code, when they save, then validation error "Product code already exists" is shown
- [ ] **AC-E3**: Given network error occurs, when API call fails, then user-friendly error message is shown with retry option

#### Integrasi dengan Shift Planner

- [ ] **AC-INT1**: Given SPK is approved, when production_schedule_id is null, then system auto-creates production_schedule with status='scheduled' for that asset+date
- [ ] **AC-INT2**: Given SPK form is open, when user creates SPK for asset+date that has existing production_schedule, then the existing schedule is auto-linked
- [ ] **AC-INT3**: Given Shift Planner view is open, when there's an approved SPK for that asset+date, then a link/badge to SPK is shown
- [ ] **AC-INT4**: Given Downtime is logged, when classifyDowntime() runs, then it still uses production_schedule.status (not affected by SPK system)

## Additional Context

### Dependencies

**External Libraries to Install:**
- `@react-pdf/renderer` - Client-side PDF generation (Frontend)

**Internal Dependencies:**
- Existing auth system (JWT + RBAC) - For user authentication and role checking
- Existing asset/machine data - SPK references assets table
- Existing users table - SPK references users for created_by, approved_by
- Existing React Query setup - For data fetching hooks

**API Dependencies:**
- `GET /api/assets` - For asset picker in SPK form
- `GET /api/auth/me` - For current user context

### Testing Strategy

**Unit Tests (Backend):**
- `ProductRepository.test.ts` - CRUD operations, search functionality
- `SPKRepository.test.ts` - CRUD with transactions, duplicate logic
- `ProductService.test.ts` - Validation, business rules
- `SPKService.test.ts` - State transitions, SPK number generation, approval logic

**Integration Tests (Backend):**
- `spk.routes.test.ts` - Full API flow: create → submit → approve
- Test role-based access (PPIC vs Manager)
- Test invalid state transitions return errors

**Component Tests (Frontend):**
- `ProductPicker.test.tsx` - Search, selection, auto-fill
- `SPKStatusBadge.test.tsx` - Correct colors per status
- `SPKForm.test.tsx` - Dynamic rows, validation

**E2E Tests (Manual/Playwright):**
1. PPIC creates SPK with 3 products → submits → Manager approves
2. PPIC creates SPK → submits → Manager rejects with reason → PPIC edits and resubmits
3. PPIC duplicates yesterday's SPK to today
4. Manager exports approved SPK to PDF

### Notes

**High-Risk Items:**
- PDF layout matching company form exactly - may require iterations
- @react-pdf/renderer bundle size impact - monitor build size
- State transition edge cases - thorough testing needed

**Known Limitations:**
- No conflict detection for mold/resource sharing (Phase 2)
- No capacity warning per machine (Phase 2)
- No push notifications (Phase 2)
- PPIC visibility limited to own SPK only (per AC-D4)

**Future Considerations (Out of Scope):**
- Mobile app with offline capability
- Integration with ERP for product master sync
- Actual vs planned production reporting
- Multi-plant support with plant-specific SPK numbering

**Migration Notes:**
- **PENTING**: `production_schedule` table dan `ProductionSchedule.tsx` **TIDAK DIHAPUS**
- SPK adalah sistem tambahan, bukan pengganti Shift Planner
- SPK mereferensi `production_schedule` via `production_schedule_id` untuk integrasi
- Downtime auto-classification tetap menggunakan `production_schedule.status`
- OEE Reports tetap menggunakan `production_schedule` data
- User bisa pilih: pakai SPK untuk detail order, Shift Planner untuk status sederhana
- Kedua sistem bisa berjalan bersamaan selama transisi

**Role-Based Access Summary:**

| Action | Admin | Manager | Supervisor (PPIC) | Member |
|--------|-------|---------|-------------------|--------|
| View all SPK | ✅ | ✅ | Own only | ❌ |
| Create SPK | ✅ | ✅ | ✅ | ❌ |
| Edit draft SPK | ✅ | ✅ | Own only | ❌ |
| Submit SPK | ✅ | ✅ | Own only | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ❌ |
| Cancel SPK | ✅ | ✅ | Own only | ❌ |
| Manage Products | ✅ | ✅ | ❌ | ❌ |
