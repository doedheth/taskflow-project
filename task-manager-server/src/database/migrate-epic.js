const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/taskmanager.db');

async function migrate() {
  console.log('🔧 Running Epic migration...');

  const SQL = await initSqlJs();

  // Load existing database
  const buffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(buffer);

  // Check if epic_id column already exists
  const tableInfo = db.exec('PRAGMA table_info(tickets)');
  const columns = tableInfo[0]?.values.map(row => row[1]) || [];

  if (!columns.includes('epic_id')) {
    console.log('📦 Adding epic_id column to tickets table...');
    db.run(
      'ALTER TABLE tickets ADD COLUMN epic_id INTEGER REFERENCES tickets(id) ON DELETE SET NULL'
    );
    console.log('✅ epic_id column added');
  } else {
    console.log('ℹ️ epic_id column already exists');
  }

  // Save database
  const data = db.export();
  const newBuffer = Buffer.from(data);
  fs.writeFileSync(dbPath, newBuffer);

  console.log('🎉 Migration complete!');
  db.close();
}

migrate().catch(console.error);
