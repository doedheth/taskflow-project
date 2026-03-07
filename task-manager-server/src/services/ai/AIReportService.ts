/**
 * AI Report Service
 *
 * AI-powered service for generating comprehensive maintenance reports
 * Story 7.7: Create AI Report Generation
 */

import OpenAI from 'openai';
import db from '../../database/db';

// ============================================
// Types
// ============================================

export interface ReportGenerationRequest {
  period_type: 'monthly' | 'weekly' | 'quarterly';
  year: number;
  month?: number;
  week?: number;
  quarter?: number;
}

export interface MetricSet {
  total_work_orders: number;
  completed_work_orders: number;
  pm_compliance_rate: number;
  mttr_hours: number;
  mtbf_hours: number;
  downtime_hours: number;
  breakdown_count: number;
}

export interface TrendIndicator {
  metric: string;
  change_percentage: number;
  direction: 'up' | 'down' | 'stable';
  is_positive: boolean;
}

export interface TopIssue {
  issue: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_type: 'create_wo' | 'update_pm' | 'review_asset' | 'other';
  action_data?: Record<string, unknown>;
}

export interface TeamMember {
  user_id: number;
  user_name: string;
  completion_count: number;
  completion_rate: number;
}

export interface TeamHighlights {
  top_performers: TeamMember[];
  completion_rate: number;
  average_response_time: string;
}

export interface GeneratedReport {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
  executive_summary: string;
  metrics: {
    current_period: MetricSet;
    previous_period: MetricSet;
    trend: TrendIndicator[];
  };
  top_issues: TopIssue[];
  recommendations: ReportRecommendation[];
  team_highlights: TeamHighlights;
}

// ============================================
// AI Report Service
// ============================================

export class AIReportService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a comprehensive maintenance report for the specified period
   */
  async generateReport(request: ReportGenerationRequest, userId: number): Promise<GeneratedReport> {
    // 1. Check if report already exists for this period
    const existing = await this.findExistingReport(request);
    if (existing) {
      return this.formatStoredReport(existing);
    }

    // 2. Gather metrics data
    const periodLabel = this.getPeriodLabel(request);
    const currentMetrics = await this.gatherMetricsForPeriod(request);
    const previousMetrics = await this.gatherMetricsForPreviousPeriod(request);

    // 3. Calculate trends
    const trends = this.calculateTrends(currentMetrics, previousMetrics);

    // 4. Identify top issues
    const topIssues = await this.identifyTopIssues(request);

    // 5. Get team performance data
    const teamHighlights = await this.getTeamHighlights(request);

    // 6. Generate AI content
    const executiveSummary = await this.generateExecutiveSummary({
      periodLabel,
      currentMetrics,
      previousMetrics,
      trends,
      topIssues,
    });

    const recommendations = await this.generateRecommendations({
      metrics: currentMetrics,
      trends,
      topIssues,
      teamHighlights,
    });

    // 7. Store report
    const report = await this.storeReport({
      ...request,
      period_label: periodLabel,
      executive_summary: executiveSummary,
      metrics: { current_period: currentMetrics, previous_period: previousMetrics, trend: trends },
      top_issues: topIssues,
      recommendations,
      team_highlights: teamHighlights,
      generated_by: userId,
    });

    return report;
  }

  /**
   * Get period label for display (e.g., "Desember 2025")
   */
  private getPeriodLabel(request: ReportGenerationRequest): string {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    if (request.period_type === 'monthly' && request.month) {
      return `${monthNames[request.month - 1]} ${request.year}`;
    } else if (request.period_type === 'quarterly' && request.quarter) {
      return `Q${request.quarter} ${request.year}`;
    } else if (request.period_type === 'weekly' && request.week) {
      return `Minggu ${request.week}, ${request.year}`;
    }
    return `${request.year}`;
  }

  /**
   * Find existing report for the same period
   */
  private findExistingReport(request: ReportGenerationRequest): any {
    const stmt = db.prepare(`
      SELECT * FROM ai_reports
      WHERE period_type = ?
        AND period_year = ?
        AND period_month = ?
      ORDER BY generated_at DESC
      LIMIT 1
    `);
    return stmt.get(request.period_type, request.year, request.month || null);
  }

  /**
   * Format stored report to GeneratedReport interface
   */
  private formatStoredReport(stored: any): GeneratedReport {
    return {
      id: stored.id,
      period_type: stored.period_type,
      period_label: stored.period_label,
      generated_at: stored.generated_at,
      generated_by: stored.generated_by,
      executive_summary: stored.executive_summary,
      metrics: JSON.parse(stored.metrics),
      top_issues: JSON.parse(stored.top_issues),
      recommendations: JSON.parse(stored.recommendations),
      team_highlights: JSON.parse(stored.team_highlights),
    };
  }

  /**
   * Gather metrics for the specified period
   */
  private async gatherMetricsForPeriod(request: ReportGenerationRequest): Promise<MetricSet> {
    const { startDate, endDate } = this.getPeriodDates(request);

    // Total and completed work orders
    const woStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
      FROM work_orders
      WHERE created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as any;

    // PM Compliance (completed PM / scheduled PM)
    const pmStats = db.prepare(`
      SELECT
        COUNT(*) as total_pm,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_pm
      FROM work_orders
      WHERE type = 'preventive'
        AND created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as any;

    const pmCompliance = pmStats.total_pm > 0
      ? Math.round((pmStats.completed_pm / pmStats.total_pm) * 100)
      : 100;

    // Downtime statistics
    const downtimeStats = db.prepare(`
      SELECT
        COALESCE(SUM(duration_minutes), 0) / 60.0 as total_hours,
        COUNT(CASE WHEN downtime_type = 'unplanned' THEN 1 END) as breakdown_count
      FROM downtime_logs
      WHERE start_time >= ? AND start_time < ?
    `).get(startDate, endDate) as any;

    // MTTR (Mean Time to Repair) - average repair duration
    const mttrStats = db.prepare(`
      SELECT AVG(
        CASE
          WHEN actual_end IS NOT NULL AND actual_start IS NOT NULL
          THEN (julianday(actual_end) - julianday(actual_start)) * 24
          ELSE NULL
        END
      ) as avg_mttr
      FROM work_orders
      WHERE type = 'corrective'
        AND status = 'completed'
        AND created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as any;

    // MTBF (Mean Time Between Failures)
    const mtbfStats = db.prepare(`
      SELECT
        COUNT(*) as failure_count,
        (julianday(?) - julianday(?)) * 24 as period_hours
      FROM downtime_logs
      WHERE downtime_type = 'unplanned'
        AND start_time >= ? AND start_time < ?
    `).get(endDate, startDate, startDate, endDate) as any;

    const mtbfHours = mtbfStats.failure_count > 1
      ? mtbfStats.period_hours / mtbfStats.failure_count
      : mtbfStats.period_hours || 720;

    return {
      total_work_orders: woStats.total || 0,
      completed_work_orders: woStats.completed || 0,
      pm_compliance_rate: pmCompliance,
      mttr_hours: Math.round((mttrStats.avg_mttr || 0) * 10) / 10,
      mtbf_hours: Math.round(mtbfHours * 10) / 10,
      downtime_hours: Math.round((downtimeStats.total_hours || 0) * 10) / 10,
      breakdown_count: downtimeStats.breakdown_count || 0,
    };
  }

  /**
   * Get previous period metrics for comparison
   */
  private async gatherMetricsForPreviousPeriod(request: ReportGenerationRequest): Promise<MetricSet> {
    const prevRequest = this.getPreviousPeriod(request);
    return this.gatherMetricsForPeriod(prevRequest);
  }

  /**
   * Calculate start and end dates for a period
   */
  private getPeriodDates(request: ReportGenerationRequest): { startDate: string; endDate: string } {
    if (request.period_type === 'monthly' && request.month) {
      const startDate = `${request.year}-${String(request.month).padStart(2, '0')}-01`;
      const nextMonth = request.month === 12 ? 1 : request.month + 1;
      const nextYear = request.month === 12 ? request.year + 1 : request.year;
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      return { startDate, endDate };
    } else if (request.period_type === 'quarterly' && request.quarter) {
      const startMonth = (request.quarter - 1) * 3 + 1;
      const endMonth = startMonth + 3;
      const startDate = `${request.year}-${String(startMonth).padStart(2, '0')}-01`;
      const nextYear = endMonth > 12 ? request.year + 1 : request.year;
      const actualEndMonth = endMonth > 12 ? 1 : endMonth;
      const endDate = `${nextYear}-${String(actualEndMonth).padStart(2, '0')}-01`;
      return { startDate, endDate };
    }
    // Default to current month
    const now = new Date();
    return {
      startDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
      endDate: `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`,
    };
  }

  /**
   * Get previous period request for comparison
   */
  private getPreviousPeriod(request: ReportGenerationRequest): ReportGenerationRequest {
    if (request.period_type === 'monthly' && request.month) {
      const prevMonth = request.month === 1 ? 12 : request.month - 1;
      const prevYear = request.month === 1 ? request.year - 1 : request.year;
      return { ...request, month: prevMonth, year: prevYear };
    } else if (request.period_type === 'quarterly' && request.quarter) {
      const prevQuarter = request.quarter === 1 ? 4 : request.quarter - 1;
      const prevYear = request.quarter === 1 ? request.year - 1 : request.year;
      return { ...request, quarter: prevQuarter, year: prevYear };
    }
    return { ...request, year: request.year - 1 };
  }

  /**
   * Calculate trend indicators between periods
   */
  private calculateTrends(current: MetricSet, previous: MetricSet): TrendIndicator[] {
    const calculateTrend = (
      metric: string,
      curr: number,
      prev: number,
      higherIsGood: boolean
    ): TrendIndicator => {
      const change = prev > 0 ? ((curr - prev) / prev) * 100 : 0;
      const direction: 'up' | 'down' | 'stable' =
        Math.abs(change) < 5 ? 'stable' : change > 0 ? 'up' : 'down';
      const isPositive = direction === 'stable' ||
        (higherIsGood ? direction === 'up' : direction === 'down');

      return {
        metric,
        change_percentage: Math.round(change * 10) / 10,
        direction,
        is_positive: isPositive,
      };
    };

    return [
      calculateTrend('Total Work Orders', current.total_work_orders, previous.total_work_orders, true),
      calculateTrend('Completed WOs', current.completed_work_orders, previous.completed_work_orders, true),
      calculateTrend('PM Compliance', current.pm_compliance_rate, previous.pm_compliance_rate, true),
      calculateTrend('MTTR (hours)', current.mttr_hours, previous.mttr_hours, false),
      calculateTrend('MTBF (hours)', current.mtbf_hours, previous.mtbf_hours, true),
      calculateTrend('Downtime (hours)', current.downtime_hours, previous.downtime_hours, false),
      calculateTrend('Breakdowns', current.breakdown_count, previous.breakdown_count, false),
    ];
  }

  /**
   * Identify top issues for the period
   */
  private async identifyTopIssues(request: ReportGenerationRequest): Promise<TopIssue[]> {
    const { startDate, endDate } = this.getPeriodDates(request);
    const prevRequest = this.getPreviousPeriod(request);
    const { startDate: prevStart, endDate: prevEnd } = this.getPeriodDates(prevRequest);

    // Get issue counts from downtime reasons
    const currentIssues = db.prepare(`
      SELECT reason as issue, COUNT(*) as count
      FROM downtime_logs
      WHERE reason IS NOT NULL AND reason != ''
        AND start_time >= ? AND start_time < ?
      GROUP BY reason
      ORDER BY count DESC
      LIMIT 5
    `).all(startDate, endDate) as any[];

    const previousIssues = db.prepare(`
      SELECT reason as issue, COUNT(*) as count
      FROM downtime_logs
      WHERE reason IS NOT NULL AND reason != ''
        AND start_time >= ? AND start_time < ?
      GROUP BY reason
    `).all(prevStart, prevEnd) as any[];

    const prevIssueMap = new Map(previousIssues.map(i => [i.issue, i.count]));
    const totalCurrent = currentIssues.reduce((sum, i) => sum + i.count, 0);

    return currentIssues.map(issue => {
      const prevCount = prevIssueMap.get(issue.issue) || 0;
      const change = prevCount > 0 ? ((issue.count - prevCount) / prevCount) * 100 : 0;
      const trend: 'up' | 'down' | 'stable' =
        Math.abs(change) < 10 ? 'stable' : change > 0 ? 'up' : 'down';

      return {
        issue: issue.issue,
        count: issue.count,
        percentage: totalCurrent > 0 ? Math.round((issue.count / totalCurrent) * 100) : 0,
        trend,
      };
    });
  }

  /**
   * Get team performance highlights
   */
  private async getTeamHighlights(request: ReportGenerationRequest): Promise<TeamHighlights> {
    const { startDate, endDate } = this.getPeriodDates(request);

    // Get top performers by completed work orders
    const topPerformers = db.prepare(`
      SELECT
        u.id as user_id,
        u.name as user_name,
        COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completion_count,
        ROUND(
          CAST(COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) AS FLOAT) /
          NULLIF(COUNT(*), 0) * 100, 1
        ) as completion_rate
      FROM users u
      LEFT JOIN work_order_assignees woa ON u.id = woa.user_id
      LEFT JOIN work_orders wo ON woa.work_order_id = wo.id
        AND wo.created_at >= ? AND wo.created_at < ?
      WHERE u.role IN ('member', 'supervisor')
      GROUP BY u.id
      HAVING COUNT(*) > 0
      ORDER BY completion_count DESC, completion_rate DESC
      LIMIT 3
    `).all(startDate, endDate) as TeamMember[];

    // Overall completion rate
    const overallStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(*) as total
      FROM work_orders
      WHERE created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as any;

    const completionRate = overallStats.total > 0
      ? Math.round((overallStats.completed / overallStats.total) * 100)
      : 0;

    // Average response time (time from creation to first action)
    const responseStats = db.prepare(`
      SELECT AVG(
        (julianday(actual_start) - julianday(created_at)) * 24 * 60
      ) as avg_minutes
      FROM work_orders
      WHERE actual_start IS NOT NULL
        AND created_at >= ? AND created_at < ?
    `).get(startDate, endDate) as any;

    const avgMinutes = responseStats.avg_minutes || 0;
    const avgResponseTime = avgMinutes >= 60
      ? `${Math.round(avgMinutes / 60)} jam`
      : `${Math.round(avgMinutes)} menit`;

    return {
      top_performers: topPerformers,
      completion_rate: completionRate,
      average_response_time: avgResponseTime,
    };
  }

  /**
   * Generate executive summary using AI
   */
  private async generateExecutiveSummary(data: {
    periodLabel: string;
    currentMetrics: MetricSet;
    previousMetrics: MetricSet;
    trends: TrendIndicator[];
    topIssues: TopIssue[];
  }): Promise<string> {
    try {
      const prompt = `Buat ringkasan eksekutif laporan maintenance untuk periode ${data.periodLabel}.

DATA METRIK PERIODE INI:
- Total Work Order: ${data.currentMetrics.total_work_orders}
- WO Selesai: ${data.currentMetrics.completed_work_orders}
- PM Compliance: ${data.currentMetrics.pm_compliance_rate}%
- MTTR: ${data.currentMetrics.mttr_hours} jam
- MTBF: ${data.currentMetrics.mtbf_hours} jam
- Total Downtime: ${data.currentMetrics.downtime_hours} jam
- Jumlah Breakdown: ${data.currentMetrics.breakdown_count}

PERBANDINGAN DENGAN PERIODE SEBELUMNYA:
${data.trends.map(t => `- ${t.metric}: ${t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : '→'} ${Math.abs(t.change_percentage)}% (${t.is_positive ? 'positif' : 'perlu perhatian'})`).join('\n')}

TOP ISSUES:
${data.topIssues.map(i => `- ${i.issue}: ${i.count} kejadian (${i.percentage}%)`).join('\n')}

Buat ringkasan dalam 2-3 paragraf bahasa Indonesia yang profesional, fokus pada:
1. Pencapaian utama periode ini
2. Area yang perlu perhatian
3. Trend positif/negatif yang signifikan

Gunakan nada profesional dan objektif.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah AI analyst untuk sistem maintenance management. Buat laporan yang profesional dan berbasis data dalam bahasa Indonesia.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 1000,
      });

      return response.choices[0].message.content || this.getFallbackSummary(data);
    } catch (error) {
      console.error('AI executive summary generation error:', error);
      return this.getFallbackSummary(data);
    }
  }

  /**
   * Fallback summary if AI fails
   */
  private getFallbackSummary(data: {
    periodLabel: string;
    currentMetrics: MetricSet;
    trends: TrendIndicator[];
  }): string {
    const completionRate = data.currentMetrics.total_work_orders > 0
      ? Math.round((data.currentMetrics.completed_work_orders / data.currentMetrics.total_work_orders) * 100)
      : 0;

    return `Pada periode ${data.periodLabel}, tim maintenance menangani ${data.currentMetrics.total_work_orders} work order dengan tingkat penyelesaian ${completionRate}%. PM Compliance tercatat di ${data.currentMetrics.pm_compliance_rate}% dengan total downtime ${data.currentMetrics.downtime_hours} jam.

MTTR (Mean Time to Repair) tercatat ${data.currentMetrics.mttr_hours} jam, sementara MTBF (Mean Time Between Failures) adalah ${data.currentMetrics.mtbf_hours} jam. Terjadi ${data.currentMetrics.breakdown_count} breakdown dalam periode ini.

Analisis trend menunjukkan beberapa metrik yang perlu perhatian. Silakan review detail metrik untuk informasi lebih lanjut.`;
  }

  /**
   * Generate actionable recommendations using AI
   */
  private async generateRecommendations(data: {
    metrics: MetricSet;
    trends: TrendIndicator[];
    topIssues: TopIssue[];
    teamHighlights: TeamHighlights;
  }): Promise<ReportRecommendation[]> {
    try {
      const prompt = `Analisis data maintenance berikut dan berikan 3-5 rekomendasi yang spesifik dan actionable:

METRIK:
- PM Compliance: ${data.metrics.pm_compliance_rate}%
- MTTR: ${data.metrics.mttr_hours} jam
- Total Downtime: ${data.metrics.downtime_hours} jam
- Breakdowns: ${data.metrics.breakdown_count}

TOP ISSUES:
${data.topIssues.map(i => `- ${i.issue}: ${i.count} kejadian (trend: ${i.trend})`).join('\n')}

TEAM COMPLETION RATE: ${data.teamHighlights.completion_rate}%
AVERAGE RESPONSE TIME: ${data.teamHighlights.average_response_time}

Berikan rekomendasi dalam format JSON array:
[
  {
    "priority": "high|medium|low",
    "title": "Judul singkat rekomendasi",
    "description": "Deskripsi lengkap dan spesifik",
    "action_type": "create_wo|update_pm|review_asset|other"
  }
]

Fokus pada rekomendasi yang:
1. Spesifik dan measureable
2. Berdasarkan data yang ada
3. Dapat langsung dieksekusi`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah AI maintenance analyst. Berikan rekomendasi yang spesifik dan actionable dalam bahasa Indonesia. Respons HANYA dalam format JSON array yang valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      const content = response.choices[0].message.content || '[]';
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((rec: any, index: number) => ({
          id: `rec-${Date.now()}-${index}`,
          priority: rec.priority || 'medium',
          title: rec.title || 'Rekomendasi',
          description: rec.description || '',
          action_type: rec.action_type || 'other',
          action_data: rec.action_data,
        }));
      }
    } catch (error) {
      console.error('AI recommendations generation error:', error);
    }

    // Fallback recommendations
    return this.getFallbackRecommendations(data);
  }

  /**
   * Fallback recommendations if AI fails
   */
  private getFallbackRecommendations(data: {
    metrics: MetricSet;
    topIssues: TopIssue[];
  }): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];

    if (data.metrics.pm_compliance_rate < 90) {
      recommendations.push({
        id: `rec-${Date.now()}-0`,
        priority: 'high',
        title: 'Tingkatkan PM Compliance',
        description: `PM Compliance saat ini ${data.metrics.pm_compliance_rate}%, di bawah target 90%. Perlu review jadwal PM dan resource allocation.`,
        action_type: 'update_pm',
      });
    }

    if (data.metrics.breakdown_count > 5) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        priority: 'high',
        title: 'Review Mesin dengan Breakdown Tinggi',
        description: `Terjadi ${data.metrics.breakdown_count} breakdown. Lakukan analisis root cause dan pertimbangkan revisi jadwal PM.`,
        action_type: 'review_asset',
      });
    }

    if (data.topIssues.length > 0 && data.topIssues[0].count > 3) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        priority: 'medium',
        title: 'Address Top Issue',
        description: `"${data.topIssues[0].issue}" adalah masalah paling sering (${data.topIssues[0].count} kejadian). Buat work order inspeksi.`,
        action_type: 'create_wo',
      });
    }

    return recommendations;
  }

  /**
   * Store generated report in database
   */
  private async storeReport(data: {
    period_type: string;
    year: number;
    month?: number;
    week?: number;
    quarter?: number;
    period_label: string;
    executive_summary: string;
    metrics: { current_period: MetricSet; previous_period: MetricSet; trend: TrendIndicator[] };
    top_issues: TopIssue[];
    recommendations: ReportRecommendation[];
    team_highlights: TeamHighlights;
    generated_by: number;
  }): Promise<GeneratedReport> {
    const result = db.prepare(`
      INSERT INTO ai_reports (
        period_type, period_year, period_month, period_week, period_quarter,
        period_label, executive_summary, metrics, top_issues, recommendations,
        team_highlights, generated_by, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      data.period_type,
      data.year,
      data.month || null,
      data.week || null,
      data.quarter || null,
      data.period_label,
      data.executive_summary,
      JSON.stringify(data.metrics),
      JSON.stringify(data.top_issues),
      JSON.stringify(data.recommendations),
      JSON.stringify(data.team_highlights),
      data.generated_by
    );

    return {
      id: Number(result.lastInsertRowid),
      period_type: data.period_type,
      period_label: data.period_label,
      generated_at: new Date().toISOString(),
      generated_by: data.generated_by,
      executive_summary: data.executive_summary,
      metrics: data.metrics,
      top_issues: data.top_issues,
      recommendations: data.recommendations,
      team_highlights: data.team_highlights,
    };
  }

  /**
   * Get list of generated reports
   */
  getReportList(limit: number = 12): any[] {
    return db.prepare(`
      SELECT id, period_type, period_label, generated_at, generated_by
      FROM ai_reports
      ORDER BY generated_at DESC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Get report by ID
   */
  getReportById(id: number): GeneratedReport | null {
    const stored = db.prepare(`
      SELECT * FROM ai_reports WHERE id = ?
    `).get(id) as any;

    if (!stored) return null;
    return this.formatStoredReport(stored);
  }

  /**
   * Delete old reports (keep last 12 per type)
   */
  cleanupOldReports(): void {
    db.prepare(`
      DELETE FROM ai_reports
      WHERE id NOT IN (
        SELECT id FROM (
          SELECT id FROM ai_reports
          ORDER BY generated_at DESC
          LIMIT 36
        )
      )
    `).run();
  }
}

// Export singleton
export const aiReportService = new AIReportService();
export default aiReportService;
