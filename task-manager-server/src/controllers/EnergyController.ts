import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { energyService, EnergyService } from '../services/EnergyService';
import { PLNMetric, CreatePLNMetricDTO } from '../types/energy';

export class EnergyController extends BaseController<PLNMetric, CreatePLNMetricDTO> {
    protected service: EnergyService;

    constructor(service: EnergyService = energyService) {
        super(service);
        this.service = service;
    }

    /**
     * GET /api/v2/energy/latest
     */
    getLatest = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.service.getLatestStatus();
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Get latest energy status');
        }
    };

    /**
     * GET /api/v2/energy/revenue
     */
    getRevenue = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                this.error(res, 'startDate and endDate are required', 400);
                return;
            }
            const result = await this.service.calculateRevenue(startDate as string, endDate as string);
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Calculate energy revenue');
        }
    };

    /**
     * GET /api/v2/energy/history
     */
    getHistory = async (req: Request, res: Response): Promise<void> => {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                this.error(res, 'startDate and endDate are required', 400);
                return;
            }
            const result = await this.service.getLoadHistory(startDate as string, endDate as string);
            this.success(res, result);
        } catch (error) {
            this.handleError(res, error, 'Get energy history');
        }
    };
}

export const energyController = new EnergyController();
export default energyController;
