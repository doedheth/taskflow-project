/**
 * Ticket Repository - Data access layer
 */

import { BaseRepository } from './BaseRepository';
import {
  Ticket,
  TicketWithDetails,
  TicketAssignee,
  TicketComment,
  TicketAttachment,
  CreateTicketDTO,
  UpdateTicketDTO,
  TicketFilter,
} from '../types/ticket';
import { PaginationParams, PaginatedResponse } from '../types/common';

interface AssigneeRow {
  ticket_id: number;
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

interface TicketCounter {
  counter: number;
}

export class TicketRepository extends BaseRepository<Ticket, CreateTicketDTO, UpdateTicketDTO> {
  constructor() {
    super('tickets');
  }

  /**
   * Generate ticket key
   */
  generateTicketKey(): string {
    this.execute('UPDATE ticket_counter SET counter = counter + 1 WHERE id = 1');
    const result = this.queryOne<TicketCounter>('SELECT counter FROM ticket_counter WHERE id = 1');
    return `TM-${result?.counter || 1}`;
  }

  /**
   * Find all with filters and details
   */
  findAllWithDetails(filter: TicketFilter): TicketWithDetails[] {
    let sql = `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.avatar as reporter_avatar,
             d.name as department_name, d.color as department_color,
             epic.ticket_key as epic_key, epic.title as epic_title,
             sprint.name as sprint_name, sprint.status as sprint_status,
             (SELECT COUNT(*) FROM comments WHERE ticket_id = t.id) as comment_count,
             asset.asset_code as asset_code, asset.name as asset_name,
             wo.wo_number as related_wo_number
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN tickets epic ON t.epic_id = epic.id
      LEFT JOIN sprints sprint ON t.sprint_id = sprint.id
      LEFT JOIN assets asset ON t.asset_id = asset.id
      LEFT JOIN work_orders wo ON t.related_wo_id = wo.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter.status) {
      sql += ' AND t.status = ?';
      params.push(filter.status);
    }
    if (filter.type) {
      sql += ' AND t.type = ?';
      params.push(filter.type);
    }
    if (filter.priority) {
      sql += ' AND t.priority = ?';
      params.push(filter.priority);
    }
    if (filter.assignee) {
      sql += ' AND t.id IN (SELECT ticket_id FROM ticket_assignees WHERE user_id = ?)';
      params.push(filter.assignee);
    }
    if (filter.department) {
      sql += ' AND t.department_id = ?';
      params.push(filter.department);
    }
    if (filter.search) {
      sql += ' AND (t.title LIKE ? OR t.ticket_key LIKE ?)';
      params.push(`%${filter.search}%`, `%${filter.search}%`);
    }
    if (filter.sprint !== undefined) {
      if (filter.sprint === 'backlog') {
        sql += ' AND t.sprint_id IS NULL AND t.type != ?';
        params.push('epic');
      } else {
        sql += ' AND t.sprint_id = ?';
        params.push(filter.sprint);
      }
    }
    if (filter.epic_id) {
      sql += ' AND t.epic_id = ?';
      params.push(filter.epic_id);
    }

    sql += ' ORDER BY t.created_at DESC';

    const tickets = this.query<TicketWithDetails>(sql, params);
    this.attachAssignees(tickets);
    return tickets;
  }

  /**
   * Find by ID with full details
   */
  findByIdWithDetails(id: number): TicketWithDetails | undefined {
    const ticket = this.queryOne<TicketWithDetails>(
      `
      SELECT t.*, 
             reporter.name as reporter_name, reporter.email as reporter_email, reporter.avatar as reporter_avatar,
             d.name as department_name, d.color as department_color,
             epic.ticket_key as epic_key, epic.title as epic_title,
             sprint.name as sprint_name, sprint.status as sprint_status,
             asset.asset_code as asset_code, asset.name as asset_name,
             wo.wo_number as related_wo_number
      FROM tickets t
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN tickets epic ON t.epic_id = epic.id
      LEFT JOIN sprints sprint ON t.sprint_id = sprint.id
      LEFT JOIN assets asset ON t.asset_id = asset.id
      LEFT JOIN work_orders wo ON t.related_wo_id = wo.id
      WHERE t.id = ?
    `,
      [id]
    );

    if (ticket) {
      ticket.assignees = this.getAssignees(id);
      ticket.comments = this.getComments(id);
      ticket.attachments = this.getAttachments(id);
    }

    return ticket;
  }

  /**
   * Find by ticket key
   */
  findByTicketKey(ticketKey: string): Ticket | undefined {
    return this.findOneBy('ticket_key', ticketKey);
  }

  /**
   * Find by sprint
   */
  findBySprint(sprintId: number): TicketWithDetails[] {
    return this.findAllWithDetails({ sprint: sprintId });
  }

  /**
   * Find by epic
   */
  findByEpic(epicId: number): TicketWithDetails[] {
    return this.findAllWithDetails({ epic_id: epicId });
  }

  /**
   * Create ticket
   */
  create(data: CreateTicketDTO, userId?: number): Ticket {
    const ticketKey = this.generateTicketKey();

    const result = this.execute(
      `
      INSERT INTO tickets (
        ticket_key, title, description, type, status, priority,
        story_points, reporter_id, department_id, epic_id, sprint_id,
        due_date, asset_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'todo', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        ticketKey,
        data.title,
        data.description || null,
        data.type || 'task',
        data.priority || 'medium',
        data.story_points || null,
        userId,
        data.department_id || null,
        data.epic_id || null,
        data.sprint_id || null,
        data.due_date || null,
        data.asset_id || null,
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
   * Update ticket
   */
  update(id: number, data: UpdateTicketDTO, userId?: number): Ticket | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.type !== undefined) {
      updates.push('type = ?');
      params.push(data.type);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      params.push(data.status);
    }
    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }
    if (data.story_points !== undefined) {
      updates.push('story_points = ?');
      params.push(data.story_points);
    }
    if (data.department_id !== undefined) {
      updates.push('department_id = ?');
      params.push(data.department_id);
    }
    if (data.epic_id !== undefined) {
      updates.push('epic_id = ?');
      params.push(data.epic_id);
    }
    if (data.sprint_id !== undefined) {
      updates.push('sprint_id = ?');
      params.push(data.sprint_id);
    }
    if (data.due_date !== undefined) {
      updates.push('due_date = ?');
      params.push(data.due_date);
    }
    if (data.asset_id !== undefined) {
      updates.push('asset_id = ?');
      params.push(data.asset_id);
    }

    params.push(id);
    this.execute(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`, params);

    // Update assignees if provided
    if (data.assignee_ids !== undefined) {
      this.setAssignees(id, data.assignee_ids);
    }

    return this.findById(id);
  }

  /**
   * Update status only
   */
  updateStatus(id: number, status: string): boolean {
    const result = this.execute(
      'UPDATE tickets SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );
    return result.changes > 0;
  }

  /**
   * Get assignees for a ticket
   */
  getAssignees(ticketId: number): TicketAssignee[] {
    return this.query<TicketAssignee>(
      `
      SELECT u.id, u.name, u.email, u.avatar
      FROM ticket_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.ticket_id = ?
      ORDER BY ta.assigned_at ASC
    `,
      [ticketId]
    );
  }

  /**
   * Get assignees for multiple tickets
   */
  getAssigneesMap(ticketIds: number[]): Map<number, TicketAssignee[]> {
    if (ticketIds.length === 0) return new Map();

    const placeholders = ticketIds.map(() => '?').join(',');
    const rows = this.query<AssigneeRow>(
      `
      SELECT ta.ticket_id, u.id, u.name, u.email, u.avatar
      FROM ticket_assignees ta
      JOIN users u ON ta.user_id = u.id
      WHERE ta.ticket_id IN (${placeholders})
      ORDER BY ta.assigned_at ASC
    `,
      ticketIds
    );

    const map = new Map<number, TicketAssignee[]>();
    rows.forEach(row => {
      const existing = map.get(row.ticket_id) || [];
      existing.push({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
      });
      map.set(row.ticket_id, existing);
    });

    return map;
  }

  /**
   * Set assignees for a ticket
   */
  setAssignees(ticketId: number, userIds: number[]): void {
    // Clear existing
    this.execute('DELETE FROM ticket_assignees WHERE ticket_id = ?', [ticketId]);

    // Add new
    for (const userId of userIds) {
      this.execute(
        'INSERT INTO ticket_assignees (ticket_id, user_id, assigned_at) VALUES (?, ?, datetime("now"))',
        [ticketId, userId]
      );
    }
  }

  /**
   * Get comments for a ticket
   */
  getComments(ticketId: number): TicketComment[] {
    return this.query<TicketComment>(
      `
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = ?
      ORDER BY c.created_at ASC
    `,
      [ticketId]
    );
  }

  /**
   * Add comment
   */
  addComment(ticketId: number, userId: number, content: string): TicketComment {
    const result = this.execute(
      `
      INSERT INTO comments (ticket_id, user_id, content, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `,
      [ticketId, userId, content]
    );

    return this.queryOne<TicketComment>(
      `
      SELECT c.*, u.name as user_name, u.avatar as user_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `,
      [Number(result.lastInsertRowid)]
    )!;
  }

  /**
   * Get attachments for a ticket
   */
  getAttachments(ticketId: number): TicketAttachment[] {
    return this.query<TicketAttachment>(
      `
      SELECT a.*, u.name as uploaded_by_name
      FROM attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.ticket_id = ?
      ORDER BY a.created_at DESC
    `,
      [ticketId]
    );
  }

  /**
   * Attach assignees to tickets array
   */
  private attachAssignees(tickets: TicketWithDetails[]): void {
    if (tickets.length === 0) return;

    const ids = tickets.map(t => t.id);
    const assigneesMap = this.getAssigneesMap(ids);

    tickets.forEach(ticket => {
      ticket.assignees = assigneesMap.get(ticket.id) || [];
    });
  }

  /**
   * Count by status
   */
  countByStatus(): { status: string; count: number }[] {
    return this.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM tickets GROUP BY status'
    );
  }

  /**
   * Search tickets
   */
  search(query: string, limit: number = 20): TicketWithDetails[] {
    const tickets = this.query<TicketWithDetails>(
      `
      SELECT t.*, d.name as department_name, d.color as department_color
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE t.title LIKE ? OR t.ticket_key LIKE ? OR t.description LIKE ?
      ORDER BY t.updated_at DESC
      LIMIT ?
    `,
      [`%${query}%`, `%${query}%`, `%${query}%`, limit]
    );

    this.attachAssignees(tickets);
    return tickets;
  }
}

// Export singleton instance
export const ticketRepository = new TicketRepository();
export default ticketRepository;
