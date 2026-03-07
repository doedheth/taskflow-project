import path from 'path';
import fs from 'fs';
import { initDb, saveDb, prepare } from '../database/db';
import { SupplierService } from '../services/SupplierService';
import { MaterialService } from '../services/MaterialService';
// Use direct SQL via prepare() for existence checks (protected repo methods not accessible)

function clean(s?: string | null) {
  if (!s) return '';
  return s.replace(/^\uFEFF/, '').replace(/"/g, '').replace(/\r/g, '').trim();
}

async function importMaterials(fileAbs: string) {
  console.log(`\n== Import Materials from: ${fileAbs}`);
  if (!fs.existsSync(fileAbs)) { console.warn('File not found, skip.'); return; }
  const raw = fs.readFileSync(fileAbs, 'utf8');
  const lines = raw.split(/\n+/);
  const service = new MaterialService();
  let count = 0, skipped = 0;
  for (let i = 0; i < lines.length; i++) {
    let name = clean(lines[i]);
    if (!name || /^daftar material/i.test(name) || name === '-' ) { skipped++; continue; }
    // Some rows may have CSV commas: use first cell only
    if (name.includes(',')) name = clean(name.split(',')[0]);
    const key = name.toUpperCase();
    const existsByName = prepare(`SELECT id FROM materials WHERE UPPER(name) = ?`).get(key) as any;
    if (existsByName) { skipped++; continue; }
    try {
      await service.create({ name, code: '' });
      count++;
    } catch (e) {
      console.warn('Skip material (error):', name, e instanceof Error ? e.message : e);
      skipped++;
    }
  }
  saveDb();
  console.log(`Materials imported: ${count}, skipped: ${skipped}`);
}

async function importSuppliers(fileAbs: string) {
  console.log(`\n== Import Suppliers from: ${fileAbs}`);
  if (!fs.existsSync(fileAbs)) { console.warn('File not found, skip.'); return; }
  const raw = fs.readFileSync(fileAbs, 'utf8');
  const lines = raw.split(/\n+/);
  const service = new SupplierService();
  let count = 0, skipped = 0;
  for (let i = 0; i < lines.length; i++) {
    let line = clean(lines[i]);
    if (!line) { skipped++; continue; }
    // header or obvious junk
    if (/^nama\s*supl|^nama\s*supplier/i.test(line)) { skipped++; continue; }
    let name = line.split(',')[0];
    name = clean(name).replace(/^-+$/, '');
    if (!name || name === '#REF!' || name === '-') { skipped++; continue; }
    const key = name.toUpperCase();
    const existsByName = prepare(`SELECT id FROM suppliers WHERE UPPER(name) = ?`).get(key) as any;
    if (existsByName) { skipped++; continue; }
    try {
      await service.create({ name, code: '' });
      count++;
    } catch (e) {
      console.warn('Skip supplier (error):', name, e instanceof Error ? e.message : e);
      skipped++;
    }
  }
  saveDb();
  console.log(`Suppliers imported: ${count}, skipped: ${skipped}`);
}

async function main() {
  await initDb();
  const root = path.resolve(__dirname, '../../..');
  const matPath = path.join(root, 'docs', 'daftar material.csv');
  const supPath = path.join(root, 'docs', 'daftar suplier.csv');
  await importMaterials(matPath);
  await importSuppliers(supPath);
  console.log('\n✅ Import completed');
}

main().catch(err=>{ console.error(err); process.exit(1); });
