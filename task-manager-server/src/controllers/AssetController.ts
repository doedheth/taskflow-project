/**
 * Asset Controller - HTTP request handling
 */

import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AssetService, assetService } from '../services/AssetService';
import { Asset, CreateAssetDTO, UpdateAssetDTO, AssetFilter } from '../types/asset';

export class AssetController extends BaseController<Asset, CreateAssetDTO, UpdateAssetDTO> {
  protected service: AssetService;

  constructor(service: AssetService = assetService) {
    super(service);
    this.service = service;
  }

  /**
   * GET /assets - Get all assets
   */
  getAll = (req: Request, res: Response): void => {
    try {
      const filter: AssetFilter = {
        status: req.query.status as any,
        category_id: req.query.category_id ? parseInt(req.query.category_id as string) : undefined,
        department_id: req.query.department_id
          ? parseInt(req.query.department_id as string)
          : undefined,
        criticality: req.query.criticality as any,
        search: req.query.search as string,
      };

      const result = this.service.getAllWithDetails(filter);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get assets');
    }
  };

  /**
   * GET /assets/:id - Get asset by ID
   */
  getById = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getByIdWithDetails(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get asset');
    }
  };

  /**
   * POST /assets - Create asset
   */
  create = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const userId = this.getUserId(req);
      const result = this.service.create(req.body, userId);
      const asset = this.service.getByIdWithDetails(result.id);
      this.created(res, asset);
    } catch (error) {
      this.handleError(res, error, 'Create asset');
    }
  };

  /**
   * PUT /assets/:id - Update asset
   */
  update = (req: Request, res: Response): void => {
    try {
      if (!this.validate(req, res)) return;

      const id = parseInt(req.params.id);
      const userId = this.getUserId(req);
      const result = this.service.update(id, req.body, userId);

      if (!result) {
        this.error(res, 'Asset not found', 404);
        return;
      }

      const asset = this.service.getByIdWithDetails(id);
      this.success(res, asset);
    } catch (error) {
      this.handleError(res, error, 'Update asset');
    }
  };

  /**
   * PATCH /assets/:id/status - Update asset status
   */
  updateStatus = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const userId = this.getUserId(req);

      const result = this.service.updateStatus(id, status, userId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update asset status');
    }
  };

  /**
   * GET /assets/categories - Get all categories
   */
  getCategories = (req: Request, res: Response): void => {
    try {
      const result = this.service.getCategories();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get categories');
    }
  };

  /**
   * POST /assets/categories - Create category
   */
  createCategory = (req: Request, res: Response): void => {
    try {
      const { name, description } = req.body;
      if (!name) {
        this.error(res, 'Category name is required', 400);
        return;
      }
      const result = this.service.createCategory(name, description);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create category');
    }
  };

  /**
   * GET /assets/failure-codes - Get failure codes
   */
  getFailureCodes = (req: Request, res: Response): void => {
    try {
      const category = req.query.category as string;
      const result = this.service.getFailureCodes(category);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get failure codes');
    }
  };

  /**
   * GET /assets/failure-codes/by-asset/:assetId - Get failure codes by asset
   * Returns failure codes filtered by asset's category, plus global codes
   */
  getFailureCodesByAsset = (req: Request, res: Response): void => {
    try {
      const assetId = parseInt(req.params.assetId);
      const result = this.service.getFailureCodesByAsset(assetId);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get failure codes by asset');
    }
  };

  /**
   * POST /assets/failure-codes - Create failure code (code is auto-generated if not provided)
   */
  createFailureCode = (req: Request, res: Response): void => {
    try {
      const { code, category, description } = req.body;
      if (!category) {
        this.error(res, 'Category is required', 400);
        return;
      }
      if (!description) {
        this.error(res, 'Description is required', 400);
        return;
      }
      const result = this.service.createFailureCode(code, category, description);
      this.created(res, result);
    } catch (error) {
      this.handleError(res, error, 'Create failure code');
    }
  };

  /**
   * GET /assets/failure-codes/generate/:category - Generate next code for category
   */
  generateFailureCode = (req: Request, res: Response): void => {
    try {
      const category = req.params.category;
      const nextCode = this.service.generateFailureCode(category);
      this.success(res, { code: nextCode });
    } catch (error) {
      this.handleError(res, error, 'Generate failure code');
    }
  };

  /**
   * PUT /assets/failure-codes/:id - Update failure code
   */
  updateFailureCode = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const { code, category, description } = req.body;
      const result = this.service.updateFailureCode(id, { code, category, description });
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Update failure code');
    }
  };

  /**
   * DELETE /assets/failure-codes/:id - Delete failure code
   */
  deleteFailureCode = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      this.service.deleteFailureCode(id);
      this.success(res, { message: 'Failure code deleted successfully' });
    } catch (error) {
      this.handleError(res, error, 'Delete failure code');
    }
  };

  /**
   * GET /assets/statistics - Get statistics
   */
  getStatistics = (req: Request, res: Response): void => {
    try {
      const result = this.service.getStatistics();
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get statistics');
    }
  };

  /**
   * GET /assets/:id/work-orders - Get asset work orders
   */
  getWorkOrders = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getWorkOrders(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get asset work orders');
    }
  };

  /**
   * GET /assets/:id/downtime - Get asset downtime history
   */
  getDowntimeHistory = (req: Request, res: Response): void => {
    try {
      const id = parseInt(req.params.id);
      const result = this.service.getDowntimeHistory(id);
      this.success(res, result);
    } catch (error) {
      this.handleError(res, error, 'Get asset downtime');
    }
  };
}

// Export singleton
export const assetController = new AssetController();
export default assetController;
