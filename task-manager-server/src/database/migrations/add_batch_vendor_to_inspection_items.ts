
import { prepare, exec } from '../db';

export async function up() {
  try {
    // Check if column exists
    const tableInfo = prepare("PRAGMA table_info(inspection_items)").all() as Array<{ name?: string }>;
    const hasColumn = tableInfo.some((col) => col.name === 'batch_vendor');

    if (!hasColumn) {
      console.log('Adding batch_vendor column to inspection_items table...');
      exec("ALTER TABLE inspection_items ADD COLUMN batch_vendor TEXT");
      console.log('Successfully added batch_vendor column.');
    } else {
      console.log('batch_vendor column already exists in inspection_items table.');
    }
  } catch (error) {
    console.error('Error adding batch_vendor column:', error);
    throw error;
  }
}

export async function down() {
  // SQLite does not support dropping columns easily in older versions,
  // but for newer ones it does. However, usually we don't need down migration for add column in this simple setup.
  console.log('Down migration not implemented for add_batch_vendor_to_inspection_items');
}
