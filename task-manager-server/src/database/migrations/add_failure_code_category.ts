/**
 * Migration: Add asset_category_id to failure_codes table
 * This allows failure codes to be filtered by machine/asset type
 */

import initSqlJs from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.join(__dirname, '../../..', 'data', 'database.sqlite');

async function runMigration(): Promise<void> {
  console.log('🚀 Starting failure_codes category migration...');

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Check if failure_codes table exists
    const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='failure_codes'");
    if (tables.length === 0 || tables[0].values.length === 0) {
      console.log('⏭️ failure_codes table does not exist yet. Migration will be applied when table is created.');
      return;
    }

    // Check if column already exists
    const tableInfo = db.exec('PRAGMA table_info(failure_codes)');
    const columns = tableInfo[0]?.values.map((row) => row[1]) || [];

    if (!columns.includes('asset_category_id')) {
      // Add asset_category_id column
      db.run('ALTER TABLE failure_codes ADD COLUMN asset_category_id INTEGER REFERENCES asset_categories(id)');
      console.log('✅ Added asset_category_id column to failure_codes');

      // Get asset categories
      const categories = db.exec('SELECT id, name FROM asset_categories');
      const categoryMap: Record<string, number> = {};
      categories[0]?.values.forEach((row) => {
        const [id, name] = row as [number, string];
        categoryMap[name.toLowerCase()] = id;
      });

      console.log('📋 Asset categories:', categoryMap);

      // Update existing failure codes based on their category to match asset categories
      // Electrical codes -> can be for all machines (null = global)
      // Mechanical codes -> can be for all machines
      // Hydraulic codes -> for machines with hydraulics
      // Pneumatic codes -> for machines with pneumatics

      // For thermoforming factory, let's assume:
      // - Thermoforming Machine can have: Electrical, Mechanical, Hydraulic, Pneumatic, Process issues
      // - Chiller can have: Electrical, Mechanical, Refrigeration issues
      // - Compressor can have: Electrical, Mechanical, Pneumatic issues
      // - Mold can have: Mechanical, Process issues

      // We'll keep failure codes as global (null) but add some specific ones
      console.log('✅ Failure codes remain global (accessible for all asset types)');
      console.log('💡 You can update specific failure codes to specific asset categories via the admin panel');
    } else {
      console.log('⏭️ asset_category_id column already exists, skipping');
    }

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('✅ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    db.close();
  }
}

runMigration().catch(console.error);

