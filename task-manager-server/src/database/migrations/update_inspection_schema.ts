import { exec } from '../db';

/**
 * Migration: Update Incoming Material Inspection Tables
 *
 * Changes:
 * - Add vehicle_type and vehicle_cover_type to incoming_inspections
 * - Add weight_per_unit to inspection_items
 */
export function migrateUpdateInspectionSchema(): void {
  // Add columns to incoming_inspections if they don't exist
  try {
    exec(`ALTER TABLE incoming_inspections ADD COLUMN vehicle_type TEXT DEFAULT 'Fuso'`);
  } catch (e) {
    // Column might already exist, ignore
  }

  try {
    exec(`ALTER TABLE incoming_inspections ADD COLUMN vehicle_cover_type TEXT DEFAULT 'Box'`);
  } catch (e) {
    // Column might already exist, ignore
  }

  try {
    exec(`ALTER TABLE incoming_inspections ADD COLUMN measure_unit TEXT DEFAULT 'KG'`);
  } catch (e) {
    // Column might already exist, ignore
  }

  // Add column to inspection_items if it doesn't exist
  try {
    exec(`ALTER TABLE inspection_items ADD COLUMN weight_per_unit REAL DEFAULT 0`);
  } catch (e) {
    // Column might already exist, ignore
  }
}
