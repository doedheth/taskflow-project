/**
 * Migration: Add AI Production Reports Table
 *
 * Creates table for storing AI-generated production reports
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIProductionReports(): void {
  console.log('Running AI production reports migration...');

  try {
    // Check if ai_production_reports table exists
    const tableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_production_reports'
    `).all();

    if (tableExists.length === 0) {
      exec(`
        CREATE TABLE ai_production_reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'weekly', 'quarterly')),
          period_year INTEGER NOT NULL,
          period_month INTEGER,
          period_week INTEGER,
          period_quarter INTEGER,
          period_label TEXT NOT NULL,

          executive_summary TEXT NOT NULL,
          metrics TEXT NOT NULL,
          downtime_breakdown TEXT NOT NULL,
          recommendations TEXT NOT NULL,
          production_highlights TEXT NOT NULL,

          generated_by INTEGER NOT NULL,
          generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          token_usage INTEGER,

          FOREIGN KEY (generated_by) REFERENCES users(id)
        )
      `);

      // Create indexes for efficient querying
      exec(`CREATE INDEX idx_prod_reports_period ON ai_production_reports(period_type, period_year, period_month)`);
      exec(`CREATE INDEX idx_prod_reports_generated_by ON ai_production_reports(generated_by)`);
      exec(`CREATE INDEX idx_prod_reports_generated_at ON ai_production_reports(generated_at)`);

      console.log('✅ Created ai_production_reports table');
    }

    saveDb();
    console.log('✅ AI production reports migration completed');
  } catch (error) {
    console.error('AI production reports migration error:', error);
    throw error;
  }
}
