
import { initDb, prepare } from '../database/db';

async function checkProductionLogs() {
  try {
    await initDb();
    console.log('Checking production logs...');

    const assetId = 20; // Compression Moulding (S 1)

    // Check count of logs
    const count = prepare('SELECT count(*) as count FROM machine_parameter_sets WHERE asset_id = ?').get(assetId);
    console.log(`Found ${(count as any).count} logs for asset ${assetId}`);

    // Get last 5 logs
    const logs = prepare('SELECT * FROM machine_parameter_sets WHERE asset_id = ? ORDER BY created_at DESC LIMIT 5').all(assetId);
    console.log('Recent logs:', logs);

  } catch (error) {
    console.error('Error:', error);
  }
}

checkProductionLogs();
