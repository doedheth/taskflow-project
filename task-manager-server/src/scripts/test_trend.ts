
import { initDb } from '../database/db';
import { solarService } from '../services/SolarService';

async function testTrend() {
    await initDb();
    const date = '2026-01-26';
    console.log(`Fetching trend for ${date}...`);
    try {
        const result = await solarService.fetchEnergyTrend(date, 4);
        console.log('Trend Keys:', Object.keys(result));
        if (result.xAxis) {
            console.log('X-Axis Sample:', result.xAxis.slice(0, 5));
        }
        if (result.productPower) {
            console.log('Product Power Sample:', result.productPower.split(',').slice(0, 5));
        }
        console.log('Total Product Power:', result.totalProductPower);
    } catch (error: any) {
        console.error('Trend test failed:', error.message);
    }
}

testTrend();
