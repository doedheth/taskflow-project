
import { initDb, prepare } from '../database/db';

async function listAssets() {
  try {
    await initDb();
    const stmt = prepare('SELECT id, name, asset_code FROM assets');
    const assets = stmt.all();
    
    console.log('All assets:', assets);
  } catch (error) {
    console.error('Error:', error);
  }
}

listAssets();
