import { exec, prepare } from '../db';

/**
 * Migration: Add lot_code to inspection_items and unique index
 * Format: LOTYYMMDDNNN (e.g., LOT260305001)
 */
export function migrateAddLotCodeToInspectionItems(): void {
  try {
    const cols = prepare('PRAGMA table_info(inspection_items)').all() as { name: string }[];
    const hasCol = cols.some(c => c.name === 'lot_code');
    if (!hasCol) {
      exec(`ALTER TABLE inspection_items ADD COLUMN lot_code TEXT`);
      console.log('✅ Migration: Added lot_code column to inspection_items');
    } else {
      console.log('ℹ️ Migration: lot_code column already exists on inspection_items');
    }
  } catch (e) {
    console.warn('Migration check for inspection_items.lot_code failed:', e);
  }
  exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_inspection_items_lot_code ON inspection_items(lot_code)
  `);
}
