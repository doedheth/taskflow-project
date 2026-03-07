// Migration: Add Complaint Table for Inspection Complaint Feature
export default {
  up: async (db: any) => {
    await db.run(`
      CREATE TABLE IF NOT EXISTS inspection_complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL,
        no TEXT,
        item_name TEXT,
        tanggal_datang TEXT,
        qty INTEGER,
        unit TEXT,
        batch_no TEXT,
        po_no TEXT,
        surat_jalan_ref TEXT,
        attn TEXT,
        keterangan TEXT,
        dibuat_oleh TEXT,
        diketahui_oleh TEXT,
        qaqc_signature_url TEXT,
        ppic_signature_url TEXT,
        supplier_signature_url TEXT,
        qc_incoming_name TEXT,
        spv_qaqc_name TEXT,
        ppic_name TEXT,
        supplier_person_name TEXT,
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
  },
  down: async (db: any) => {
    await db.run('DROP TABLE IF EXISTS inspection_complaints');
  }
};