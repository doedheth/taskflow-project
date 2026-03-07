/**
 * Work Order Repository - Data access layer
 */

import { BaseRepository } from './BaseRepository';
import {
  WorkOrder,
  WorkOrderWithDetails,
  WorkOrderAssignee,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  WorkOrderFilter,
} from '../types/workOrder';
import { PaginationParams, PaginatedResponse } from '../types/common';

interface AssigneeRow {
  work_order_id: number;
  user_id: number;
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export class WorkOrderRepository extends BaseRepository<
  WorkOrder,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO
> {
  constructor() {
    super('work_orders');
  }

  /**
   * Generate next work order number
   */
  generateWONumber(): string {
    const currentYear = new Date().getFullYear();

    const maxWO = this.queryOne<{ wo_number: string }>(
      `SELECT wo_number FROM work_orders 
       WHERE wo_number LIKE 'WO-${currentYear}-%'
       ORDER BY wo_number DESC 
       LIMIT 1`
    );

    let nextNumber = 1;
    if (maxWO) {
      const parts = maxWO.wo_number.split('-');
      if (parts.length === 3) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }

    // Update counter table
    const counter = this.queryOne<{ counter: number }>(
      'SELECT counter FROM work_order_counter WHERE year = ?',
      [currentYear]
    );

    if (!counter) {
      this.execute('INSERT INTO work_order_counter (year, counter) VALUES (?, ?)', [
        currentYear,
        nextNumber,
      ]);
    } else if (counter.counter < nextNumber) {
      this.execute('UPDATE work_order_counter SET counter = ? WHERE year = ?', [
        nextNumber,
        currentYear,
      ]);
    }

    return `WO-${currentYear}-${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Find all with filters and details
   */
  findAllWithDetails(
    filter: WorkOrderFilter,
    pagination?: PaginationParams
  ): WorkOrderWithDetails[] | PaginatedResponse<WorkOrderWithDetails> {
    let sql = `
      SELECT DISTINCT wo.*, 
             a.asset_code, a.name as asset_name,
             fc.code as failure_code, fc.description as failure_description,
             reporter.name as reporter_name,
             t.ticket_key as related_ticket_key,
             s.name as sprint_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN failure_codes fc ON wo.failure_code_id = fc.id
      LEFT JOIN users reporter ON wo.reported_by = reporter.id
      LEFT JOIN tickets t ON wo.related_ticket_id = t.id
      LEFT JOIN sprints s ON wo.sprint_id = s.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Join with assignees if filtering by assigned_to
    if (filter.assigned_to) {
      sql = sql.replace(
        'FROM work_orders wo',
        'FROM work_orders wo LEFT JOIN work_order_assignees woa ON wo.id = woa.work_order_id'
      );
      conditions.push('woa.user_id = ?');
      params.push(filter.assigned_to);
    }

    if (filter.status) {
      conditions.push('wo.status = ?');
      params.push(filter.status);
    }
    if (filter.type) {
      conditions.push('wo.type = ?');
      params.push(filter.type);
    }
    if (filter.priority) {
      conditions.push('wo.priority = ?');
      params.push(filter.priority);
    }
    if (filter.asset_id) {
      conditions.push('wo.asset_id = ?');
      params.push(filter.asset_id);
    }
    if (filter.sprint_id) {
      conditions.push('wo.sprint_id = ?');
      params.push(filter.sprint_id);
    }
    if (filter.related_ticket_id) {
      conditions.push('wo.related_ticket_id = ?');
      params.push(filter.related_ticket_id);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }

    sql += ' ORDER BY wo.created_at DESC';

    if (pagination) {
      // Get total count
      const countSql = sql.replace(
        /SELECT DISTINCT wo\.\*.*?FROM/,
        'SELECT COUNT(DISTINCT wo.id) as count FROM'
      );
      const countResult = this.queryOne<{ count: number }>(countSql, params);
      const total = countResult?.count || 0;

      sql += ' LIMIT ? OFFSET ?';
      params.push(pagination.limit, pagination.offset);

      const data = this.query<WorkOrderWithDetails>(sql, params);
      this.attachAssignees(data);

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages: Math.ceil(total / pagination.limit),
        },
      };
    } else {
      const limit = filter.limit || 50;
      sql += ' LIMIT ?';
      params.push(limit);

      const data = this.query<WorkOrderWithDetails>(sql, params);
      this.attachAssignees(data);
      return data;
    }
  }

  /**
   * Find by ID with details
   */
  findByIdWithDetails(id: number): WorkOrderWithDetails | undefined {
    const wo = this.queryOne<WorkOrderWithDetails>(
      `
      SELECT wo.*, 
             a.asset_code, a.name as asset_name,
             fc.code as failure_code, fc.description as failure_description,
             reporter.name as reporter_name,
             t.ticket_key as related_ticket_key,
             s.name as sprint_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN failure_codes fc ON wo.failure_code_id = fc.id
      LEFT JOIN users reporter ON wo.reported_by = reporter.id
      LEFT JOIN tickets t ON wo.related_ticket_id = t.id
      LEFT JOIN sprints s ON wo.sprint_id = s.id
      WHERE wo.id = ?
    `,
      [id]
    );

    if (wo) {
      wo.assignees = this.getAssignees(id);
    }

    return wo;
  }

  /**
   * Find by WO number
   */
  findByWONumber(woNumber: string): WorkOrder | undefined {
    return this.findOneBy('wo_number', woNumber);
  }

  /**
   * Find by related ticket
   */
  findByTicketId(ticketId: number): WorkOrderWithDetails[] {
    const workOrders = this.query<WorkOrderWithDetails>(
      `
      SELECT wo.*, 
             a.asset_code, a.name as asset_name,
             fc.code as failure_code, fc.description as failure_description,
             reporter.name as reporter_name
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN failure_codes fc ON wo.failure_code_id = fc.id
      LEFT JOIN users reporter ON wo.reported_by = reporter.id
      WHERE wo.related_ticket_id = ?
      ORDER BY wo.created_at DESC
    `,
      [ticketId]
    );

    this.attachAssignees(workOrders);
    return workOrders;
  }

  /**
   * Create work order
   */
  create(data: CreateWorkOrderDTO, userId?: number): WorkOrder {
    const woNumber = this.generateWONumber();

    const result = this.execute(
      `
      INSERT INTO work_orders (
        wo_number, asset_id, type, priority, status, title, description,
        failure_code_id, maintenance_schedule_id, related_ticket_id, sprint_id,
        scheduled_start, scheduled_end, reported_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        woNumber,
        data.asset_id,
        data.type,
        data.priority,
        data.title,
        data.description || null,
        data.failure_code_id || null,
        data.maintenance_schedule_id || null,
        data.related_ticket_id || null,
        data.sprint_id || null,
        data.scheduled_start || null,
        data.scheduled_end || null,
        userId || null,
      ]
    );

    const newId = Number(result.lastInsertRowid);

    // Add assignees
    if (data.assignee_ids && data.assignee_ids.length > 0) {
      this.setAssignees(newId, data.assignee_ids);
    }

    return this.findById(newId)!;
  }

  /**
   * Update work order
   */
  update(id: number, data: UpdateWorkOrderDTO, userId?: number): WorkOrder | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    if (data.asset_id !== undefined) {
      updates.push('asset_id = ?');
      params.push(data.asset_id);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }
    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.failure_code_id !== undefined) {
      updates.push('failure_code_id = ?');
      params.push(data.failure_code_id);
    }
    if (data.scheduled_start !== undefined) {
      updates.push('scheduled_start = ?');
      params.push(data.scheduled_start);
    }
    if (data.scheduled_end !== undefined) {
      updates.push('scheduled_end = ?');
      params.push(data.scheduled_end);
    }

    params.push(id);
    this.execute(`UPDATE work_orders SET ${updates.join(', ')} WHERE id = ?`, params);

    // Update assignees if provided
    if (data.assignee_ids !== undefined) {
      this.setAssignees(id, data.assignee_ids);
    }

    return this.findById(id);
  }

  /**
   * Update status
   */
  updateStatus(id: number, status: string): boolean {
    const result = this.execute(
      'UPDATE work_orders SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );
    return result.changes > 0;
  }

  /**
   * Start work order
   */
  start(id: number): boolean {
    const result = this.execute(
      `
      UPDATE work_orders 
      SET status = 'in_progress', 
          actual_start = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ?
    `,
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Complete work order
   */
  complete(
    id: number,
    data: { root_cause?: string; solution?: string; parts_used?: string; labor_hours?: number }
  ): boolean {
    const result = this.execute(
      `
      UPDATE work_orders 
      SET status = 'completed', 
          actual_end = datetime('now'),
          root_cause = ?,
          solution = ?,
          parts_used = ?,
          labor_hours = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `,
      [
        data.root_cause || null,
        data.solution || null,
        data.parts_used || null,
        data.labor_hours || null,
        id,
      ]
    );
    return result.changes > 0;
  }

  /**
   * Cancel work order
   */
  cancel(id: number): boolean {
    const result = this.execute(
      'UPDATE work_orders SET status = "cancelled", updated_at = datetime("now") WHERE id = ?',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Get assignees for a work order
   */
  getAssignees(workOrderId: number): WorkOrderAssignee[] {
    return this.query<WorkOrderAssignee>(
      `
      SELECT u.id, u.name, u.email, u.avatar
      FROM work_order_assignees woa
      JOIN users u ON woa.user_id = u.id
      WHERE woa.work_order_id = ?
      ORDER BY woa.assigned_at ASC
    `,
      [workOrderId]
    );
  }

  /**
   * Get assignees for multiple work orders
   */
  getAssigneesMap(workOrderIds: number[]): Map<number, WorkOrderAssignee[]> {
    if (workOrderIds.length === 0) return new Map();

    const placeholders = workOrderIds.map(() => '?').join(',');
    const rows = this.query<AssigneeRow>(
      `
      SELECT woa.work_order_id, u.id, u.name, u.email, u.avatar
      FROM work_order_assignees woa
      JOIN users u ON woa.user_id = u.id
      WHERE woa.work_order_id IN (${placeholders})
      ORDER BY woa.assigned_at ASC
    `,
      workOrderIds
    );

    const map = new Map<number, WorkOrderAssignee[]>();
    rows.forEach(row => {
      const existing = map.get(row.work_order_id) || [];
      existing.push({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
      });
      map.set(row.work_order_id, existing);
    });

    return map;
  }

  /**
   * Set assignees for a work order
   */
  setAssignees(workOrderId: number, userIds: number[]): void {
    // Clear existing
    this.execute('DELETE FROM work_order_assignees WHERE work_order_id = ?', [workOrderId]);

    // Add new
    for (const userId of userIds) {
      this.execute(
        'INSERT INTO work_order_assignees (work_order_id, user_id, assigned_at) VALUES (?, ?, datetime("now"))',
        [workOrderId, userId]
      );
    }
  }

  /**
   * Attach assignees to work orders array
   */
  private attachAssignees(workOrders: WorkOrderWithDetails[]): void {
    if (workOrders.length === 0) return;

    const ids = workOrders.map(wo => wo.id);
    const assigneesMap = this.getAssigneesMap(ids);

    workOrders.forEach(wo => {
      wo.assignees = assigneesMap.get(wo.id) || [];
    });
  }

  /**
   * Count by status
   */
  countByStatus(): { status: string; count: number }[] {
    return this.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM work_orders GROUP BY status'
    );
  }
}

// Export singleton instance
export const workOrderRepository = new WorkOrderRepository();
export default workOrderRepository;
