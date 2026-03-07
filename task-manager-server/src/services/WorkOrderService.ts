/**
 * Work Order Service - Business logic layer
 */

import { BaseService, ValidationError, NotFoundError, ForbiddenError, ConflictError } from './BaseService';
import { WorkOrderRepository, workOrderRepository } from '../models/WorkOrderRepository';
import {
  WorkOrder,
  WorkOrderWithDetails,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO,
  CompleteWorkOrderDTO,
  WorkOrderFilter,
} from '../types/workOrder';
import { PaginationParams, PaginatedResponse } from '../types/common';
import db from '../database/db';

export class WorkOrderService extends BaseService<
  WorkOrder,
  CreateWorkOrderDTO,
  UpdateWorkOrderDTO
> {
  protected repository: WorkOrderRepository;

  constructor(repository: WorkOrderRepository = workOrderRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Get all work orders with filters
   */
  getAllWithDetails(
    filter: WorkOrderFilter,
    pagination?: PaginationParams
  ): WorkOrderWithDetails[] | PaginatedResponse<WorkOrderWithDetails> {
    return this.repository.findAllWithDetails(filter, pagination);
  }

  /**
   * Get work order by ID with all details
   */
  getByIdWithDetails(id: number): WorkOrderWithDetails {
    const workOrder = this.repository.findByIdWithDetails(id);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }
    return workOrder;
  }

  /**
   * Get work orders by ticket ID
   */
  getByTicketId(ticketId: number): WorkOrderWithDetails[] {
    return this.repository.findByTicketId(ticketId);
  }

  /**
   * Create new work order
   */
  create(data: CreateWorkOrderDTO, userId?: number): WorkOrder {
    this.validateCreate(data);

    const workOrder = this.repository.create(data, userId);

    // Create notifications for assignees
    if (data.assignee_ids && data.assignee_ids.length > 0) {
      this.notifyAssignees(workOrder.id, data.assignee_ids, 'assigned', userId);
    }

    // Update related ticket status if exists
    if (data.related_ticket_id) {
      this.updateRelatedTicketStatus(data.related_ticket_id, 'wo_created');
    }

    return workOrder;
  }

  /**
   * Start work order
   */
  start(id: number, userId?: number): WorkOrderWithDetails {
    const workOrder = this.repository.findById(id);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    if (workOrder.status !== 'open') {
      throw new ValidationError('Work order must be in "open" status to start');
    }

    this.repository.start(id);

    // Create downtime log
    this.createDowntimeLog(workOrder, userId);

    // Update related ticket status
    if (workOrder.related_ticket_id) {
      this.updateRelatedTicketStatus(workOrder.related_ticket_id, 'wo_started');
    }

    // Log activity
    this.logActivity(id, 'start', userId);

    return this.getByIdWithDetails(id);
  }

  /**
   * Complete work order
   */
  complete(id: number, data: CompleteWorkOrderDTO, userId?: number): WorkOrderWithDetails {
    const workOrder = this.repository.findById(id);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    if (workOrder.status !== 'in_progress') {
      throw new ValidationError('Work order must be in "in_progress" status to complete');
    }

    this.repository.complete(id, data);

    // Close downtime log
    this.closeDowntimeLog(workOrder);

    // Update PM schedule if this is a preventive maintenance work order
    if (workOrder.maintenance_schedule_id) {
      this.updateMaintenanceSchedule(workOrder.maintenance_schedule_id);
    }

    // Update related ticket status
    if (workOrder.related_ticket_id) {
      this.updateRelatedTicketStatus(workOrder.related_ticket_id, 'wo_completed');
    }

    // Log activity
    this.logActivity(id, 'complete', userId);

    return this.getByIdWithDetails(id);
  }

  /**
   * Cancel work order
   */
  cancel(id: number, userId?: number): WorkOrderWithDetails {
    const workOrder = this.repository.findById(id);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    if (!['open', 'in_progress'].includes(workOrder.status)) {
      throw new ValidationError('Work order cannot be cancelled in current status');
    }

    this.repository.cancel(id);

    // Close downtime log if in progress
    if (workOrder.status === 'in_progress') {
      this.closeDowntimeLog(workOrder, 'cancelled');
    }

    // Log activity
    this.logActivity(id, 'cancel', userId);

    return this.getByIdWithDetails(id);
  }

  /**
   * Validation for create
   */
  protected validateCreate(data: CreateWorkOrderDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.asset_id) {
      errors.push({ field: 'asset_id', message: 'Asset is required' });
    }
    if (!data.type) {
      errors.push({ field: 'type', message: 'Type is required' });
    }
    if (!data.priority) {
      errors.push({ field: 'priority', message: 'Priority is required' });
    }
    if (!data.title || data.title.trim() === '') {
      errors.push({ field: 'title', message: 'Title is required' });
    }
    if (!data.assignee_ids || data.assignee_ids.length === 0) {
      errors.push({ field: 'assignee_ids', message: 'At least one assignee is required' });
    }

    // Validate asset exists
    if (data.asset_id) {
      const asset = db.prepare('SELECT id FROM assets WHERE id = ?').get(data.asset_id);
      if (!asset) {
        errors.push({ field: 'asset_id', message: 'Asset not found' });
      }
    }

    // Validate related ticket if provided
    if (data.related_ticket_id) {
      const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(data.related_ticket_id);
      if (!ticket) {
        errors.push({ field: 'related_ticket_id', message: 'Related ticket not found' });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Create downtime log when WO starts
   */
  private createDowntimeLog(workOrder: WorkOrder, userId?: number): void {
    try {
      // Determine classification based on WO type and production schedule
      let classificationCode: string;
      let downtimeType: string;

      if (workOrder.type === 'preventive') {
        downtimeType = 'planned';
        
        // Check production schedule to determine PM classification
        const today = new Date().toISOString().split('T')[0];
        const schedule = db.prepare(`
          SELECT status FROM production_schedule 
          WHERE asset_id = ? AND date(date) = date(?)
          LIMIT 1
        `).get(workOrder.asset_id, today) as { status: string } | undefined;

        if (schedule) {
          switch (schedule.status) {
            case 'maintenance_window':
              classificationCode = 'PM-WINDOW';
              break;
            case 'scheduled':
              classificationCode = 'PM-PROD';
              break;
            default:
              classificationCode = 'PM-IDLE';
          }
        } else {
          // No schedule found, default to PM-IDLE
          classificationCode = 'PM-IDLE';
        }
      } else {
        // Corrective/Emergency - use breakdown classification
        downtimeType = 'unplanned';
        
        // Check production schedule for breakdown classification
        const today = new Date().toISOString().split('T')[0];
        const schedule = db.prepare(`
          SELECT status FROM production_schedule 
          WHERE asset_id = ? AND date(date) = date(?)
          LIMIT 1
        `).get(workOrder.asset_id, today) as { status: string } | undefined;

        if (schedule && schedule.status === 'scheduled') {
          classificationCode = 'BD-PROD';
        } else {
          classificationCode = 'BD-IDLE';
        }
      }
      
      const classification = db
        .prepare(
          'SELECT id FROM downtime_classifications WHERE code = ? LIMIT 1'
        )
        .get(classificationCode) as { id: number } | undefined;

      const result = db.prepare(
        `
        INSERT INTO downtime_logs (
          asset_id, start_time, reason, downtime_type, classification_id,
          work_order_id, logged_by, created_at
        ) VALUES (?, datetime('now'), ?, ?, ?, ?, ?, datetime('now'))
      `
      ).run(
        workOrder.asset_id,
        `Work Order: ${workOrder.wo_number} - ${workOrder.title}`,
        downtimeType,
        classification?.id || null,
        workOrder.id,
        userId || null
      );

      console.log(`✅ Created downtime log for WO ${workOrder.wo_number} (${classificationCode}), inserted ID: ${result.lastInsertRowid}`);
    } catch (error) {
      console.error('Create downtime log error:', error);
      // Don't throw - downtime log is secondary
    }
  }

  /**
   * Close downtime log when WO completes/cancels
   */
  private closeDowntimeLog(workOrder: WorkOrder, status: string = 'resolved'): void {
    try {
      db.run(
        `
        UPDATE downtime_logs 
        SET end_time = datetime('now'), 
            status = ?,
            updated_at = datetime('now')
        WHERE work_order_id = ? AND end_time IS NULL
      `,
        [status, workOrder.id]
      );
    } catch (error) {
      console.error('Close downtime log error:', error);
    }
  }

  /**
   * Update PM schedule when work order completes
   * - Sets last_performed to today
   * - Calculates and sets new next_due based on frequency
   */
  private updateMaintenanceSchedule(scheduleId: number): void {
    try {
      // Get the maintenance schedule
      const schedule = db.prepare(`
        SELECT id, frequency_type, frequency_value, next_due
        FROM maintenance_schedules 
        WHERE id = ?
      `).get(scheduleId) as {
        id: number;
        frequency_type: string;
        frequency_value: number;
        next_due: string;
      } | undefined;

      if (!schedule) {
        console.warn(`Maintenance schedule ${scheduleId} not found`);
        return;
      }

      // Calculate new next_due based on frequency
      const today = new Date();
      let nextDue = new Date(today);

      switch (schedule.frequency_type) {
        case 'daily':
          nextDue.setDate(nextDue.getDate() + schedule.frequency_value);
          break;
        case 'weekly':
          nextDue.setDate(nextDue.getDate() + (schedule.frequency_value * 7));
          break;
        case 'monthly':
          nextDue.setMonth(nextDue.getMonth() + schedule.frequency_value);
          break;
        case 'quarterly':
          nextDue.setMonth(nextDue.getMonth() + (schedule.frequency_value * 3));
          break;
        case 'yearly':
          nextDue.setFullYear(nextDue.getFullYear() + schedule.frequency_value);
          break;
        case 'runtime_hours':
          // For runtime-based PM, don't auto-calculate next_due
          // It should be triggered by actual runtime hours
          console.log(`PM schedule ${scheduleId} is runtime-based, skipping auto next_due calculation`);
          db.run(`
            UPDATE maintenance_schedules 
            SET last_performed = date('now'),
                updated_at = datetime('now')
            WHERE id = ?
          `, [scheduleId]);
          return;
        default:
          console.warn(`Unknown frequency type: ${schedule.frequency_type}`);
          return;
      }

      const nextDueStr = nextDue.toISOString().split('T')[0];

      // Update the schedule
      db.run(`
        UPDATE maintenance_schedules 
        SET last_performed = date('now'),
            next_due = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `, [nextDueStr, scheduleId]);

      console.log(`✅ PM schedule ${scheduleId} updated: last_performed = today, next_due = ${nextDueStr}`);
    } catch (error) {
      console.error('Update maintenance schedule error:', error);
      // Don't throw - PM schedule update is secondary
    }
  }

  /**
   * Update related ticket status based on WO action
   */
  private updateRelatedTicketStatus(ticketId: number, action: string): void {
    try {
      let newStatus: string | null = null;

      if (action === 'wo_started') {
        // Check if ticket is in todo/open/backlog, change to in_progress
        const ticket = db.prepare('SELECT status FROM tickets WHERE id = ?').get(ticketId) as
          | { status: string }
          | undefined;
        if (ticket && ['todo', 'open', 'backlog'].includes(ticket.status)) {
          newStatus = 'in_progress';
        }
      } else if (action === 'wo_completed') {
        // Check if all work orders for this ticket are completed
        const openWOs = db
          .prepare(
            `
          SELECT COUNT(*) as count FROM work_orders 
          WHERE related_ticket_id = ? AND status NOT IN ('completed', 'cancelled')
        `
          )
          .get(ticketId) as { count: number };

        if (openWOs.count === 0) {
          newStatus = 'done';
        }
      }

      if (newStatus) {
        db.run('UPDATE tickets SET status = ?, updated_at = datetime("now") WHERE id = ?', [
          newStatus,
          ticketId,
        ]);
      }
    } catch (error) {
      console.error('Update related ticket status error:', error);
    }
  }

  /**
   * Create notifications for assignees
   */
  private notifyAssignees(
    workOrderId: number,
    userIds: number[],
    action: string,
    fromUserId?: number
  ): void {
    try {
      const wo = this.repository.findById(workOrderId);
      if (!wo) return;

      const message =
        action === 'assigned'
          ? `You have been assigned to work order ${wo.wo_number}`
          : `Work order ${wo.wo_number} has been updated`;

      for (const userId of userIds) {
        if (userId !== fromUserId) {
          db.run(
            `
            INSERT INTO notifications (user_id, type, message, link, created_at)
            VALUES (?, 'work_order', ?, ?, datetime('now'))
          `,
            [userId, message, `/work-orders/${workOrderId}`]
          );
        }
      }
    } catch (error) {
      console.error('Notify assignees error:', error);
    }
  }

  /**
   * Log activity
   */
  private logActivity(workOrderId: number, action: string, userId?: number): void {
    try {
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, details, created_at)
        VALUES (?, 'work_order', ?, ?, ?, datetime('now'))
      `,
        [action, workOrderId, userId || null, JSON.stringify({ action })]
      );
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Get work order statistics
   */
  getStatistics(): {
    total: number;
    byStatus: { status: string; count: number }[];
    completedThisMonth: number;
    avgCompletionTime: number | null;
  } {
    const total = this.repository.count();
    const byStatus = this.repository.countByStatus();

    const completedThisMonth = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM work_orders 
      WHERE status = 'completed' 
      AND actual_end >= date('now', 'start of month')
    `
      )
      .get() as { count: number };

    const avgTime = db
      .prepare(
        `
      SELECT AVG(
        (julianday(actual_end) - julianday(actual_start)) * 24
      ) as avg_hours
      FROM work_orders 
      WHERE status = 'completed' 
      AND actual_start IS NOT NULL 
      AND actual_end IS NOT NULL
    `
      )
      .get() as { avg_hours: number | null };

    return {
      total,
      byStatus,
      completedThisMonth: completedThisMonth.count,
      avgCompletionTime: avgTime.avg_hours,
    };
  }

  /**
   * Create work order from ticket
   */
  createFromTicket(ticketId: number, data: CreateWorkOrderDTO, userId?: number): WorkOrder {
    // Verify ticket exists
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Auto-fill title from ticket if not provided
    if (!data.title) {
      data.title = `[${ticket.ticket_key}] ${ticket.title}`;
    }

    // Auto-fill description from ticket if not provided
    if (!data.description && ticket.description) {
      data.description = ticket.description;
    }

    // Set related_ticket_id
    data.related_ticket_id = ticketId;

    // Create work order
    const workOrder = this.create(data, userId);

    // Update ticket with related WO
    db.run('UPDATE tickets SET related_wo_id = ? WHERE id = ?', [workOrder.id, ticketId]);

    // Update ticket status to in_progress if it's in todo/backlog
    if (['todo', 'backlog', 'open'].includes(ticket.status)) {
      db.run('UPDATE tickets SET status = ?, updated_at = datetime("now") WHERE id = ?', ['in_progress', ticketId]);
    }

    return workOrder;
  }

  /**
   * Add assignee to work order
   */
  addAssignee(workOrderId: number, userId: number, byUserId?: number): WorkOrderWithDetails {
    const workOrder = this.repository.findById(workOrderId);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    // Check if already assigned
    const existing = db.prepare(
      'SELECT 1 FROM work_order_assignees WHERE work_order_id = ? AND user_id = ?'
    ).get(workOrderId, userId);

    if (existing) {
      throw new ConflictError('User is already assigned to this work order');
    }

    // Add assignee
    db.run(
      'INSERT INTO work_order_assignees (work_order_id, user_id, assigned_at) VALUES (?, ?, datetime("now"))',
      [workOrderId, userId]
    );

    // Log activity
    this.logActivity(workOrderId, 'assignee_added', byUserId);

    // Notify assignee
    this.notifyAssignees(workOrderId, [userId], 'assigned', byUserId);

    return this.getByIdWithDetails(workOrderId);
  }

  /**
   * Remove assignee from work order
   */
  removeAssignee(workOrderId: number, userId: number, byUserId?: number): WorkOrderWithDetails {
    const workOrder = this.repository.findById(workOrderId);
    if (!workOrder) {
      throw new NotFoundError('Work order not found');
    }

    const result = db.run(
      'DELETE FROM work_order_assignees WHERE work_order_id = ? AND user_id = ?',
      [workOrderId, userId]
    );

    if (result.changes === 0) {
      throw new NotFoundError('Assignee not found');
    }

    // Log activity
    this.logActivity(workOrderId, 'assignee_removed', byUserId);

    return this.getByIdWithDetails(workOrderId);
  }
}

// Export singleton instance
export const workOrderService = new WorkOrderService();
export default workOrderService;
