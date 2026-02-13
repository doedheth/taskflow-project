# Fix: Remove Internal Lines from Section Headers

## Problem
Section header "KUALITAS" masih memiliki garis horizontal/vertikal internal yang tidak seharusnya ada.

## Solution - CSS Fix

```css
/* Remove ALL internal borders from section header */
.section-header td {
  /* Background and text */
  background-color: #e8e8e8;
  font-weight: bold;
  text-align: left;
  padding: 8px 12px;

  /* ONLY outer border, no internal lines */
  border: 1px solid #333 !important;

  /* Force no internal borders */
  border-collapse: collapse;
}

/* Ensure no borders between merged cells */
.section-header td::before,
.section-header td::after {
  content: none;
  border: none;
}

/* Remove any inherited borders */
table.inspection-form .section-header td {
  border-left: 1px solid #333;
  border-right: 1px solid #333;
  border-top: 1px solid #333;
  border-bottom: 1px solid #333;
  border-spacing: 0;
}

/* Force border collapse for the entire table */
table.inspection-form {
  border-collapse: collapse !important;
  border-spacing: 0 !important;
}
```

---

## Complete Clean HTML + CSS

```html
<!DOCTYPE html>
<html>
<head>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.inspection-form {
  width: 100%;
  border-collapse: collapse !important;
  border-spacing: 0 !important;
  font-family: Arial, sans-serif;
  font-size: 11px;
}

/* All cells default border */
.inspection-form th,
.inspection-form td {
  border: 1px solid #333;
  padding: 4px 6px;
  text-align: center;
}

/* Header styling */
.inspection-form thead th {
  background-color: #f0f0f0;
  font-weight: bold;
  font-size: 10px;
}

/* SECTION HEADER - COMPLETELY CLEAN, NO INTERNAL LINES */
.inspection-form .section-header {
  background-color: #e8e8e8;
}

.inspection-form .section-header td {
  /* Single merged cell with ONLY outer border */
  border: 1px solid #333 !important;
  background-color: #e8e8e8 !important;
  font-weight: bold;
  text-align: left;
  padding: 6px 12px;

  /* Remove any possible internal borders */
  border-image: none;
  border-spacing: 0;
}

/* Text alignment */
.inspection-form td:nth-child(2),
.inspection-form td:nth-child(3) {
  text-align: left;
}

/* Number columns centered */
.inspection-form td:nth-child(1),
.inspection-form td:nth-child(4),
.inspection-form td:nth-child(5) {
  text-align: center;
}
</style>
</head>
<body>

<table class="inspection-form">
  <thead>
    <tr>
      <th rowspan="2">No.</th>
      <th rowspan="2">Item Pengecekan</th>
      <th rowspan="2">Standar</th>
      <th rowspan="2">Score</th>
      <th rowspan="2">AQL</th>
      <th colspan="2">n1</th>
      <th colspan="2">n2</th>
      <th colspan="2">n3</th>
      <th rowspan="2">Jumlah</th>
      <th rowspan="2">Mil Std</th>
    </tr>
    <tr>
      <th>Ac</th><th>Re</th>
      <th>Ac</th><th>Re</th>
      <th>Ac</th><th>Re</th>
    </tr>
  </thead>
  <tbody>
    <!-- SECTION HEADER: No internal lines at all -->
    <tr class="section-header">
      <td colspan="12">KUALITAS :</td>
    </tr>

    <!-- Data rows -->
    <tr>
      <td>1.</td>
      <td>Berat</td>
      <td>Sesuai standar di ITP</td>
      <td>30/25</td>
      <td>4.0</td>
      <td>✓</td><td></td>
      <td>✓</td><td></td>
      <td>✓</td><td></td>
      <td>2 - 15</td>
      <td></td>
    </tr>

    <tr>
      <td>2.</td>
      <td>Fungsional</td>
      <td></td>
      <td>25</td>
      <td>4.0</td>
      <td colspan="6"></td>
      <td>16 - 50</td>
      <td></td>
    </tr>

    <tr>
      <td>a.</td>
      <td>Bersih</td>
      <td>Sanitasi baik</td>
      <td></td>
      <td></td>
      <td>✓</td><td></td>
      <td>✓</td><td></td>
      <td>✓</td><td></td>
      <td></td>
      <td></td>
    </tr>

    <!-- Add more rows as needed -->
  </tbody>
</table>

</body>
</html>
```

---

## Alternative: Using rowspan instead of background lines

Jika masih ada garis, coba approach ini:

```html
<!-- Use single cell with proper colspan -->
<tr class="section-header">
  <td colspan="12" style="border: 1px solid #333; background: #e8e8e8; font-weight: bold; padding: 6px 12px; text-align: left;">
    KUALITAS :
  </td>
</tr>
```

---

## React/Tailwind Clean Version

```tsx
export const InspectionTable = () => {
  return (
    <table className="w-full border-collapse border-spacing-0">
      <thead>
        <tr className="bg-gray-100">
          <th rowSpan={2} className="border border-gray-800 p-2">No.</th>
          <th rowSpan={2} className="border border-gray-800 p-2">Item Pengecekan</th>
          <th rowSpan={2} className="border border-gray-800 p-2">Standar</th>
          <th rowSpan={2} className="border border-gray-800 p-2">Score</th>
          <th rowSpan={2} className="border border-gray-800 p-2">AQL</th>
          <th colSpan={2} className="border border-gray-800 p-2">n1</th>
          <th colSpan={2} className="border border-gray-800 p-2">n2</th>
          <th colSpan={2} className="border border-gray-800 p-2">n3</th>
          <th rowSpan={2} className="border border-gray-800 p-2">Jumlah</th>
        </tr>
        <tr className="bg-gray-100">
          <th className="border border-gray-800 p-1">Ac</th>
          <th className="border border-gray-800 p-1">Re</th>
          <th className="border border-gray-800 p-1">Ac</th>
          <th className="border border-gray-800 p-1">Re</th>
          <th className="border border-gray-800 p-1">Ac</th>
          <th className="border border-gray-800 p-1">Re</th>
        </tr>
      </thead>
      <tbody>
        {/* SECTION HEADER - Single merged cell, no internal borders */}
        <tr>
          <td
            colSpan={11}
            className="border border-gray-800 bg-gray-200 p-2 text-left font-bold"
            style={{ borderCollapse: 'collapse' }}
          >
            KUALITAS :
          </td>
        </tr>

        {/* Data rows */}
        <tr>
          <td className="border border-gray-800 p-2">1.</td>
          <td className="border border-gray-800 p-2 text-left">Berat</td>
          <td className="border border-gray-800 p-2 text-left">Sesuai standar di ITP</td>
          <td className="border border-gray-800 p-2">30/25</td>
          <td className="border border-gray-800 p-2">4.0</td>
          <td className="border border-gray-800 p-2">✓</td>
          <td className="border border-gray-800 p-2"></td>
          <td className="border border-gray-800 p-2">✓</td>
          <td className="border border-gray-800 p-2"></td>
          <td className="border border-gray-800 p-2">✓</td>
          <td className="border border-gray-800 p-2"></td>
          <td className="border border-gray-800 p-2">2 - 15</td>
        </tr>
      </tbody>
    </table>
  );
};
```

---

## Debug Checklist

Jika garis masih muncul, cek:

### ✅ **1. Border Collapse**
```css
table {
  border-collapse: collapse !important; /* Harus collapse, bukan separate */
}
```

### ✅ **2. No Border Spacing**
```css
table {
  border-spacing: 0 !important;
}
```

### ✅ **3. Colspan Correct**
```html
<!-- Pastikan colspan = total kolom -->
<td colspan="12">KUALITAS :</td>  <!-- 12 columns total -->
```

### ✅ **4. No Background Images/Gradients**
```css
.section-header td {
  background-image: none !important;
  background: #e8e8e8 !important; /* Solid color only */
}
```

### ✅ **5. Force Single Border**
```css
.section-header td {
  border: 1px solid #333 !important; /* Override all */
  border-image: none !important;
}
```

---

## Quick Fix Inline Style

Jika masih bermasalah, gunakan inline style langsung:

```html
<tr>
  <td
    colspan="12"
    style="
      border: 1px solid #333;
      background-color: #e8e8e8;
      font-weight: bold;
      padding: 6px 12px;
      text-align: left;
      border-collapse: collapse;
      border-spacing: 0;
      background-image: none;
    "
  >
    KUALITAS :
  </td>
</tr>
```

Coba solusi ini dan beritahu saya hasilnya!
