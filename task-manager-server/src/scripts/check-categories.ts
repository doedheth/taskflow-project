
import { initDb, prepare } from '../database/db';

async function checkCategories() {
  try {
    await initDb();
    console.log('Database initialized.');

    const rows = prepare('SELECT * FROM asset_categories').all();
    console.log('Categories:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCategories();
