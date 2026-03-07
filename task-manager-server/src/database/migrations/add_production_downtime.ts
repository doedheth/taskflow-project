/**
 * Migration: Add Production Downtime Classifications
 *
 * This migration adds new downtime classifications specifically for
 * production-related downtime events like changeover, mold change, etc.
 */

import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate(): Promise<void> {
  console.log('🔧 Running migration: Add Production Downtime Classifications...');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found at:', dbPath);
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    console.log('📋 Checking downtime classifications...');
    const allClassifications = db.exec(`
      SELECT code, name, category, counts_as_downtime
      FROM downtime_classifications
      ORDER BY category, code
    `);

    if (allClassifications.length > 0) {
      console.log('');
      console.log('| Code | Name | Category | Counts |');
      console.log('|------|------|----------|--------|');
      allClassifications[0].values.forEach(row => {
        const [code, name, category, counts] = row;
        console.log(`| ${code} | ${name} | ${category} | ${counts ? 'Yes' : 'No'} |`);
      });
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
