import { exec, prepare, saveDb } from '../db';

/**
 * Migration: Create Materials Table
 */
export function migrateMaterialsTable(): void {
  // Create materials table
  exec(`
    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add material_id to incoming_inspections if it doesn't exist
  try {
    const tableInfo = prepare('PRAGMA table_info(incoming_inspections)').all() as { name: string }[];
    if (tableInfo.length > 0 && !tableInfo.some(col => col.name === 'material_id')) {
      exec('ALTER TABLE incoming_inspections ADD COLUMN material_id INTEGER REFERENCES materials(id)');
      saveDb();
      console.log('✅ Migration: Added material_id column to incoming_inspections');
    }
  } catch (error) {
    console.error('Migration failed to add material_id:', error);
  }
}
