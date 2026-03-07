/**
 * Migration: Add WhatsApp field to users table
 * Purpose: Support future WhatsApp integration for notifications
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate() {
  console.log('🔧 Running migration: Add WhatsApp field to users...');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found. Please run setup first.');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Check if column already exists
    const columns = db.exec('PRAGMA table_info(users)');
    const columnNames = columns[0]?.values.map(row => row[1]) || [];

    if (columnNames.includes('whatsapp')) {
      console.log('✅ WhatsApp column already exists. Skipping...');
    } else {
      // Add whatsapp column
      db.run('ALTER TABLE users ADD COLUMN whatsapp TEXT');
      console.log('✅ Added whatsapp column to users table');
    }

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
