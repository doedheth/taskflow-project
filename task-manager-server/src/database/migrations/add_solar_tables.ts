/**
 * Migration: Add Solar Monitoring Tables
 * 
 * Creates the following tables:
 * - solar_config: Stores Huawei FusionSolar credentials and session data
 * - solar_energy_data: Stores daily energy production data (Huawei vs Manual)
 */

import db from '../db';

export function migrateSolarTables(): void {
  // Check if already migrated
  const solarConfigExists = db.prepare(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='solar_config'`
  ).get();

  if (solarConfigExists) {
    console.log('Solar tables already exist, skipping migration');
    return;
  }

  console.log('Creating Solar monitoring tables...');

  // Create solar_config table
  db.exec(`
    CREATE TABLE IF NOT EXISTS solar_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      station_dn TEXT,
      session_cookies TEXT,
      last_login TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create solar_energy_data table
  db.exec(`
    CREATE TABLE IF NOT EXISTS solar_energy_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT UNIQUE NOT NULL, -- Format: YYYY-MM-DD
      product_power REAL DEFAULT 0, -- Data from Huawei (kWh)
      manual_kwh REAL DEFAULT 0,    -- Data from manual input (kWh)
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create index for date
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_solar_energy_date ON solar_energy_data(date)
  `);

  console.log('Solar tables created successfully');
}

if (require.main === module) {
  migrateSolarTables();
}
