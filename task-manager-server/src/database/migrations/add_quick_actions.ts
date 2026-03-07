/**
 * Migration: Add Production Downtime Quick Actions Table
 *
 * This migration creates a table to store customizable quick action buttons
 * for the Production Downtime page.
 */

import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate(): Promise<void> {
  console.log('🔧 Running migration: Add Quick Actions Table...');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Check if table already exists
    const tableExists = db.exec(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='production_quick_actions'
    `);

    if (tableExists.length > 0 && tableExists[0].values.length > 0) {
      console.log('⏭️  Table production_quick_actions already exists, skipping creation.');
    } else {
      // Create quick actions table
      db.exec(`
        CREATE TABLE production_quick_actions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          label TEXT NOT NULL,
          icon TEXT NOT NULL DEFAULT '⚡',
          color TEXT NOT NULL DEFAULT 'bg-blue-500 hover:bg-blue-600',
          classification_code TEXT NOT NULL,
          sort_order INTEGER DEFAULT 0,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (classification_code) REFERENCES downtime_classifications(code)
        )
      `);
      console.log('✅ Created production_quick_actions table');
    }

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('');
    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
