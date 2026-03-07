import { exec } from '../db';

/**
 * Migration: Add Inspection Attachments Table
 *
 * Changes:
 * - Create inspection_attachments table for storing additional photos
 */
export function migrateAddInspectionAttachments(): void {
  try {
    exec(`
      CREATE TABLE IF NOT EXISTS inspection_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        inspection_id INTEGER NOT NULL,
        photo_url TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (inspection_id) REFERENCES incoming_inspections (id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Created inspection_attachments table');
  } catch (error) {
    console.error('Failed to create inspection_attachments table:', error);
  }
}
