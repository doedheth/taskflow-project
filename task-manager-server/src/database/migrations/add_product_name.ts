/**
 * Migration: Add product_name to production_schedule table
 */
import { initDb, prepare, exec, saveDb } from '../db';

export async function runMigration(): Promise<void> {
  console.log('🔧 Running product_name migration...');

  await initDb();

  try {
    // Check if column exists
    const tableInfo = prepare('PRAGMA table_info(production_schedule)').all() as { name: string }[];
    const columnExists = tableInfo.some(col => col.name === 'product_name');

    if (!columnExists) {
      exec('ALTER TABLE production_schedule ADD COLUMN product_name TEXT');
      saveDb();
      console.log('✅ Added product_name column to production_schedule');
    } else {
      console.log('ℹ️ product_name column already exists');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
