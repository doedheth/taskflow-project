# Database Setup Guide - Incoming Material Inspection

## 🚀 Quick Start

Untuk setup database lengkap dari awal:

```bash
# 1. Setup base tables (users, departments, tickets, dll)
npm run db:setup

# 2. Migrate maintenance tables (assets, work orders, dll)
npm run db:migrate:maintenance

# 3. Seed mockup data untuk incoming material
npm run db:seed:incoming

# 4. Jalankan server (akan menjalankan migrasi otomatis)
npm run dev
```

## 📊 Database Scripts

### Setup & Migration
- `npm run db:setup` - Buat tabel dasar dan user default
- `npm run db:migrate:maintenance` - Buat tabel maintenance management
- `npm run db:seed:incoming` - Buat mockup data incoming material

### Monitoring & Debugging
- `npm run db:health` - Check kesehatan database
- `npm run db:view:incoming` - Lihat detail mockup data incoming material

## 📦 Mockup Data yang Dibuat

### Suppliers (5 vendors)
1. **SUP001** - PT Indopack Pratama
2. **SUP002** - CV Karton Jaya
3. **SUP003** - PT Packaging Indonesia
4. **SUP004** - UD Mitra Kemasan
5. **SUP005** - PT Corrugated Box Nusantara

### Incoming Inspections (5 inspections)
- **INSP-20250208-001** - Master Box 40x30x25cm (500 karton)
- **INSP-20250207-001** - Secondary Box 35x25x20cm (800 karton)
- **INSP-20250206-001** - Display Box 30x30x15cm (350 karton)
- **INSP-20250205-001** - Shipper Box 50x40x30cm (1000 karton) - PENDING
- **INSP-20250204-001** - Transport Box 45x35x28cm (600 karton)

### Data Terkait
- **16 QC Sampling Items** - Data sampling kualitas per batch
- **14 Weight Measurements** - Data timbangan sampling
- **5 QC Parameter Sets** - Hasil QC lengkap dengan score dan decision

## 🔑 Default Login Credentials

```
Admin:
  Email: admin@taskmanager.com
  Password: admin123

Sample User:
  Email: john@taskmanager.com
  Password: password123
```

## 🧪 Testing API Endpoints

### Suppliers
```bash
# Get all suppliers
GET http://localhost:5555/api/v2/suppliers

# Create new supplier (gunakan kode unique!)
POST http://localhost:5555/api/v2/suppliers
{
  "code": "SUP006",
  "name": "PT New Supplier",
  "address": "Jakarta",
  "contact_person": "John Doe",
  "phone": "021-12345678"
}
```

### Incoming Inspections
```bash
# Get all inspections
GET http://localhost:5555/api/v2/inspections

# Get inspection detail
GET http://localhost:5555/api/v2/inspections/1

# Create new inspection
POST http://localhost:5555/api/v2/inspections
{
  "inspection_date": "2025-02-09",
  "supplier_id": 2,
  "po_no": "PO/2025/006",
  "nama_produsen": "PT Indopack Pratama",
  // ... data lengkap lainnya
}
```

## ⚠️ Common Errors

### 1. "UNIQUE constraint failed: suppliers.code"
**Penyebab**: Mencoba membuat supplier dengan kode yang sudah ada
**Solusi**: Gunakan kode supplier yang berbeda (SUP006, SUP007, dll)

### 2. "no such table: users"
**Penyebab**: Database belum di-setup
**Solusi**: Jalankan `npm run db:setup`

### 3. "no such table: assets"
**Penyebab**: Maintenance tables belum di-migrate
**Solusi**: Jalankan `npm run db:migrate:maintenance`

### 4. "no such column: nama_produsen"
**Penyebab**: Migration incoming_inspections belum berjalan
**Solusi**: Restart server untuk menjalankan auto-migration

## 🗄️ Database Schema

### incoming_inspections (53 columns)
- Basic info: inspection_no, date, supplier_id, PO, surat jalan
- Product info: product_code, nama_produsen, negara_produsen, logo_halal
- Logistics: vehicle_no, driver, expedition, seal_no, arrival_time
- Material: material_type, warna, jumlah_sampling, item_name
- Quality checks: 20+ boolean flags untuk kondisi kendaraan & material
- Signatures: checker, driver, warehouse, supervisor

### inspection_items
- QC sampling per batch/pallet
- Fields: batch_no, expired_date, palet_no, qty, is_ok, notes

### inspection_weights
- Data timbangan sampling
- Fields: batch_no, weight, photo_url

### inspection_qc_params
- Parameter QC lengkap (30+ fields)
- Kualitas: berat, joint, creasing, CoA, visual
- Food Safety: material & vehicle checks
- Scoring: qc_score, fs_score, decision

## 📈 Database Statistics

Total Tables: **48**
Total Suppliers: **5**
Total Inspections: **5**
Total Material Received: **3,250 karton**
Average QC Score: **91.2/100**
Average FS Score: **94.0/100**

## 🔄 Reset Database

Untuk reset database dari awal:

```bash
# Hapus database file
rm task-manager-server/data/taskmanager.db

# Setup ulang
npm run db:setup
npm run db:migrate:maintenance
npm run db:seed:incoming

# Start server
npm run dev
```

## 📝 Notes

- Database menggunakan **SQL.js** (SQLite in-memory dengan persistence)
- Auto-migration berjalan saat server start
- Semua foreign keys diaktifkan
- Timestamps (created_at, updated_at) otomatis
- Inspection number auto-generated: `INSP-YYYYMMDD-SEQ`
