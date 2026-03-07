
import { initDb } from '../database/db';
import { solarService } from '../services/SolarService';

async function runSync() {
    await initDb();

    // Use date from command line argument if provided, otherwise today
    const args = process.argv.slice(2);
    const date = args[0] || new Date().toISOString().split('T')[0];

    console.log(`Starting manual sync for ${date}...`);
    try {
        const result = await solarService.fetchEnergyBalance(date);
        console.log(`✅ Sync successful! Energy: ${result} kWh`);
    } catch (error: any) {
        console.error('❌ Sync failed:', error.message);
        if (error.response) {
            console.error('API Response:', JSON.stringify(error.response.data));
        }
    }
}

runSync();
