/**
 * Energy Service
 *
 * Business logic for energy metrics, load profiles, and revenue calculations.
 * Integrates data from PLN (pln_metrics) and Solar (solar_energy_data).
 */

import { plnMetricRepository } from '../models/PLNMetricRepository';
import { solarRepository } from '../models/SolarRepository';
import { EnergyRevenue, EnergyLoadHistory, PLNMetric, CreatePLNMetricDTO } from '../types/energy';
import { format } from 'date-fns';
import { BaseService } from './BaseService';

export class EnergyService extends BaseService<PLNMetric, CreatePLNMetricDTO> {
    constructor() {
        super(plnMetricRepository);
    }
    /**
     * Get the latest real-time energy status
     */
    async getLatestStatus() {
        const latestPln = plnMetricRepository.findLatest();

        // For real-time kW, we usually calculate delta between two most recent points
        // but if the hardware pushes instantaneous kW, we use that.
        // For this implementation, we'll simulate current load if points are sparse
        // or use the 'total' field if it represents instantaneous power.
        // Per Story 9.5 AC1, we need PLN Load and Solar Supply.

        // Mocking real-time behavior for now as pln_metrics stores cumulative kWh
        // In a real scenario, this would come from a different table or calculated delta
        return {
            pln_kw: latestPln ? (latestPln.power_factor * 100) : 0, // Simplified mock
            solar_kw: 45.2, // Mock solar real-time
            total_kw: latestPln ? (latestPln.power_factor * 100 + 45.2) : 45.2,
            power_factor: latestPln?.power_factor ?? 0.95
        };
    }

    /**
     * Calculate Net Revenue / Savings (Story 9.4)
     */
    async calculateRevenue(startDate: string, endDate: string): Promise<EnergyRevenue> {
        const solarConfig = solarRepository.getConfig();
        const pricePerKwh = solarConfig?.price_per_kwh ?? 1500;

        const solarData = solarRepository.getComparison(startDate, endDate);
        const plnMetrics = plnMetricRepository.getPeriodStats(startDate, endDate);

        const totalSolarYield = solarData.reduce((acc, d) => acc + (d.product_power || 0), 0);
        const savingsMonth = totalSolarYield * pricePerKwh;

        // Today's savings
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todaySolar = solarRepository.findByDate(todayStr);
        const savingsToday = (todaySolar?.product_power || 0) * pricePerKwh;

        const plnCostMtd = (plnMetrics?.total_delta || 0) * pricePerKwh;
        const totalEnergyCost = plnCostMtd + savingsMonth;
        const solarContributionPercent = totalEnergyCost > 0 ? (savingsMonth / totalEnergyCost) * 100 : 0;

        return {
            savings_today: savingsToday,
            savings_month: savingsMonth,
            solar_contribution_percent: solarContributionPercent,
            pln_cost_mtd: plnCostMtd
        };
    }

    /**
     * Get Energy Load History (Story 9.5 AC1)
     */
    async getLoadHistory(startDate: string, endDate: string): Promise<EnergyLoadHistory[]> {
        const metrics = plnMetricRepository.findInPeriod(startDate, endDate);

        // Map to load profile
        // Since pln_metrics stores cumulative, we'd normally calculate deltas per interval
        // Here we'll return the raw points or simulated load points for the visualization
        return metrics.map((m, i) => {
            const prev = metrics[i-1];
            const pln_kw = prev ? (m.total - prev.total) * 60 : 50; // Simple kWh to kW conversion if 1min interval

            return {
                timestamp: m.recorded_at,
                pln_kw: Math.max(0, pln_kw),
                solar_kw: 20 + Math.random() * 30, // Mock solar history
                total_kw: Math.max(0, pln_kw) + 20
            };
        });
    }
}

export const energyService = new EnergyService();
export default energyService;
