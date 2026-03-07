import { exec, prepare, saveDb } from '../db';

/**
 * Migration: Create Producers Table
 */
export function migrateProducersTable(): void {
  exec(`
    CREATE TABLE IF NOT EXISTS producers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT,
      address TEXT,
      contact_person TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add email column if it doesn't exist (in case table already exists but without email)
  try {
    const producerCols = prepare('PRAGMA table_info(producers)').all() as { name: string }[];
    if (producerCols.length > 0 && !producerCols.some(col => col.name === 'email')) {
      exec('ALTER TABLE producers ADD COLUMN email TEXT');
      console.log('✅ Migration: Added email column to producers');
    }
  } catch (error) {
    console.warn('Migration check for producers.email failed:', error);
  }

  // Add producer_id to incoming_inspections if it doesn't exist
  try {
    const tableInfo = prepare('PRAGMA table_info(incoming_inspections)').all() as { name: string }[];
    if (tableInfo.length > 0 && !tableInfo.some(col => col.name === 'producer_id')) {
      exec('ALTER TABLE incoming_inspections ADD COLUMN producer_id INTEGER REFERENCES producers(id)');
      saveDb();
      console.log('✅ Migration: Added producer_id column to incoming_inspections');
    }
  } catch (error) {
    console.error('Migration failed to add producer_id:', error);
  }
}
