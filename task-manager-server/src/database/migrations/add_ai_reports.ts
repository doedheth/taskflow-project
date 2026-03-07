/**
 * Migration: Add AI Reports Table
 *
 * Creates table for storing AI-generated maintenance reports
 * Story 7.7: Create AI Report Generation
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIReports(): void {
  console.log('Running AI reports migration...');

  try {
    // Check if ai_reports table exists
    const reportsTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_reports'
    `).all();

    if (reportsTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'weekly', 'quarterly')),
          period_year INTEGER NOT NULL,
          period_month INTEGER,
          period_week INTEGER,
          period_quarter INTEGER,
          period_label TEXT NOT NULL,

          executive_summary TEXT NOT NULL,
          metrics TEXT NOT NULL,
          top_issues TEXT NOT NULL,
          recommendations TEXT NOT NULL,
          team_highlights TEXT NOT NULL,

          generated_by INTEGER NOT NULL,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          token_usage INTEGER,

          FOREIGN KEY (generated_by) REFERENCES users(id)
        )
      `);

      // Create indexes for efficient querying
      exec(`CREATE INDEX idx_reports_period ON ai_reports(period_type, period_year, period_month)`);
      exec(`CREATE INDEX idx_reports_generated_by ON ai_reports(generated_by)`);
      exec(`CREATE INDEX idx_reports_generated_at ON ai_reports(generated_at)`);

      console.log('✅ Created ai_reports table');
    }

    saveDb();
    console.log('✅ AI reports migration completed');
  } catch (error) {
    console.error('AI reports migration error:', error);
    throw error;
  }
}
