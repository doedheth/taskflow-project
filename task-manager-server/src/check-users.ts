/**
 * Verify users table exists
 */
import { initDb, prepare } from './database/db';

async function checkUsersTable() {
  await initDb();

  console.log('\n=== CHECKING USERS TABLE ===\n');

  try {
    const schema = prepare(`PRAGMA table_info(users)`).all();

    if (schema.length === 0) {
      console.log('❌ Users table does not exist!');
    } else {
      console.log('✅ Users table exists!');
      console.log(`📊 Total columns: ${schema.length}\n`);

      // Show first few columns
      console.log('Columns:');
      schema.slice(0, 10).forEach((col: any) => {
        console.log(`  - ${col.name} (${col.type})`);
      });

      // Count users
      const count = prepare(`SELECT COUNT(*) as count FROM users`).get() as { count: number };
      console.log(`\n👥 Total users: ${count.count}`);
    }
  } catch (error: any) {
    console.log('❌ Error checking users table:', error.message);
  }

  process.exit(0);
}

checkUsersTable();
