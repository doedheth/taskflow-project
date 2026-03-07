/**
 * List all tables in the database
 */
import { initDb, prepare } from './database/db';

async function listTables() {
  await initDb();

  console.log('\n=== ALL TABLES IN DATABASE ===\n');

  try {
    const tables = prepare(`SELECT name FROM sqlite_master WHERE type='table' ORDER BY name`).all() as { name: string }[];

    if (tables.length === 0) {
      console.log('❌ No tables found in database!');
    } else {
      console.log(`📊 Total tables: ${tables.length}\n`);
      tables.forEach((table, idx) => {
        console.log(`${idx + 1}. ${table.name}`);
      });
    }
  } catch (error: any) {
    console.log('❌ Error listing tables:', error.message);
  }

  process.exit(0);
}

listTables();
