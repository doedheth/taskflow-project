// Migration: Create inspection_complaints table if not exists
import { exec, prepare, saveDb } from '../db';

export function migrateComplaintTables() {
  // Create base table if not exists
  exec(`
    CREATE TABLE IF NOT EXISTS inspection_complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL,
      no TEXT,
      item_name TEXT,
      tanggal_datang TEXT,
      qty INTEGER,
      unit TEXT,
      batch_no TEXT,
      attn TEXT,
      keterangan TEXT,
      dibuat_oleh TEXT,
      diketahui_oleh TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      supplier_response_analisa TEXT,
      supplier_response_perbaikan TEXT,
      supplier_response_pencegahan TEXT,
      supplier_ttd TEXT,
      status TEXT DEFAULT 'pending',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inspection_id) REFERENCES incoming_inspections(id)
    )
  `);

  // Add missing columns (safe for existing tables — each wrapped in try/catch)
  const newColumns = [
    'po_no TEXT',
    'surat_jalan_ref TEXT',
    'qaqc_signature_url TEXT',
    'spv_qaqc_signature_url TEXT',
    'ppic_signature_url TEXT',
    'supplier_signature_url TEXT',
    'qc_incoming_name TEXT',
    'spv_qaqc_name TEXT',
    'ppic_name TEXT',
    'supplier_person_name TEXT',
  ];
  for (const col of newColumns) {
    try {
      exec(`ALTER TABLE inspection_complaints ADD COLUMN ${col}`);
    } catch {
      // Column already exists — ignore
    }
  }

  // Create complaint_photos table if not exists
  exec(`
    CREATE TABLE IF NOT EXISTS complaint_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      photo_url TEXT NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (complaint_id) REFERENCES inspection_complaints(id) ON DELETE CASCADE
    )
  `);

  // Optional safety indexes
  try {
    exec(`CREATE INDEX IF NOT EXISTS idx_ic_inspection_id ON inspection_complaints (inspection_id)`);
  } catch (_e) {
    void _e;
  }

  try {
    exec(`CREATE INDEX IF NOT EXISTS idx_cp_complaint_id ON complaint_photos (complaint_id)`);
  } catch (_e) {
    void _e;
  }

  saveDb();
}
