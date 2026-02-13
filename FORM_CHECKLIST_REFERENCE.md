# Form Incoming Material Inspection - Checklist Reference

## 📋 Form Structure

### Logo Halal
- Options: **Ada** / Tidak Ada

---

## ✅ KUALITAS (Quality Checks)

### 1. Berat (Weight)
- **Standar**: Sesuai standar di ITP
- **Score**: 30/25
- **AQL**: 4.0
- **Sampling**: n1, n2, n3 (Accept/Reject untuk masing-masing)
- **Jumlah Sample**: 2 - 15 pcs

### 2. Fungsional (Functional Checks)
- **Score**: 25
- **Jumlah Sample**: 18 - 50 pcs

#### a. Bersih (Cleanliness)
- **Standar**: Sanitasi baik
- ✅ Ac/Re untuk n1, n2, n3

#### b. Bau (Odor)
- **Standar**: Baik Tidak Berbau
- ✅ Ac/Re untuk n1, n2, n3

#### c. Bak (Container/Truck Bed)
- **Standar**: Tertutup, bersegel
- ✅ Ac/Re untuk n1, n2, n3

#### d. Segel (Seal)
- **Standar**: Bersegel/utuh
- ✅ Ac/Re untuk n1, n2, n3

**Note**: Untuk box dengan 7 plastic inner: n1, n2, n3 = jumlah sample / 3

---

## 🎯 Keputusan (Decision)

Pilih salah satu:

- ☐ **Diterima** (Accepted)
- ☐ **AOD** (Accept on Deviation)
- ☐ **Hold** (On Hold - pending review)
- ☐ **Rejected** (Ditolak)

---

## 📊 Mapping ke Database

### Table: inspection_qc_params

```typescript
interface InspectionQCParams {
  // KUALITAS - Berat
  q_berat: number;              // 1 = Pass, 0 = Fail

  // KUALITAS - Fungsional
  // Keamanan Pangan: Material
  fs_mat_bersih: number;        // a. Bersih (Sanitasi baik)
  fs_mat_bau: number;           // b. Bau (Baik Tidak Berbau)

  // Keamanan Pangan: Kendaraan
  fs_veh_bak: number;           // c. Bak (Tertutup, bersegel)
  fs_veh_segel: number;         // d. Segel (Bersegel/utuh)

  // Scoring
  qc_score: number;             // Total QC Score (0-100)
  fs_score: number;             // Total Food Safety Score (0-100)

  // Decision
  decision: string;             // 'Diterima' | 'AOD' | 'Hold' | 'Rejected'
}
```

---

## 🔄 Sampling Logic

### n1, n2, n3 (3 Sampling Points)
- Setiap item dicek di 3 titik sampling berbeda
- Setiap titik: **Accept (Ac)** atau **Reject (Re)**
- Jika ada 1 Reject → perlu review lebih lanjut

### Jumlah Sample
- **Berat**: 2-15 pcs
- **Fungsional**: 18-50 pcs

### Special Case: Box dengan 7 Plastic Inner
- Total sample dibagi 3 untuk mendapat n1, n2, n3
- Contoh: 21 sample total → n1=7, n2=7, n3=7

---

## ✏️ Corrections Applied

### Typos Fixed:
1. ~~"Santasi"~~ → **"Sanitasi"** ✅
2. ~~"Di terima"~~ → **"Diterima"** ✅

### Clarifications:
- Note untuk plastic inner dijelaskan dengan lebih baik
- Mapping ke database field dijelaskan
- Decision options dibuat konsisten

---

## 🧪 Testing Checklist

Ketika membuat inspection baru via API:

```json
{
  "inspection_date": "2025-02-09",
  "supplier_id": 2,
  "logo_halal": "Ada",

  "qc_params": {
    // Kualitas - Berat
    "q_berat": 1,

    // Fungsional
    "fs_mat_bersih": 1,    // a. Bersih
    "fs_mat_bau": 1,       // b. Bau
    "fs_veh_bak": 1,       // c. Bak
    "fs_veh_segel": 1,     // d. Segel

    // Scores
    "qc_score": 95,
    "fs_score": 98,

    // Decision (pilih salah satu)
    "decision": "Diterima"  // atau "AOD", "Hold", "Rejected"
  }
}
```

---

## 📱 UI Implementation Notes

### Form Layout:
1. Header: Logo Halal dropdown
2. Table dengan kolom: No, Item Pengecekan, Standar, Score, AQL, n1, n2, n3, Jumlah
3. Setiap n1/n2/n3 punya checkbox Ac dan Re
4. Footer: Radio buttons untuk Keputusan
5. Signature fields (checker, driver, warehouse, supervisor)

### Validation Rules:
- Minimal 1 keputusan harus dipilih
- Semua checklist items harus diisi (Ac atau Re)
- Jika ada Re, muncul warning untuk review
- Score otomatis dihitung dari checklist results
