import { prepare, exec } from '../db';

export function migrateAddScaleWeightToInspectionItems(): void {
  try {
    const cols = prepare('PRAGMA table_info(inspection_items)').all() as { name: string }[];
    if (cols.length > 0 && !cols.some(c => c.name === 'scale_weight')) {
      exec('ALTER TABLE inspection_items ADD COLUMN scale_weight REAL');
      console.log('✅ Migration: Added scale_weight column to inspection_items');
    }
  } catch (e) {
    console.warn('Migration check for inspection_items.scale_weight failed:', e);
  }
}
