/**
 * Ticket Service - Business logic layer
 */

import { BaseService, ValidationError, NotFoundError, ConflictError } from './BaseService';
import { TicketRepository, ticketRepository } from '../models/TicketRepository';
import { WorkOrderRepository, workOrderRepository } from '../models/WorkOrderRepository';
import {
  Ticket,
  TicketWithDetails,
  TicketComment,
  CreateTicketDTO,
  UpdateTicketDTO,
  CreateCommentDTO,
  TicketFilter,
  QuickMaintenanceDTO,
  QuickMaintenanceResult,
} from '../types/ticket';
import db from '../database/db';

export class TicketService extends BaseService<Ticket, CreateTicketDTO, UpdateTicketDTO> {
  protected repository: TicketRepository;
  protected workOrderRepository: WorkOrderRepository;

  constructor(
    repository: TicketRepository = ticketRepository,
    woRepository: WorkOrderRepository = workOrderRepository
  ) {
    super(repository);
    this.repository = repository;
    this.workOrderRepository = woRepository;
  }

  /**
   * Get all tickets with filters
   */
  getAllWithDetails(filter: TicketFilter): TicketWithDetails[] {
    return this.repository.findAllWithDetails(filter);
  }

  /**
   * Get ticket by ID with full details
   */
  getByIdWithDetails(id: number): TicketWithDetails {
    const ticket = this.repository.findByIdWithDetails(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }
    return ticket;
  }

  /**
   * Get ticket by ticket key
   */
  getByTicketKey(ticketKey: string): TicketWithDetails {
    const ticket = this.repository.findByTicketKey(ticketKey);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }
    return this.getByIdWithDetails(ticket.id);
  }

  /**
   * Get tickets by sprint
   */
  getBySprint(sprintId: number): TicketWithDetails[] {
    return this.repository.findBySprint(sprintId);
  }

  /**
   * Get tickets by epic
   */
  getByEpic(epicId: number): TicketWithDetails[] {
    return this.repository.findByEpic(epicId);
  }

  /**
   * Create new ticket
   */
  create(data: CreateTicketDTO, userId?: number): Ticket {
    this.validateCreate(data);

    const ticket = this.repository.create(data, userId);

    // Notify assignees
    if (data.assignee_ids && data.assignee_ids.length > 0 && userId) {
      this.notifyAssignees(ticket.id, data.assignee_ids, 'assigned', userId);
    }

    // Log activity
    this.logActivity(ticket.id, 'create', userId);

    return ticket;
  }

  /**
   * Update ticket
   */
  update(id: number, data: UpdateTicketDTO, userId?: number): Ticket | null {
    this.validateUpdate(id, data);

    const oldTicket = this.repository.findById(id);
    const result = this.repository.update(id, data, userId);

    if (result && userId) {
      // Notify new assignees
      if (data.assignee_ids) {
        const oldAssignees = this.repository.getAssignees(id);
        const oldIds = oldAssignees.map(a => a.id);
        const newIds = data.assignee_ids.filter(id => !oldIds.includes(id));
        if (newIds.length > 0) {
          this.notifyAssignees(id, newIds, 'assigned', userId);
        }
      }

      // Notify status change
      if (data.status && oldTicket && data.status !== oldTicket.status) {
        this.notifyStatusChange(id, data.status, userId);
      }

      // Log activity
      this.logActivity(id, 'update', userId, data);
    }

    return result;
  }

  /**
   * Update ticket status
   */
  updateStatus(id: number, status: string, userId?: number): TicketWithDetails {
    const ticket = this.repository.findById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const validStatuses = ['todo', 'in_progress', 'review', 'done'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status', [
        { field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` },
      ]);
    }

    this.repository.updateStatus(id, status);

    // Notify status change
    if (userId) {
      this.notifyStatusChange(id, status, userId);
      this.logActivity(id, 'status_change', userId, {
        old_status: ticket.status,
        new_status: status,
      });
    }

    return this.getByIdWithDetails(id);
  }

  /**
   * Add comment to ticket
   */
  addComment(ticketId: number, data: CreateCommentDTO, userId: number): TicketComment {
    const ticket = this.repository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    if (!data.content || data.content.trim() === '') {
      throw new ValidationError('Comment content is required');
    }

    const comment = this.repository.addComment(ticketId, userId, data.content);

    // Notify ticket reporter and assignees
    this.notifyComment(ticketId, userId);

    // Log activity
    this.logActivity(ticketId, 'comment', userId);

    return comment;
  }

  /**
   * Quick maintenance - create ticket and work order together
   */
  quickMaintenance(data: QuickMaintenanceDTO, userId: number): QuickMaintenanceResult {
    this.validateQuickMaintenance(data);

    try {
      this.repository.beginTransaction();

      // 1. Create maintenance ticket
      const ticketData: CreateTicketDTO = {
        title: data.title,
        description: data.description,
        type: 'task',
        priority: data.priority,
        asset_id: data.asset_id,
        assignee_ids: data.assignee_ids,
      };

      const ticket = this.repository.create(ticketData, userId);

      // 2. Create work order linked to ticket
      const woData = {
        asset_id: data.asset_id,
        type: data.wo_type || ('corrective' as const),
        priority: data.priority,
        title: `[${ticket.ticket_key}] ${data.title}`,
        description: data.description,
        related_ticket_id: ticket.id,
        assignee_ids: data.assignee_ids,
      };

      const workOrder = this.workOrderRepository.create(woData, userId);

      // 3. Update ticket with related WO
      db.run('UPDATE tickets SET related_wo_id = ? WHERE id = ?', [workOrder.id, ticket.id]);

      this.repository.commit();

      // Log activity
      this.logActivity(ticket.id, 'quick_maintenance', userId, {
        wo_number: workOrder.wo_number,
      });

      const ticketWithDetails = this.getByIdWithDetails(ticket.id);

      return {
        ticket: ticketWithDetails,
        workOrder: {
          id: workOrder.id,
          wo_number: workOrder.wo_number,
          title: workOrder.title,
        },
      };
    } catch (error) {
      this.repository.rollback();
      throw error;
    }
  }

  /**
   * Search tickets
   */
  search(query: string, limit: number = 20): TicketWithDetails[] {
    return this.repository.search(query, limit);
  }

  /**
   * Validation for create
   */
  protected validateCreate(data: CreateTicketDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    }

    if (data.type && !['bug', 'task', 'story', 'epic'].includes(data.type)) {
      errors.push({ field: 'type', message: 'Invalid ticket type' });
    }

    if (data.priority && !['low', 'medium', 'high', 'critical'].includes(data.priority)) {
      errors.push({ field: 'priority', message: 'Invalid priority' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Validation for quick maintenance
   */
  private validateQuickMaintenance(data: QuickMaintenanceDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push({ field: 'title', message: 'Title must be at least 3 characters' });
    }

    if (!data.asset_id) {
      errors.push({ field: 'asset_id', message: 'Asset is required' });
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

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Notify assignees
   */
  private notifyAssignees(
    ticketId: number,
    userIds: number[],
    action: string,
    fromUserId: number
  ): void {
    try {
      const ticket = this.repository.findById(ticketId);
      if (!ticket) return;

      const fromUser = db.prepare('SELECT name FROM users WHERE id = ?').get(fromUserId) as
        | { name: string }
        | undefined;

      const message =
        action === 'assigned'
          ? `You have been assigned to ticket ${ticket.ticket_key}`
          : `Ticket ${ticket.ticket_key} has been updated`;

      for (const userId of userIds) {
        if (userId !== fromUserId) {
          db.run(
            `
            INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
            VALUES (?, 'ticket_assigned', ?, ?, ?, ?, ?, ?)
          `,
            [
              userId,
              ticket.ticket_key,
              message,
              ticketId,
              ticket.ticket_key,
              fromUserId,
              fromUser?.name || 'Unknown',
            ]
          );
        }
      }
    } catch (error) {
      console.error('Notify assignees error:', error);
    }
  }

  /**
   * Notify status change
   */
  private notifyStatusChange(ticketId: number, newStatus: string, userId: number): void {
    try {
      const ticket = this.repository.findById(ticketId);
      if (!ticket) return;

      const fromUser = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as
        | { name: string }
        | undefined;

      // Notify reporter if different from updater
      if (ticket.reporter_id && ticket.reporter_id !== userId) {
        db.run(
          `
          INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
          VALUES (?, 'ticket_updated', ?, ?, ?, ?, ?, ?)
        `,
          [
            ticket.reporter_id,
            ticket.ticket_key,
            `Ticket ${ticket.ticket_key} status changed to ${newStatus}`,
            ticketId,
            ticket.ticket_key,
            userId,
            fromUser?.name || 'Unknown',
          ]
        );
      }

      // Notify assignees
      const assignees = this.repository.getAssignees(ticketId);
      for (const assignee of assignees) {
        if (assignee.id !== userId) {
          db.run(
            `
            INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
            VALUES (?, 'ticket_updated', ?, ?, ?, ?, ?, ?)
          `,
            [
              assignee.id,
              ticket.ticket_key,
              `Ticket ${ticket.ticket_key} status changed to ${newStatus}`,
              ticketId,
              ticket.ticket_key,
              userId,
              fromUser?.name || 'Unknown',
            ]
          );
        }
      }
    } catch (error) {
      console.error('Notify status change error:', error);
    }
  }

  /**
   * Notify comment added
   */
  private notifyComment(ticketId: number, userId: number): void {
    try {
      const ticket = this.repository.findById(ticketId);
      if (!ticket) return;

      const fromUser = db.prepare('SELECT name FROM users WHERE id = ?').get(userId) as
        | { name: string }
        | undefined;

      // Notify reporter if different
      if (ticket.reporter_id && ticket.reporter_id !== userId) {
        db.run(
          `
          INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
          VALUES (?, 'ticket_comment', ?, ?, ?, ?, ?, ?)
        `,
          [
            ticket.reporter_id,
            ticket.ticket_key,
            `New comment on ticket ${ticket.ticket_key}`,
            ticketId,
            ticket.ticket_key,
            userId,
            fromUser?.name || 'Unknown',
          ]
        );
      }

      // Notify assignees
      const assignees = this.repository.getAssignees(ticketId);
      for (const assignee of assignees) {
        if (assignee.id !== userId) {
          db.run(
            `
            INSERT INTO notifications (user_id, type, title, message, ticket_id, ticket_key, actor_id, actor_name)
            VALUES (?, 'ticket_comment', ?, ?, ?, ?, ?, ?)
          `,
            [
              assignee.id,
              ticket.ticket_key,
              `New comment on ticket ${ticket.ticket_key}`,
              ticketId,
              ticket.ticket_key,
              userId,
              fromUser?.name || 'Unknown',
            ]
          );
        }
      }
    } catch (error) {
      console.error('Notify comment error:', error);
    }
  }

  /**
   * Log activity
   */
  private logActivity(ticketId: number, action: string, userId?: number, details?: any): void {
    try {
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, details, created_at)
        VALUES (?, 'ticket', ?, ?, ?, datetime('now'))
      `,
        [action, ticketId, userId || null, details ? JSON.stringify(details) : null]
      );
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }

  /**
   * Add assignee to ticket
   */
  addAssignee(ticketId: number, userId: number, byUserId?: number): TicketWithDetails {
    const ticket = this.repository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    // Check if already assigned
    const existing = db.prepare(
      'SELECT 1 FROM ticket_assignees WHERE ticket_id = ? AND user_id = ?'
    ).get(ticketId, userId);

    if (existing) {
      throw new ConflictError('User is already assigned to this ticket');
    }

    // Add assignee
    db.run(
      'INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES (?, ?, datetime("now"))',
      [ticketId, userId]
    );

    // Log activity
    this.logActivity(ticketId, 'assignee_added', byUserId, { assignee_id: userId });

    // Notify assignee
    this.notifyAssignees(ticketId, [userId], 'assigned', byUserId || 0);

    return this.getByIdWithDetails(ticketId);
  }

  /**
   * Remove assignee from ticket
   */
  removeAssignee(ticketId: number, userId: number, byUserId?: number): TicketWithDetails {
    const ticket = this.repository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found');
    }

    const result = db.run(
      'DELETE FROM ticket_assignees WHERE ticket_id = ? AND user_id = ?',
      [ticketId, userId]
    );

    if (result.changes === 0) {
      throw new NotFoundError('Assignee not found');
    }

    // Log activity
    this.logActivity(ticketId, 'assignee_removed', byUserId, { assignee_id: userId });

    return this.getByIdWithDetails(ticketId);
  }

  /**
   * Get ticket statistics
   */
  getStatistics(): {
    total: number;
    byStatus: { status: string; count: number }[];
    createdThisWeek: number;
    completedThisWeek: number;
  } {
    const total = this.repository.count();
    const byStatus = this.repository.countByStatus();

    const createdThisWeek = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets 
      WHERE created_at >= date('now', '-7 days')
    `
      )
      .get() as { count: number };

    const completedThisWeek = db
      .prepare(
        `
      SELECT COUNT(*) as count FROM tickets 
      WHERE status = 'done' 
      AND updated_at >= date('now', '-7 days')
    `
      )
      .get() as { count: number };

    return {
      total,
      byStatus,
      createdThisWeek: createdThisWeek.count,
      completedThisWeek: completedThisWeek.count,
    };
  }
}

// Export singleton instance
export const ticketService = new TicketService();
export default ticketService;
