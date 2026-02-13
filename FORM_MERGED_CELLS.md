# Form Inspection - Merged Cell Section Headers

## HTML Version dengan Merged Cells

```html
<table class="inspection-form">
  <!-- Logo Halal -->
  <tr>
    <td colspan="11" class="form-header">
      <strong>Logo Halal</strong>: Ada
    </td>
  </tr>

  <!-- Table Headers -->
  <tr class="main-header">
    <th rowspan="2">No.</th>
    <th rowspan="2">Item Pengecekan</th>
    <th rowspan="2">Standar</th>
    <th rowspan="2">Score</th>
    <th rowspan="2">AQL</th>
    <th colspan="2">n1</th>
    <th colspan="2">n2</th>
    <th colspan="2">n3</th>
    <th rowspan="2">Jumlah</th>
  </tr>
  <tr class="sub-header">
    <th>Ac</th>
    <th>Re</th>
    <th>Ac</th>
    <th>Re</th>
    <th>Ac</th>
    <th>Re</th>
  </tr>

  <!-- SECTION HEADER: KUALITAS (MERGED CELL - NO VERTICAL LINES) -->
  <tr class="section-header">
    <td colspan="11"><strong>KUALITAS :</strong></td>
  </tr>

  <!-- Row 1: Berat -->
  <tr>
    <td>1.</td>
    <td>Berat</td>
    <td>Sesuai standar di ITP</td>
    <td>30/25</td>
    <td>4.0</td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>2 - 15</td>
  </tr>

  <!-- Row 2: Fungsional (Parent Row) -->
  <tr>
    <td>2.</td>
    <td>Fungsional</td>
    <td></td>
    <td>25</td>
    <td></td>
    <td colspan="6"></td>
    <td>18 - 50</td>
  </tr>

  <!-- Sub-item a: Bersih -->
  <tr>
    <td>a.</td>
    <td>Bersih</td>
    <td>Sanitasi baik</td>
    <td></td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td></td>
  </tr>

  <!-- Sub-item b: Bau -->
  <tr>
    <td>b.</td>
    <td>Bau</td>
    <td>Baik Tidak Berbau</td>
    <td></td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td></td>
  </tr>

  <!-- Sub-item c: Bak -->
  <tr>
    <td>c.</td>
    <td>Bak</td>
    <td>Tertutup, bersegel</td>
    <td></td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td></td>
  </tr>

  <!-- Sub-item d: Segel -->
  <tr>
    <td>d.</td>
    <td>Segel</td>
    <td>Bersegel/utuh</td>
    <td></td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td>✓</td>
    <td></td>
    <td></td>
  </tr>

  <!-- Note Row -->
  <tr class="note-row">
    <td colspan="11">
      <em>Note: Box 7 plastic inner: n1,2,3 = n/3</em>
    </td>
  </tr>

  <!-- Decision Row -->
  <tr class="decision-row">
    <td colspan="11">
      <strong>Keputusan:</strong>
      ☐ Diterima &nbsp;&nbsp; ☑ AOD &nbsp;&nbsp; ☐ Hold &nbsp;&nbsp; ☐ Rejected
    </td>
  </tr>
</table>

<style>
.inspection-form {
  width: 100%;
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  font-size: 12px;
  border: 2px solid #000;
}

.inspection-form th,
.inspection-form td {
  border: 1px solid #333;
  padding: 6px 8px;
  text-align: center;
}

/* Form Header (Logo Halal) */
.form-header {
  background-color: white;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #000;
}

/* Main Table Headers */
.main-header th,
.sub-header th {
  background-color: #f0f0f0;
  font-weight: bold;
  font-size: 11px;
}

/* SECTION HEADER - MERGED CELL WITH NO INTERNAL BORDERS */
.section-header td {
  background-color: #e8e8e8;
  font-weight: bold;
  text-align: left;
  padding: 8px 12px;
  border-left: 1px solid #333;
  border-right: 1px solid #333;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
  /* No internal vertical borders - achieved by colspan */
}

/* Data Cells - Left Align for Text */
.inspection-form td:nth-child(2),
.inspection-form td:nth-child(3) {
  text-align: left;
}

/* Note Row */
.note-row td {
  background-color: #fffacd;
  font-style: italic;
  font-size: 11px;
  text-align: left;
  padding: 6px 12px;
}

/* Decision Row */
.decision-row td {
  background-color: white;
  text-align: left;
  padding: 10px 12px;
  border-top: 2px solid #000;
}

/* Print Styles */
@media print {
  .inspection-form {
    border: 2px solid #000;
  }

  .section-header td {
    background-color: #e8e8e8 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
```

---

## Visual Representation (Text)

```
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│ Logo Halal: Ada                                                                           │
├────┬───────────────┬──────────────────────┬───────┬─────┬──────────────────────┬─────────┤
│No. │Item Pengecekan│ Standar              │ Score │ AQL │  n1    n2    n3      │ Jumlah  │
│    │               │                      │       │     │ Ac│Re│Ac│Re│Ac│Re    │         │
├────┴───────────────┴──────────────────────┴───────┴─────┴──────────────────────┴─────────┤
│ KUALITAS :                                                                                │  ← MERGED CELL (No internal lines)
├────┬───────────────┬──────────────────────┬───────┬─────┬──────────────────────┬─────────┤
│ 1. │ Berat         │ Sesuai standar di ITP│ 30/25 │ 4.0 │ ✓  │  │ ✓  │  │ ✓  │  │ 2 - 15  │
├────┼───────────────┼──────────────────────┼───────┼─────┼────┼──┼────┼──┼────┼──┼─────────┤
│ 2. │ Fungsional    │                      │  25   │     │                      │ 18 - 50 │
├────┼───────────────┼──────────────────────┼───────┼─────┼────┼──┼────┼──┼────┼──┼─────────┤
│ a. │ Bersih        │ Sanitasi baik        │       │     │ ✓  │  │ ✓  │  │ ✓  │  │         │
│ b. │ Bau           │ Baik Tidak Berbau    │       │     │ ✓  │  │ ✓  │  │ ✓  │  │         │
│ c. │ Bak           │ Tertutup, bersegel   │       │     │ ✓  │  │ ✓  │  │ ✓  │  │         │
│ d. │ Segel         │ Bersegel/utuh        │       │     │ ✓  │  │ ✓  │  │ ✓  │  │         │
├────┴───────────────┴──────────────────────┴───────┴─────┴──────────────────────┴─────────┤
│ Note: Box 7 plastic inner: n1,2,3 = n/3                                                  │
├───────────────────────────────────────────────────────────────────────────────────────────┤
│ Keputusan: ☐ Diterima    ☑ AOD    ☐ Hold    ☐ Rejected                                  │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Points - Merged Cell Implementation

### ✅ **How It Works:**

1. **Use `colspan` attribute**
   ```html
   <td colspan="11">KUALITAS :</td>
   ```

2. **CSS Styling**
   ```css
   .section-header td {
     /* Only outer borders, no internal divisions */
     border: 1px solid #333;
     background-color: #e8e8e8;
   }
   ```

3. **Result:**
   - Cell spans across all columns
   - **NO vertical lines inside**
   - Acts as one unified cell
   - Background color fills entire width

### 🎯 **Benefits:**

✅ Clean section header tanpa garis vertikal
✅ Lebih mudah dibaca
✅ Professional appearance
✅ Standard table practice
✅ Print-friendly
