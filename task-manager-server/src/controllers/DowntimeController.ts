/**
 * Downtime Controller - HTTP request handling
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { DowntimeService, downtimeService } from '../services/DowntimeService';
import {
  DowntimeLog,
  CreateDowntimeDTO,
  UpdateDowntimeDTO,
  DowntimeFilter,
} from '../types/downtime';

export class DowntimeController extends BaseController<
  DowntimeLog,
  CreateDowntimeDTO,
  UpdateDowntimeDTO
> {
  protected service: DowntimeService;

  constructor(service: DowntimeService = downtimeService) {
    super(service);
    this.service = service;
  }

  /**
   * GET /downtime - Get all downtime logs with filters
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const filter: DowntimeFilter = {
        asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        downtime_type: req.query.downtime_type as any,
        classification_id: req.query.classification_id
          ? parseInt(req.query.classification_id as string)
          : undefined,
        category: req.query.category as any,
        status: req.query.status as any,
        work_order_id: req.query.work_order_id
          ? parseInt(req.query.work_order_id as string)
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      };

      const result = this.service.getAllWithDetails(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get downtime logs');
    }
  };

  /**
   * GET /downtime/:id - Get downtime log by ID
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getByIdWithDetails(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get downtime log');
    }
  };

  /**
   * GET /downtime/active - Get all active downtime logs
   */
  getAllActive = (req: Request, res: Response): void => {
    try {
      const result = this.service.getAllActive();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get all active downtime');
    }
  };

  /**
   * GET /downtime/asset/:assetId/active - Get active downtime for asset
   */
  getActiveByAsset = (req: Request, res: Response): void => {
    try {
      const assetId = parseInt(req.params.assetId);
      const result = this.service.getActiveByAsset(assetId);
      this.success(res, result || null);
    } catch (error) {
      this.handleError(res, error, 'Get active downtime');
    }
  };

  /**
   * GET /downtime/dashboard - Get dashboard data
   */
  getDashboard = (req: Request, res: Response): void => {
    try {
      const result = this.service.getDashboard();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get dashboard');
    }
  };

  /**
   * GET /downtime/statistics - Get statistics
   */
  getStatistics = (req: Request, res: Response): void => {
    try {
      const filter = {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
      };
      const result = this.service.getStatistics(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get statistics');
    }
  };

  /**
   * GET /downtime/classifications - Get all classifications
   */
  getClassifications = (req: Request, res: Response): void => {
    try {
      const category = req.query.category as string;
      const result = this.service.getClassifications(category);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get classifications');
    }
  };

  /**
   * GET /downtime/classifications/:id - Get classification by ID
   */
  getClassificationById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getClassificationById(id);
      if (!result) {
        this.error(res, 'Classification not found', 404);
        return;
      }
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get classification by ID');
    }
  };

  /**
   * POST /downtime/classifications - Create a new classification
   */
  createClassification = (req: Request, res: Response): void => {
    try {
      const { code, name, category, description } = req.body;
      
      if (!code || !name || !category) {
        this.error(res, 'Code, name, and category are required', 400);
        return;
      }

      const result = this.service.createClassification({ code, name, category, description });
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create classification');
    }
  };

  /**
   * PUT /downtime/classifications/:id - Update a classification
   */
  updateClassification = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { code, name, category, description } = req.body;
      
      const result = this.service.updateClassification(id, { code, name, category, description });
      if (!result) {
        this.error(res, 'Classification not found', 404);
        return;
      }
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update classification');
    }
  };

  /**
   * DELETE /downtime/classifications/:id - Delete a classification
   */
  deleteClassification = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      this.service.deleteClassification(id);
      this.success(res, { message: 'Classification deleted successfully' });
    } catch (error) {
      this.handleError(res, error, 'Delete classification');
    }
  };

  /**
   * GET /downtime/classifications/generate/:category - Generate next code for category
   */
  generateClassificationCode = (req: Request, res: Response): void => {
    try {
      const category = req.params.category;
      const code = this.service.generateClassificationCode(category);
      this.success(res, { code });
    } catch (error) {
      this.handleError(res, error, 'Generate classification code');
    }
  };

  /**
   * POST /downtime/start - Start downtime
   */
  start = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const data: CreateDowntimeDTO = {
        asset_id: req.body.asset_id,
        downtime_type: req.body.downtime_type,
        classification_id: req.body.classification_id,
        reason: req.body.reason,
        failure_code_id: req.body.failure_code_id,
        production_impact: req.body.production_impact,
        work_order_id: req.body.work_order_id,
      };

      const result = this.service.start(data, userId);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Start downtime');
    }
  };

  /**
   * POST /downtime/:id/end - End downtime
   */
  end = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const data = {
        reason: req.body.reason,
        production_impact: req.body.production_impact,
      };

      const result = this.service.end(id, data, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'End downtime');
    }
  };

  /**
   * PUT /downtime/:id - Update downtime log
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const data: UpdateDowntimeDTO = {
        reason: req.body.reason,
        production_impact: req.body.production_impact,
        classification_id: req.body.classification_id,
        failure_code_id: req.body.failure_code_id,
      };

      const result = this.service.update(id, data, userId);

      if (!result) {
        this.error(res, 'Downtime log not found', 404);
        return;
      }

      const updated = this.service.getByIdWithDetails(id);
      this.success(res, updated);
    } catch (error) {
      this.handleError(res, error, 'Update downtime');
    }
  };

  /**
   * POST /downtime - Create downtime log (direct create with start_time)
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const data: CreateDowntimeDTO = {
        asset_id: req.body.asset_id,
        downtime_type: req.body.downtime_type,
        classification_id: req.body.classification_id,
        reason: req.body.reason,
        failure_code_id: req.body.failure_code_id,
        production_impact: req.body.production_impact,
        work_order_id: req.body.work_order_id,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
      };

      const result = this.service.createDirect(data, userId);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create downtime');
    }
  };

  /**
   * GET /downtime/stats/summary - Get stats summary
   */
  getStatsSummary = (req: Request, res: Response): void => {
    try {
      const filter = {
        asset_id: req.query.asset_id ? parseInt(req.query.asset_id as string) : undefined,
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string,
        days: req.query.days ? parseInt(req.query.days as string) : 30,
      };
      const result = this.service.getStatsSummary(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get stats summary');
    }
  };

  /**
   * GET /downtime/check-schedule/:assetId - Check production schedule
   */
  checkSchedule = (req: Request, res: Response): void => {
    try {
      const assetId = parseInt(req.params.assetId);
      const datetime = req.query.datetime as string;
      const result = this.service.checkSchedule(assetId, datetime);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Check schedule');
    }
  };
}

// Export singleton instance
export const downtimeController = new DowntimeController();
export default downtimeController;
