import { exec } from '../db';

/**
 * Migration: Add email column to suppliers table
 */
export function migrateAddSupplierEmail(): void {
  try {
    exec(`ALTER TABLE suppliers ADD COLUMN email TEXT;`);
    console.log('✅ Migration: Added email column to suppliers table');
  } catch (error) {
    // Ignore error if column already exists
    if (error instanceof Error && (error.message.includes('duplicate column name') || error.message.includes('already exists'))) {
      console.log('ℹ️ email column already exists in suppliers table');
    } else {
      console.error('❌ Migration failed (add_supplier_email):', error);
      // Don't throw to prevent server startup failure, but log it
    }
  }
}
