/**
 * Migration: Update role constraint in users table to include supervisor
 * SQLite doesn't support ALTER TABLE to modify constraints, so we need to:
 * 1. Create a new table with the correct constraint
 * 2. Copy data from old table
 * 3. Drop old table
 * 4. Rename new table
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate() {
  console.log('🔧 Running migration: Update role constraint to include supervisor...');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found. Please run setup first.');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Start transaction
    db.run('BEGIN TRANSACTION');

    // 1. Create new users table with updated constraint
    console.log('📋 Creating new users table with supervisor role...');
    db.run(`
      CREATE TABLE IF NOT EXISTS users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT,
        whatsapp TEXT,
        role TEXT DEFAULT 'member' CHECK(role IN ('admin', 'manager', 'supervisor', 'member')),
        department_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      )
    `);

    // 2. Copy data from old table to new table
    console.log('📦 Copying user data...');
    db.run(`
      INSERT INTO users_new (id, email, password, name, avatar, whatsapp, role, department_id, created_at, updated_at)
      SELECT id, email, password, name, avatar, whatsapp, role, department_id, created_at, updated_at
      FROM users
    `);

    // 3. Drop old table
    console.log('🗑️ Dropping old users table...');
    db.run('DROP TABLE users');

    // 4. Rename new table to users
    console.log('✏️ Renaming new table to users...');
    db.run('ALTER TABLE users_new RENAME TO users');

    // Commit transaction
    db.run('COMMIT');

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('');
    console.log('✅ Role constraint updated successfully!');
    console.log('   Available roles: admin, manager, supervisor, member');
    console.log('');
    console.log('🎉 Migration completed successfully!');
  } catch (error) {
    // Rollback on error
    try {
      db.run('ROLLBACK');
    } catch (e) {}
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
