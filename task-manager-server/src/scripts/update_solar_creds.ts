
import { initDb, exec } from '../database/db';

async function updateConfig() {
    await initDb();

    const username = 'sapsedati97';
    const password = 'suryasukses97';

    try {
        exec(
            `UPDATE solar_config SET username = '${username}', password = '${password}' WHERE id = (SELECT MAX(id) FROM solar_config)`
        );
        console.log('✅ Solar configuration updated with new credentials.');
    } catch (error: any) {
        console.error('❌ Failed to update configuration:', error.message);
    }
}

updateConfig();
