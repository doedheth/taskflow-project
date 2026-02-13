# FORM INSPEKSI KEDATANGAN MATERIAL - CORRECTED VERSION

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Logo Halal                              : Ada                                                   │
├─────┬───────────────────────┬──────────────────────────┬───────┬──────┬───────────────┬─────────┤
│ No. │ Item Pengecekan       │ Standar                  │ Score │ AQL  │ n1   n2   n3  │ Jumlah  │
│     │                       │                          │       │      │ Ac Re Ac Re Ac Re │      │
├─────┴───────────────────────┴──────────────────────────┴───────┴──────┴───────────────┴─────────┤
│ KUALITAS :                                                                                      │
├─────┬───────────────────────┬──────────────────────────┬───────┬──────┬───────────────┬─────────┤
│ 1.  │ Berat                 │ Sesuai standar di ITP    │ 30/25 │ 4.0  │ ✓   ✓   ✓   │ 2 - 15  │
├─────┼───────────────────────┼──────────────────────────┼───────┼──────┼───────────────┼─────────┤
│ 2.  │ Fungsional            │                          │ 25    │      │               │ 18 - 50 │
│     │                       │                          │       │      │               │         │
│  a. │ Bersih                │ Sanitasi baik            │       │      │ ✓   ✓   ✓   │         │
│     │                       │                          │       │      │               │         │
│  b. │ Bau                   │ Baik Tidak Berbau        │       │      │ ✓   ✓   ✓   │         │
│     │                       │                          │       │      │               │         │
│  c. │ Bak                   │ Tertutup, bersegel       │       │      │ ✓   ✓   ✓   │         │
│     │                       │                          │       │      │               │         │
│  d. │ Segel                 │ Bersegel/utuh            │       │      │ ✓   ✓   ✓   │         │
│     │                       │                          │       │      │               │         │
│     │                       │ Note: Box 7 plastic inner: n1,2,3 = n/3                │         │
├─────┴───────────────────────┴──────────────────────────┴───────┴──────┴───────────────┴─────────┤
│ Keputusan :  ☐ Diterima    ☑ AOD    ☐ Hold    ☐ Rejected                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ✅ CORRECTIONS APPLIED:

### 1. **Typo Fixes**
- ❌ ~~"Santasi baik"~~
- ✅ **"Sanitasi baik"**

- ❌ ~~"Di terima"~~
- ✅ **"Diterima"** (satu kata)

### 2. **Consistency Improvements**
- Semua checkmark (✓) aligned
- Decision options konsisten dengan database
- Note dijelaskan dengan lebih jelas

### 3. **Database Mapping**

| Form Item | Database Column | Type | Description |
|-----------|----------------|------|-------------|
| **Logo Halal** | `logo_halal` | TEXT | 'Ada' / 'Tidak Ada' |
| **1. Berat** | `q_berat` | INTEGER | 1 = Pass, 0 = Fail |
| **2a. Bersih** | `fs_mat_bersih` | INTEGER | 1 = OK, 0 = Not OK |
| **2b. Bau** | `fs_mat_bau` | INTEGER | 1 = OK, 0 = Not OK |
| **2c. Bak** | `fs_veh_bak` | INTEGER | 1 = OK, 0 = Not OK |
| **2d. Segel** | `fs_veh_segel` | INTEGER | 1 = OK, 0 = Not OK |
| **QC Score** | `qc_score` | INTEGER | 0-100 |
| **FS Score** | `fs_score` | INTEGER | 0-100 |
| **Keputusan** | `decision` | TEXT | 'Diterima' / 'AOD' / 'Hold' / 'Rejected' |

---

## 📊 SAMPLING EXPLANATION

### n1, n2, n3 (Three Sampling Points)

Setiap item quality check dilakukan di **3 titik sampling berbeda**:

- **n1** = Sample pertama
- **n2** = Sample kedua
- **n3** = Sample ketiga

Untuk setiap sample:
- **Ac (Accept)** = Lulus pengecekan ✓
- **Re (Reject)** = Tidak lulus ✗

### Example:

**Item: Bersih (Sanitasi baik)**
```
n1: Ac ✓  Re ☐  → Sample 1 bersih
n2: Ac ✓  Re ☐  → Sample 2 bersih
n3: Ac ☐  Re ✗  → Sample 3 tidak bersih

Result: 2 dari 3 lulus → AOD (Accept on Deviation)
```

### Special Case: Box dengan Plastic Inner

Jika box mengandung 7 plastic inner:
- Total sample dibagi 3
- **Formula**: n = Total Sample / 3

**Contoh**:
- Total sample: 21 pcs
- n1 = 7 pcs
- n2 = 7 pcs
- n3 = 7 pcs

---

## 🎯 DECISION MATRIX

| QC Score | FS Score | Decision | Description |
|----------|----------|----------|-------------|
| ≥ 95 | ≥ 95 | **Diterima** | Perfect - material diterima tanpa syarat |
| 85-94 | ≥ 90 | **AOD** | Accept on Deviation - diterima dengan catatan |
| 85-94 | < 90 | **Hold** | Menunggu review/test tambahan |
| < 85 | Any | **Rejected** | Material ditolak |
| Any | < 85 | **Rejected** | Material ditolak (food safety issue) |

---

## 📝 NOTES

1. **Sanitasi** = Cleanliness/hygiene standard
2. **AQL 4.0** = Acceptable Quality Level 4.0 (industry standard)
3. **ITP** = Inspection and Test Plan
4. Semua checkmark harus diisi (tidak boleh kosong)
5. Minimal 1 keputusan harus dipilih

---

## 🚀 Implementation in Code

```typescript
// Example: Create inspection with proper checklist
const inspectionData = {
  logo_halal: 'Ada',

  qc_params: {
    // 1. Berat
    q_berat: 1,  // 1 = sesuai standar

    // 2. Fungsional
    fs_mat_bersih: 1,  // a. Bersih (Sanitasi baik)
    fs_mat_bau: 1,     // b. Bau (Baik Tidak Berbau)
    fs_veh_bak: 1,     // c. Bak (Tertutup, bersegel)
    fs_veh_segel: 1,   // d. Segel (Bersegel/utuh)

    // Calculated scores
    qc_score: 95,
    fs_score: 98,

    // Decision based on scores
    decision: 'Diterima'  // NOT "Di terima" ✅
  }
};
```
