/**
 * Migration: Add AI Usage Tracking and Settings
 *
 * Creates tables for tracking AI API usage and managing AI feature settings
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIUsageTracking(): void {
  console.log('Running AI usage tracking migration...');

  try {
    // Check if ai_usage_logs table exists
    const usageTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_usage_logs'
    `).all();

    if (usageTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_usage_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          endpoint TEXT NOT NULL,
          model TEXT DEFAULT 'gpt-3.5-turbo',
          tokens_input INTEGER DEFAULT 0,
          tokens_output INTEGER DEFAULT 0,
          tokens_total INTEGER DEFAULT 0,
          estimated_cost REAL DEFAULT 0,
          response_time_ms INTEGER DEFAULT 0,
          success INTEGER DEFAULT 1,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create index for efficient querying
      exec(`CREATE INDEX idx_ai_usage_user_date ON ai_usage_logs(user_id, created_at)`);
      exec(`CREATE INDEX idx_ai_usage_endpoint ON ai_usage_logs(endpoint, created_at)`);

      console.log('✅ Created ai_usage_logs table');
    }

    // Check if ai_settings table exists
    const settingsTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_settings'
    `).all();

    if (settingsTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          setting_key TEXT UNIQUE NOT NULL,
          setting_value TEXT NOT NULL,
          description TEXT,
          updated_by INTEGER,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (updated_by) REFERENCES users(id)
        )
      `);

      console.log('✅ Created ai_settings table');
    }

    saveDb();
    console.log('✅ AI usage tracking migration completed');
  } catch (error) {
    console.error('AI usage tracking migration error:', error);
    throw error;
  }
}
