/**
 * Migration: Add product_name to production_schedule table
 */

const db = require('../db');

function runMigration() {
  console.log('��� Adding product_name column to production_schedule...');

  try {
    // Check if column exists first
    const tableInfo = db.prepare('PRAGMA table_info(production_schedule)').all();
    const columnExists = tableInfo.some(col => col.name === 'product_name');

    if (!columnExists) {
      db.exec(`ALTER TABLE production_schedule ADD COLUMN product_name TEXT;`);
      console.log('✅ Added product_name column to production_schedule');
    } else {
      console.log('ℹ️ product_name column already exists');
    }

    db.saveDb();
    console.log('��� Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  db.initDb()
    .then(() => {
      runMigration();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { runMigration };
