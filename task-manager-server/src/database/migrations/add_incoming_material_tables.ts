import { exec } from '../db';

/**
 * Migration: Create Incoming Material Inspection Tables
 *
 * Tables:
 * - suppliers: Vendor/Supplier master data
 * - incoming_inspections: Main inspection records
 * - inspection_items: QC sampling items
 * - inspection_weights: Weight sampling and photos
 */
export function migrateIncomingMaterialTables(): void {
  // Suppliers table
  exec(`
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT,
      contact_person TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Main Inspections table
  exec(`
    CREATE TABLE IF NOT EXISTS incoming_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_no TEXT NOT NULL UNIQUE,
      inspection_date DATE NOT NULL,
      supplier_id INTEGER NOT NULL,
      po_no TEXT,
      surat_jalan_no TEXT,
      pabrik_danone TEXT,
      product_code TEXT,
      kode_produksi TEXT,
      expedition_name TEXT,
      vehicle_no TEXT,
      driver_name TEXT,
      driver_phone TEXT,
      expired_date TEXT,
      no_seal TEXT,
      arrival_time TEXT,
      unloading_start_time TEXT,
      unloading_end_time TEXT,
      total_items_received INTEGER,
      total_items_received_text TEXT,
      nama_produsen TEXT,
      negara_produsen TEXT,
      logo_halal TEXT, -- Ada / Tidak Ada
      material_type TEXT,
      warna TEXT,
      jumlah_sampling TEXT,
      tanggal_produksi TEXT,
      item_name TEXT,
      checker_id INTEGER NOT NULL,
      checker_signature TEXT,
      driver_signature TEXT,
      warehouse_signature TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      packaging_notes TEXT,
      vehicle_clean INTEGER DEFAULT 1,
      vehicle_no_odor INTEGER DEFAULT 1,
      vehicle_closed INTEGER DEFAULT 1,
      vehicle_on_time INTEGER DEFAULT 1,
      vehicle_on_time_delivery INTEGER DEFAULT 1, -- Pengiriman Tepat Waktu
      item_not_wet INTEGER DEFAULT 1,
      item_not_torn INTEGER DEFAULT 1,
      item_not_dusty INTEGER DEFAULT 1,
      item_closed_tight INTEGER DEFAULT 1, -- Tertutup Rapat
      item_no_haram INTEGER DEFAULT 1, -- Tidak Tercampur Barang Haram
      pkg_condition TEXT, -- Baik, Rusak, Rusak Sebagian
      pkg_name_check TEXT, -- Ada, Tidak Ada
      pkg_hazard_label TEXT, -- Ada, Tidak Ada, Tidak Perlu
      pkg_good INTEGER DEFAULT 1,
      pkg_label_ok INTEGER DEFAULT 1,
      packaging_unit TEXT DEFAULT 'BOX',
      supervisor_signature TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (checker_id) REFERENCES users(id)
    )
  `);

  // QC Parameters table (New)
  exec(`
    CREATE TABLE IF NOT EXISTS inspection_qc_params (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL UNIQUE,
      -- Kualitas
      q_berat INTEGER,
      -- Kualitas: Fungsional
      q_joint INTEGER,
      q_creasing INTEGER,
      -- Kualitas: CoA
      q_coa_panjang INTEGER,
      q_coa_lebar INTEGER,
      q_coa_tinggi INTEGER,
      q_coa_tebal INTEGER,
      q_coa_bct INTEGER,
      q_coa_cobb INTEGER,
      q_coa_bursting INTEGER,
      q_coa_batch_lot INTEGER,
      q_coa_color_chip INTEGER,
      -- Kualitas: Visual
      q_visual_sobek INTEGER,
      q_visual_cetakan INTEGER,
      q_visual_flutting INTEGER,
      q_visual_packaging INTEGER,
      q_visual_warna INTEGER,
      q_visual_clarity INTEGER,
      -- Keamanan Pangan: Material
      fs_mat_bersih INTEGER,
      fs_mat_bau INTEGER,
      -- Keamanan Pangan: Kendaraan
      fs_veh_bersih INTEGER,
      fs_veh_bau INTEGER,
      fs_veh_bak INTEGER,
      fs_veh_segel INTEGER,
      -- Additional
      qc_score INTEGER,
      fs_score INTEGER,
      decision TEXT, -- Di terima, AOD, Hold, Rejected
      FOREIGN KEY (inspection_id) REFERENCES incoming_inspections(id) ON DELETE CASCADE
    )
  `);

  // Inspection Items (QC Sampling)
  exec(`
    CREATE TABLE IF NOT EXISTS inspection_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL,
      batch_no TEXT,
      expired_date TEXT,
      palet_no TEXT,
      qty REAL,
      is_ok INTEGER DEFAULT 1,
      notes TEXT,
      FOREIGN KEY (inspection_id) REFERENCES incoming_inspections(id) ON DELETE CASCADE
    )
  `);

  // Inspection Weights (Sampling Timbangan)
  exec(`
    CREATE TABLE IF NOT EXISTS inspection_weights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inspection_id INTEGER NOT NULL,
      batch_no TEXT,
      weight REAL NOT NULL,
      photo_url TEXT,
      FOREIGN KEY (inspection_id) REFERENCES incoming_inspections(id) ON DELETE CASCADE
    )
  `);
}
