/**
 * User Repository - Data access layer
 */

import { BaseRepository } from './BaseRepository';
import {
  User,
  UserWithDetails,
  UserWithStats,
  CreateUserDTO,
  UpdateUserDTO,
  UserFilter,
} from '../types/user';
import bcrypt from 'bcryptjs';

export class UserRepository extends BaseRepository<User, CreateUserDTO, UpdateUserDTO> {
  constructor() {
    super('users');
  }

  /**
   * Find all with details (excluding password)
   */
  findAllWithDetails(filter?: UserFilter): UserWithDetails[] {
    let sql = `
      SELECT u.id, u.email, u.name, u.avatar, u.whatsapp, u.role, 
             u.department_id, u.created_at, u.updated_at,
             d.name as department_name, d.color as department_color
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.role) {
      sql += ' AND u.role = ?';
      params.push(filter.role);
    }
    if (filter?.department_id) {
      sql += ' AND u.department_id = ?';
      params.push(filter.department_id);
    }
    if (filter?.search) {
      sql += ' AND (u.name LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm);
    }

    sql += ' ORDER BY u.name ASC';

    return this.query<UserWithDetails>(sql, params);
  }

  /**
   * Find by ID with details (excluding password)
   */
  findByIdWithDetails(id: number): UserWithDetails | undefined {
    return this.queryOne<UserWithDetails>(
      `
      SELECT u.id, u.email, u.name, u.avatar, u.whatsapp, u.role, 
             u.department_id, u.created_at, u.updated_at,
             d.name as department_name, d.color as department_color
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `,
      [id]
    );
  }

  /**
   * Find by email (includes password for auth)
   */
  findByEmail(email: string): User | undefined {
    return this.queryOne<User>('SELECT * FROM users WHERE email = ?', [email]);
  }

  /**
   * Create user
   */
  create(data: CreateUserDTO, userId?: number): User {
    // Hash password
    const hashedPassword = bcrypt.hashSync(data.password, 10);

    const result = this.execute(
      `
      INSERT INTO users (email, password, name, avatar, whatsapp, role, department_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      [
        data.email,
        hashedPassword,
        data.name,
        data.avatar || null,
        data.whatsapp || null,
        data.role || 'technician',
        data.department_id || null,
      ]
    );

    return this.findById(Number(result.lastInsertRowid))!;
  }

  /**
   * Update user
   */
  update(id: number, data: UpdateUserDTO, userId?: number): User | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = ['updated_at = datetime("now")'];
    const params: any[] = [];

    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email);
    }
    if (data.password !== undefined) {
      updates.push('password = ?');
      params.push(bcrypt.hashSync(data.password, 10));
    }
    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(data.avatar);
    }
    if (data.whatsapp !== undefined) {
      updates.push('whatsapp = ?');
      params.push(data.whatsapp);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      params.push(data.role);
    }
    if (data.department_id !== undefined) {
      updates.push('department_id = ?');
      params.push(data.department_id);
    }

    params.push(id);
    this.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    return this.findById(id);
  }

  /**
   * Get user with stats
   */
  getUserWithStats(id: number, periodDays: number = 30): UserWithStats | undefined {
    const user = this.findByIdWithDetails(id);
    if (!user) return undefined;

    const stats = this.getUserStats(id, periodDays);
    return { ...user, stats };
  }

  /**
   * Get user statistics
   */
  getUserStats(userId: number, periodDays: number = 30): UserWithStats['stats'] {
    const totalAssigned = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? AND t.type != 'epic'
    `,
      [userId]
    );

    const totalCompleted = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? AND t.status = 'done' AND t.type != 'epic'
    `,
      [userId]
    );

    const completedPoints = this.queryOne<{ total: number }>(
      `
      SELECT COALESCE(SUM(t.story_points), 0) as total
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? AND t.status = 'done' AND t.type != 'epic'
    `,
      [userId]
    );

    const recentCompleted = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? 
        AND t.status = 'done' 
        AND t.type != 'epic'
        AND t.updated_at >= datetime('now', '-' || ? || ' days')
    `,
      [userId, periodDays]
    );

    const recentPoints = this.queryOne<{ total: number }>(
      `
      SELECT COALESCE(SUM(t.story_points), 0) as total
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? 
        AND t.status = 'done' 
        AND t.type != 'epic'
        AND t.updated_at >= datetime('now', '-' || ? || ' days')
    `,
      [userId, periodDays]
    );

    const currentWorkload = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? AND t.status IN ('todo', 'in_progress') AND t.type != 'epic'
    `,
      [userId]
    );

    // Today's load for this user
    const todayLoad = this.queryOne<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM ticket_assignees ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.user_id = ? 
        AND t.type != 'epic'
        AND t.status IN ('todo', 'in_progress')
        AND (
          date(t.due_date) = date('now')
          OR date(t.updated_at) = date('now')
          OR date(t.created_at) = date('now')
        )
    `,
      [userId]
    );

    const assigned = totalAssigned?.count || 0;
    const completed = totalCompleted?.count || 0;
    const completionRate = assigned > 0 ? (completed / assigned) * 100 : 0;

    return {
      totalAssigned: assigned,
      totalCompleted: completed,
      completedPoints: completedPoints?.total || 0,
      recentCompleted: recentCompleted?.count || 0,
      recentPoints: recentPoints?.total || 0,
      currentWorkload: currentWorkload?.count || 0,
      todayLoad: todayLoad?.count || 0,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  /**
   * Get team performance
   */
  getTeamPerformance(periodDays: number = 30): UserWithStats[] {
    const users = this.findAllWithDetails();
    return users.map(user => ({
      ...user,
      stats: this.getUserStats(user.id, periodDays),
    }));
  }

  /**
   * Get team totals with DISTINCT ticket counts (avoid double-counting)
   */
  getTeamTotals(periodDays: number = 30): {
    totalAssigned: number;
    totalCompleted: number;
    completedPoints: number;
    recentCompleted: number;
    recentPoints: number;
    currentWorkload: number;
    todayLoad: number;
  } {
    // Total distinct assigned tickets (not per-person, but actual tickets)
    const totalAssigned = this.queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tickets t
       WHERE t.type != 'epic'`
    );

    // Total distinct completed tickets
    const totalCompleted = this.queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tickets t
       WHERE t.status = 'done' AND t.type != 'epic'`
    );

    // Total story points for completed tickets
    const completedPoints = this.queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(t.story_points), 0) as total
       FROM tickets t
       WHERE t.status = 'done' AND t.type != 'epic'`
    );

    // Recent completed tickets (in period)
    const recentCompleted = this.queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tickets t
       WHERE t.status = 'done' 
         AND t.type != 'epic'
         AND t.updated_at >= datetime('now', '-' || ? || ' days')`,
      [periodDays]
    );

    // Recent story points (in period)
    const recentPoints = this.queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(t.story_points), 0) as total
       FROM tickets t
       WHERE t.status = 'done' 
         AND t.type != 'epic'
         AND t.updated_at >= datetime('now', '-' || ? || ' days')`,
      [periodDays]
    );

    // Current workload (active tickets)
    const currentWorkload = this.queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tickets t
       WHERE t.status IN ('todo', 'in_progress') AND t.type != 'epic'`
    );

    // Today's load (tickets due today or updated today that are active)
    const todayLoad = this.queryOne<{ count: number }>(
      `SELECT COUNT(DISTINCT t.id) as count
       FROM tickets t
       WHERE t.type != 'epic'
         AND t.status IN ('todo', 'in_progress')
         AND (
           date(t.due_date) = date('now')
           OR date(t.updated_at) = date('now')
           OR date(t.created_at) = date('now')
         )`
    );

    return {
      totalAssigned: totalAssigned?.count || 0,
      totalCompleted: totalCompleted?.count || 0,
      completedPoints: completedPoints?.total || 0,
      recentCompleted: recentCompleted?.count || 0,
      recentPoints: recentPoints?.total || 0,
      currentWorkload: currentWorkload?.count || 0,
      todayLoad: todayLoad?.count || 0,
    };
  }

  /**
   * Get technicians
   */
  getTechnicians(): UserWithDetails[] {
    return this.findAllWithDetails({ role: 'technician' as any });
  }

  /**
   * Verify password
   */
  verifyPassword(userId: number, password: string): boolean {
    const user = this.findById(userId);
    if (!user || !user.password) return false;
    return bcrypt.compareSync(password, user.password);
  }
}

// Export singleton
export const userRepository = new UserRepository();
export default userRepository;
