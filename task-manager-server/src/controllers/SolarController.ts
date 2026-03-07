/**
 * Solar Controller
 * 
 * Handles HTTP requests for Solar monitoring and comparison
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { solarService, SolarService } from '../services/SolarService';
import { SolarEnergyData } from '../types/solar';

export class SolarController extends BaseController<SolarEnergyData> {
    protected service: SolarService;

    constructor(service: SolarService = solarService) {
        super(service);
        this.service = service;
    }

    /**
     * GET /api/v2/solar/realtime - Get real-time energy flow
     */
    getRealtime = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.fetchEnergyFlow();
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Get solar realtime flow');
        }
    };

    /**
     * GET /api/v2/solar/trend - Get trend data
     */
    getTrend = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, dimension } = req.query;
            const targetDate = (date as string) || new Date().toISOString().split('T')[0];
            const targetDim = Number(dimension) || 4;
            const result = await this.service.fetchEnergyTrend(targetDate, targetDim);
            this.success(res, result);
        } catch (error: any) {
            console.error('Get solar trend error:', error);
            res.status(500).json({
                success: false,
                error: 'Get solar trend failed',
                message: error.message || 'Unknown error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    };

    /**
     * GET /api/v2/solar/comparison - Get comparison data
     */
    getComparison = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;
            const result = await this.service.getComparisonData(
                startDate as string,
                endDate as string
            );
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Get solar comparison');
        }
    };

    /**
     * GET /api/v2/solar/export - Export comparison data to CSV
     */
    exportCsv = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;
            const csv = await this.service.exportComparisonCsv(
                startDate as string,
                endDate as string
            );

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=solar-report-${startDate}-to-${endDate}.csv`);
            res.status(200).send(csv);
        } catch (error) {
            this.handleError(res, error, 'Export solar CSV');
        }
    };

    /**
     * POST /api/v2/solar/manual - Save manual KWH data
     */
    saveManual = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, manual_kwh } = req.body;
            if (!date || manual_kwh === undefined) {
                this.error(res, 'Date and manual_kwh are required', 400);
                return;
            }
            const result = await this.service.saveManualData(date, Number(manual_kwh));
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Save solar manual data');
        }
    };

    /**
     * GET /api/v2/solar/sync - Manually trigger sync for a date range
     */
    sync = async (req: Request, res: Response): Promise<void> => {
        try {
            const { date, range } = req.query;
            const targetDate = (date as string) || new Date().toISOString().split('T')[0];

            if (range === 'month') {
                console.log(`Manual range sync triggered for month of ${targetDate}`);
                await this.service.fetchEnergyTrend(targetDate, 4); // This now auto-persists all days in that month
                this.success(res, { message: `Successfully synced monthly data for ${targetDate}` });
            } else {
                const result = await this.service.fetchEnergyBalance(targetDate);
                this.success(res, { date: targetDate, product_power: result });
            }
        } catch (error) {
            this.handleError(res, error, 'Sync solar data');
        }
    };

    /**
     * GET /api/v2/solar/config - Get solar configuration
     */
    getConfig = async (req: Request, res: Response): Promise<void> => {
        try {
            const config = await this.service.getConfig();

            // Return DB config if exists, otherwise fallback to ENV for safe fields
            const responseData = config ? {
                username: config.username,
                station_dn: config.station_dn,
                price_per_kwh: config.price_per_kwh,
                last_login: config.last_login
            } : {
                username: process.env.SOLAR_USERNAME,
                station_dn: process.env.SOLAR_STATION_DN,
                price_per_kwh: Number(process.env.SOLAR_PRICE_PER_KWH) || 1500,
                last_login: null
            };

            this.success(res, responseData);
        } catch (error) {
            this.handleError(res, error, 'Get solar config');
        }
    };

    /**
     * POST /api/v2/solar/config - Save solar configuration
     */
    saveConfig = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.saveConfig(req.body);
            this.success(res, { message: 'Configuration saved successfully' });
        } catch (error) {
            this.handleError(res, error, 'Save solar config');
        }
    };
}

export const solarController = new SolarController();
export default solarController;
