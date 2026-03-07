/**
 * Asset Service - Business logic layer
 */

import { BaseService, ValidationError, NotFoundError, ConflictError } from './BaseService';
import { AssetRepository, assetRepository } from '../models/AssetRepository';
import {
  Asset,
  AssetWithDetails,
  AssetCategory,
  FailureCode,
  CreateAssetDTO,
  UpdateAssetDTO,
  AssetFilter,
  AssetStatistics,
} from '../types/asset';
import db from '../database/db';

export class AssetService extends BaseService<Asset, CreateAssetDTO, UpdateAssetDTO> {
  protected repository: AssetRepository;

  constructor(repository: AssetRepository = assetRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Get all assets with filters
   */
  getAllWithDetails(filter: AssetFilter): AssetWithDetails[] {
    return this.repository.findAllWithDetails(filter);
  }

  /**
   * Get asset by ID with details
   */
  getByIdWithDetails(id: number): AssetWithDetails {
    const asset = this.repository.findByIdWithDetails(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    return asset;
  }

  /**
   * Create asset
   */
  create(data: CreateAssetDTO, userId?: number): Asset {
    this.validateCreate(data);

    // Check for duplicate asset code
    const existing = this.repository.findByAssetCode(data.asset_code);
    if (existing) {
      throw new ConflictError('Asset code already exists');
    }

    const asset = this.repository.create(data, userId);
    this.logActivity(asset.id, 'create', userId);

    return asset;
  }

  /**
   * Update asset
   */
  update(id: number, data: UpdateAssetDTO, userId?: number): Asset | null {
    this.validateUpdate(id, data);

    // Check for duplicate asset code if updating
    if (data.asset_code) {
      const existing = this.repository.findByAssetCode(data.asset_code);
      if (existing && existing.id !== id) {
        throw new ConflictError('Asset code already exists');
      }
    }

    const result = this.repository.update(id, data, userId);

    if (result && userId) {
      this.logActivity(id, 'update', userId);
    }

    return result;
  }

  /**
   * Update asset status
   */
  updateStatus(id: number, status: string, userId?: number): AssetWithDetails {
    const asset = this.repository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    const validStatuses = ['operational', 'down', 'maintenance', 'retired'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status', [
        { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` },
      ]);
    }

    this.repository.updateStatus(id, status);

    if (userId) {
      this.logActivity(id, 'status_change', userId, {
        old_status: asset.status,
        new_status: status,
      });
    }

    return this.getByIdWithDetails(id);
  }

  /**
   * Get categories
   */
  getCategories(): AssetCategory[] {
    return this.repository.getCategories();
  }

  /**
   * Create category
   */
  createCategory(name: string, description?: string): AssetCategory {
    if (!name || name.trim() === '') {
      throw new ValidationError('Category name is required', [
        { field: 'name', message: 'Category name is required' },
      ]);
    }
    return this.repository.createCategory(name.trim(), description?.trim());
  }

  /**
   * Get failure codes
   */
  getFailureCodes(category?: string): FailureCode[] {
    return this.repository.getFailureCodes(category);
  }

  /**
   * Get failure codes by asset (filtered by asset's category + global codes)
   */
  getFailureCodesByAsset(assetId: number): FailureCode[] {
    return this.repository.getFailureCodesByAsset(assetId);
  }

  /**
   * Create failure code (code is auto-generated if not provided)
   */
  createFailureCode(code: string | undefined, category: string | undefined, description: string): FailureCode {
    if (!description || description.trim() === '') {
      throw new ValidationError('Description is required', [
        { field: 'description', message: 'Description is required' },
      ]);
    }
    if (!category || category.trim() === '') {
      throw new ValidationError('Category is required', [
        { field: 'category', message: 'Category is required for auto-generating code' },
      ]);
    }
    return this.repository.createFailureCode(code?.trim(), category.trim(), description.trim());
  }

  /**
   * Generate next failure code for preview
   */
  generateFailureCode(category: string): string {
    return this.repository.generateFailureCode(category);
  }

  /**
   * Update failure code
   */
  updateFailureCode(id: number, data: { code?: string; category?: string; description?: string }): FailureCode {
    const result = this.repository.updateFailureCode(id, data);
    if (!result) {
      throw new NotFoundError('Failure code not found');
    }
    return result;
  }

  /**
   * Delete failure code
   */
  deleteFailureCode(id: number): void {
    const success = this.repository.deleteFailureCode(id);
    if (!success) {
      throw new NotFoundError('Failure code not found');
    }
  }

  /**
   * Get statistics
   */
  getStatistics(): AssetStatistics {
    return this.repository.getStatistics();
  }

  /**
   * Get asset work orders
   */
  getWorkOrders(assetId: number): any[] {
    const asset = this.repository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return db
      .prepare(
        `
      SELECT wo.*, 
             GROUP_CONCAT(u.name, ', ') as assignee_names
      FROM work_orders wo
      LEFT JOIN work_order_assignees woa ON wo.id = woa.work_order_id
      LEFT JOIN users u ON woa.user_id = u.id
      WHERE wo.asset_id = ?
      GROUP BY wo.id
      ORDER BY wo.created_at DESC
    `
      )
      .all(assetId);
  }

  /**
   * Get asset downtime history
   */
  getDowntimeHistory(assetId: number): any[] {
    const asset = this.repository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    return db
      .prepare(
        `
      SELECT dl.*, 
             dc.name as classification_name
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.asset_id = ?
      ORDER BY dl.start_time DESC
      LIMIT 50
    `
      )
      .all(assetId);
  }

  /**
   * Validation for create
   */
  protected validateCreate(data: CreateAssetDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.asset_code || data.asset_code.trim() === '') {
      errors.push({ field: 'asset_code', message: 'Asset code is required' });
    }
    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Log activity
   */
  private logActivity(assetId: number, action: string, userId?: number, details?: any): void {
    try {
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, details, created_at)
        VALUES (?, 'asset', ?, ?, ?, datetime('now'))
      `,
        [action, assetId, userId || null, details ? JSON.stringify(details) : null]
      );
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }
}

// Export singleton
export const assetService = new AssetService();
export default assetService;
