/**
 * Migration: Copy assignee_id data to ticket_assignees junction table
 * Purpose: Migrate legacy single-assignee data to multi-assignee system
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../../../data/taskmanager.db');

async function migrate() {
  console.log('🔧 Running migration: Migrate assignee_id to ticket_assignees...');

  if (!fs.existsSync(dbPath)) {
    console.error('❌ Database file not found. Please run setup first.');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  const db = new SQL.Database(fileBuffer);

  try {
    // Get all tickets that have assignee_id but no entry in ticket_assignees
    const result = db.exec(`
      SELECT t.id, t.assignee_id 
      FROM tickets t
      WHERE t.assignee_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM ticket_assignees ta 
        WHERE ta.ticket_id = t.id AND ta.user_id = t.assignee_id
      )
    `);

    if (result.length === 0 || result[0].values.length === 0) {
      console.log('✅ No tickets need migration.');
    } else {
      const tickets = result[0].values;
      console.log(`📋 Found ${tickets.length} tickets with assignee_id that need migration`);

      for (const [ticketId, assigneeId] of tickets) {
        db.run('INSERT OR IGNORE INTO ticket_assignees (ticket_id, user_id) VALUES (?, ?)', [
          ticketId,
          assigneeId,
        ]);
        console.log(`  ✓ Migrated ticket ${ticketId} -> user ${assigneeId}`);
      }

      console.log(`\n✅ Successfully migrated ${tickets.length} ticket assignments.`);
    }

    // Verify the migration
    const countResult = db.exec('SELECT COUNT(*) as count FROM ticket_assignees');
    const count = countResult[0]?.values[0]?.[0] || 0;
    console.log(`\n📊 Total entries in ticket_assignees table: ${count}`);

    // Save database
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);

    console.log('\n🎉 Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

migrate().catch(console.error);
