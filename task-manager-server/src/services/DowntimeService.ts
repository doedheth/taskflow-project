/**
 * Downtime Service - Business logic layer
 */

import { BaseService, ValidationError, NotFoundError, ConflictError } from './BaseService';
import { DowntimeRepository, downtimeRepository } from '../models/DowntimeRepository';
import {
  DowntimeLog,
  DowntimeLogWithDetails,
  DowntimeClassification,
  CreateDowntimeDTO,
  UpdateDowntimeDTO,
  EndDowntimeDTO,
  DowntimeFilter,
  DowntimeStatistics,
} from '../types/downtime';
import db from '../database/db';

export class DowntimeService extends BaseService<
  DowntimeLog,
  CreateDowntimeDTO,
  UpdateDowntimeDTO
> {
  protected repository: DowntimeRepository;

  constructor(repository: DowntimeRepository = downtimeRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Get all downtime logs with filters
   */
  getAllWithDetails(filter: DowntimeFilter): DowntimeLogWithDetails[] {
    return this.repository.findAllWithDetails(filter);
  }

  /**
   * Get downtime log by ID with details
   */
  getByIdWithDetails(id: number): DowntimeLogWithDetails {
    const downtime = this.repository.findByIdWithDetails(id);
    if (!downtime) {
      throw new NotFoundError('Downtime log not found');
    }
    return downtime;
  }

  /**
   * Get all active downtime logs
   */
  getAllActive(): DowntimeLogWithDetails[] {
    return this.repository.findAllActive();
  }

  /**
   * Get active downtime for asset
   */
  getActiveByAsset(assetId: number): DowntimeLogWithDetails | null {
    const downtime = this.repository.findActiveByAsset(assetId);
    return downtime || null;
  }

  /**
   * Start downtime (create new log)
   */
  start(data: CreateDowntimeDTO, userId?: number): DowntimeLogWithDetails {
    this.validateStart(data);

    // Check if asset already has active downtime
    const existing = this.repository.findActiveByAsset(data.asset_id);
    if (existing) {
      throw new ConflictError(`Asset already has active downtime (ID: ${existing.id})`);
    }

    const downtime = this.repository.create(data, userId);

    // Log activity
    this.logActivity(downtime.id, 'start', userId);

    // Update asset status
    this.updateAssetStatus(data.asset_id, 'down');

    return this.getByIdWithDetails(downtime.id);
  }

  /**
   * End downtime
   */
  end(id: number, data?: EndDowntimeDTO, userId?: number): DowntimeLogWithDetails {
    const downtime = this.repository.findById(id);
    if (!downtime) {
      throw new NotFoundError('Downtime log not found');
    }

    if (downtime.end_time) {
      throw new ValidationError('Downtime already ended');
    }

    const result = this.repository.end(id, data);
    if (!result) {
      throw new NotFoundError('Failed to end downtime');
    }

    // Log activity
    this.logActivity(id, 'end', userId);

    // Update asset status
    this.updateAssetStatus(downtime.asset_id, 'operational');

    // If linked to work order, complete the work order
    if (downtime.work_order_id) {
      this.completeLinkedWorkOrder(downtime.work_order_id, userId);
    }

    return this.getByIdWithDetails(id);
  }

  /**
   * End downtime by work order ID
   */
  endByWorkOrderId(workOrderId: number, userId?: number): boolean {
    const downtime = this.repository.findByWorkOrderId(workOrderId);
    if (downtime && !downtime.end_time) {
      this.repository.endByWorkOrderId(workOrderId);

      // Update asset status
      this.updateAssetStatus(downtime.asset_id, 'operational');

      // Log activity
      this.logActivity(downtime.id, 'end_by_wo', userId);

      return true;
    }
    return false;
  }

  /**
   * Update downtime log
   */
  update(id: number, data: UpdateDowntimeDTO, userId?: number): DowntimeLog | null {
    this.validateUpdate(id, data);
    const result = this.repository.update(id, data, userId);

    if (result && userId) {
      this.logActivity(id, 'update', userId);
    }

    return result;
  }

  /**
   * Get all classifications
   */
  getClassifications(category?: string): DowntimeClassification[] {
    return this.repository.getClassifications(category);
  }

  /**
   * Get classification by ID
   */
  getClassificationById(id: number): DowntimeClassification | null {
    return this.repository.getClassificationById(id);
  }

  /**
   * Create a new classification
   */
  createClassification(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }): { id: number; classification: DowntimeClassification | null } {
    const id = this.repository.createClassification(data);
    const classification = this.repository.getClassificationById(id);
    return { id, classification };
  }

  /**
   * Update a classification
   */
  updateClassification(id: number, data: {
    code?: string;
    name?: string;
    category?: string;
    description?: string;
  }): DowntimeClassification | null {
    this.repository.updateClassification(id, data);
    return this.repository.getClassificationById(id);
  }

  /**
   * Delete a classification
   */
  deleteClassification(id: number): boolean {
    return this.repository.deleteClassification(id);
  }

  /**
   * Generate next classification code for a category
   */
  generateClassificationCode(category: string): string {
    return this.repository.generateClassificationCode(category);
  }

  /**
   * Get statistics
   */
  getStatistics(filter: {
    start_date?: string;
    end_date?: string;
    asset_id?: number;
  }): DowntimeStatistics {
    return this.repository.getStatistics(filter);
  }

  /**
   * Get real-time dashboard data
   */
  getDashboard(): {
    activeDowntimes: DowntimeLogWithDetails[];
    recentResolved: DowntimeLogWithDetails[];
    statistics: DowntimeStatistics;
  } {
    const activeDowntimes = this.repository.findAllWithDetails({ status: 'active', limit: 50 });
    const recentResolved = this.repository.findAllWithDetails({ status: 'resolved', limit: 10 });
    const statistics = this.repository.getStatistics({});

    return {
      activeDowntimes,
      recentResolved,
      statistics,
    };
  }

  /**
   * Validation for start
   */
  private validateStart(data: CreateDowntimeDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.asset_id) {
      errors.push({ field: 'asset_id', message: 'Asset is required' });
    }

    // Validate asset exists
    if (data.asset_id) {
      const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(data.asset_id);
      if (!asset) {
        errors.push({ field: 'asset_id', message: 'Asset not found' });
      }
    }

    // Validate work order exists if provided
    if (data.work_order_id) {
      const wo = db.prepare('SELECT id FROM work_orders WHERE id = ?').get(data.work_order_id);
      if (!wo) {
        errors.push({ field: 'work_order_id', message: 'Work order not found' });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Update asset status
   */
  private updateAssetStatus(assetId: number, status: string): void {
    try {
      db.run('UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?', [
        status,
        assetId,
      ]);
    } catch (error) {
      console.error('Update asset status error:', error);
    }
  }

  /**
   * Complete linked work order when downtime ends
   */
  private completeLinkedWorkOrder(workOrderId: number, userId?: number): void {
    try {
      // Get work order
      const wo = db.prepare('SELECT * FROM work_orders WHERE id = ?').get(workOrderId) as
        | {
            id: number;
            status: string;
            related_ticket_id?: number;
          }
        | undefined;

      if (!wo || wo.status !== 'in_progress') return;

      // Complete work order
      db.run(
        `
        UPDATE work_orders 
        SET status = 'completed', 
            actual_end = datetime('now'),
            updated_at = datetime('now')
        WHERE id = ?
      `,
        [workOrderId]
      );

      // Log activity
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, details, created_at)
        VALUES (?, 'work_order', ?, ?, ?, datetime('now'))
      `,
        ['auto_complete', workOrderId, userId || null, JSON.stringify({ reason: 'downtime_ended' })]
      );

      // Update related ticket if all WOs are complete
      if (wo.related_ticket_id) {
        const openWOs = db
          .prepare(
            `
          SELECT COUNT(*) as count FROM work_orders 
          WHERE related_ticket_id = ? AND status NOT IN ('completed', 'cancelled')
        `
          )
          .get(wo.related_ticket_id) as { count: number };

        if (openWOs.count === 0) {
          db.run('UPDATE tickets SET status = "done", updated_at = datetime("now") WHERE id = ?', [
            wo.related_ticket_id,
          ]);
        }
      }
    } catch (error) {
      console.error('Complete linked work order error:', error);
    }
  }

  /**
   * Log activity
   */
  private logActivity(downtimeId: number, action: string, userId?: number): void {
    try {
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, details, created_at)
        VALUES (?, 'downtime', ?, ?, ?, datetime('now'))
      `,
        [action, downtimeId, userId || null, JSON.stringify({ action })]
      );
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Create downtime directly (with start_time and optional end_time)
   */
  createDirect(data: CreateDowntimeDTO, userId?: number): DowntimeLogWithDetails {
    this.validateStart(data);

    // Check for existing active downtime
    const existingActive = this.repository.findActiveByAsset(data.asset_id);
    if (existingActive) {
      throw new ConflictError('Asset already has active downtime');
    }

    const result = this.repository.createDirect(data, userId);

    // Update asset status
    this.updateAssetStatus(data.asset_id, 'down');

    // Log activity
    this.logActivity(result.id, 'created', userId);

    // If end_time provided, also end the downtime
    if (data.end_time) {
      this.updateAssetStatus(data.asset_id, 'operational');
    }

    return this.getByIdWithDetails(result.id);
  }

  /**
   * Get stats summary (for frontend /stats/summary)
   */
  getStatsSummary(filter: {
    asset_id?: number;
    start_date?: string;
    end_date?: string;
    days?: number;
  }): any {
    // Calculate dates based on days if not provided
    let startDate = filter.start_date;
    let endDate = filter.end_date;

    if (!startDate && filter.days) {
      const start = new Date();
      start.setDate(start.getDate() - filter.days);
      startDate = start.toISOString();
    }

    const stats = this.repository.getStatistics({
      start_date: startDate,
      end_date: endDate,
      asset_id: filter.asset_id,
    });

    // Calculate additional metrics
    const totalMinutes = stats.totalDowntime || 0;
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Get top 5 assets by downtime
    const topAssets = stats.byAsset.slice(0, 5);

    // Get top 5 classifications by downtime
    const topClassifications = stats.byClassification.slice(0, 5);

    return {
      ...stats,
      totalHours,
      topAssets,
      topClassifications,
      period: {
        start: startDate,
        end: endDate,
        days: filter.days || 30,
      },
    };
  }

  /**
   * Check production schedule for asset
   */
  checkSchedule(assetId: number, datetime?: string): any {
    const checkTime = datetime || new Date().toISOString();
    const checkDate = checkTime.split('T')[0]; // Get date part only

    const asset = db.prepare('SELECT id, name, asset_code, status FROM assets WHERE id = ?')
      .get(assetId) as any | undefined;

    if (!asset) {
      throw new NotFoundError('Asset not found');
    }

    // Check if asset has a production schedule at this time
    const schedule = db.prepare(`
      SELECT ps.*, sp.name as shift_name, sp.start_time, sp.end_time
      FROM production_schedule ps
      LEFT JOIN shift_patterns sp ON ps.shift_pattern_id = sp.id
      WHERE ps.asset_id = ? 
        AND date(ps.date) = date(?)
      ORDER BY ps.shift_pattern_id ASC
      LIMIT 1
    `).get(assetId, checkDate) as any | undefined;

    // Determine status and message
    let status = 'unscheduled';
    let message = 'Tidak ada jadwal produksi untuk tanggal ini';
    let countsAsDowntime = false;

    if (schedule) {
      status = schedule.status; // 'scheduled', 'no_order', 'holiday', 'maintenance_window'
      
      switch (schedule.status) {
        case 'scheduled':
          message = `Jadwal produksi aktif untuk ${asset.name}. Shift: ${schedule.shift_name || 'N/A'}`;
          countsAsDowntime = true;
          break;
        case 'no_order':
          message = `Tidak ada order produksi untuk ${asset.name} pada tanggal ini`;
          countsAsDowntime = false;
          break;
        case 'holiday':
          message = `Hari libur - ${schedule.notes || 'Produksi diliburkan'}`;
          countsAsDowntime = false;
          break;
        case 'maintenance_window':
          message = `Waktu maintenance terjadwal untuk ${asset.name}`;
          countsAsDowntime = false;
          break;
        default:
          message = `Status: ${schedule.status}`;
          countsAsDowntime = false;
      }
    }

    return {
      hasSchedule: !!schedule,
      status,
      message,
      countsAsDowntime,
      asset,
      schedule: schedule || null,
      checkTime,
      checkDate,
    };
  }
}

// Export singleton instance
export const downtimeService = new DowntimeService();
export default downtimeService;
