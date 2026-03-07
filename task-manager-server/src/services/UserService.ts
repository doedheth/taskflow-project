/**
 * User Service - Business logic layer
 */

import {
  BaseService,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from './BaseService';
import { UserRepository, userRepository } from '../models/UserRepository';
import {
  User,
  UserWithDetails,
  UserWithStats,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateProfileDTO,
  UserFilter,
  TeamPerformance,
} from '../types/user';
import db from '../database/db';

export class UserService extends BaseService<User, CreateUserDTO, UpdateUserDTO> {
  protected repository: UserRepository;

  constructor(repository: UserRepository = userRepository) {
    super(repository);
    this.repository = repository;
  }

  /**
   * Get all users with details
   */
  getAllWithDetails(filter?: UserFilter): UserWithDetails[] {
    return this.repository.findAllWithDetails(filter);
  }

  /**
   * Get user by ID with details
   */
  getByIdWithDetails(id: number): UserWithDetails {
    const user = this.repository.findByIdWithDetails(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Get user with statistics
   */
  getWithStats(id: number, periodDays: number = 30): UserWithStats {
    const user = this.repository.getUserWithStats(id, periodDays);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  /**
   * Create user
   */
  create(data: CreateUserDTO, userId?: number): User {
    this.validateCreate(data);

    // Check for duplicate email
    const existing = this.repository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    const user = this.repository.create(data, userId);
    this.logActivity(user.id, 'create', userId);

    return user;
  }

  /**
   * Update user
   */
  update(id: number, data: UpdateUserDTO, userId?: number): User | null {
    this.validateUpdate(id, data);

    // Check for duplicate email if updating
    if (data.email) {
      const existing = this.repository.findByEmail(data.email);
      if (existing && existing.id !== id) {
        throw new ConflictError('Email already exists');
      }
    }

    const result = this.repository.update(id, data, userId);

    if (result && userId) {
      this.logActivity(id, 'update', userId);
    }

    return result;
  }

  /**
   * Update user profile (self-update)
   */
  updateProfile(id: number, data: UpdateProfileDTO): UserWithDetails {
    const result = this.repository.update(id, data, id);
    if (!result) {
      throw new NotFoundError('User not found');
    }
    return this.getByIdWithDetails(id);
  }

  /**
   * Change password
   */
  changePassword(id: number, currentPassword: string, newPassword: string): boolean {
    const user = this.repository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    if (!this.repository.verifyPassword(id, currentPassword)) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new ValidationError('Password must be at least 6 characters');
    }

    this.repository.update(id, { password: newPassword }, id);
    this.logActivity(id, 'password_change', id);

    return true;
  }

  /**
   * Get team performance
   */
  getTeamPerformance(periodDays: number = 30): any {
    const users = this.repository.getTeamPerformance(periodDays);

    // Calculate team totals using DISTINCT ticket counts (avoid double-counting)
    const teamTotals = this.repository.getTeamTotals(periodDays);

    // Sort members by recent points (descending) for leaderboard
    const sortedMembers = users.sort((a, b) => 
      (b.stats?.recentPoints || 0) - (a.stats?.recentPoints || 0)
    );

    // Return in the format expected by the frontend
    return {
      period: periodDays,
      teamTotals,
      members: sortedMembers,
    };
  }

  /**
   * Get technicians for assignment
   */
  getTechnicians(): UserWithDetails[] {
    return this.repository.getTechnicians();
  }

  /**
   * Get user performance
   */
  getPerformance(id: number, periodDays: number = 30): any {
    const user = this.repository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user stats
    const userStats = this.repository.getUserStats(id, periodDays) as any;

    // Get tickets by status
    const ticketsByStatus = db.prepare(`
      SELECT 
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) as review,
        SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ?
    `).get(id) as any;

    // Get tickets by priority
    const ticketsByPriority = db.prepare(`
      SELECT 
        SUM(CASE WHEN t.priority = 'low' THEN 1 ELSE 0 END) as low,
        SUM(CASE WHEN t.priority = 'medium' THEN 1 ELSE 0 END) as medium,
        SUM(CASE WHEN t.priority = 'high' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN t.priority = 'critical' THEN 1 ELSE 0 END) as critical
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ?
    `).get(id) as any;

    // Get weekly trend (last 8 weeks)
    const weeklyTrend = db.prepare(`
      WITH weeks AS (
        SELECT 0 as week_offset UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
        UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7
      )
      SELECT 
        w.week_offset as week,
        'Week ' || (8 - w.week_offset) as label,
        (SELECT COUNT(DISTINCT ta.ticket_id) 
         FROM ticket_assignees ta 
         JOIN tickets t ON ta.ticket_id = t.id 
         WHERE ta.user_id = ? 
           AND t.status = 'done'
           AND t.updated_at >= date('now', '-' || ((w.week_offset + 1) * 7) || ' days')
           AND t.updated_at < date('now', '-' || (w.week_offset * 7) || ' days')
        ) as completed,
        (SELECT COALESCE(SUM(t.story_points), 0)
         FROM ticket_assignees ta 
         JOIN tickets t ON ta.ticket_id = t.id 
         WHERE ta.user_id = ? 
           AND t.status = 'done'
           AND t.updated_at >= date('now', '-' || ((w.week_offset + 1) * 7) || ' days')
           AND t.updated_at < date('now', '-' || (w.week_offset * 7) || ' days')
        ) as points
      FROM weeks w
      ORDER BY w.week_offset DESC
    `).all(id, id) as any[];

    // Get recent completed tickets
    const recentCompletedTickets = db.prepare(`
      SELECT t.id, t.ticket_key, t.title, t.status, t.priority, t.story_points, t.updated_at as completed_at,
             d.name as department_name, d.color as department_color
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE ta.user_id = ? AND t.status = 'done'
      ORDER BY t.updated_at DESC
      LIMIT 5
    `).all(id);

    // Get active tickets
    const activeTickets = db.prepare(`
      SELECT t.id, t.ticket_key, t.title, t.status, t.priority, t.story_points, t.due_date,
             d.name as department_name, d.color as department_color
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE ta.user_id = ? AND t.status IN ('todo', 'in_progress', 'review')
      ORDER BY 
        CASE t.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
        t.due_date ASC NULLS LAST
      LIMIT 10
    `).all(id);

    return {
      user: this.getByIdWithDetails(id),
      stats: {
        totalAssigned: userStats.totalAssigned || 0,
        totalCompleted: userStats.totalCompleted || 0,
        completionRate: userStats.completionRate || 0,
        totalStoryPoints: userStats.completedPoints || 0,
        completedStoryPoints: userStats.completedPoints || 0,
        avgResolutionDays: 0, // Not tracked currently
        currentWorkload: userStats.currentWorkload || 0,
        recentCompleted: userStats.recentCompleted || 0,
        recentStoryPoints: userStats.recentPoints || 0,
      },
      ticketsByStatus: {
        todo: ticketsByStatus?.todo || 0,
        in_progress: ticketsByStatus?.in_progress || 0,
        review: ticketsByStatus?.review || 0,
        done: ticketsByStatus?.done || 0,
      },
      ticketsByPriority: {
        low: ticketsByPriority?.low || 0,
        medium: ticketsByPriority?.medium || 0,
        high: ticketsByPriority?.high || 0,
        critical: ticketsByPriority?.critical || 0,
      },
      weeklyTrend,
      recentCompletedTickets,
      activeTickets,
    };
  }

  /**
   * Reset user password (Admin)
   */
  resetPassword(id: number, password?: string): string {
    const user = this.repository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const newPassword = password || this.generateRandomPassword();
    this.repository.update(id, { password: newPassword }, id);
    this.logActivity(id, 'password_reset', id);

    return newPassword;
  }

  /**
   * Generate random password
   */
  private generateRandomPassword(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get user activity
   */
  getUserActivity(id: number, limit: number = 20): any[] {
    const user = this.repository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return db
      .prepare(
        `
      SELECT al.*, 
             t.ticket_key, t.title as ticket_title,
             wo.wo_number, wo.title as wo_title
      FROM activity_log al
      LEFT JOIN tickets t ON al.entity_type = 'ticket' AND al.entity_id = t.id
      LEFT JOIN work_orders wo ON al.entity_type = 'work_order' AND al.entity_id = wo.id
      WHERE al.user_id = ?
      ORDER BY al.created_at DESC
      LIMIT ?
    `
      )
      .all(id, limit);
  }

  /**
   * Validation for create
   */
  protected validateCreate(data: CreateUserDTO): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push({ field: 'email', message: 'Valid email is required' });
    }
    if (!data.password || data.password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters' });
    }
    if (!data.name || data.name.trim() === '') {
      errors.push({ field: 'name', message: 'Name is required' });
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
  }

  /**
   * Email validation helper
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Log activity
   */
  private logActivity(userId: number, action: string, byUserId?: number): void {
    try {
      db.run(
        `
        INSERT INTO activity_log (action, entity_type, entity_id, user_id, created_at)
        VALUES (?, 'user', ?, ?, datetime('now'))
      `,
        [action, userId, byUserId || null]
      );
    } catch (error) {
      console.error('Log activity error:', error);
    }
  }
}

// Export singleton
export const userService = new UserService();
export default userService;
