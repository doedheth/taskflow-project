/**
 * AI Tools Service
 * Implements AI tools for OpenAI function calling
 */

import db from '../../database/db';
import { ToolDefinition, ToolExecutionResult } from '../../types/ai';

export class AIToolsService {
  /**
   * Tool definitions for OpenAI function calling
   */
  private toolDefinitions: ToolDefinition[] = [
    {
      type: 'function',
      function: {
        name: 'search_tickets',
        description: 'Search for tickets by various criteria like status, priority, keyword, or assignee',
        parameters: {
          type: 'object',
          properties: {
            keyword: { type: 'string', description: 'Search keyword in title or description' },
            ticket_key: { type: 'string', description: 'Specific ticket key (e.g., TM-123)' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'review', 'done'], description: 'Ticket status' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'], description: 'Ticket priority' },
            type: { type: 'string', enum: ['bug', 'feature', 'task', 'improvement', 'maintenance'], description: 'Ticket type' },
            limit: { type: 'number', description: 'Max number of results (default 10)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_work_order_insights',
        description: 'Get insights about work orders including active WOs, statistics, and recent completions',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_downtime_analysis',
        description: 'Analyze downtime data by classification and asset for a given period',
        parameters: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days to analyze (default 7)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_team_workload',
        description: 'Get workload distribution across team members',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_asset_health',
        description: 'Get asset health summary including assets with issues and overall statistics',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_production_kpi',
        description: 'Get production KPI metrics for a given period',
        parameters: {
          type: 'object',
          properties: {
            days: { type: 'number', description: 'Number of days (default 30)' },
            asset_id: { type: 'number', description: 'Specific asset ID (optional)' },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_manager_insights',
        description: 'Get high-level insights for managers including KPIs, alerts, and recommendations',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
    },
  ];

  /**
   * Get all tool definitions for OpenAI function calling
   */
  getToolDefinitions(): ToolDefinition[] {
    return this.toolDefinitions;
  }

  /**
   * Execute a tool by name
   */
  async executeTool(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      let result: any;

      switch (toolName) {
        case 'search_tickets':
          result = this.searchTickets(args);
          break;
        case 'get_work_order_insights':
          result = this.getWorkOrderInsights();
          break;
        case 'get_downtime_analysis':
          result = this.getDowntimeAnalysis(args.days || 7);
          break;
        case 'get_team_workload':
          result = this.getTeamWorkload();
          break;
        case 'get_asset_health':
          result = this.getAssetHealth();
          break;
        case 'get_production_kpi':
          result = this.getProductionKPI(args.days || 30, args.asset_id);
          break;
        case 'get_manager_insights':
          result = this.getManagerInsights();
          break;
        default:
          return {
            success: false,
            error: `Unknown tool: ${toolName}`,
          };
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      console.error(`Tool execution error (${toolName}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search tickets
   */
  searchTickets(params: {
    keyword?: string;
    ticket_key?: string;
    status?: string;
    priority?: string;
    type?: string;
    assignee_name?: string;
    department_name?: string;
    limit?: number;
  }): any[] {
    let sql = `
      SELECT t.*, 
             d.name as department_name,
             GROUP_CONCAT(u.name, ', ') as assignee_names
      FROM tickets t
      LEFT JOIN departments d ON t.department_id = d.id
      LEFT JOIN ticket_assignees ta ON t.id = ta.ticket_id
      LEFT JOIN users u ON ta.user_id = u.id
      WHERE 1=1
    `;
    const queryParams: any[] = [];

    if (params.keyword) {
      sql += ' AND (t.title LIKE ? OR t.description LIKE ?)';
      queryParams.push(`%${params.keyword}%`, `%${params.keyword}%`);
    }
    if (params.ticket_key) {
      sql += ' AND t.ticket_key = ?';
      queryParams.push(params.ticket_key);
    }
    if (params.status) {
      sql += ' AND t.status = ?';
      queryParams.push(params.status);
    }
    if (params.priority) {
      sql += ' AND t.priority = ?';
      queryParams.push(params.priority);
    }
    if (params.type) {
      sql += ' AND t.type = ?';
      queryParams.push(params.type);
    }

    sql += ' GROUP BY t.id ORDER BY t.updated_at DESC';

    if (params.limit) {
      sql += ' LIMIT ?';
      queryParams.push(params.limit);
    } else {
      sql += ' LIMIT 10';
    }

    return db.prepare(sql).all(...queryParams);
  }

  /**
   * Get work order insights
   */
  getWorkOrderInsights(): any {
    // Active work orders
    const activeWOs = db
      .prepare(
        `
      SELECT wo.*, a.name as asset_name, a.asset_code,
             GROUP_CONCAT(u.name, ', ') as assignee_names
      FROM work_orders wo
      LEFT JOIN assets a ON wo.asset_id = a.id
      LEFT JOIN work_order_assignees woa ON wo.id = woa.work_order_id
      LEFT JOIN users u ON woa.user_id = u.id
      WHERE wo.status IN ('open', 'in_progress')
      GROUP BY wo.id
      ORDER BY wo.priority DESC, wo.created_at ASC
      LIMIT 20
    `
      )
      .all();

    // Statistics
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'completed' AND date(actual_end) >= date('now', '-7 days') THEN 1 ELSE 0 END) as completed_this_week
      FROM work_orders
    `
      )
      .get();

    return { activeWOs, stats };
  }

  /**
   * Get downtime analysis
   */
  getDowntimeAnalysis(days: number = 7): any {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total downtime by classification
    const byClassification = db
      .prepare(
        `
      SELECT 
        dc.name as classification_name,
        COUNT(*) as count,
        SUM(
          CASE 
            WHEN dl.end_time IS NOT NULL THEN 
              CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
            ELSE 
              CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
          END
        ) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ?
      GROUP BY dc.id
      ORDER BY total_minutes DESC
    `
      )
      .all(startDate.toISOString());

    // Top assets with most downtime
    const byAsset = db
      .prepare(
        `
      SELECT 
        a.name as asset_name,
        a.asset_code,
        COUNT(*) as incident_count,
        SUM(
          CASE 
            WHEN dl.end_time IS NOT NULL THEN 
              CAST((julianday(dl.end_time) - julianday(dl.start_time)) * 1440 AS INTEGER)
            ELSE 
              CAST((julianday('now') - julianday(dl.start_time)) * 1440 AS INTEGER)
          END
        ) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN assets a ON dl.asset_id = a.id
      WHERE dl.start_time >= ?
      GROUP BY a.id
      ORDER BY total_minutes DESC
      LIMIT 10
    `
      )
      .all(startDate.toISOString());

    return { byClassification, byAsset, period: `${days} days` };
  }

  /**
   * Get team workload
   */
  getTeamWorkload(): any[] {
    return db
      .prepare(
        `
      SELECT 
        u.id as user_id,
        u.name as user_name,
        u.role,
        COUNT(DISTINCT ta.ticket_id) as assigned_tickets,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo,
        SUM(CASE WHEN t.status = 'done' AND date(t.updated_at) >= date('now', '-7 days') THEN 1 ELSE 0 END) as completed_this_week
      FROM users u
      LEFT JOIN ticket_assignees ta ON u.id = ta.user_id
      LEFT JOIN tickets t ON ta.ticket_id = t.id
      WHERE u.role IN ('technician', 'operator', 'supervisor')
      GROUP BY u.id
      ORDER BY assigned_tickets DESC
    `
      )
      .all();
  }

  /**
   * Get asset health summary
   */
  getAssetHealth(): any {
    // Assets with recent downtime
    const assetsWithIssues = db
      .prepare(
        `
      SELECT 
        a.id, a.name, a.asset_code, a.status,
        COUNT(dl.id) as downtime_count,
        MAX(dl.start_time) as last_downtime
      FROM assets a
      LEFT JOIN downtime_logs dl ON a.id = dl.asset_id 
        AND dl.start_time >= date('now', '-30 days')
      GROUP BY a.id
      HAVING downtime_count > 0
      ORDER BY downtime_count DESC
      LIMIT 10
    `
      )
      .all();

    // Overall health stats
    const stats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_assets,
        SUM(CASE WHEN status = 'operational' THEN 1 ELSE 0 END) as operational,
        SUM(CASE WHEN status = 'down' THEN 1 ELSE 0 END) as down,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as under_maintenance
      FROM assets
    `
      )
      .get();

    return { assetsWithIssues, stats };
  }

  /**
   * Get production KPI
   */
  getProductionKPI(days: number = 30, assetId?: number): any {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let assetFilter = '';
    const params: any[] = [startDate.toISOString()];
    if (assetId) {
      assetFilter = ' AND dl.asset_id = ?';
      params.push(assetId);
    }

    // Production downtime stats
    const downtimeStats = db
      .prepare(
        `
      SELECT 
        dc.category,
        COUNT(*) as incident_count,
        SUM(COALESCE(dl.duration_minutes, 0)) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? ${assetFilter}
      GROUP BY dc.category
    `
      )
      .all(...params);

    // Changeover stats
    const changeoverStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as changeover_count,
        AVG(dl.duration_minutes) as avg_minutes,
        SUM(dl.duration_minutes) as total_minutes
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      WHERE dl.start_time >= ? 
        AND (dc.category = 'changeover' OR dc.code LIKE 'CO-%')
        ${assetFilter}
    `
      )
      .get(...params);

    return {
      period: `${days} days`,
      downtimeByCategory: downtimeStats,
      changeover: changeoverStats,
    };
  }

  /**
   * Get manager insights
   */
  getManagerInsights(): any {
    // KPI Summary
    const ticketStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('todo', 'in_progress') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN priority = 'critical' AND status != 'done' THEN 1 ELSE 0 END) as critical_open
      FROM tickets
      WHERE created_at >= date('now', '-30 days')
    `
      )
      .get();

    const woStats = db
      .prepare(
        `
      SELECT 
        COUNT(*) as total_work_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN priority = 'critical' AND status != 'completed' THEN 1 ELSE 0 END) as critical_open
      FROM work_orders
      WHERE created_at >= date('now', '-30 days')
    `
      )
      .get();

    // Active alerts
    const alerts: string[] = [];

    // Check for critical items
    const criticalTickets = db
      .prepare(
        `SELECT COUNT(*) as count FROM tickets WHERE priority = 'critical' AND status NOT IN ('done', 'cancelled')`
      )
      .get() as { count: number };

    if (criticalTickets.count > 0) {
      alerts.push(`${criticalTickets.count} tiket kritis membutuhkan perhatian`);
    }

    const criticalWOs = db
      .prepare(
        `SELECT COUNT(*) as count FROM work_orders WHERE priority = 'critical' AND status NOT IN ('completed', 'cancelled')`
      )
      .get() as { count: number };

    if (criticalWOs.count > 0) {
      alerts.push(`${criticalWOs.count} work order kritis aktif`);
    }

    // Check for assets in breakdown
    const breakdownAssets = db
      .prepare(`SELECT COUNT(*) as count FROM assets WHERE status = 'breakdown'`)
      .get() as { count: number };

    if (breakdownAssets.count > 0) {
      alerts.push(`${breakdownAssets.count} aset dalam kondisi breakdown`);
    }

    return {
      ticketStats,
      woStats,
      alerts,
      recommendations: this.generateRecommendations(ticketStats, woStats),
    };
  }

  /**
   * Generate recommendations based on stats
   */
  private generateRecommendations(ticketStats: any, woStats: any): string[] {
    const recommendations: string[] = [];

    if (ticketStats?.critical_open > 0) {
      recommendations.push('Prioritaskan penyelesaian tiket kritis yang masih terbuka');
    }

    if (woStats?.critical_open > 0) {
      recommendations.push('Perhatikan work order kritis yang membutuhkan penanganan segera');
    }

    const completionRate =
      ticketStats?.total_tickets > 0
        ? (ticketStats.completed / ticketStats.total_tickets) * 100
        : 0;

    if (completionRate < 70) {
      recommendations.push(
        `Tingkat penyelesaian tiket (${completionRate.toFixed(1)}%) di bawah target. Pertimbangkan untuk mengalokasikan lebih banyak sumber daya.`
      );
    }

    return recommendations;
  }
}

// Export singleton
export const aiToolsService = new AIToolsService();
export default aiToolsService;
