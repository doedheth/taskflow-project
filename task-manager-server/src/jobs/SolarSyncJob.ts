/**
 * Solar Sync Job
 * 
 * Background job that runs every hour to sync data from Huawei FusionSolar
 */

import cron from 'node-cron';
import { solarService, SolarService } from '../services/SolarService';

export class SolarSyncJob {
    private service: SolarService;
    private isRunning: boolean = false;

    constructor(service: SolarService = solarService) {
        this.service = service;
    }

    /**
     * Start the cron job scheduler
     */
    start(): void {
        // Run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            await this.syncCurrentDay();
        });

        console.log('[SolarSyncJob] Scheduled for every hour');
    }

    /**
     * Sync data for the current day
     */
    async syncCurrentDay(): Promise<{ success: boolean; date: string; value: number; error?: string }> {
        if (this.isRunning) {
            console.log('[SolarSyncJob] Sync already in progress, skipping...');
            return { success: false, date: '', value: 0 };
        }

        this.isRunning = true;
        const date = new Date().toISOString().split('T')[0];
        console.log(`[SolarSyncJob] Starting sync for ${date}...`);

        try {
            const value = await this.service.fetchEnergyBalance(date);
            console.log(`[SolarSyncJob] Sync completed for ${date}: ${value} kWh`);
            return { success: true, date, value };
        } catch (error: any) {
            console.error(`[SolarSyncJob] Sync failed for ${date}:`, error.message);
            return { success: false, date, value: 0, error: error.message };
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Sync data for a specific date range (backfill)
     */
    async syncRange(startDate: string, endDate: string): Promise<{ success: boolean; processed: number }> {
        console.log(`[SolarSyncJob] Starting range sync from ${startDate} to ${endDate}...`);

        let processed = 0;
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            try {
                await this.service.fetchEnergyBalance(dateStr);
                processed++;
                // Avoid aggressive polling
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error: any) {
                console.error(`[SolarSyncJob] Range sync failed for ${dateStr}:`, error.message);
            }
        }

        return { success: true, processed };
    }
}

export const solarSyncJob = new SolarSyncJob();
export default solarSyncJob;
