/**
 * Downtime Repository - Data access layer
 */

import { BaseRepository } from './BaseRepository';
import {
  DowntimeLog,
  DowntimeLogWithDetails,
  DowntimeClassification,
  CreateDowntimeDTO,
  UpdateDowntimeDTO,
  DowntimeFilter,
  ClassificationResult,
} from '../types/downtime';

interface ProductionSchedule {
  id: number;
  asset_id: number;
  date: string;
  status: string;
  planned_start?: string;
  planned_end?: string;
}

export class DowntimeRepository extends BaseRepository<
  DowntimeLog,
  CreateDowntimeDTO,
  UpdateDowntimeDTO
> {
  constructor() {
    super('downtime_logs');
  }

  /**
   * Auto-classify downtime based on production schedule
   */
  classifyDowntime(assetId: number, startTime: string, downtimeType: string): ClassificationResult {
    // Check if there's a production schedule at this time
    const schedule = this.queryOne<ProductionSchedule & { classification_id: number }>(
      `
      SELECT ps.*, dc.id as classification_id
      FROM production_schedule ps
      LEFT JOIN downtime_classifications dc ON (
        CASE 
          WHEN ps.status = 'no_order' AND ? = 'unplanned' THEN dc.code = 'BD-IDLE'
          WHEN ps.status = 'no_order' AND ? = 'planned' THEN dc.code = 'PM-IDLE'
          WHEN ps.status = 'maintenance_window' AND ? = 'planned' THEN dc.code = 'PM-WINDOW'
          WHEN ps.status = 'scheduled' AND ? = 'unplanned' THEN dc.code = 'BD-PROD'
          WHEN ps.status = 'scheduled' AND ? = 'planned' THEN dc.code = 'PM-PROD'
          ELSE dc.code = 'BD-PROD'
        END
      )
      WHERE ps.asset_id = ? 
      AND ps.date = date(?)
      AND (ps.planned_start IS NULL OR time(?) >= ps.planned_start)
      AND (ps.planned_end IS NULL OR time(?) <= ps.planned_end)
      LIMIT 1
    `,
      [
        downtimeType,
        downtimeType,
        downtimeType,
        downtimeType,
        downtimeType,
        assetId,
        startTime,
        startTime,
        startTime,
      ]
    );

    if (!schedule) {
      // No schedule found - assume idle time
      const idleClassification = this.queryOne<{ id: number }>(
        'SELECT id FROM downtime_classifications WHERE code = ?',
        [downtimeType === 'planned' ? 'PM-IDLE' : 'BD-IDLE']
      );

      return {
        classificationId: idleClassification?.id || 1,
        wasScheduledProduction: false,
        scheduleId: null,
      };
    }

    // Get classification based on schedule status
    let classificationCode = 'BD-PROD';

    if (schedule.status === 'no_order') {
      classificationCode = downtimeType === 'planned' ? 'PM-IDLE' : 'BD-IDLE';
    } else if (schedule.status === 'maintenance_window') {
      classificationCode = 'PM-WINDOW';
    } else if (schedule.status === 'scheduled') {
      classificationCode = downtimeType === 'planned' ? 'PM-PROD' : 'BD-PROD';
    }

    const classification = this.queryOne<{ id: number }>(
      'SELECT id FROM downtime_classifications WHERE code = ?',
      [classificationCode]
    );

    return {
      classificationId: classification?.id || 1,
      wasScheduledProduction: schedule.status === 'scheduled',
      scheduleId: schedule.id,
    };
  }

  /**
   * Find all with filters and details
   */
  findAllWithDetails(filter: DowntimeFilter): DowntimeLogWithDetails[] {
    let sql = `
      SELECT dl.*, 
             a.asset_code, a.name as asset_name,
             dc.code as classification_code, dc.name as classification_name,
             dc.category as classification_type,
             dc.category as classification_category,
             dc.counts_as_downtime,
             wo.wo_number, wo.title as wo_title,
             u.name as logged_by_name,
             dept.name as department_name,
             fc.code as failure_code, fc.description as failure_description,
             fc.category as failure_category,
             CASE 
               WHEN dl.end_time IS NOT NULL THEN 
                 CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
               ELSE 
                 CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
             END as duration_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
      LEFT JOIN users u ON dl.logged_by = u.id
      LEFT JOIN departments dept ON dl.department_id = dept.id
      LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.asset_id) {
      sql += ' AND dl.asset_id = ?';
      params.push(filter.asset_id);
    }
    if (filter.start_date) {
      sql += ' AND datetime(dl.start_time) >= datetime(?)';
      // Normalize date format: replace T with space for consistent comparison
      params.push(filter.start_date.replace('T', ' '));
    }
    if (filter.end_date) {
      sql += ' AND datetime(dl.start_time) <= datetime(?)';
      params.push(filter.end_date.replace('T', ' '));
    }
    if (filter.downtime_type) {
      sql += ' AND dl.downtime_type = ?';
      params.push(filter.downtime_type);
    }
    if (filter.classification_id) {
      sql += ' AND dl.classification_id = ?';
      params.push(filter.classification_id);
    }
    if (filter.category) {
      sql += ' AND dc.category = ?';
      params.push(filter.category);
    }
    if (filter.department_id) {
      sql += ' AND dl.department_id = ?';
      params.push(filter.department_id);
    }
    if (filter.status) {
      // Use end_time to determine status since there's no status column
      if (filter.status === 'active') {
        sql += ' AND dl.end_time IS NULL';
      } else if (filter.status === 'resolved') {
        sql += ' AND dl.end_time IS NOT NULL';
      }
    }
    if (filter.work_order_id) {
      sql += ' AND dl.work_order_id = ?';
      params.push(filter.work_order_id);
    }

    sql += ' ORDER BY dl.start_time DESC';

    if (filter.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    return this.query<DowntimeLogWithDetails>(sql, params);
  }

  /**
   * Find by ID with details
   */
  findByIdWithDetails(id: number): DowntimeLogWithDetails | undefined {
    return this.queryOne<DowntimeLogWithDetails>(
      `
      SELECT dl.*, 
             a.asset_code, a.name as asset_name,
             dc.code as classification_code, dc.name as classification_name,
             dc.category as classification_type,
             dc.category as classification_category,
             dc.counts_as_downtime,
             wo.wo_number, wo.title as wo_title,
             u.name as logged_by_name,
             dept.name as department_name,
             fc.code as failure_code, fc.description as failure_description,
             fc.category as failure_category,
             CASE 
               WHEN dl.end_time IS NOT NULL THEN 
                 CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
               ELSE 
                 CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
             END as duration_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      LEFT JOIN work_orders wo ON dl.work_order_id = wo.id
      LEFT JOIN users u ON dl.logged_by = u.id
      LEFT JOIN departments dept ON dl.department_id = dept.id
      LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE dl.id = ?
    `,
      [id]
    );
  }

  /**
   * Find all active downtime logs
   */
  findAllActive(): DowntimeLogWithDetails[] {
    return this.query<DowntimeLogWithDetails>(
      `
      SELECT dl.*, 
             a.asset_code, a.name as asset_name,
             dc.code as classification_code, dc.name as classification_name,
             dc.category as classification_category,
             dc.counts_as_downtime,
             fc.code as failure_code,
             fc.description as failure_description,
             fc.category as failure_category,
             CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER) as duration_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE dl.end_time IS NULL
      ORDER BY dl.start_time DESC
    `
    );
  }

  /**
   * Find active downtime for asset
   */
  findActiveByAsset(assetId: number): DowntimeLogWithDetails | undefined {
    return this.queryOne<DowntimeLogWithDetails>(
      `
      SELECT dl.*, 
             a.asset_code, a.name as asset_name,
             dc.code as classification_code, dc.name as classification_name,
             dc.category as classification_category,
             dc.counts_as_downtime,
             fc.code as failure_code,
             fc.description as failure_description,
             fc.category as failure_category,
             CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER) as duration_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE dl.asset_id = ? AND dl.end_time IS NULL
      ORDER BY dl.start_time DESC
      LIMIT 1
    `,
      [assetId]
    );
  }

  /**
   * Find by work order ID
   */
  findByWorkOrderId(workOrderId: number): DowntimeLogWithDetails | undefined {
    return this.queryOne<DowntimeLogWithDetails>(
      `
      SELECT dl.*, 
             a.asset_code, a.name as asset_name,
             dc.code as classification_code, dc.name as classification_name
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.work_order_id = ?
      ORDER BY dl.start_time DESC
      LIMIT 1
    `,
      [workOrderId]
    );
  }

  /**
   * Create downtime log
   */
  create(data: CreateDowntimeDTO, userId?: number): DowntimeLog {
    const startTime = new Date().toISOString();
    const downtimeType = data.downtime_type || 'unplanned';

    // Get user's department
    let departmentId = null;
    if (userId) {
      const user = this.queryOne<{ department_id: number }>('SELECT department_id FROM users WHERE id = ?', [userId]);
      departmentId = user?.department_id || null;
    }

    // Auto-classify
    let classificationId = data.classification_id;
    let wasScheduledProduction = false;
    let scheduleId: number | null = null;

    if (!classificationId) {
      const classification = this.classifyDowntime(data.asset_id, startTime, downtimeType);
      classificationId = classification.classificationId;
      wasScheduledProduction = classification.wasScheduledProduction;
      scheduleId = classification.scheduleId;
    }

    const result = this.execute(
      `
      INSERT INTO downtime_logs (
        asset_id, work_order_id, downtime_type, classification_id,
        start_time, reason, failure_code_id, production_impact,
        was_scheduled_production, production_schedule_id, logged_by, department_id,
        created_at
      ) VALUES (?, ?, ?, ?, datetime('now'), ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        data.asset_id,
        data.work_order_id || null,
        downtimeType,
        classificationId,
        data.reason || null,
        data.failure_code_id || null,
        data.production_impact || null,
        wasScheduledProduction ? 1 : 0,
        scheduleId,
        userId || null,
        departmentId,
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Create downtime log with explicit start_time (and optional end_time)
   */
  createDirect(data: CreateDowntimeDTO, userId?: number): DowntimeLog {
    const startTime = data.start_time || new Date().toISOString();
    const downtimeType = data.downtime_type || 'unplanned';

    // Auto-classify
    let classificationId = data.classification_id;
    let wasScheduledProduction = false;
    let scheduleId: number | null = null;

    if (!classificationId) {
      const classification = this.classifyDowntime(data.asset_id, startTime, downtimeType);
      classificationId = classification.classificationId;
      wasScheduledProduction = classification.wasScheduledProduction;
      scheduleId = classification.scheduleId;
    }

    // Calculate duration if end_time is provided
    let durationMinutes: number | null = null;
    if (data.end_time) {
      const start = new Date(startTime);
      const end = new Date(data.end_time);
      durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    }

    const result = this.execute(
      `
      INSERT INTO downtime_logs (
        asset_id, work_order_id, downtime_type, classification_id,
        start_time, end_time, duration_minutes, reason, failure_code_id, production_impact,
        was_scheduled_production, production_schedule_id, logged_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `,
      [
        data.asset_id,
        data.work_order_id || null,
        downtimeType,
        classificationId,
        startTime,
        data.end_time || null,
        durationMinutes,
        data.reason || null,
        data.failure_code_id || null,
        data.production_impact || null,
        wasScheduledProduction ? 1 : 0,
        scheduleId,
        userId || null,
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Update downtime log
   */
  update(id: number, data: UpdateDowntimeDTO, userId?: number): DowntimeLog | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const params: any[] = [];

    if (data.reason !== undefined) {
      updates.push('reason = ?');
      params.push(data.reason);
    }
    if (data.production_impact !== undefined) {
      updates.push('production_impact = ?');
      params.push(data.production_impact);
    }
    if (data.classification_id !== undefined) {
      updates.push('classification_id = ?');
      params.push(data.classification_id);
    }
    if (data.failure_code_id !== undefined) {
      updates.push('failure_code_id = ?');
      params.push(data.failure_code_id);
    }

    params.push(id);
    this.execute(`UPDATE downtime_logs SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id);
  }

  /**
   * End downtime
   */
  end(id: number, data?: { reason?: string; production_impact?: string }): DowntimeLog | null {
    const existing = this.findById(id);
    if (!existing) return null;

    // Build dynamic update query - duration calculated in SQLite to avoid timezone issues
    const updates = [
      'end_time = datetime("now")',
      'duration_minutes = CAST((julianday(datetime("now")) - julianday(start_time)) * 1440 AS INTEGER)',
    ];
    const params: any[] = [];

    if (data?.reason) {
      updates.push('reason = ?');
      params.push(data.reason);
    }
    if (data?.production_impact) {
      updates.push('production_impact = ?');
      params.push(data.production_impact);
    }

    params.push(id);
    this.execute(`UPDATE downtime_logs SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id);
  }

  /**
   * End downtime by work order ID
   */
  endByWorkOrderId(workOrderId: number): boolean {
    // First check if there's an active downtime for this work order
    const downtime = this.findByWorkOrderId(workOrderId);
    if (!downtime || downtime.end_time) return false;

    // Calculate duration in SQLite to avoid timezone issues
    const result = this.execute(
      `
      UPDATE downtime_logs 
      SET end_time = datetime('now'), 
          duration_minutes = CAST((julianday(datetime('now')) - julianday(start_time)) * 1440 AS INTEGER)
      WHERE work_order_id = ? AND end_time IS NULL
    `,
      [workOrderId]
    );
    return result.changes > 0;
  }

  /**
   * Get all classifications
   */
  getClassifications(category?: string): DowntimeClassification[] {
    if (category) {
      // Support comma-separated categories (e.g., 'production,changeover,idle')
      const categories = category.split(',').map(c => c.trim());
      if (categories.length === 1) {
        return this.query<DowntimeClassification>(
          'SELECT * FROM downtime_classifications WHERE category = ? ORDER BY name',
          [categories[0]]
        );
      }
      // Multiple categories
      const placeholders = categories.map(() => '?').join(',');
      return this.query<DowntimeClassification>(
        `SELECT * FROM downtime_classifications WHERE category IN (${placeholders}) ORDER BY category, name`,
        categories
      );
    }
    return this.query<DowntimeClassification>(
      'SELECT * FROM downtime_classifications ORDER BY category, name'
    );
  }

  /**
   * Get classification by ID
   */
  getClassificationById(id: number): DowntimeClassification | null {
    return this.queryOne<DowntimeClassification>(
      'SELECT * FROM downtime_classifications WHERE id = ?',
      [id]
    );
  }

  /**
   * Create a new classification
   */
  createClassification(data: {
    code: string;
    name: string;
    category: string;
    description?: string;
  }): number {
    this.execute(
      `INSERT INTO downtime_classifications (code, name, category, description)
       VALUES (?, ?, ?, ?)`,
      [data.code, data.name, data.category, data.description || null]
    );
    const result = this.queryOne<{ id: number }>('SELECT last_insert_rowid() as id');
    return result?.id || 0;
  }

  /**
   * Update a classification
   */
  updateClassification(id: number, data: {
    code?: string;
    name?: string;
    category?: string;
    description?: string;
  }): boolean {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.code !== undefined) {
      updates.push('code = ?');
      params.push(data.code);
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.category !== undefined) {
      updates.push('category = ?');
      params.push(data.category);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }

    if (updates.length === 0) return false;

    params.push(id);
    this.execute(
      `UPDATE downtime_classifications SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return true;
  }

  /**
   * Delete a classification
   */
  deleteClassification(id: number): boolean {
    // Check if classification is in use
    const inUse = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM downtime_logs WHERE classification_id = ?',
      [id]
    );
    
    if (inUse && inUse.count > 0) {
      throw new Error(`Klasifikasi ini sedang digunakan oleh ${inUse.count} downtime log dan tidak dapat dihapus`);
    }

    this.execute('DELETE FROM downtime_classifications WHERE id = ?', [id]);
    return true;
  }

  /**
   * Generate next classification code for a category
   */
  generateClassificationCode(category: string): string {
    // Define prefix mapping
    const prefixMap: Record<string, string> = {
      'production': 'PROD',
      'changeover': 'CO',
      'idle': 'IDLE',
      'breakdown': 'BD',
      'planned_maintenance': 'PM',
      'material': 'MAT',
      'quality': 'QC',
    };

    const prefix = prefixMap[category] || category.toUpperCase().substring(0, 4);

    // Find the highest existing number for this prefix
    const existing = this.query<{ code: string }>(
      `SELECT code FROM downtime_classifications WHERE code LIKE ? ORDER BY code DESC`,
      [`${prefix}-%`]
    );

    let maxNum = 0;
    for (const row of existing) {
      const match = row.code.match(new RegExp(`^${prefix}-(\\d+)$`));
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
  }

  /**
   * Get statistics
   */
  getStatistics(filter: { start_date?: string; end_date?: string; asset_id?: number }): {
    totalDowntime: number;
    activeCount: number;
    byClassification: any[];
    byAsset: any[];
  } {
    const params: any[] = [];
    let whereClause = '1=1';

    if (filter.start_date) {
      whereClause += ' AND datetime(dl.start_time) >= datetime(?)';
      params.push(filter.start_date.replace('T', ' '));
    }
    if (filter.end_date) {
      whereClause += ' AND datetime(dl.start_time) <= datetime(?)';
      params.push(filter.end_date.replace('T', ' '));
    }
    if (filter.asset_id) {
      whereClause += ' AND dl.asset_id = ?';
      params.push(filter.asset_id);
    }

    // Total downtime minutes
    const total = this.queryOne<{ total: number }>(
      `
      SELECT COALESCE(SUM(
        CASE 
          WHEN dl.end_time IS NOT NULL THEN 
            CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
          ELSE 
            CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
        END
      ), 0) as total
      FROM downtime_logs dl
      WHERE ${whereClause}
    `,
      params
    );

    // Active count
    const active = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count FROM downtime_logs dl
      WHERE ${whereClause} AND dl.end_time IS NULL
    `,
      params
    );

    // By classification
    const byClassification = this.query<any>(
      `
      SELECT 
        dc.id as classification_id,
        dc.name as classification_name,
        COUNT(*) as count,
        COALESCE(SUM(
          CASE 
            WHEN dl.end_time IS NOT NULL THEN 
              CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
            ELSE 
              CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
          END
        ), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE ${whereClause}
      GROUP BY dc.id
      ORDER BY total_minutes DESC
    `,
      params
    );

    // By asset
    const byAsset = this.query<any>(
      `
      SELECT 
        a.id as asset_id,
        a.name as asset_name,
        COUNT(*) as count,
        COALESCE(SUM(
          CASE 
            WHEN dl.end_time IS NOT NULL THEN 
              CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
            ELSE 
              CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
          END
        ), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      WHERE ${whereClause}
      GROUP BY a.id
      ORDER BY total_minutes DESC
    `,
      params
    );

    return {
      totalDowntime: total?.total || 0,
      activeCount: active?.count || 0,
      byClassification,
      byAsset,
    };
  }
}

// Export singleton instance
export const downtimeRepository = new DowntimeRepository();
export default downtimeRepository;
