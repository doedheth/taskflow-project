/**
 * Migration: Add SPK Production Order Tables
 *
 * Creates the following tables:
 * - products: Master data produk untuk SPK
 * - spk_headers: Header SPK (Surat Perintah Kerja)
 * - spk_line_items: Line items untuk setiap SPK
 */

import db from '../db';

export function migrateSPKTables(): void {
  // Check if already migrated by checking for products table
  const productsTableExists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='products'`
  ).get();

  if (productsTableExists) {
    console.log('SPK tables already exist, skipping migration');
    return;
  }

  console.log('Creating SPK tables...');

  // Create products table (Master Data Produk)
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      material TEXT,
      weight_gram REAL,
      default_packaging TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create index on products.code for fast lookup
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(code)
  `);

  // Create index on products.is_active for filtering
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active)
  `);

  console.log('Created products table');

  // Create spk_headers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spk_headers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spk_number TEXT UNIQUE NOT NULL,
      asset_id INTEGER NOT NULL,
      production_date TEXT NOT NULL,
      production_schedule_id INTEGER,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')),
      created_by INTEGER NOT NULL,
      approved_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      submitted_at TEXT,
      approved_at TEXT,
      rejection_reason TEXT,
      notes TEXT,
      FOREIGN KEY (asset_id) REFERENCES assets(id),
      FOREIGN KEY (production_schedule_id) REFERENCES production_schedule(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )
  `);

  // Create indexes for spk_headers
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_spk_number ON spk_headers(spk_number)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_asset_id ON spk_headers(asset_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_production_date ON spk_headers(production_date)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_status ON spk_headers(status)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_created_by ON spk_headers(created_by)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_headers_production_schedule_id ON spk_headers(production_schedule_id)
  `);

  console.log('Created spk_headers table');

  // Create spk_line_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS spk_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      spk_header_id INTEGER NOT NULL,
      sequence INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      packaging_type TEXT,
      packaging_confirmed INTEGER DEFAULT 0,
      remarks TEXT,
      FOREIGN KEY (spk_header_id) REFERENCES spk_headers(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Create indexes for spk_line_items
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_line_items_spk_header_id ON spk_line_items(spk_header_id)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_spk_line_items_product_id ON spk_line_items(product_id)
  `);

  console.log('Created spk_line_items table');

  console.log('SPK tables migration completed successfully');
}

// Allow running directly with ts-node/node
if (require.main === module) {
  migrateSPKTables();
}
