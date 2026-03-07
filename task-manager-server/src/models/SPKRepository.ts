/**
 * SPK Repository
 *
 * Data access layer for SPK Headers and Line Items (SPK Production Order System)
 */

import { BaseRepository } from './BaseRepository';
import {
  SPKHeader,
  SPKHeaderWithDetails,
  SPKLineItem,
  SPKLineItemWithProduct,
  SPKWithItems,
  SPKFilter,
  CreateSPKHeaderDTO,
  UpdateSPKHeaderDTO,
  CreateSPKLineItemDTO,
  SPKDashboardSummary,
  SPKDashboardItem,
  SPKStatus,
} from '../types/spk';
import { PaginationParams, PaginatedResponse } from '../types/common';

export class SPKRepository extends BaseRepository<SPKHeader, CreateSPKHeaderDTO, UpdateSPKHeaderDTO> {
  constructor() {
    super('spk_headers');
  }

  /**
   * Generate unique SPK number
   * Format: SPK-YYYYMMDD-ASSETCODE-SEQ
   */
  generateSPKNumber(assetCode: string, productionDate: string): string {
    const dateStr = productionDate.replace(/-/g, '');

    // Count existing SPKs for this asset and date
    const result = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM spk_headers h
       JOIN assets a ON h.asset_id = a.id
       WHERE a.asset_code = ? AND h.production_date = ?`,
      [assetCode, productionDate]
    );

    const seq = String((result?.count || 0) + 1).padStart(3, '0');
    return `SPK-${dateStr}-${assetCode}-${seq}`;
  }

  /**
   * Create SPK with line items (transactional)
   */
  create(data: CreateSPKHeaderDTO, userId?: number): SPKHeader {
    // Get asset code for SPK number generation
    const asset = this.queryOne<{ asset_code: string }>(
      `SELECT asset_code FROM assets WHERE id = ?`,
      [data.asset_id]
    );

    if (!asset) {
      throw new Error(`Asset with ID ${data.asset_id} not found`);
    }

    const spkNumber = this.generateSPKNumber(asset.asset_code, data.production_date);

    // Insert header
    const headerResult = this.execute(
      `INSERT INTO spk_headers (spk_number, asset_id, production_date, production_schedule_id, status, created_by, notes)
       VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
      [
        spkNumber,
        data.asset_id,
        data.production_date,
        data.production_schedule_id || null,
        userId || 0,
        data.notes || null,
      ]
    );

    const headerId = Number(headerResult.lastInsertRowid);

    // Insert line items
    if (data.line_items && data.line_items.length > 0) {
      this.insertLineItems(headerId, data.line_items);
    }

    return this.findById(headerId)!;
  }

  /**
   * Update SPK header and replace line items
   */
  update(id: number, data: UpdateSPKHeaderDTO): SPKHeader | null {
    const existing = this.findById(id);
    if (!existing) return null;

    // Check if SPK is in draft status
    if (existing.status !== 'draft') {
      throw new Error('Cannot update SPK that is not in draft status');
    }

    const fields: (keyof UpdateSPKHeaderDTO)[] = [
      'asset_id',
      'production_date',
      'production_schedule_id',
      'notes',
    ];

    const updates: string[] = [];
    const params: any[] = [];

    fields.forEach((field) => {
      if (field !== 'line_items' && data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    });

    if (updates.length > 0) {
      params.push(id);
      this.execute(
        `UPDATE spk_headers SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    // Replace line items if provided
    if (data.line_items) {
      this.deleteLineItems(id);
      this.insertLineItems(id, data.line_items);
    }

    return this.findById(id);
  }

  /**
   * Insert line items for a SPK header
   */
  private insertLineItems(headerId: number, items: CreateSPKLineItemDTO[]): void {
    items.forEach((item, index) => {
      const sequence = item.sequence ?? index + 1;
      this.execute(
        `INSERT INTO spk_line_items (spk_header_id, sequence, product_id, quantity, packaging_type, packaging_confirmed, remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          headerId,
          sequence,
          item.product_id,
          item.quantity,
          item.packaging_type || null,
          item.packaging_confirmed || 0,
          item.remarks || null,
        ]
      );
    });
  }

  /**
   * Delete all line items for a SPK header
   */
  private deleteLineItems(headerId: number): void {
    this.execute(`DELETE FROM spk_line_items WHERE spk_header_id = ?`, [headerId]);
  }

  /**
   * Find SPK header with details (joined data)
   */
  findWithDetails(id: number): SPKHeaderWithDetails | undefined {
    return this.queryOne<SPKHeaderWithDetails>(
      `SELECT h.*,
              a.asset_code,
              a.name as asset_name,
              u1.name as created_by_name,
              u2.name as approved_by_name,
              (SELECT COUNT(*) FROM spk_line_items WHERE spk_header_id = h.id) as line_items_count
       FROM spk_headers h
       LEFT JOIN assets a ON h.asset_id = a.id
       LEFT JOIN users u1 ON h.created_by = u1.id
       LEFT JOIN users u2 ON h.approved_by = u2.id
       WHERE h.id = ?`,
      [id]
    );
  }

  /**
   * Find SPK with all line items and product details
   */
  findWithItems(id: number): SPKWithItems | undefined {
    const header = this.findWithDetails(id);
    if (!header) return undefined;

    const lineItems = this.query<SPKLineItemWithProduct>(
      `SELECT li.*,
              p.code as product_code,
              p.name as product_name,
              p.material as product_material,
              p.weight_gram as product_weight_gram
       FROM spk_line_items li
       LEFT JOIN products p ON li.product_id = p.id
       WHERE li.spk_header_id = ?
       ORDER BY li.sequence ASC`,
      [id]
    );

    return {
      ...header,
      line_items: lineItems,
    };
  }

  /**
   * Find all SPK headers with filters
   */
  findAllWithFilter(
    filter?: SPKFilter,
    pagination?: PaginationParams
  ): SPKHeaderWithDetails[] | PaginatedResponse<SPKHeaderWithDetails> {
    let sql = `
      SELECT h.*,
             a.asset_code,
             a.name as asset_name,
             u1.name as created_by_name,
             u2.name as approved_by_name,
             (SELECT COUNT(*) FROM spk_line_items WHERE spk_header_id = h.id) as line_items_count
      FROM spk_headers h
      LEFT JOIN assets a ON h.asset_id = a.id
      LEFT JOIN users u1 ON h.created_by = u1.id
      LEFT JOIN users u2 ON h.approved_by = u2.id
      WHERE 1=1
    `;

    let countSql = `SELECT COUNT(*) as count FROM spk_headers h WHERE 1=1`;
    const params: any[] = [];

    if (filter?.asset_id) {
      sql += ` AND h.asset_id = ?`;
      countSql += ` AND h.asset_id = ?`;
      params.push(filter.asset_id);
    }

    if (filter?.status) {
      sql += ` AND h.status = ?`;
      countSql += ` AND h.status = ?`;
      params.push(filter.status);
    }

    if (filter?.created_by) {
      sql += ` AND h.created_by = ?`;
      countSql += ` AND h.created_by = ?`;
      params.push(filter.created_by);
    }

    if (filter?.production_date) {
      sql += ` AND h.production_date = ?`;
      countSql += ` AND h.production_date = ?`;
      params.push(filter.production_date);
    }

    if (filter?.date_from) {
      sql += ` AND h.production_date >= ?`;
      countSql += ` AND h.production_date >= ?`;
      params.push(filter.date_from);
    }

    if (filter?.date_to) {
      sql += ` AND h.production_date <= ?`;
      countSql += ` AND h.production_date <= ?`;
      params.push(filter.date_to);
    }

    sql += ` ORDER BY h.production_date DESC, h.created_at DESC`;

    if (pagination) {
      const countResult = this.queryOne<{ count: number }>(countSql, params);
      const total = countResult?.count || 0;

      sql += ` LIMIT ? OFFSET ?`;
      const data = this.query<SPKHeaderWithDetails>(sql, [...params, pagination.limit, pagination.offset]);

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    }

    return this.query<SPKHeaderWithDetails>(sql, params);
  }

  /**
   * Get dashboard summary for a specific date
   */
  getDashboardSummary(date?: string): SPKDashboardSummary {
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get totals
    const totals = this.queryOne<{
      total: number;
      pending: number;
      approved: number;
      rejected: number;
      draft: number;
      cancelled: number;
    }>(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
         SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected,
         SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
       FROM spk_headers
       WHERE production_date = ?`,
      [targetDate]
    );

    // Get by asset
    const byAsset = this.query<SPKDashboardItem>(
      `SELECT
         a.id as asset_id,
         a.asset_code,
         a.name as asset_name,
         COUNT(h.id) as total_spk,
         SUM(CASE WHEN h.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
         SUM(CASE WHEN h.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
         SUM(CASE WHEN h.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
         SUM(CASE WHEN h.status = 'draft' THEN 1 ELSE 0 END) as draft_count
       FROM assets a
       LEFT JOIN spk_headers h ON a.id = h.asset_id AND h.production_date = ?
       WHERE a.status != 'retired'
       GROUP BY a.id, a.asset_code, a.name
       HAVING total_spk > 0
       ORDER BY a.asset_code`,
      [targetDate]
    );

    return {
      total: totals?.total || 0,
      pending: totals?.pending || 0,
      approved: totals?.approved || 0,
      rejected: totals?.rejected || 0,
      draft: totals?.draft || 0,
      cancelled: totals?.cancelled || 0,
      by_asset: byAsset,
    };
  }

  /**
   * Update SPK status
   */
  updateStatus(
    id: number,
    status: SPKStatus,
    userId?: number,
    additionalData?: { rejection_reason?: string }
  ): SPKHeader | null {
    const now = `datetime('now')`;
    let sql = `UPDATE spk_headers SET status = ?`;
    const params: any[] = [status];

    if (status === 'pending') {
      sql += `, submitted_at = ${now}`;
    } else if (status === 'approved') {
      sql += `, approved_at = ${now}, approved_by = ?`;
      params.push(userId);
    } else if (status === 'rejected') {
      sql += `, rejection_reason = ?`;
      params.push(additionalData?.rejection_reason || null);
    }

    sql += ` WHERE id = ?`;
    params.push(id);

    this.execute(sql, params);
    return this.findById(id) || null;
  }

  /**
   * Duplicate SPK to new date
   */
  duplicate(sourceId: number, newProductionDate: string, newAssetId?: number, userId?: number): SPKHeader {
    const source = this.findWithItems(sourceId);
    if (!source) {
      throw new Error(`Source SPK with ID ${sourceId} not found`);
    }

    const targetAssetId = newAssetId || source.asset_id;

    // Create new SPK with line items
    const createData: CreateSPKHeaderDTO = {
      asset_id: targetAssetId,
      production_date: newProductionDate,
      notes: source.notes || undefined,
      line_items: source.line_items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        packaging_type: item.packaging_type || undefined,
        packaging_confirmed: 0, // Reset confirmation
        remarks: item.remarks || undefined,
      })),
    };

    return this.create(createData, userId);
  }

  /**
   * Find or create production schedule link
   * Used when approving SPK to ensure there's a production_schedule entry
   */
  linkToProductionSchedule(spkId: number): number | null {
    const spk = this.findById(spkId);
    if (!spk) return null;

    // Check if already linked
    if (spk.production_schedule_id) {
      return spk.production_schedule_id;
    }

    // Check if production_schedule exists for this asset+date
    const existing = this.queryOne<{ id: number }>(
      `SELECT id FROM production_schedule WHERE asset_id = ? AND date = ?`,
      [spk.asset_id, spk.production_date]
    );

    if (existing) {
      // Link to existing schedule
      this.execute(
        `UPDATE spk_headers SET production_schedule_id = ? WHERE id = ?`,
        [existing.id, spkId]
      );
      return existing.id;
    }

    // Create new production_schedule with 'scheduled' status
    const result = this.execute(
      `INSERT INTO production_schedule (asset_id, date, shift, status, notes, created_by)
       VALUES (?, ?, 1, 'scheduled', 'Auto-created from SPK', ?)`,
      [spk.asset_id, spk.production_date, spk.created_by]
    );

    const scheduleId = Number(result.lastInsertRowid);

    // Link SPK to new schedule
    this.execute(
      `UPDATE spk_headers SET production_schedule_id = ? WHERE id = ?`,
      [scheduleId, spkId]
    );

    return scheduleId;
  }

  /**
   * Find SPKs by production schedule ID
   */
  findByProductionScheduleId(productionScheduleId: number): SPKHeaderWithDetails[] {
    return this.query<SPKHeaderWithDetails>(
      `SELECT h.*,
              a.asset_code,
              a.name as asset_name,
              u1.name as created_by_name,
              u2.name as approved_by_name,
              (SELECT COUNT(*) FROM spk_line_items WHERE spk_header_id = h.id) as line_items_count
       FROM spk_headers h
       LEFT JOIN assets a ON h.asset_id = a.id
       LEFT JOIN users u1 ON h.created_by = u1.id
       LEFT JOIN users u2 ON h.approved_by = u2.id
       WHERE h.production_schedule_id = ?
       ORDER BY h.created_at DESC`,
      [productionScheduleId]
    );
  }
}

// Export singleton instance
export const spkRepository = new SPKRepository();
export default spkRepository;
