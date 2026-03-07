/**
 * Migration: Add PLN Metrics Table
 *
 * Stores high-frequency energy consumption data from PLN Induk.
 */

import db from '../db';

export function migratePLNMetricsTable(): void {
  // Check if already migrated
  const plnMetricsExists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='pln_metrics'`
  ).get();

  if (plnMetricsExists) {
    console.log('PLN metrics table already exists, skipping migration');
    return;
  }

  console.log('Creating PLN metrics table...');

  // Create pln_metrics table (Story 9.1 AC1)
  db.exec(`
    CREATE TABLE IF NOT EXISTS pln_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bp REAL DEFAULT 0,            -- Beban Puncak (Peak Load)
      lbp REAL DEFAULT 0,           -- Luar Waktu Beban Puncak (Off-Peak)
      total REAL DEFAULT 0,         -- Total kWh
      varh REAL DEFAULT 0,          -- Reactive Energy
      power_factor REAL DEFAULT 0,  -- Power Factor
      recorded_at TEXT NOT NULL,    -- Timestamp from meter
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create indexes for performance (Story 9.1 AC2)
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_pln_metrics_recorded_at ON pln_metrics(recorded_at);
    CREATE INDEX IF NOT EXISTS idx_pln_metrics_power_factor ON pln_metrics(power_factor);
  `);

  console.log('PLN metrics table created successfully');
}

if (require.main === module) {
  migratePLNMetricsTable();
}
