/**
 * Migration: Add AI Feature Toggles Table
 *
 * Creates table for granular AI feature control per role
 * Story 7.9: Implement AI Admin Controls & Analytics
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIFeatureToggles(): void {
  console.log('Running AI feature toggles migration...');

  try {
    // Check if ai_feature_toggles table exists
    const tableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_feature_toggles'
    `).all();

    if (tableExists.length === 0) {
      exec(`
        CREATE TABLE ai_feature_toggles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          feature TEXT NOT NULL,
          role TEXT NOT NULL,
          enabled INTEGER NOT NULL DEFAULT 1,
          updated_by INTEGER,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(feature, role),
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `);

      // Create index for efficient lookup
      exec(`CREATE INDEX idx_feature_toggles_lookup ON ai_feature_toggles(feature, role)`);

      console.log('✅ Created ai_feature_toggles table');
    }

    saveDb();
    console.log('✅ AI feature toggles migration completed');
  } catch (error) {
    console.error('AI feature toggles migration error:', error);
    throw error;
  }
}
