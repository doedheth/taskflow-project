import { prepare, exec } from '../db';

export function migrateAddBatchVendorToInspectionWeights(): void {
  try {
    const cols = prepare('PRAGMA table_info(inspection_weights)').all() as { name: string }[];
    if (cols.length > 0 && !cols.some(c => c.name === 'batch_vendor')) {
      exec('ALTER TABLE inspection_weights ADD COLUMN batch_vendor TEXT');
      console.log('✅ Migration: Added batch_vendor column to inspection_weights');
    }
  } catch (e) {
    console.warn('Migration check for inspection_weights.batch_vendor failed:', e);
  }
}
