/**
 * Report Repository - Data access for reports and KPIs
 */

import db from '../database/db';
import {
  KPIDashboard,
  ProductionKPI,
  ProductionBreakdown,
  WorkOrderReport,
  TicketReport,
  TeamReport,
  DateRangeFilter,
} from '../types/report';

export class ReportRepository {
  protected db = db;

  protected query<T>(sql: string, params: any[] = []): T[] {
    return this.db.prepare(sql).all(...params) as T[];
  }

  protected queryOne<T>(sql: string, params: any[] = []): T | undefined {
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Get KPI Dashboard - Full maintenance KPI data
   */
  getKPIDashboard(filter: DateRangeFilter & { asset_id?: number }): any {
    const days = filter.days || 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    let assetFilter = '';
    const params: any[] = [];

    if (filter.asset_id) {
      assetFilter = ' AND asset_id = ?';
      params.push(filter.asset_id);
    }

    // Scheduled production time
    const scheduledTime = this.queryOne<{ total_minutes: number }>(`
      SELECT COALESCE(SUM(planned_production_minutes), 0) as total_minutes
      FROM production_schedule
      WHERE date >= date('now', '-${days} days')
      AND status = 'scheduled'
    `) || { total_minutes: 0 };

    // Actual downtime stats
    const downtimeStats = this.queryOne<{ total_minutes: number; total_incidents: number; unplanned: number; planned: number }>(
      `
      SELECT 
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes,
        COUNT(*) as total_incidents,
        SUM(CASE WHEN dl.downtime_type = 'unplanned' THEN 1 ELSE 0 END) as unplanned,
        SUM(CASE WHEN dl.downtime_type = 'planned' THEN 1 ELSE 0 END) as planned
      FROM downtime_logs dl
      WHERE dl.start_time >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'dl.asset_id')}
    `,
      params
    ) || { total_minutes: 0, total_incidents: 0, unplanned: 0, planned: 0 };

    // Calculate metrics
    const scheduledMinutes = scheduledTime.total_minutes || (days * 8 * 60); // Default 8h/day if no schedule
    const downtimeMinutes = downtimeStats.total_minutes || 0;
    const availability = Math.max(0, Math.min(100, ((scheduledMinutes - downtimeMinutes) / scheduledMinutes) * 100));
    const operatingMinutes = Math.max(0, scheduledMinutes - downtimeMinutes);
    const operatingHours = operatingMinutes / 60;

    // MTBF calculation
    const failures = downtimeStats.unplanned || 0;
    const mtbf = failures > 0 ? operatingHours / failures : operatingHours;

    // Repair times for MTTR
    const repairTimes = this.queryOne<{ total_hours: number; count: number }>(
      `
      SELECT 
        COALESCE(SUM(labor_hours), 0) as total_hours,
        COUNT(*) as count
      FROM work_orders
      WHERE type IN ('corrective', 'emergency')
      AND status = 'completed'
      AND actual_end >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'work_orders.asset_id')}
    `,
      params
    ) || { total_hours: 0, count: 0 };

    const mttr = repairTimes.count > 0 ? repairTimes.total_hours / repairTimes.count : 0;

    // Downtime breakdown by type
    const downtimeByType = this.query<any>(
      `
      SELECT 
        dc.category,
        dc.name,
        dc.counts_as_downtime,
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'dl.asset_id')}
      GROUP BY dc.id, dc.category, dc.name, dc.counts_as_downtime
      ORDER BY total_minutes DESC
    `,
      params
    );

    // Work order statistics by type
    const workOrderStats = this.query<any>(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN labor_hours ELSE NULL END), 0) as avg_completion_hours
      FROM work_orders
      WHERE created_at >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'work_orders.asset_id')}
      GROUP BY type
      ORDER BY count DESC
    `, params);

    // Top failing assets
    const topFailingAssets = this.query<any>(`
      SELECT 
        a.asset_code,
        a.name,
        COUNT(*) as failures,
        COALESCE(SUM(dl.duration_minutes), 0) as total_downtime_minutes
      FROM downtime_logs dl
      JOIN assets a ON dl.asset_id = a.id
      WHERE dl.start_time >= datetime('now', '-${days} days')
      AND dl.downtime_type = 'unplanned'
      GROUP BY a.id, a.asset_code, a.name
      ORDER BY failures DESC
      LIMIT 5
    `);

    // Recent work orders
    const recentWorkOrders = this.query<any>(`
      SELECT 
        wo.wo_number,
        wo.title,
        wo.type,
        wo.status,
        wo.priority,
        a.asset_code,
        wo.created_at
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      ORDER BY wo.created_at DESC
      LIMIT 10
    `);

    // Top Failure Codes
    const topFailureCodes = this.query<any>(`
      SELECT 
        fc.code,
        fc.category,
        fc.description,
        COUNT(dl.id) as occurrences,
        COALESCE(SUM(dl.duration_minutes), 0) as total_downtime_minutes
      FROM downtime_logs dl
      JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE dl.start_time >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'dl.asset_id')}
      GROUP BY fc.id, fc.code, fc.category, fc.description
      ORDER BY occurrences DESC
      LIMIT 10
    `, params);

    // Weekly Trend
    const weeklyTrend = this.query<any>(`
      SELECT 
        strftime('%Y-W%W', dl.start_time) as week,
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes,
        COALESCE(SUM(CASE WHEN dc.counts_as_downtime = 1 THEN dl.duration_minutes ELSE 0 END), 0) as counted_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'dl.asset_id')}
      GROUP BY week
      ORDER BY week ASC
    `, params);

    // Daily Trend
    const dailyTrend = this.query<any>(`
      SELECT 
        strftime('%Y-%m-%d', dl.start_time) as date,
        COALESCE(SUM(dl.duration_minutes), 0) as downtime_minutes,
        COUNT(*) as incidents
      FROM downtime_logs dl
      WHERE dl.start_time >= datetime('now', '-${days} days')
      ${assetFilter.replace('asset_id', 'dl.asset_id')}
      GROUP BY date
      ORDER BY date ASC
    `, params);

    // PM Compliance Metrics
    const pmCompliance = this.queryOne<{
      total_scheduled: number;
      completed_on_time: number;
      completed_late: number;
      overdue: number;
    }>(`
      SELECT 
        COUNT(DISTINCT ms.id) as total_scheduled,
        COUNT(DISTINCT CASE 
          WHEN wo.status = 'completed' AND date(wo.actual_end) <= date(ms.next_due) 
          THEN ms.id 
        END) as completed_on_time,
        COUNT(DISTINCT CASE 
          WHEN wo.status = 'completed' AND date(wo.actual_end) > date(ms.next_due) 
          THEN ms.id 
        END) as completed_late,
        COUNT(DISTINCT CASE 
          WHEN (wo.id IS NULL OR wo.status NOT IN ('completed', 'cancelled'))
            AND date(ms.next_due) < date('now')
          THEN ms.id 
        END) as overdue
      FROM maintenance_schedules ms
      LEFT JOIN work_orders wo ON wo.maintenance_schedule_id = ms.id 
        AND wo.created_at >= datetime('now', '-${days} days')
      WHERE ms.is_active = 1
        AND ms.next_due BETWEEN date('now', '-${days} days') AND date('now', '+7 days')
        ${assetFilter.replace('asset_id', 'ms.asset_id')}
    `, params) || { total_scheduled: 0, completed_on_time: 0, completed_late: 0, overdue: 0 };

    // PM Compliance Rate
    const pmComplianceRate = pmCompliance.total_scheduled > 0 
      ? (pmCompliance.completed_on_time / pmCompliance.total_scheduled) * 100 
      : 100;

    // Upcoming PM in next 7 days
    const upcomingPM = this.query<any>(`
      SELECT 
        ms.id,
        ms.title,
        ms.next_due,
        ms.frequency_type,
        ms.estimated_duration_minutes,
        a.asset_code,
        a.name as asset_name,
        a.criticality,
        u.name as assigned_to_name,
        CASE 
          WHEN date(ms.next_due) < date('now') THEN 'overdue'
          WHEN date(ms.next_due) = date('now') THEN 'due_today'
          ELSE 'upcoming'
        END as status
      FROM maintenance_schedules ms
      LEFT JOIN assets a ON ms.asset_id = a.id
      LEFT JOIN users u ON ms.assigned_to = u.id
      WHERE ms.is_active = 1
        AND ms.next_due <= date('now', '+7 days')
        ${assetFilter.replace('asset_id', 'ms.asset_id')}
      ORDER BY 
        CASE WHEN date(ms.next_due) < date('now') THEN 0 ELSE 1 END,
        ms.next_due ASC,
        a.criticality DESC
      LIMIT 10
    `, params);

    return {
      period: {
        days,
        startDate,
        endDate,
      },
      kpi: {
        availability,
        mtbf,
        mttr,
        scheduledTimeHours: scheduledMinutes / 60,
        downtimeHours: downtimeMinutes / 60,
        operatingTimeHours: operatingHours,
        failureCount: failures,
        totalIncidents: downtimeStats.total_incidents,
        unplannedIncidents: downtimeStats.unplanned,
        plannedIncidents: downtimeStats.planned,
      },
      pmCompliance: {
        totalScheduled: pmCompliance.total_scheduled,
        completedOnTime: pmCompliance.completed_on_time,
        completedLate: pmCompliance.completed_late,
        overdue: pmCompliance.overdue,
        complianceRate: Math.round(pmComplianceRate * 10) / 10,
      },
      upcomingPM,
      downtimeByType,
      workOrderStats,
      topFailingAssets,
      recentWorkOrders,
      topFailureCodes,
      weeklyTrend,
      dailyTrend,
    };
  }

  /**
   * Get Production KPI - Full comprehensive data for frontend
   */
  getProductionKPI(filter: DateRangeFilter & { asset_id?: number }): any {
    const days = filter.days || 30;
    const startDate = filter.start_date || new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDateBase = filter.end_date || new Date().toISOString().split('T')[0];
    // Add time to end date to include full day (23:59:59)
    const endDate = `${endDateBase} 23:59:59`;

    let assetFilter = '';
    // Include both start and end date in params
    const params: any[] = [startDate, endDate];

    if (filter.asset_id) {
      assetFilter = ' AND dl.asset_id = ?';
      params.push(filter.asset_id);
    }

    // Get shifts
    const shifts = this.query<any>(`
      SELECT id, name, start_time, end_time, break_minutes
      FROM shift_patterns
      WHERE is_active = 1
      ORDER BY start_time
    `);

    // Total available time from shifts (per day)
    const shiftMinutesPerDay = shifts.reduce((sum: number, s: any) => {
      const start = s.start_time.split(':').map(Number);
      const end = s.end_time.split(':').map(Number);
      let mins = (end[0] * 60 + end[1]) - (start[0] * 60 + start[1]);
      if (mins < 0) mins += 24 * 60; // Handle overnight shifts
      return sum + mins - (s.break_minutes || 0);
    }, 0);
    const totalShiftMinutesPeriod = shiftMinutesPerDay * days;

    // Scheduled production time - include all statuses except explicit 'no_order' and 'holiday'
    // Also calculate production minutes from shift duration if planned_production_minutes is NULL
    const scheduled = this.queryOne<{ total: number; count: number }>(`
      SELECT 
        COALESCE(SUM(
          COALESCE(ps.planned_production_minutes, 
            (SELECT 
              CASE 
                WHEN sp.end_time > sp.start_time THEN 
                  (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
                  (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) -
                  COALESCE(sp.break_minutes, 0)
                ELSE 
                  (24 * 60) - 
                  (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) +
                  (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
                  COALESCE(sp.break_minutes, 0)
              END
            FROM shift_patterns sp WHERE sp.id = ps.shift_pattern_id)
          )
        ), 0) as total, 
        COUNT(*) as count
      FROM production_schedule ps
      WHERE date(ps.date) >= date(?) AND date(ps.date) <= date(?)
      AND (ps.status IS NULL OR ps.status NOT IN ('no_order', 'holiday'))
      ${filter.asset_id ? 'AND ps.asset_id = ?' : ''}
    `, filter.asset_id ? [startDate, endDate, filter.asset_id] : [startDate, endDate]) || { total: 0, count: 0 };

    // Summary statistics - total downtime
    const summaryStats = this.queryOne<any>(`
      SELECT 
        COUNT(*) as totalIncidents,
        COALESCE(SUM(dl.duration_minutes), 0) as totalDowntimeMinutes,
        COALESCE(AVG(dl.duration_minutes), 0) as avgDowntimeMinutes
      FROM downtime_logs dl
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
    `, params) || { totalIncidents: 0, totalDowntimeMinutes: 0, avgDowntimeMinutes: 0 };

    // Changeover stats
    const changeoverStats = this.queryOne<any>(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(dl.duration_minutes), 0) as totalMinutes,
        COALESCE(AVG(dl.duration_minutes), 0) as avgMinutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ?
      AND (dc.category = 'changeover' OR dc.code LIKE 'CO-%')
      ${assetFilter}
    `, params) || { count: 0, totalMinutes: 0, avgMinutes: 0 };

    // Maintenance downtime stats
    const maintenanceStats = this.queryOne<any>(`
      SELECT 
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as totalMinutes,
        COALESCE(SUM(CASE WHEN dl.downtime_type = 'planned' THEN dl.duration_minutes ELSE 0 END), 0) as plannedMinutes,
        COALESCE(SUM(CASE WHEN dl.downtime_type = 'unplanned' THEN dl.duration_minutes ELSE 0 END), 0) as unplannedMinutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ?
      AND dc.category = 'maintenance'
      ${assetFilter}
    `, params) || { incidents: 0, totalMinutes: 0, plannedMinutes: 0, unplannedMinutes: 0 };

    // Breakdown by changeover type
    const changeoverBreakdown = this.query<any>(`
      SELECT 
        dc.code,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ?
      AND (dc.category = 'changeover' OR dc.code LIKE 'CO-%')
      ${assetFilter}
      GROUP BY dc.code
    `, params);

    const breakdown = {
      changeover: {
        product: changeoverBreakdown.find((c: any) => c.code === 'CO-PRODUCT')?.total_minutes || 0,
        mold: changeoverBreakdown.find((c: any) => c.code === 'CO-MOLD')?.total_minutes || 0,
        setup: changeoverBreakdown.find((c: any) => c.code === 'CO-SETUP')?.total_minutes || 0,
        color: changeoverBreakdown.find((c: any) => c.code === 'CO-COLOR')?.total_minutes || 0,
      },
      material: {
        wait: this.queryOne<{ total: number }>(`
          SELECT COALESCE(SUM(dl.duration_minutes), 0) as total
          FROM downtime_logs dl
          LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
          WHERE dl.start_time >= ? AND dl.start_time <= ? AND dc.code = 'MAT-WAIT' ${assetFilter}
        `, params)?.total || 0,
        change: this.queryOne<{ total: number }>(`
          SELECT COALESCE(SUM(dl.duration_minutes), 0) as total
          FROM downtime_logs dl
          LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
          WHERE dl.start_time >= ? AND dl.start_time <= ? AND dc.code = 'MAT-CHANGE' ${assetFilter}
        `, params)?.total || 0,
      },
      quality: this.queryOne<{ total: number }>(`
        SELECT COALESCE(SUM(dl.duration_minutes), 0) as total
        FROM downtime_logs dl
        LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
        WHERE dl.start_time >= ? AND dl.start_time <= ? AND dc.code LIKE 'QC-%' ${assetFilter}
      `, params)?.total || 0,
      operator: this.queryOne<{ total: number }>(`
        SELECT COALESCE(SUM(dl.duration_minutes), 0) as total
        FROM downtime_logs dl
        LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
        WHERE dl.start_time >= ? AND dl.start_time <= ? AND dc.code LIKE 'OP-%' ${assetFilter}
      `, params)?.total || 0,
    };

    // Changeover stats by classification
    const changeoverStatsList = this.query<any>(`
      SELECT 
        dc.code,
        dc.name,
        COUNT(*) as count,
        COALESCE(AVG(dl.duration_minutes), 0) as avg_minutes,
        COALESCE(MIN(dl.duration_minutes), 0) as min_minutes,
        COALESCE(MAX(dl.duration_minutes), 0) as max_minutes,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ?
      AND (dc.category = 'changeover' OR dc.code LIKE 'CO-%')
      ${assetFilter}
      GROUP BY dc.code, dc.name
      ORDER BY total_minutes DESC
    `, params);

    // Downtime by classification
    const downtimeByClassification = this.query<any>(`
      SELECT 
        dc.code,
        dc.name,
        dc.category,
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes,
        COALESCE(AVG(dl.duration_minutes), 0) as avg_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      GROUP BY dc.code, dc.name, dc.category
      ORDER BY total_minutes DESC
    `, params);

    // Downtime by asset
    const downtimeByAsset = this.query<any>(`
      SELECT 
        a.id as asset_id,
        a.asset_code,
        a.name as asset_name,
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes,
        COALESCE(AVG(dl.duration_minutes), 0) as avg_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'CO-%' THEN dl.duration_minutes ELSE 0 END), 0) as changeover_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'MAT-%' THEN dl.duration_minutes ELSE 0 END), 0) as material_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'QC-%' THEN dl.duration_minutes ELSE 0 END), 0) as quality_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      GROUP BY a.id, a.asset_code, a.name
      ORDER BY total_minutes DESC
    `, params);

    // Daily trend
    const dailyTrend = this.query<any>(`
      SELECT 
        date(dl.start_time) as date,
        COUNT(*) as incidents,
        COALESCE(SUM(dl.duration_minutes), 0) as total_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'CO-%' THEN dl.duration_minutes ELSE 0 END), 0) as changeover_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'MAT-%' THEN dl.duration_minutes ELSE 0 END), 0) as material_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'QC-%' THEN dl.duration_minutes ELSE 0 END), 0) as quality_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      GROUP BY date(dl.start_time)
      ORDER BY date ASC
    `, params);

    // Recent downtimes - increased limit and added classification_code for filtering
    const recentDowntimes = this.query<any>(`
      SELECT 
        dl.id,
        dl.reason,
        dc.code as classification_code,
        dc.name as classification_name,
        dc.category as classification_category,
        dl.duration_minutes,
        dl.downtime_type,
        a.asset_code,
        a.name as asset_name,
        dl.start_time,
        dl.end_time
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      ORDER BY dl.start_time DESC
      LIMIT 50
    `, params);

    // Daily breakdown
    const dailyBreakdown = this.query<any>(`
      SELECT 
        date(dl.start_time) as date,
        COALESCE(SUM(CASE WHEN dc.category = 'production' AND dc.code NOT LIKE 'CO-%' AND dc.code NOT LIKE 'MAT-%' AND dc.code NOT LIKE 'QC-%' THEN dl.duration_minutes ELSE 0 END), 0) as production_downtime,
        COALESCE(SUM(CASE WHEN dc.category IN ('breakdown', 'planned_maintenance') THEN dl.duration_minutes ELSE 0 END), 0) as maintenance_downtime,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'CO-%' OR dc.category = 'changeover' THEN dl.duration_minutes ELSE 0 END), 0) as changeover_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'MAT-%' OR dc.code LIKE 'IDLE-MATERIAL' THEN dl.duration_minutes ELSE 0 END), 0) as material_minutes,
        COALESCE(SUM(CASE WHEN dc.code LIKE 'QC-%' THEN dl.duration_minutes ELSE 0 END), 0) as quality_minutes,
        COALESCE(SUM(CASE WHEN dc.category = 'breakdown' OR dc.code LIKE 'BD-%' THEN dl.duration_minutes ELSE 0 END), 0) as breakdown_minutes,
        COALESCE(SUM(CASE WHEN dc.category = 'planned_maintenance' OR dc.code LIKE 'PM-%' THEN dl.duration_minutes ELSE 0 END), 0) as pm_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      GROUP BY date(dl.start_time)
      ORDER BY date ASC
    `, params);

    // Daily scheduled - calculate from shift if planned_production_minutes is NULL
    const dailyScheduled = this.query<any>(`
      SELECT 
        date(ps.date) as date,
        COALESCE(SUM(
          COALESCE(ps.planned_production_minutes, 
            (SELECT 
              CASE 
                WHEN sp.end_time > sp.start_time THEN 
                  (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
                  (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) -
                  COALESCE(sp.break_minutes, 0)
                ELSE 
                  (24 * 60) - 
                  (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) +
                  (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
                  COALESCE(sp.break_minutes, 0)
              END
            FROM shift_patterns sp WHERE sp.id = ps.shift_pattern_id)
          )
        ), 0) as scheduled_minutes
      FROM production_schedule ps
      WHERE date(ps.date) >= date(?) AND date(ps.date) <= date(?)
      AND (ps.status IS NULL OR ps.status NOT IN ('no_order', 'holiday'))
      ${filter.asset_id ? 'AND ps.asset_id = ?' : ''}
      GROUP BY date(ps.date)
      ORDER BY date ASC
    `, filter.asset_id ? [startDate, endDate, filter.asset_id] : [startDate, endDate]);

    // Daily schedule status - for timeline display (per-shift)
    const dailyScheduleStatus = this.query<any>(`
      SELECT 
        date(ps.date) as date,
        ps.shift_pattern_id,
        sp.name as shift_name,
        sp.start_time as shift_start,
        sp.end_time as shift_end,
        ps.status,
        COALESCE(ps.planned_production_minutes, 
          CASE 
            WHEN sp.end_time > sp.start_time THEN 
              (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
              (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) -
              COALESCE(sp.break_minutes, 0)
            ELSE 
              (24 * 60) - 
              (CAST(substr(sp.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.start_time, 4, 2) AS INTEGER)) +
              (CAST(substr(sp.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(sp.end_time, 4, 2) AS INTEGER)) -
              COALESCE(sp.break_minutes, 0)
          END
        ) as planned_minutes,
        ps.product_name,
        ps.notes
      FROM production_schedule ps
      LEFT JOIN shift_patterns sp ON ps.shift_pattern_id = sp.id
      WHERE date(ps.date) >= date(?) AND date(ps.date) <= date(?)
      ${filter.asset_id ? 'AND ps.asset_id = ?' : ''}
      ORDER BY date ASC, sp.start_time ASC
    `, filter.asset_id ? [startDate, endDate, filter.asset_id] : [startDate, endDate]);

    // Per-shift downtime breakdown - actual time-based allocation with position info
    // Get raw downtime logs with actual start/end times
    const rawDowntimeLogs = this.query<any>(`
      SELECT 
        dl.id,
        dl.start_time,
        dl.end_time,
        dl.duration_minutes,
        dc.category,
        dc.code
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? AND dl.start_time <= ? ${assetFilter}
      ORDER BY dl.start_time ASC
    `, params);

    // Process downtime logs to allocate to specific shifts
    // Build maps for both totals and positioned segments
    const shiftDowntimeMap: Record<string, Record<number, { 
      changeover: number; material: number; quality: number; breakdown: number; pm: number 
    }>> = {};
    
    // New: Track positioned segments for accurate timeline visualization
    type DowntimeSegment = {
      startPercent: number;  // Position within shift (0-100%)
      widthPercent: number;  // Width within shift (0-100%)
      category: 'changeover' | 'material' | 'quality' | 'breakdown' | 'pm';
      durationMinutes: number;
      logId: number;         // Downtime log ID for fetching details
      actualStartTime: string;  // Actual start time (HH:MM)
      actualEndTime: string;    // Actual end time (HH:MM)
    };
    const shiftSegmentsMap: Record<string, Record<number, DowntimeSegment[]>> = {};

    // Helper to get shift duration in minutes
    const getShiftDuration = (shift: any): number => {
      const shiftStart = parseInt(shift.start_time.split(':')[0]) * 60 + parseInt(shift.start_time.split(':')[1]);
      let shiftEnd = parseInt(shift.end_time.split(':')[0]) * 60 + parseInt(shift.end_time.split(':')[1]);
      if (shiftEnd <= shiftStart) shiftEnd += 24 * 60; // Overnight shift
      return shiftEnd - shiftStart;
    };

    for (const log of rawDowntimeLogs) {
      if (!log.start_time || !log.duration_minutes) continue;
      
      const logStartTime = new Date(log.start_time.replace(' ', 'T'));
      const logEndTime = log.end_time 
        ? new Date(log.end_time.replace(' ', 'T')) 
        : new Date(logStartTime.getTime() + log.duration_minutes * 60 * 1000);
      
      // Determine category
      let categoryKey: 'changeover' | 'material' | 'quality' | 'breakdown' | 'pm' = 'breakdown';
      const code = log.code || '';
      const category = log.category || '';
      
      if (code.startsWith('CO-') || category === 'changeover') categoryKey = 'changeover';
      else if (code.startsWith('MAT-') || code === 'IDLE-MATERIAL') categoryKey = 'material';
      else if (code.startsWith('QC-')) categoryKey = 'quality';
      else if (code.startsWith('PM-') || category === 'planned_maintenance') categoryKey = 'pm';
      else if (code.startsWith('BD-') || category === 'breakdown') categoryKey = 'breakdown';
      
      // Distribute minutes across dates and shifts
      let currentTime = new Date(logStartTime);
      let remainingMinutes = log.duration_minutes;
      
      while (remainingMinutes > 0 && currentTime < logEndTime) {
        let dateStr = currentTime.toISOString().split('T')[0];
        const timeMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
        
        // Find which shift this time falls into
        let matchedShift: any = null;
        let matchedShiftId: number | null = null;
        let minutesInThisSegment = 0;
        let positionInShift = 0; // Minutes from shift start
        let isOvernightNextDayPortion = false;
        
        for (const shift of shifts) {
          const shiftStart = parseInt(shift.start_time.split(':')[0]) * 60 + parseInt(shift.start_time.split(':')[1]);
          let shiftEnd = parseInt(shift.end_time.split(':')[0]) * 60 + parseInt(shift.end_time.split(':')[1]);
          
          // Handle overnight shift
          if (shiftEnd <= shiftStart) {
            // Overnight shift: e.g., 23:00 to 07:00
            if (timeMinutes >= shiftStart) {
              // After shift start (same day)
              matchedShift = shift;
              matchedShiftId = shift.id;
              positionInShift = timeMinutes - shiftStart;
              const shiftDuration = (24 * 60 - shiftStart) + shiftEnd;
              minutesInThisSegment = Math.min(remainingMinutes, shiftDuration - positionInShift);
              break;
            } else if (timeMinutes < shiftEnd) {
              // Before shift end (next day portion) - this is part of PREVIOUS day's shift
              matchedShift = shift;
              matchedShiftId = shift.id;
              positionInShift = (24 * 60 - shiftStart) + timeMinutes;
              minutesInThisSegment = Math.min(remainingMinutes, shiftEnd - timeMinutes);
              isOvernightNextDayPortion = true; // Mark this as next-day portion
              break;
            }
          } else {
            // Normal shift (same day)
            if (timeMinutes >= shiftStart && timeMinutes < shiftEnd) {
              matchedShift = shift;
              matchedShiftId = shift.id;
              positionInShift = timeMinutes - shiftStart;
              minutesInThisSegment = Math.min(remainingMinutes, shiftEnd - timeMinutes);
              break;
            }
          }
        }
        
        // For overnight shift's next-day portion, use previous day's date
        if (isOvernightNextDayPortion) {
          const prevDate = new Date(currentTime);
          prevDate.setDate(prevDate.getDate() - 1);
          dateStr = prevDate.toISOString().split('T')[0];
        }
        
        // If no shift matched, skip to next shift start
        if (matchedShiftId === null) {
          let nextShiftStart = 24 * 60;
          for (const shift of shifts) {
            const shiftStart = parseInt(shift.start_time.split(':')[0]) * 60 + parseInt(shift.start_time.split(':')[1]);
            if (shiftStart > timeMinutes && shiftStart < nextShiftStart) {
              nextShiftStart = shiftStart;
            }
          }
          const skipMinutes = Math.min(remainingMinutes, nextShiftStart - timeMinutes);
          if (skipMinutes <= 0) {
            // Move to next day
            currentTime = new Date(currentTime.getTime() + 60 * 1000);
            remainingMinutes -= 1;
          } else {
            currentTime = new Date(currentTime.getTime() + skipMinutes * 60 * 1000);
            remainingMinutes -= skipMinutes;
          }
          continue;
        }
        
        // Ensure we make progress
        if (minutesInThisSegment <= 0) minutesInThisSegment = 1;
        
        // Initialize map structures
        if (!shiftDowntimeMap[dateStr]) {
          shiftDowntimeMap[dateStr] = {};
        }
        if (!shiftDowntimeMap[dateStr][matchedShiftId]) {
          shiftDowntimeMap[dateStr][matchedShiftId] = { changeover: 0, material: 0, quality: 0, breakdown: 0, pm: 0 };
        }
        
        if (!shiftSegmentsMap[dateStr]) {
          shiftSegmentsMap[dateStr] = {};
        }
        if (!shiftSegmentsMap[dateStr][matchedShiftId]) {
          shiftSegmentsMap[dateStr][matchedShiftId] = [];
        }
        
        // Add minutes to the correct category (totals)
        const actualMinutes = Math.min(minutesInThisSegment, remainingMinutes);
        shiftDowntimeMap[dateStr][matchedShiftId][categoryKey] += actualMinutes;
        
        // Add positioned segment with actual time info
        const shiftDuration = matchedShift ? getShiftDuration(matchedShift) : 480;
        
        // Calculate actual start and end times for this segment
        const segmentStartHour = Math.floor(timeMinutes / 60);
        const segmentStartMin = timeMinutes % 60;
        const segmentEndMinutes = timeMinutes + actualMinutes;
        const segmentEndHour = Math.floor(segmentEndMinutes / 60) % 24;
        const segmentEndMin = segmentEndMinutes % 60;
        
        const formatTime = (h: number, m: number) => 
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        
        shiftSegmentsMap[dateStr][matchedShiftId].push({
          startPercent: (positionInShift / shiftDuration) * 100,
          widthPercent: (actualMinutes / shiftDuration) * 100,
          category: categoryKey,
          durationMinutes: actualMinutes,
          logId: log.id,
          actualStartTime: formatTime(segmentStartHour, segmentStartMin),
          actualEndTime: formatTime(segmentEndHour, segmentEndMin)
        });
        
        remainingMinutes -= actualMinutes;
        currentTime = new Date(currentTime.getTime() + actualMinutes * 60 * 1000);
      }
    }

    // Convert map to array format for frontend
    const dailyShiftDowntime: Array<{
      date: string;
      shift_pattern_id: number;
      changeover_minutes: number;
      material_minutes: number;
      quality_minutes: number;
      breakdown_minutes: number;
      pm_minutes: number;
      segments: DowntimeSegment[];
    }> = [];

    // Get all dates from both maps
    const allDates = new Set([...Object.keys(shiftDowntimeMap), ...Object.keys(shiftSegmentsMap)]);
    
    for (const date of Array.from(allDates).sort()) {
      const shiftIds = new Set([
        ...Object.keys(shiftDowntimeMap[date] || {}),
        ...Object.keys(shiftSegmentsMap[date] || {})
      ]);
      
      for (const shiftIdStr of shiftIds) {
        const shiftId = parseInt(shiftIdStr);
        const data = shiftDowntimeMap[date]?.[shiftId] || { changeover: 0, material: 0, quality: 0, breakdown: 0, pm: 0 };
        const segments = shiftSegmentsMap[date]?.[shiftId] || [];
        
        dailyShiftDowntime.push({
          date,
          shift_pattern_id: shiftId,
          changeover_minutes: data.changeover,
          material_minutes: data.material,
          quality_minutes: data.quality,
          breakdown_minutes: data.breakdown,
          pm_minutes: data.pm,
          segments: segments.sort((a, b) => a.startPercent - b.startPercent)
        });
      }
    }

    // Schedule breakdown
    const noOrderMinutes = Math.max(0, totalShiftMinutesPeriod - scheduled.total);

    // Calculate efficiency
    const totalAllDowntime = summaryStats.totalDowntimeMinutes;
    const productiveMinutes = Math.max(0, scheduled.total - totalAllDowntime);
    const efficiency = scheduled.total > 0 ? (productiveMinutes / scheduled.total) * 100 : 0;

    return {
      period: {
        days,
        startDate,
        endDate,
      },
      summary: {
        totalDowntimeMinutes: summaryStats.totalDowntimeMinutes,
        totalDowntimeHours: summaryStats.totalDowntimeMinutes / 60,
        totalIncidents: summaryStats.totalIncidents,
        avgDowntimeMinutes: summaryStats.avgDowntimeMinutes,
        scheduledProductionMinutes: scheduled.total,
        scheduledProductionHours: scheduled.total / 60,
        productionEfficiency: efficiency,
        totalChangeoverMinutes: changeoverStats.totalMinutes,
        avgChangeoverMinutes: changeoverStats.avgMinutes,
        changeoverCount: changeoverStats.count,
        maintenanceDowntimeMinutes: maintenanceStats.totalMinutes,
        maintenanceDowntimeHours: maintenanceStats.totalMinutes / 60,
        maintenanceIncidents: maintenanceStats.incidents,
        plannedMaintenanceMinutes: maintenanceStats.plannedMinutes,
        unplannedMaintenanceMinutes: maintenanceStats.unplannedMinutes,
        productiveMinutes,
        productiveHours: productiveMinutes / 60,
        totalAllDowntimeMinutes: totalAllDowntime,
        gapMinutes: Math.max(0, totalShiftMinutesPeriod - scheduled.total - totalAllDowntime),
      },
      breakdown,
      changeoverStats: changeoverStatsList,
      downtimeByClassification,
      downtimeByAsset,
      dailyTrend,
      weeklyComparison: [], // Could be computed if needed
      recentDowntimes,
      maintenanceDowntime: {
        totalMinutes: maintenanceStats.totalMinutes,
        incidents: maintenanceStats.incidents,
        plannedMinutes: maintenanceStats.plannedMinutes,
        unplannedMinutes: maintenanceStats.unplannedMinutes,
      },
      dailyBreakdown,
      dailyScheduled,
      dailyScheduleStatus,
      dailyShiftDowntime,
      scheduleBreakdown: {
        totalShiftMinutesPerDay: shiftMinutesPerDay,
        totalShiftMinutesPeriod,
        scheduled: scheduled.total,
        noOrder: noOrderMinutes,
        holiday: 0, // Could be computed from a holiday table if exists
        maintenanceWindow: 0, // Could be computed
        unscheduled: noOrderMinutes,
      },
      shifts,
    };
  }

  /**
   * Get Work Order Report
   */
  getWorkOrderReport(filter: DateRangeFilter): WorkOrderReport {
    const days = filter.days || 30;

    const total = this.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM work_orders') || {
      count: 0,
    };

    const byStatus = this.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM work_orders GROUP BY status'
    );

    const byType = this.query<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM work_orders GROUP BY type'
    );

    const byPriority = this.query<{ priority: string; count: number }>(
      'SELECT priority, COUNT(*) as count FROM work_orders GROUP BY priority'
    );

    const completedThisMonth = this.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM work_orders 
      WHERE status = 'completed' AND actual_end >= date('now', '-${days} days')
    `) || { count: 0 };

    const avgCompletion = this.queryOne<{ avg_hours: number }>(`
      SELECT AVG(
        (julianday(actual_end) - julianday(actual_start)) * 24
      ) as avg_hours
      FROM work_orders
      WHERE status = 'completed' AND actual_start IS NOT NULL AND actual_end IS NOT NULL
    `) || { avg_hours: 0 };

    const topAssets = this.query<any>(`
      SELECT 
        a.id as asset_id, a.name as asset_name, a.asset_code,
        COUNT(wo.id) as total_wo,
        SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_wo
      FROM assets a
      LEFT JOIN work_orders wo ON a.id = wo.asset_id
      GROUP BY a.id
      ORDER BY total_wo DESC
      LIMIT 10
    `);

    return {
      total: total.count,
      byStatus,
      byType,
      byPriority,
      completedThisMonth: completedThisMonth.count,
      avgCompletionHours: avgCompletion.avg_hours || 0,
      topAssets,
    };
  }

  /**
   * Get Ticket Report
   */
  getTicketReport(filter: DateRangeFilter): TicketReport {
    const days = filter.days || 30;

    const total = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM tickets WHERE type != "epic"'
    ) || { count: 0 };

    const byStatus = this.query<{ status: string; count: number }>(
      'SELECT status, COUNT(*) as count FROM tickets WHERE type != "epic" GROUP BY status'
    );

    const byType = this.query<{ type: string; count: number }>(
      'SELECT type, COUNT(*) as count FROM tickets GROUP BY type'
    );

    const byPriority = this.query<{ priority: string; count: number }>(
      'SELECT priority, COUNT(*) as count FROM tickets WHERE type != "epic" GROUP BY priority'
    );

    const createdThisMonth = this.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE created_at >= date('now', '-${days} days') AND type != 'epic'
    `) || { count: 0 };

    const completedThisMonth = this.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE status = 'done' AND updated_at >= date('now', '-${days} days') AND type != 'epic'
    `) || { count: 0 };

    const avgCompletion = this.queryOne<{ avg_days: number }>(`
      SELECT AVG(julianday(updated_at) - julianday(created_at)) as avg_days
      FROM tickets
      WHERE status = 'done' AND type != 'epic'
    `) || { avg_days: 0 };

    const overdue = this.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM tickets 
      WHERE due_date < date('now') AND status NOT IN ('done') AND type != 'epic'
    `) || { count: 0 };

    return {
      total: total.count,
      byStatus,
      byType,
      byPriority,
      createdThisMonth: createdThisMonth.count,
      completedThisMonth: completedThisMonth.count,
      avgCompletionDays: avgCompletion.avg_days || 0,
      overdueCount: overdue.count,
    };
  }

  /**
   * Get Team Report
   */
  getTeamReport(): TeamReport {
    const totalMembers = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    ) || { count: 0 };

    const byRole = this.query<{ role: string; count: number }>(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );

    const topPerformers = this.query<any>(`
      SELECT 
        u.id as user_id, u.name as user_name,
        COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN t.status = 'done' THEN t.story_points ELSE 0 END), 0) as story_points
      FROM users u
      LEFT JOIN ticket_assignees ta ON u.id = ta.user_id
      LEFT JOIN tickets t ON ta.ticket_id = t.id AND t.type != 'epic'
      GROUP BY u.id
      ORDER BY completed_count DESC
      LIMIT 10
    `);

    const workloadDistribution = this.query<any>(`
      SELECT 
        u.id as user_id, u.name as user_name,
        COUNT(ta.ticket_id) as assigned_count,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress
      FROM users u
      LEFT JOIN ticket_assignees ta ON u.id = ta.user_id
      LEFT JOIN tickets t ON ta.ticket_id = t.id AND t.type != 'epic' AND t.status NOT IN ('done')
      GROUP BY u.id
      ORDER BY assigned_count DESC
    `);

    return {
      totalMembers: totalMembers.count,
      byRole,
      topPerformers,
      workloadDistribution,
    };
  }

  /**
   * Get Daily Production Breakdown
   */
  getDailyBreakdown(filter: DateRangeFilter & { asset_id?: number }): ProductionBreakdown[] {
    const days = filter.days || 7;

    return this.query<ProductionBreakdown>(`
      SELECT 
        date(ps.date) as date,
        COALESCE(SUM(ps.planned_production_minutes), 0) as scheduledMinutes,
        COALESCE(SUM(ps.planned_production_minutes), 0) - 
          COALESCE((
            SELECT SUM(dl.duration_minutes) 
            FROM downtime_logs dl 
            WHERE date(dl.start_time) = date(ps.date)
          ), 0) as productiveMinutes,
        COALESCE((
          SELECT SUM(dl.duration_minutes) 
          FROM downtime_logs dl 
          JOIN downtime_classifications dc ON dl.classification_id = dc.id
          WHERE date(dl.start_time) = date(ps.date) AND (dc.category = 'changeover' OR dc.code LIKE 'CO-%')
        ), 0) as changeoverMinutes,
        COALESCE((
          SELECT SUM(dl.duration_minutes) 
          FROM downtime_logs dl 
          JOIN downtime_classifications dc ON dl.classification_id = dc.id
          WHERE date(dl.start_time) = date(ps.date) AND dc.category = 'maintenance'
        ), 0) as maintenanceMinutes,
        COALESCE((
          SELECT SUM(dl.duration_minutes) 
          FROM downtime_logs dl 
          JOIN downtime_classifications dc ON dl.classification_id = dc.id
          WHERE date(dl.start_time) = date(ps.date) AND dc.category = 'production' AND dc.code NOT LIKE 'CO-%'
        ), 0) as productionDowntimeMinutes,
        0 as idleMinutes
      FROM production_schedule ps
      WHERE ps.date >= date('now', '-${days} days')
      GROUP BY date(ps.date)
      ORDER BY date(ps.date) ASC
    `);
  }

  /**
   * Get Asset KPI
   */
  getAssetKPI(assetId: number, days: number = 30): any {
    const asset = this.db.prepare('SELECT * FROM assets WHERE id = ?').get(assetId) as any;
    if (!asset) return null;

    const downtimeStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total_events,
        COALESCE(SUM(
          CASE WHEN end_time IS NOT NULL THEN
            CAST((julianday(end_time) - julianday(start_time)) * 1440 AS INTEGER)
          ELSE 0 END
        ), 0) as total_minutes,
        COALESCE(AVG(
          CASE WHEN end_time IS NOT NULL THEN
            CAST((julianday(end_time) - julianday(start_time)) * 1440 AS REAL)
          ELSE NULL END
        ), 0) as avg_duration
      FROM downtime_logs
      WHERE asset_id = ? AND start_time >= date('now', '-' || ? || ' days')
    `).get(assetId, days);

    const workOrderStats = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as pending
      FROM work_orders
      WHERE asset_id = ? AND created_at >= date('now', '-' || ? || ' days')
    `).get(assetId, days);

    return {
      asset,
      period: `${days} days`,
      downtime: downtimeStats,
      workOrders: workOrderStats,
    };
  }

  /**
   * Get Downtime Report
   */
  getDowntimeReport(filter: DateRangeFilter & { asset_id?: number }): any {
    let whereClause = '1=1';
    const params: any[] = [];

    if (filter.start_date) {
      whereClause += ' AND dl.start_time >= ?';
      params.push(filter.start_date);
    } else if (filter.days) {
      whereClause += ` AND dl.start_time >= date('now', '-${filter.days} days')`;
    }
    if (filter.end_date) {
      whereClause += ' AND dl.start_time <= ?';
      params.push(filter.end_date);
    }
    if (filter.asset_id) {
      whereClause += ' AND dl.asset_id = ?';
      params.push(filter.asset_id);
    }

    const summary = this.db.prepare(`
      SELECT 
        COUNT(*) as total_events,
        SUM(CASE WHEN end_time IS NULL THEN 1 ELSE 0 END) as active_events,
        COALESCE(SUM(
          CASE WHEN end_time IS NOT NULL THEN
            CAST((julianday(end_time) - julianday(start_time)) * 1440 AS INTEGER)
          ELSE 0 END
        ), 0) as total_minutes
      FROM downtime_logs dl
      WHERE ${whereClause}
    `).get(...params);

    const byClassification = this.db.prepare(`
      SELECT 
        dc.id, dc.name, dc.category,
        COUNT(*) as count,
        COALESCE(SUM(
          CASE WHEN dl.end_time IS NOT NULL THEN
            CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
          ELSE 0 END
        ), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE ${whereClause}
      GROUP BY dc.id
      ORDER BY total_minutes DESC
    `).all(...params);

    const byAsset = this.db.prepare(`
      SELECT 
        a.id, a.name, a.asset_code,
        COUNT(*) as count,
        COALESCE(SUM(
          CASE WHEN dl.end_time IS NOT NULL THEN
            CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
          ELSE 0 END
        ), 0) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      WHERE ${whereClause}
      GROUP BY a.id
      ORDER BY total_minutes DESC
      LIMIT 10
    `).all(...params);

    return {
      summary,
      byClassification,
      byAsset,
    };
  }

  /**
   * Get Maintenance Compliance
   */
  getMaintenanceCompliance(days: number = 30): any {
    const schedules = this.db.prepare(`
      SELECT 
        COUNT(*) as total_schedules,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_schedules,
        SUM(CASE WHEN next_due < date('now') THEN 1 ELSE 0 END) as overdue
      FROM maintenance_schedules
    `).get() as any;

    const completedOnTime = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM work_orders wo
      WHERE wo.type = 'preventive'
        AND wo.status = 'completed'
        AND wo.actual_end <= wo.scheduled_end
        AND wo.created_at >= date('now', '-' || ? || ' days')
    `).get(days) as { count: number };

    const completedLate = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM work_orders wo
      WHERE wo.type = 'preventive'
        AND wo.status = 'completed'
        AND (wo.actual_end > wo.scheduled_end OR wo.scheduled_end IS NULL)
        AND wo.created_at >= date('now', '-' || ? || ' days')
    `).get(days) as { count: number };

    const total = completedOnTime.count + completedLate.count;
    const complianceRate = total > 0 ? (completedOnTime.count / total) * 100 : 0;

    return {
      schedules,
      completedOnTime: completedOnTime.count,
      completedLate: completedLate.count,
      complianceRate: Math.round(complianceRate * 10) / 10,
      period: `${days} days`,
    };
  }

  /**
   * Get Technician Performance
   */
  getTechnicianPerformance(days: number = 30): any {
    const technicians = this.db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(DISTINCT woa.work_order_id) as total_assigned,
        SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed,
        COALESCE(AVG(
          CASE WHEN wo.status = 'completed' AND wo.actual_start IS NOT NULL AND wo.actual_end IS NOT NULL THEN
            CAST((julianday(wo.actual_end) - julianday(wo.actual_start)) * 24 AS REAL)
          ELSE NULL END
        ), 0) as avg_completion_hours
      FROM users u
      LEFT JOIN work_order_assignees woa ON u.id = woa.user_id
      LEFT JOIN work_orders wo ON woa.work_order_id = wo.id 
        AND wo.created_at >= date('now', '-' || ? || ' days')
      WHERE u.role IN ('technician', 'operator', 'supervisor')
      GROUP BY u.id
      ORDER BY completed DESC
    `).all(days);

    return {
      technicians,
      period: `${days} days`,
    };
  }
}

// Export singleton
export const reportRepository = new ReportRepository();
export default reportRepository;
