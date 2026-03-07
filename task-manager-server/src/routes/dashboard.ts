import express, { Request, Response } from 'express';
import db from '../database/db';
import { auth } from '../middleware/auth';
import { AuthenticatedRequest, Ticket } from '../types';

const router = express.Router();

interface CountResult {
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface PriorityCount {
  priority: string;
  count: number;
}

interface TypeCount {
  type: string;
  count: number;
}

interface DepartmentCount {
  name: string;
  color: string;
  count: number;
}

interface ActivityLog {
  id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  user_id: number;
  details: string | null;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
  ticket_key: string | null;
  ticket_title: string | null;
}

// Get dashboard statistics
router.get('/stats', auth, (req: Request, res: Response): void => {
  try {
    // Total tickets by status
    const ticketsByStatus = db
      .prepare(
        `
      SELECT status, COUNT(*) as count
      FROM tickets
      GROUP BY status
    `
      )
      .all() as StatusCount[];

    // Total tickets by priority
    const ticketsByPriority = db
      .prepare(
        `
      SELECT priority, COUNT(*) as count
      FROM tickets
      GROUP BY priority
    `
      )
      .all() as PriorityCount[];

    // Total tickets by type
    const ticketsByType = db
      .prepare(
        `
      SELECT type, COUNT(*) as count
      FROM tickets
      GROUP BY type
    `
      )
      .all() as TypeCount[];

    // Tickets assigned to current user (using ticket_assignees junction table)
    const myTickets = db
      .prepare(
        `
      SELECT t.status, COUNT(DISTINCT t.id) as count
      FROM tickets t
      INNER JOIN ticket_assignees ta ON t.id = ta.ticket_id
      WHERE ta.user_id = ?
      GROUP BY t.status
    `
      )
      .all(req.user.id) as StatusCount[];

    // Tickets reported by current user
    const reportedByMe = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM tickets
      WHERE reporter_id = ?
    `
      )
      .get(req.user.id) as CountResult;

    // Total counts
    const totalTicketsResult = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as CountResult | undefined;
    const totalUsersResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as CountResult | undefined;
    const totalDepartmentsResult = db.prepare('SELECT COUNT(*) as count FROM departments').get() as CountResult | undefined;

    // Overdue tickets
    const overdueTicketsResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM tickets
      WHERE due_date < date('now') AND status != 'done'
    `
      )
      .get() as CountResult | undefined;

    // Overdue PM (Preventive Maintenance)
    const overduePMResult = db
      .prepare(
        `
      SELECT COUNT(*) as count
      FROM maintenance_schedules
      WHERE is_active = 1
        AND next_due < date('now')
        AND NOT EXISTS (
          SELECT 1 FROM work_orders wo
          WHERE wo.maintenance_schedule_id = maintenance_schedules.id
          AND wo.status NOT IN ('completed', 'cancelled')
        )
    `
      )
      .get() as CountResult | undefined;

    // PM due this week
    const pmDueThisWeek = db
      .prepare(
        `
      SELECT ms.id, ms.title, ms.next_due, a.asset_code, a.name as asset_name,
             CASE
               WHEN date(ms.next_due) < date('now') THEN 'overdue'
               WHEN date(ms.next_due) = date('now') THEN 'due_today'
               ELSE 'upcoming'
             END as status
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      WHERE ms.is_active = 1
        AND ms.next_due <= date('now', '+7 days')
      ORDER BY
        CASE WHEN date(ms.next_due) < date('now') THEN 0 ELSE 1 END,
        ms.next_due ASC
      LIMIT 5
    `
      )
      .all() as any[];

    // Tickets by department
    const ticketsByDepartment = db
      .prepare(
        `
      SELECT d.name, d.color, COUNT(t.id) as count
      FROM departments d
      LEFT JOIN tickets t ON d.id = t.department_id
      GROUP BY d.id
      ORDER BY count DESC
    `
      )
      .all() as DepartmentCount[];

    res.json({
      overview: {
        totalTickets: totalTicketsResult?.count ?? 0,
        totalUsers: totalUsersResult?.count ?? 0,
        totalDepartments: totalDepartmentsResult?.count ?? 0,
        overdueTickets: overdueTicketsResult?.count ?? 0,
        overduePM: overduePMResult?.count ?? 0,
      },
      ticketsByStatus,
      ticketsByPriority,
      ticketsByType,
      ticketsByDepartment,
      pmDueThisWeek,
      myTickets: {
        assigned: myTickets,
        reported: (reportedByMe as CountResult)?.count ?? 0,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get recent activity
router.get('/activity', auth, (req: Request, res: Response): void => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = db
      .prepare(
        `
      SELECT a.*, u.name as user_name, u.avatar as user_avatar,
             CASE 
               WHEN a.entity_type = 'ticket' THEN t.ticket_key
               ELSE NULL
             END as ticket_key,
             CASE 
               WHEN a.entity_type = 'ticket' THEN t.title
               ELSE NULL
             END as ticket_title
      FROM activity_log a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN tickets t ON a.entity_type = 'ticket' AND a.entity_id = t.id
      ORDER BY a.created_at DESC
      LIMIT ?
    `
      )
      .all(limit) as ActivityLog[];

    res.json(activities);
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get my assigned tickets (using ticket_assignees junction table for multi-user assignment)
router.get('/my-tickets', auth, (req: Request, res: Response): void => {
  try {
    const tickets = db
      .prepare(
        `
      SELECT DISTINCT t.*, 
             reporter.name as reporter_name,
             d.name as department_name, d.color as department_color
      FROM tickets t
      INNER JOIN ticket_assignees ta ON t.id = ta.ticket_id
      LEFT JOIN users reporter ON t.reporter_id = reporter.id
      LEFT JOIN departments d ON t.department_id = d.id
      WHERE ta.user_id = ?
      ORDER BY 
        CASE t.status
          WHEN 'in_progress' THEN 1
          WHEN 'todo' THEN 2
          WHEN 'review' THEN 3
          WHEN 'done' THEN 4
        END,
        CASE t.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `
      )
      .all(req.user.id) as Ticket[];

    res.json(tickets);
  } catch (error) {
    console.error('Get my tickets error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get my assigned work orders
router.get('/my-work-orders', auth, (req: Request, res: Response): void => {
  try {
    const workOrders = db
      .prepare(
        `
      SELECT DISTINCT wo.*,
             a.asset_code, a.name as asset_name,
             t.ticket_key as related_ticket_key,
             s.name as sprint_name
      FROM work_orders wo
      INNER JOIN work_order_assignees woa ON wo.id = woa.work_order_id
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN tickets t ON wo.related_ticket_id = t.id
      LEFT JOIN sprints s ON wo.sprint_id = s.id
      WHERE woa.user_id = ?
      ORDER BY
        CASE wo.status
          WHEN 'in_progress' THEN 1
          WHEN 'open' THEN 2
          WHEN 'on_hold' THEN 3
          WHEN 'completed' THEN 4
          WHEN 'cancelled' THEN 5
        END,
        CASE wo.priority
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END
    `
      )
      .all(req.user.id);

    res.json(workOrders);
  } catch (error) {
    console.error('Get my work orders error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// Supervisor Dashboard Endpoint
// ============================================

interface MachineStatusCount {
  status: string;
  count: number;
}

interface TechnicianWorkload {
  id: number;
  name: string;
  avatar: string | null;
  assigned_work_orders: number;
  in_progress_work_orders: number;
  workload_percentage: number;
}

interface YesterdaySummary {
  completed_work_orders: number;
  pending_review_work_orders: number;
  completed_tickets: number;
}

/**
 * GET /api/dashboard/supervisor
 * Returns all data needed for supervisor dashboard in a single request
 *
 * Response:
 * - machineStatus: { operational, maintenance, breakdown, retired, total }
 * - teamWorkload: Array of technician workload data
 * - yesterdaySummary: { completedWOs, pendingReview, completedTickets }
 * - machines: List of all machines with their status
 */
router.get('/supervisor', auth, (req: Request, res: Response): void => {
  try {
    // ========================================
    // 1. Machine Status (Asset Status)
    // ========================================
    const machineStatusRaw = db
      .prepare(
        `
        SELECT status, COUNT(*) as count
        FROM assets
        WHERE status != 'retired'
        GROUP BY status
      `
      )
      .all() as MachineStatusCount[];

    // Convert to object for easy access
    const machineStatus = {
      operational: 0,
      maintenance: 0,
      down: 0, // 'down' is the breakdown status in the database
      total: 0,
    };

    machineStatusRaw.forEach((item) => {
      if (item.status === 'operational') machineStatus.operational = item.count;
      else if (item.status === 'maintenance') machineStatus.maintenance = item.count;
      else if (item.status === 'down') machineStatus.down = item.count;
      machineStatus.total += item.count;
    });

    // Get list of machines with status for detail view
    const machines = db
      .prepare(
        `
        SELECT
          a.id, a.asset_code, a.name, a.status, a.criticality, a.location,
          ac.name as category_name
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        WHERE a.status != 'retired'
        ORDER BY
          CASE a.status
            WHEN 'down' THEN 1
            WHEN 'maintenance' THEN 2
            WHEN 'operational' THEN 3
          END,
          a.name ASC
      `
      )
      .all();

    // ========================================
    // 2. Team Workload (Technicians)
    // ========================================
    // Get all users who are technicians/members with their workload
    const teamWorkload = db
      .prepare(
        `
        SELECT
          u.id,
          u.name,
          u.avatar,
          COALESCE(assigned.count, 0) as assigned_work_orders,
          COALESCE(in_progress.count, 0) as in_progress_work_orders
        FROM users u
        LEFT JOIN (
          SELECT woa.user_id, COUNT(*) as count
          FROM work_order_assignees woa
          INNER JOIN work_orders wo ON woa.work_order_id = wo.id
          WHERE wo.status NOT IN ('completed', 'cancelled')
          GROUP BY woa.user_id
        ) assigned ON u.id = assigned.user_id
        LEFT JOIN (
          SELECT woa.user_id, COUNT(*) as count
          FROM work_order_assignees woa
          INNER JOIN work_orders wo ON woa.work_order_id = wo.id
          WHERE wo.status = 'in_progress'
          GROUP BY woa.user_id
        ) in_progress ON u.id = in_progress.user_id
        WHERE u.role IN ('member', 'supervisor')
        ORDER BY assigned_work_orders DESC
      `
      )
      .all() as any[];

    // Calculate workload percentage (assume max capacity is 10 WOs per person)
    const MAX_CAPACITY = 10;
    const teamWorkloadWithPercentage = teamWorkload.map((tech) => ({
      ...tech,
      workload_percentage: Math.min(
        Math.round((tech.assigned_work_orders / MAX_CAPACITY) * 100),
        100
      ),
    }));

    // ========================================
    // 3. Yesterday Summary
    // ========================================
    // Work orders completed yesterday
    const completedYesterdayWO = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_orders
        WHERE date(actual_end) = date('now', '-1 day')
          AND status = 'completed'
      `
      )
      .get() as CountResult;

    // Work orders pending review (status = 'completed' but not yet verified/closed)
    // For now, we'll count WOs that were completed but might need review
    const pendingReviewWO = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_orders
        WHERE status = 'on_hold'
      `
      )
      .get() as CountResult;

    // Tickets completed yesterday
    const completedYesterdayTickets = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM tickets
        WHERE date(updated_at) = date('now', '-1 day')
          AND status = 'done'
      `
      )
      .get() as CountResult;

    const yesterdaySummary: YesterdaySummary = {
      completed_work_orders: completedYesterdayWO.count,
      pending_review_work_orders: pendingReviewWO.count,
      completed_tickets: completedYesterdayTickets.count,
    };

    // ========================================
    // Response
    // ========================================
    res.json({
      machineStatus,
      machines,
      teamWorkload: teamWorkloadWithPercentage,
      yesterdaySummary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get supervisor dashboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// Member Dashboard Endpoint
// ============================================

interface MyDayTask {
  id: number;
  type: 'work_order' | 'pm_schedule';
  title: string;
  asset_name: string | null;
  priority: string;
  status: string;
  due_date: string | null;
}

interface AssignedWorkOrder {
  id: number;
  wo_number: string;
  title: string;
  asset_name: string | null;
  priority: string;
  status: string;
  created_at: string;
}

interface PMReminder {
  id: number;
  description: string;
  asset_name: string | null;
  next_due: string;
  frequency_type: string;
  is_overdue: boolean;
}

interface PersonalWorkload {
  assigned_work_orders: number;
  in_progress_work_orders: number;
  completed_today: number;
  completed_this_week: number;
  workload_percentage: number;
}

/**
 * GET /api/dashboard/member
 * Returns all data needed for member "My Day" dashboard
 *
 * Response:
 * - myDay: Priority tasks for today (WOs + PM schedules due)
 * - assignedWorkOrders: All assigned work orders
 * - pmReminders: Upcoming PM schedules
 * - personalWorkload: Personal workload stats
 */
router.get('/member', auth, (req: Request, res: Response): void => {
  try {
    const userId = (req as any).user.id;

    // ========================================
    // 1. My Day - Priority Tasks (WOs + PMs due today/overdue)
    // ========================================
    const myDayWOs = db
      .prepare(
        `
        SELECT
          wo.id,
          'work_order' as type,
          wo.title,
          a.name as asset_name,
          wo.priority,
          wo.status,
          wo.scheduled_end as due_date
        FROM work_orders wo
        INNER JOIN work_order_assignees woa ON wo.id = woa.work_order_id
        LEFT JOIN assets a ON wo.asset_id = a.id
        WHERE woa.user_id = ?
          AND wo.status IN ('open', 'in_progress')
          AND (wo.scheduled_end IS NULL OR date(wo.scheduled_end) <= date('now', '+1 day'))
        ORDER BY
          CASE wo.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          wo.scheduled_end ASC
        LIMIT 10
      `
      )
      .all(userId) as MyDayTask[];

    const myDayPMs = db
      .prepare(
        `
        SELECT
          pm.id,
          'pm_schedule' as type,
          pm.description as title,
          a.name as asset_name,
          'medium' as priority,
          CASE
            WHEN date(pm.next_due) < date('now') THEN 'overdue'
            ELSE 'upcoming'
          END as status,
          pm.next_due as due_date
        FROM maintenance_schedules pm
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.assigned_to = ?
          AND pm.is_active = 1
          AND date(pm.next_due) <= date('now', '+7 day')
        ORDER BY pm.next_due ASC
        LIMIT 5
      `
      )
      .all(userId) as MyDayTask[];

    const myDay = [...myDayWOs, ...myDayPMs].sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder: Record<string, number> = { critical: 1, high: 2, medium: 3, low: 4 };
      const priorityDiff = (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

    // ========================================
    // 2. Assigned Work Orders (All active WOs)
    // ========================================
    const assignedWorkOrders = db
      .prepare(
        `
        SELECT
          wo.id,
          wo.wo_number,
          wo.title,
          a.name as asset_name,
          wo.priority,
          wo.status,
          wo.created_at
        FROM work_orders wo
        INNER JOIN work_order_assignees woa ON wo.id = woa.work_order_id
        LEFT JOIN assets a ON wo.asset_id = a.id
        WHERE woa.user_id = ?
          AND wo.status NOT IN ('completed', 'cancelled')
        ORDER BY
          CASE wo.status
            WHEN 'in_progress' THEN 1
            WHEN 'open' THEN 2
            WHEN 'on_hold' THEN 3
          END,
          CASE wo.priority
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END
      `
      )
      .all(userId) as AssignedWorkOrder[];

    // ========================================
    // 3. PM Reminders (Upcoming PM schedules)
    // ========================================
    const pmReminders = db
      .prepare(
        `
        SELECT
          pm.id,
          pm.description,
          a.name as asset_name,
          pm.next_due,
          pm.frequency_type,
          CASE WHEN date(pm.next_due) < date('now') THEN 1 ELSE 0 END as is_overdue
        FROM maintenance_schedules pm
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.assigned_to = ?
          AND pm.is_active = 1
          AND date(pm.next_due) <= date('now', '+14 day')
        ORDER BY pm.next_due ASC
        LIMIT 10
      `
      )
      .all(userId) as any[];

    // Convert is_overdue to boolean
    const pmRemindersFormatted: PMReminder[] = pmReminders.map((pm) => ({
      ...pm,
      is_overdue: pm.is_overdue === 1,
    }));

    // ========================================
    // 4. Personal Workload Stats
    // ========================================
    const assignedCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_order_assignees woa
        INNER JOIN work_orders wo ON woa.work_order_id = wo.id
        WHERE woa.user_id = ?
          AND wo.status NOT IN ('completed', 'cancelled')
      `
      )
      .get(userId) as CountResult;

    const inProgressCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_order_assignees woa
        INNER JOIN work_orders wo ON woa.work_order_id = wo.id
        WHERE woa.user_id = ?
          AND wo.status = 'in_progress'
      `
      )
      .get(userId) as CountResult;

    const completedTodayCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_order_assignees woa
        INNER JOIN work_orders wo ON woa.work_order_id = wo.id
        WHERE woa.user_id = ?
          AND wo.status = 'completed'
          AND date(wo.actual_end) = date('now')
      `
      )
      .get(userId) as CountResult;

    const completedThisWeekCount = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_order_assignees woa
        INNER JOIN work_orders wo ON woa.work_order_id = wo.id
        WHERE woa.user_id = ?
          AND wo.status = 'completed'
          AND date(wo.actual_end) >= date('now', '-7 day')
      `
      )
      .get(userId) as CountResult;

    const MAX_CAPACITY = 10;
    const personalWorkload: PersonalWorkload = {
      assigned_work_orders: assignedCount.count,
      in_progress_work_orders: inProgressCount.count,
      completed_today: completedTodayCount.count,
      completed_this_week: completedThisWeekCount.count,
      workload_percentage: Math.min(
        Math.round((assignedCount.count / MAX_CAPACITY) * 100),
        100
      ),
    };

    // ========================================
    // Response
    // ========================================
    res.json({
      myDay,
      assignedWorkOrders,
      pmReminders: pmRemindersFormatted,
      personalWorkload,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get member dashboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// Manager Dashboard Endpoint
// ============================================

interface KPISummary {
  work_orders_completed_mtd: number;
  work_orders_completed_change: number; // percentage change from last month
  tickets_resolved_mtd: number;
  tickets_resolved_change: number;
  avg_resolution_time_hours: number;
  resolution_time_change: number;
  machine_uptime_percentage: number;
  uptime_change: number;
}

interface TeamMemberPerformance {
  id: number;
  name: string;
  avatar: string | null;
  completed_work_orders: number;
  avg_completion_time_hours: number;
  performance_score: number; // 0-100
}

interface Alert {
  id: number;
  type: 'machine_down' | 'overdue_pm' | 'high_priority_wo' | 'low_performance';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  created_at: string;
  related_id?: number;
}

/**
 * GET /api/dashboard/manager
 * Returns all data needed for manager executive dashboard
 *
 * Response:
 * - kpiSummary: Key performance indicators
 * - teamPerformance: Team member performance metrics
 * - alerts: Active alerts requiring attention
 */
router.get('/manager', auth, (req: Request, res: Response): void => {
  try {
    // ========================================
    // 1. KPI Summary (Month-to-Date)
    // ========================================
    // Work orders completed this month
    const woCompletedMTD = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_orders
        WHERE status = 'completed'
          AND strftime('%Y-%m', actual_end) = strftime('%Y-%m', 'now')
      `
      )
      .get() as CountResult;

    // Work orders completed last month (for comparison)
    const woCompletedLastMonth = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM work_orders
        WHERE status = 'completed'
          AND strftime('%Y-%m', actual_end) = strftime('%Y-%m', 'now', '-1 month')
      `
      )
      .get() as CountResult;

    // Tickets resolved this month
    const ticketsResolvedMTD = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM tickets
        WHERE status = 'done'
          AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now')
      `
      )
      .get() as CountResult;

    // Tickets resolved last month
    const ticketsResolvedLastMonth = db
      .prepare(
        `
        SELECT COUNT(*) as count
        FROM tickets
        WHERE status = 'done'
          AND strftime('%Y-%m', updated_at) = strftime('%Y-%m', 'now', '-1 month')
      `
      )
      .get() as CountResult;

    // Average resolution time (hours) for completed WOs this month
    const avgResolutionTime = db
      .prepare(
        `
        SELECT AVG(
          (julianday(actual_end) - julianday(created_at)) * 24
        ) as avg_hours
        FROM work_orders
        WHERE status = 'completed'
          AND actual_end IS NOT NULL
          AND strftime('%Y-%m', actual_end) = strftime('%Y-%m', 'now')
      `
      )
      .get() as { avg_hours: number | null };

    // Machine uptime percentage
    const machineStats = db
      .prepare(
        `
        SELECT
          COUNT(*) as total,
          SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational
        FROM assets
        WHERE status != 'retired'
      `
      )
      .get() as { total: number; operational: number };

    const uptimePercentage =
      machineStats.total > 0
        ? Math.round((machineStats.operational / machineStats.total) * 100)
        : 100;

    // Calculate changes (percentage)
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const kpiSummary: KPISummary = {
      work_orders_completed_mtd: woCompletedMTD.count,
      work_orders_completed_change: calculateChange(
        woCompletedMTD.count,
        woCompletedLastMonth.count
      ),
      tickets_resolved_mtd: ticketsResolvedMTD.count,
      tickets_resolved_change: calculateChange(
        ticketsResolvedMTD.count,
        ticketsResolvedLastMonth.count
      ),
      avg_resolution_time_hours: Math.round(avgResolutionTime.avg_hours || 0),
      resolution_time_change: 0, // Would need historical data for comparison
      machine_uptime_percentage: uptimePercentage,
      uptime_change: 0, // Would need historical data
    };

    // ========================================
    // 2. Team Performance (Last 30 days)
    // ========================================
    const teamPerformance = db
      .prepare(
        `
        SELECT
          u.id,
          u.name,
          u.avatar,
          COALESCE(completed.count, 0) as completed_work_orders,
          COALESCE(completed.avg_hours, 0) as avg_completion_time_hours
        FROM users u
        LEFT JOIN (
          SELECT
            woa.user_id,
            COUNT(*) as count,
            AVG((julianday(wo.actual_end) - julianday(wo.created_at)) * 24) as avg_hours
          FROM work_order_assignees woa
          INNER JOIN work_orders wo ON woa.work_order_id = wo.id
          WHERE wo.status = 'completed'
            AND wo.actual_end >= date('now', '-30 day')
          GROUP BY woa.user_id
        ) completed ON u.id = completed.user_id
        WHERE u.role IN ('member', 'supervisor')
        ORDER BY completed_work_orders DESC
        LIMIT 10
      `
      )
      .all() as any[];

    // Calculate performance score based on completion rate and speed
    const maxCompleted = Math.max(...teamPerformance.map((t) => t.completed_work_orders), 1);
    const teamPerformanceWithScore: TeamMemberPerformance[] = teamPerformance.map((member) => ({
      ...member,
      avg_completion_time_hours: Math.round(member.avg_completion_time_hours || 0),
      performance_score: Math.min(
        100,
        Math.round((member.completed_work_orders / maxCompleted) * 100)
      ),
    }));

    // ========================================
    // 3. Alerts (Active issues requiring attention)
    // ========================================
    const alerts: Alert[] = [];

    // Alert: Machines down
    const machinesDown = db
      .prepare(
        `
        SELECT id, name, asset_code
        FROM assets
        WHERE status = 'down'
        LIMIT 5
      `
      )
      .all() as any[];

    machinesDown.forEach((machine) => {
      alerts.push({
        id: alerts.length + 1,
        type: 'machine_down',
        severity: 'critical',
        title: `Mesin Breakdown: ${machine.name}`,
        description: `Asset ${machine.asset_code} membutuhkan perhatian segera`,
        created_at: new Date().toISOString(),
        related_id: machine.id,
      });
    });

    // Alert: Overdue PM schedules
    const overduePMs = db
      .prepare(
        `
        SELECT pm.id, pm.description, a.name as asset_name
        FROM maintenance_schedules pm
        LEFT JOIN assets a ON pm.asset_id = a.id
        WHERE pm.is_active = 1
          AND date(pm.next_due) < date('now')
        LIMIT 5
      `
      )
      .all() as any[];

    overduePMs.forEach((pm) => {
      alerts.push({
        id: alerts.length + 1,
        type: 'overdue_pm',
        severity: 'warning',
        title: `PM Terlambat: ${pm.description}`,
        description: pm.asset_name ? `Asset: ${pm.asset_name}` : 'Jadwal PM sudah lewat',
        created_at: new Date().toISOString(),
        related_id: pm.id,
      });
    });

    // Alert: High priority WOs not started
    const urgentWOs = db
      .prepare(
        `
        SELECT wo.id, wo.wo_number, wo.title
        FROM work_orders wo
        WHERE wo.status = 'open'
          AND wo.priority IN ('critical', 'high')
          AND wo.created_at < datetime('now', '-24 hours')
        LIMIT 3
      `
      )
      .all() as any[];

    urgentWOs.forEach((wo) => {
      alerts.push({
        id: alerts.length + 1,
        type: 'high_priority_wo',
        severity: 'warning',
        title: `WO Urgent Belum Dikerjakan: ${wo.wo_number}`,
        description: wo.title,
        created_at: new Date().toISOString(),
        related_id: wo.id,
      });
    });

    // Sort alerts by severity
    const severityOrder: Record<string, number> = { critical: 1, warning: 2, info: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // ========================================
    // Response
    // ========================================
    res.json({
      kpiSummary,
      teamPerformance: teamPerformanceWithScore,
      alerts,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get manager dashboard error:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ============================================
// Admin Dashboard Endpoint
// ============================================

interface SystemHealth {
  database_size_mb: number;
  total_users: number;
  active_users_today: number;
  total_assets: number;
  total_work_orders: number;
  total_tickets: number;
  server_uptime_hours: number;
}

interface UserActivityItem {
  id: number;
  user_name: string;
  user_avatar: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  created_at: string;
}

interface QuickAccessItem {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: string;
  count?: number;
}

/**
 * GET /api/dashboard/admin
 * Returns all data needed for admin system dashboard
 *
 * Response:
 * - systemHealth: System health metrics
 * - recentActivity: Recent user activity
 * - quickAccess: Quick access to admin settings
 */
router.get('/admin', auth, (req: Request, res: Response): void => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    // ========================================
    // 1. System Health
    // ========================================
    // Total users
    const totalUsersResult = db.prepare('SELECT COUNT(*) as count FROM users').get() as CountResult | undefined;
    const totalUsers = totalUsersResult?.count ?? 0;

    // Active users today
    const activeUsersTodayResult = db.prepare(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM activity_log
        WHERE date(created_at) = date('now')
      `).get() as CountResult | undefined;
    const activeUsersToday = activeUsersTodayResult?.count ?? 0;

    // Total assets
    const totalAssetsResult = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status != 'retired'").get() as CountResult | undefined;
    const totalAssets = totalAssetsResult?.count ?? 0;

    // Total work orders
    const totalWorkOrdersResult = db.prepare('SELECT COUNT(*) as count FROM work_orders').get() as CountResult | undefined;
    const totalWorkOrders = totalWorkOrdersResult?.count ?? 0;

    // Total tickets
    const totalTicketsResult = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as CountResult | undefined;
    const totalTickets = totalTicketsResult?.count ?? 0;

    // Server uptime
    const serverUptimeHours = Math.round(process.uptime() / 3600);

    const systemHealth: SystemHealth = {
      database_size_mb: 0,
      total_users: totalUsers,
      active_users_today: activeUsersToday,
      total_assets: totalAssets,
      total_work_orders: totalWorkOrders,
      total_tickets: totalTickets,
      server_uptime_hours: serverUptimeHours,
    };

    // ========================================
    // 2. Recent Activity (Last 20 activities)
    // ========================================
    const recentActivity = db
      .prepare(
        `
        SELECT
          al.id,
          u.name as user_name,
          u.avatar as user_avatar,
          al.action,
          al.entity_type,
          al.entity_id,
          al.created_at
        FROM activity_log al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 20
      `
      )
      .all() as UserActivityItem[];

    // ========================================
    // 3. Quick Access Items
    // ========================================
    // Get counts for quick access items
    const pendingUsersResult = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get() as CountResult | undefined;
    const pendingUsersCount = pendingUsersResult?.count ?? 0;

    const activeAssetsResult = db.prepare("SELECT COUNT(*) as count FROM assets WHERE status = 'operational'").get() as CountResult | undefined;
    const activeAssetsCount = activeAssetsResult?.count ?? 0;

    const departmentsResult = db.prepare('SELECT COUNT(*) as count FROM departments').get() as CountResult | undefined;
    const departmentsCount = departmentsResult?.count ?? 0;

    const failureCodesResult = db.prepare('SELECT COUNT(*) as count FROM failure_codes').get() as CountResult | undefined;
    const failureCodesCount = failureCodesResult?.count ?? 0;

    const quickAccess: QuickAccessItem[] = [
      {
        id: 'users',
        label: 'User Management',
        description: 'Kelola user dan permissions',
        route: '/users',
        icon: 'users',
        count: totalUsers,
      },
      {
        id: 'departments',
        label: 'Departments',
        description: 'Kelola departemen',
        route: '/departments',
        icon: 'building',
        count: departmentsCount,
      },
      {
        id: 'assets',
        label: 'Asset Management',
        description: 'Kelola mesin dan asset',
        route: '/assets',
        icon: 'cpu',
        count: activeAssetsCount,
      },
      {
        id: 'failure-codes',
        label: 'Failure Codes',
        description: 'Kelola kode kegagalan',
        route: '/failure-codes',
        icon: 'alert-triangle',
        count: failureCodesCount,
      },
      {
        id: 'downtime',
        label: 'Downtime Classifications',
        description: 'Kelola klasifikasi downtime',
        route: '/downtime-classifications',
        icon: 'clock',
      },
      {
        id: 'settings',
        label: 'System Settings',
        description: 'Pengaturan sistem',
        route: '/settings',
        icon: 'settings',
      },
    ];

    // ========================================
    // Response
    // ========================================
    res.json({
      systemHealth,
      recentActivity,
      quickAccess,
      generatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({ error: 'Server error.', message: error.message });
  }
});

export default router;
