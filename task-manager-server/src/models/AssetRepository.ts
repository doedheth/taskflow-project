/**
 * Asset Repository - Data access layer
 */

import { BaseRepository } from './BaseRepository';
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

export class AssetRepository extends BaseRepository<Asset, CreateAssetDTO, UpdateAssetDTO> {
  constructor() {
    super('assets');
  }

  /**
   * Find all with filters and details
   */
  findAllWithDetails(filter: AssetFilter): AssetWithDetails[] {
    let sql = `
      SELECT a.*, 
             c.name as category_name,
             d.name as department_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.status) {
      sql += ' AND a.status = ?';
      params.push(filter.status);
    }
    if (filter.category_id) {
      sql += ' AND a.category_id = ?';
      params.push(filter.category_id);
    }
    if (filter.department_id) {
      sql += ' AND a.department_id = ?';
      params.push(filter.department_id);
    }
    if (filter.criticality) {
      sql += ' AND a.criticality = ?';
      params.push(filter.criticality);
    }
    if (filter.search) {
      sql += ' AND (a.asset_code LIKE ? OR a.name LIKE ? OR a.serial_number LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    sql += ' ORDER BY a.asset_code ASC';

    return this.query<AssetWithDetails>(sql, params);
  }

  /**
   * Find by ID with full details
   */
  findByIdWithDetails(id: number): AssetWithDetails | undefined {
    const asset = this.queryOne<AssetWithDetails>(
      `
      SELECT a.*, 
             c.name as category_name,
             d.name as department_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE a.id = ?
    `,
      [id]
    );

    if (asset) {
      // Get statistics
      const stats = this.getAssetStats(id);
      Object.assign(asset, stats);
    }

    return asset;
  }

  /**
   * Find by asset code
   */
  findByAssetCode(assetCode: string): Asset | undefined {
    return this.findOneBy('asset_code', assetCode);
  }

  /**
   * Create asset
   */
  create(data: CreateAssetDTO, userId?: number): Asset {
    const result = this.execute(
      `
      INSERT INTO assets (
        asset_code, name, category_id, location, manufacturer, model,
        serial_number, purchase_date, warranty_expiry, status, criticality,
        department_id, specifications, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        data.asset_code,
        data.name,
        data.category_id || null,
        data.location || null,
        data.manufacturer || null,
        data.model || null,
        data.serial_number || null,
        data.purchase_date || null,
        data.warranty_expiry || null,
        data.status || 'operational',
        data.criticality || 'medium',
        data.department_id || null,
        data.specifications || null,
        data.notes || null,
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Update asset
   */
  update(id: number, data: UpdateAssetDTO, userId?: number): Asset | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    const fields = [
      'asset_code',
      'name',
      'category_id',
      'location',
      'manufacturer',
      'model',
      'serial_number',
      'purchase_date',
      'warranty_expiry',
      'status',
      'criticality',
      'department_id',
      'specifications',
      'notes',
    ];

    fields.forEach(field => {
      if ((data as any)[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push((data as any)[field]);
      }
    });

    params.push(id);
    this.execute(`UPDATE assets SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id);
  }

  /**
   * Update status
   */
  updateStatus(id: number, status: string): boolean {
    const result = this.execute(
      'UPDATE assets SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );
    return result.changes > 0;
  }

  /**
   * Get asset statistics
   */
  getAssetStats(assetId: number): {
    total_downtime_minutes: number;
    total_work_orders: number;
    pending_work_orders: number;
    recent_downtime_count: number;
  } {
    const downtime = this.queryOne<{ total: number }>(
      `
      SELECT COALESCE(SUM(
        CASE 
          WHEN end_time IS NOT NULL THEN 
            CAST((julianday(end_time) - julianday(start_time)) * 1440 AS INTEGER)
          ELSE 0
        END
      ), 0) as total
      FROM downtime_logs
      WHERE asset_id = ?
    `,
      [assetId]
    );

    const woTotal = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_orders WHERE asset_id = ?',
      [assetId]
    );

    const woPending = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM work_orders WHERE asset_id = ? AND status IN ("open", "in_progress")',
      [assetId]
    );

    const recentDowntime = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count FROM downtime_logs 
      WHERE asset_id = ? AND start_time >= date('now', '-30 days')
    `,
      [assetId]
    );

    return {
      total_downtime_minutes: downtime?.total || 0,
      total_work_orders: woTotal?.count || 0,
      pending_work_orders: woPending?.count || 0,
      recent_downtime_count: recentDowntime?.count || 0,
    };
  }

  /**
   * Get all categories
   */
  getCategories(): AssetCategory[] {
    return this.query<AssetCategory>('SELECT * FROM asset_categories ORDER BY name');
  }

  /**
   * Create category
   */
  createCategory(name: string, description?: string): AssetCategory {
    const result = this.execute(
      `INSERT INTO asset_categories (name, description, created_at, updated_at) 
       VALUES (?, ?, datetime('now'), datetime('now'))`,
      [name, description || null]
    );
    return this.queryOne<AssetCategory>('SELECT * FROM asset_categories WHERE id = ?', [
      Number(result.lastInsertRowid),
    ])!;
  }

  /**
   * Get failure codes
   */
  getFailureCodes(category?: string): FailureCode[] {
    if (category) {
      return this.query<FailureCode>(
        'SELECT * FROM failure_codes WHERE category = ? ORDER BY code',
        [category]
      );
    }
    return this.query<FailureCode>('SELECT * FROM failure_codes ORDER BY category, code');
  }

  /**
   * Get failure codes by asset (filtered by asset's category name + global codes)
   * Currently returns all failure codes grouped by category,
   * prioritizing codes that match the asset's type.
   * 
   * For thermoforming factory:
   * - All machines can have Electrical, Mechanical issues
   * - Specific codes based on machine type are prioritized
   */
  getFailureCodesByAsset(assetId: number): FailureCode[] {
    // Get the asset's category and code
    const asset = this.queryOne<{ category_id: number; category_name: string; asset_code: string }>(
      `SELECT a.category_id, ac.name as category_name, a.asset_code 
       FROM assets a 
       LEFT JOIN asset_categories ac ON a.category_id = ac.id 
       WHERE a.id = ?`,
      [assetId]
    );

    const categoryName = asset?.category_name?.toLowerCase() || '';
    const assetCode = asset?.asset_code || '';

    // Define which failure code categories are relevant for each asset type
    // Always include basic categories
    let allowedCategories = ['Electrical', 'Mechanical', 'Other', 'Safety'];
    
    if (categoryName.includes('thermoform') || categoryName.includes('forming')) {
      allowedCategories.push('Hydraulic', 'Pneumatic', 'Process', 'Thermoforming', 'Extruder', 'Piovan', 'Mold', 'Heating', 'Cooling');
    } else if (categoryName.includes('chiller') || categoryName.includes('cooling')) {
      allowedCategories.push('Refrigeration', 'Chiller', 'Pump', 'Fan');
    } else if (categoryName.includes('compressor')) {
      allowedCategories.push('Pneumatic', 'Compressor', 'Motor', 'Valve');
    } else if (categoryName.includes('mold') || categoryName.includes('die')) {
      allowedCategories.push('Process', 'Mold', 'Die', 'Wear');
    } else if (categoryName.includes('conveyor')) {
      allowedCategories.push('Motor', 'Belt', 'Chain', 'Roller');
    } else if (categoryName.includes('auxiliary')) {
      allowedCategories.push('Pneumatic', 'Hydraulic', 'General');
    }

    const clauses: string[] = [];
    const params: any[] = [];

    if (allowedCategories.length > 0) {
      const placeholders = allowedCategories.map(() => '?').join(',');
      clauses.push(`category IN (${placeholders})`);
      params.push(...allowedCategories);

      const likeClause = allowedCategories.map(() => 'category LIKE ?').join(' OR ');
      clauses.push(`(${likeClause})`);
      params.push(...allowedCategories.map(cat => `${cat}%`));
    }

    if (assetCode) {
      clauses.push('category LIKE ?');
      params.push(`${assetCode}%`);
    }

    if (asset?.category_name) {
      clauses.push('category LIKE ?');
      params.push(`${asset.category_name}%`);
    }

    const whereClause = clauses.length > 0 ? clauses.join(' OR ') : '1=1';

    return this.query<FailureCode>(
      `SELECT * FROM failure_codes 
       WHERE ${whereClause}
       ORDER BY category, code`,
      params
    );
  }

  /**
   * Get category prefix mapping for auto-generating codes
   */
  private getCategoryPrefix(category: string): string {
    const prefixMap: Record<string, string> = {
      'Electrical': 'EL',
      'Mechanical': 'MC',
      'Hydraulic': 'HY',
      'Pneumatic': 'PN',
      'Process': 'PR',
      'Operator': 'OP',
      'Material': 'MT',
      'Quality': 'QC',
      'Mold': 'MD',
      'Thermoforming': 'TF',
      'Other': 'OT',
    };
    return prefixMap[category] || 'OT';
  }

  /**
   * Generate next failure code for a category
   */
  generateFailureCode(category: string): string {
    const prefix = this.getCategoryPrefix(category);
    
    // Find the highest existing number for this prefix
    const existing = this.queryOne<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(code, 4) AS INTEGER)) as max_num 
       FROM failure_codes 
       WHERE code LIKE ? || '-%'`,
      [prefix]
    );
    
    const nextNum = (existing?.max_num || 0) + 1;
    return `${prefix}-${String(nextNum).padStart(3, '0')}`;
  }

  /**
   * Create failure code (auto-generates code if not provided)
   */
  createFailureCode(code: string | undefined, category: string | undefined, description: string): FailureCode {
    // Auto-generate code if not provided
    const finalCode = code?.trim() || this.generateFailureCode(category || 'Other');
    const finalCategory = category || 'Other';

    const result = this.execute(
      `INSERT INTO failure_codes (code, category, description, created_at) 
       VALUES (?, ?, ?, datetime('now'))`,
      [finalCode, finalCategory, description]
    );
    return this.queryOne<FailureCode>('SELECT * FROM failure_codes WHERE id = ?', [
      Number(result.lastInsertRowid),
    ])!;
  }

  /**
   * Update failure code
   */
  updateFailureCode(id: number, data: { code?: string; category?: string; description?: string }): FailureCode | null {
    const existing = this.queryOne<FailureCode>('SELECT * FROM failure_codes WHERE id = ?', [id]);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      params.push(data.code.trim());
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category?.trim() || null);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description.trim());
    }

    params.push(id);
    this.execute(`UPDATE failure_codes SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.queryOne<FailureCode>('SELECT * FROM failure_codes WHERE id = ?', [id]);
  }

  /**
   * Delete failure code
   */
  deleteFailureCode(id: number): boolean {
    // Check if it's being used
    const usageCount = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM downtime_logs WHERE failure_code_id = ?`,
      [id]
    );

    if (usageCount && usageCount.count > 0) {
      throw new Error(`Failure code is being used in ${usageCount.count} downtime log(s) and cannot be deleted`);
    }

    const woUsageCount = this.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM work_orders WHERE failure_code_id = ?`,
      [id]
    );

    if (woUsageCount && woUsageCount.count > 0) {
      throw new Error(`Failure code is being used in ${woUsageCount.count} work order(s) and cannot be deleted`);
    }

    const result = this.execute('DELETE FROM failure_codes WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Get statistics
   */
  getStatistics(): AssetStatistics {
    const total = this.count();

    const byStatus = this.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM assets GROUP BY status'
    );

    const byCriticality = this.query<{ criticality: string; count: number }>(
      'SELECT criticality, COUNT(*) as count FROM assets GROUP BY criticality'
    );

    const needingAttention = this.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM assets 
      WHERE status IN ('down', 'maintenance') OR criticality = 'critical'
    `);

    return {
      total,
      byStatus,
      byCriticality,
      needingAttention: needingAttention?.count || 0,
    };
  }
}

// Export singleton
export const assetRepository = new AssetRepository();
export default assetRepository;
