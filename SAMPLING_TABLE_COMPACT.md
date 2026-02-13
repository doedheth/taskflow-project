# MIL Std 105D - S3 AQL 4.0 Table - Compact Version

## HTML/CSS Implementation (Compact)

```html
<table class="sampling-table-compact">
  <thead>
    <tr>
      <th colspan="4">MIL Std 105D - S3 AQL 4.0</th>
    </tr>
    <tr>
      <th>Jumlah</th>
      <th>n</th>
      <th>Ac</th>
      <th>Re</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2 - 15</td>
      <td>2</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>16 - 50</td>
      <td>3</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>51 - 150</td>
      <td>5</td>
      <td>0</td>
      <td>1</td>
    </tr>
    <tr>
      <td>151 - 500</td>
      <td>8</td>
      <td>1</td>
      <td>2</td>
    </tr>
    <tr>
      <td>501 - 3200</td>
      <td>13</td>
      <td>1</td>
      <td>2</td>
    </tr>
  </tbody>
</table>

<style>
.sampling-table-compact {
  width: auto; /* Auto width instead of 100% */
  border-collapse: collapse;
  font-family: Arial, sans-serif;
  font-size: 11px;
  margin: 10px 0;
}

.sampling-table-compact th,
.sampling-table-compact td {
  border: 1px solid #333;
  padding: 4px 8px; /* Reduced padding */
  text-align: center;
}

.sampling-table-compact thead tr:first-child th {
  background-color: #f0f0f0;
  font-weight: bold;
  padding: 6px;
}

.sampling-table-compact thead tr:nth-child(2) th {
  background-color: #e8e8e8;
  font-weight: bold;
  font-size: 10px;
  padding: 4px;
  min-width: 40px; /* Minimum width for compact columns */
}

/* Specific column widths */
.sampling-table-compact th:nth-child(1),
.sampling-table-compact td:nth-child(1) {
  min-width: 70px; /* Jumlah */
  text-align: left;
  padding-left: 8px;
}

.sampling-table-compact th:nth-child(2),
.sampling-table-compact td:nth-child(2) {
  min-width: 30px; /* n */
}

.sampling-table-compact th:nth-child(3),
.sampling-table-compact td:nth-child(3) {
  min-width: 30px; /* Ac */
}

.sampling-table-compact th:nth-child(4),
.sampling-table-compact td:nth-child(4) {
  min-width: 30px; /* Re */
}

.sampling-table-compact tbody tr:hover {
  background-color: #f9f9f9;
}
</style>
```

---

## React/TypeScript Component (Ultra Compact)

```typescript
import React from 'react';

interface SamplingRow {
  jumlah: string;
  n: number;
  ac: number;
  re: number;
}

const samplingData: SamplingRow[] = [
  { jumlah: '2 - 15', n: 2, ac: 0, re: 1 },
  { jumlah: '16 - 50', n: 3, ac: 0, re: 1 },
  { jumlah: '51 - 150', n: 5, ac: 0, re: 1 },
  { jumlah: '151 - 500', n: 8, ac: 1, re: 2 },
  { jumlah: '501 - 3200', n: 13, ac: 1, re: 2 },
];

export const SamplingTableCompact: React.FC = () => {
  return (
    <table className="w-auto border-collapse text-xs">
      <thead>
        <tr>
          <th colSpan={4} className="bg-gray-100 border border-gray-800 p-2 text-center font-bold">
            MIL Std 105D - S3 AQL 4.0
          </th>
        </tr>
        <tr className="bg-gray-50">
          <th className="border border-gray-800 px-2 py-1 text-[10px] min-w-[70px]">Jumlah</th>
          <th className="border border-gray-800 px-2 py-1 text-[10px] min-w-[30px]">n</th>
          <th className="border border-gray-800 px-2 py-1 text-[10px] min-w-[30px]">Ac</th>
          <th className="border border-gray-800 px-2 py-1 text-[10px] min-w-[30px]">Re</th>
        </tr>
      </thead>
      <tbody>
        {samplingData.map((row, index) => (
          <tr key={index} className="hover:bg-gray-50">
            <td className="border border-gray-800 px-2 py-1 text-left">{row.jumlah}</td>
            <td className="border border-gray-800 px-2 py-1 text-center">{row.n}</td>
            <td className="border border-gray-800 px-2 py-1 text-center">{row.ac}</td>
            <td className="border border-gray-800 px-2 py-1 text-center">{row.re}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

---

## CSS Grid Alternative (Even More Compact)

```html
<div class="sampling-grid">
  <div class="grid-header">MIL Std 105D - S3 AQL 4.0</div>

  <div class="grid-row header">
    <div>Jumlah</div>
    <div>n</div>
    <div>Ac</div>
    <div>Re</div>
  </div>

  <div class="grid-row">
    <div>2 - 15</div>
    <div>2</div>
    <div>0</div>
    <div>1</div>
  </div>

  <div class="grid-row">
    <div>16 - 50</div>
    <div>3</div>
    <div>0</div>
    <div>1</div>
  </div>

  <div class="grid-row">
    <div>51 - 150</div>
    <div>5</div>
    <div>0</div>
    <div>1</div>
  </div>

  <div class="grid-row">
    <div>151 - 500</div>
    <div>8</div>
    <div>1</div>
    <div>2</div>
  </div>

  <div class="grid-row">
    <div>501 - 3200</div>
    <div>13</div>
    <div>1</div>
    <div>2</div>
  </div>
</div>

<style>
.sampling-grid {
  display: inline-block; /* Fit to content */
  border: 1px solid #333;
  font-family: Arial, sans-serif;
  font-size: 11px;
}

.grid-header {
  background-color: #f0f0f0;
  padding: 6px;
  text-align: center;
  font-weight: bold;
  border-bottom: 1px solid #333;
}

.grid-row {
  display: grid;
  grid-template-columns: 80px 35px 35px 35px; /* Compact fixed widths */
  border-bottom: 1px solid #333;
}

.grid-row:last-child {
  border-bottom: none;
}

.grid-row.header {
  background-color: #e8e8e8;
  font-weight: bold;
  font-size: 10px;
}

.grid-row > div {
  padding: 4px 6px;
  border-right: 1px solid #333;
  text-align: center;
}

.grid-row > div:first-child {
  text-align: left;
  padding-left: 8px;
}

.grid-row > div:last-child {
  border-right: none;
}

.grid-row:not(.header):hover {
  background-color: #f9f9f9;
}
</style>
```

---

## Minimal Text Version (For Documentation)

```
╔═══════════════════════════════════════╗
║   MIL Std 105D - S3 AQL 4.0          ║
╠═══════════╦════╦════╦════╗
║  Jumlah   ║ n  ║ Ac ║ Re ║
╠═══════════╬════╬════╬════╣
║  2 - 15   ║  2 ║  0 ║  1 ║
║ 16 - 50   ║  3 ║  0 ║  1 ║
║ 51 - 150  ║  5 ║  0 ║  1 ║
║ 151 - 500 ║  8 ║  1 ║  2 ║
║ 501 - 3200║ 13 ║  1 ║  2 ║
╚═══════════╩════╩════╩════╝
```

---

## TypeScript Type & Data

```typescript
// Type definition
export interface SamplingPlan {
  minQty: number;
  maxQty: number;
  sampleSize: number;
  acceptNumber: number;
  rejectNumber: number;
}

// Data array
export const MIL_STD_105D_AQL_4_0: SamplingPlan[] = [
  { minQty: 2, maxQty: 15, sampleSize: 2, acceptNumber: 0, rejectNumber: 1 },
  { minQty: 16, maxQty: 50, sampleSize: 3, acceptNumber: 0, rejectNumber: 1 },
  { minQty: 51, maxQty: 150, sampleSize: 5, acceptNumber: 0, rejectNumber: 1 },
  { minQty: 151, maxQty: 500, sampleSize: 8, acceptNumber: 1, rejectNumber: 2 },
  { minQty: 501, maxQty: 3200, sampleSize: 13, acceptNumber: 1, rejectNumber: 2 },
];

// Helper function to get sampling plan
export const getSamplingPlan = (quantity: number): SamplingPlan | null => {
  return MIL_STD_105D_AQL_4_0.find(
    plan => quantity >= plan.minQty && quantity <= plan.maxQty
  ) || null;
};

// Usage example
const qty = 100;
const plan = getSamplingPlan(qty);
if (plan) {
  console.log(`For ${qty} items:`);
  console.log(`Sample size: ${plan.sampleSize}`);
  console.log(`Accept if defects ≤ ${plan.acceptNumber}`);
  console.log(`Reject if defects ≥ ${plan.rejectNumber}`);
}
```

---

## Comparison: Width Reduction

### Before (Original):
```
Total width: ~600px
- Jumlah: 200px
- n: 150px
- Ac: 150px
- Re: 150px
```

### After (Compact):
```
Total width: ~185px (69% reduction!)
- Jumlah: 80px
- n: 35px
- Ac: 35px
- Re: 35px
```

---

## Best Practices for Compact Tables

1. **Use fixed column widths** based on content
2. **Reduce padding** (4-6px instead of 10-15px)
3. **Smaller font size** (10-11px instead of 14px)
4. **Remove unnecessary spacing**
5. **Use `width: auto`** instead of `width: 100%`
6. **Center-align numeric data**
7. **Left-align text data**

Pilih versi yang paling sesuai untuk UI Anda!
