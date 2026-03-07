/**
 * AI Production Report Service
 *
 * AI-powered service for generating comprehensive production reports
 * Analyzes production schedules, downtime, OEE, and output metrics
 */

import OpenAI from 'openai';
import { prepare } from '../../database/db';

// ============================================
// Types
// ============================================

export interface ProductionReportRequest {
  period_type: 'monthly' | 'weekly' | 'quarterly' | 'daily' | 'custom_range';
  year?: number;
  month?: number;
  week?: number;
  quarter?: number;
  day?: number;
  machine_ids?: number[];
  shift?: string;
  start_date?: string;
  end_date?: string;
}

export interface ProductionMetricSet {
  total_scheduled_hours: number;
  actual_production_hours: number;
  planned_output: number;
  actual_output: number;
  output_achievement_rate: number;
  total_downtime_hours: number;
  planned_downtime_hours: number;
  unplanned_downtime_hours: number;
  oee_percentage: number;
  availability_rate: number;
  performance_rate: number;
  quality_rate: number;
}

export interface ProductionTrendIndicator {
  metric: string;
  change_percentage: number;
  direction: 'up' | 'down' | 'stable';
  is_positive: boolean;
}

export interface DowntimeBreakdown {
  classification: string;
  hours: number;
  percentage: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MachinePerformance {
  machine_id: number;
  machine_name: string;
  oee: number;
  availability: number;
  output_count: number;
  downtime_hours: number;
}

export interface ProductionRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_type: 'optimize_schedule' | 'reduce_changeover' | 'improve_quality' | 'maintenance_action' | 'other';
  action_data?: Record<string, unknown>;
}

export interface ProductionHighlights {
  best_performing_machines: MachinePerformance[];
  worst_performing_machines: MachinePerformance[];
  total_products_produced: number;
  defect_rate: number;
}

export interface GeneratedProductionReport {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
  executive_summary: string;
  metrics: {
    current_period: ProductionMetricSet;
    previous_period: ProductionMetricSet;
    trend: ProductionTrendIndicator[];
  };
  downtime_breakdown: DowntimeBreakdown[];
  recommendations: ProductionRecommendation[];
  production_highlights: ProductionHighlights;
}

// ============================================
// AI Production Report Service
// ============================================

export class AIProductionReportService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Generate a comprehensive production report for the specified period
   */
  async generateReport(
    request: ProductionReportRequest,
    userId: number
  ): Promise<GeneratedProductionReport> {
    // Check for existing report
    const existing = this.findExistingReport(request);
    if (existing) {
      return existing;
    }

    // Gather metrics
    const currentMetrics = await this.gatherMetricsForPeriod(request);
    const previousMetrics = await this.gatherMetricsForPreviousPeriod(request);

    // Calculate trends
    const trends = this.calculateTrends(currentMetrics, previousMetrics);

    // Get downtime breakdown
    const downtimeBreakdown = await this.getDowntimeBreakdown(request);

    // Get production highlights
    const productionHighlights = await this.getProductionHighlights(request);

    // Generate AI content
    const executiveSummary = await this.generateExecutiveSummary({
      period: request,
      currentMetrics,
      previousMetrics,
      trends,
      downtimeBreakdown,
    });

    const recommendations = await this.generateRecommendations({
      metrics: currentMetrics,
      trends,
      downtimeBreakdown,
      productionHighlights,
    });

    // Store and return report
    const report = this.storeReport({
      ...request,
      executive_summary: executiveSummary,
      metrics: {
        current_period: currentMetrics,
        previous_period: previousMetrics,
        trend: trends,
      },
      downtime_breakdown: downtimeBreakdown,
      recommendations,
      production_highlights: productionHighlights,
      generated_by: userId,
    });

    return report;
  }

  /**
   * Get period label
   */
  private getPeriodLabel(request: ProductionReportRequest): string {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    if (request.period_type === 'monthly' && request.month && request.year) {
      return `${monthNames[request.month - 1]} ${request.year}`;
    } else if (request.period_type === 'quarterly' && request.quarter && request.year) {
      return `Q${request.quarter} ${request.year}`;
    } else if (request.period_type === 'weekly' && request.week && request.year) {
      return `Minggu ${request.week}, ${request.year}`;
    } else if (request.period_type === 'daily' && request.day && request.month && request.year) {
      return `${request.day} ${monthNames[request.month - 1]} ${request.year}`;
    } else if (request.period_type === 'custom_range' && request.start_date && request.end_date) {
      return `Custom Range: ${request.start_date} to ${request.end_date}`;
    }
    return `${request.year}`;
  }

  /**
   * Find existing report for the same period
   */
  private findExistingReport(request: ProductionReportRequest): GeneratedProductionReport | null {
    try {
      const query = `
        SELECT * FROM ai_production_reports
        WHERE period_type = ?
          AND (period_year = ? OR period_year IS NULL)
          AND (period_month = ? OR period_month IS NULL)
          AND (period_week = ? OR period_week IS NULL)
          AND (period_quarter = ? OR period_quarter IS NULL)
          AND (start_date = ? OR start_date IS NULL)
          AND (end_date = ? OR end_date IS NULL)
        ORDER BY generated_at DESC
        LIMIT 1
      `;

      const row = prepare(query).get(
        request.period_type,
        request.year || null,
        request.month || null,
        request.week || null,
        request.quarter || null,
        request.start_date || null,
        request.end_date || null
      ) as any;

      if (row) {
        return this.parseReportRow(row);
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Parse database row to report object
   */
  private parseReportRow(row: any): GeneratedProductionReport {
    return {
      id: row.id,
      period_type: row.period_type,
      period_label: row.period_label,
      generated_at: row.generated_at,
      generated_by: row.generated_by,
      executive_summary: row.executive_summary,
      metrics: JSON.parse(row.metrics),
      downtime_breakdown: JSON.parse(row.downtime_breakdown),
      recommendations: JSON.parse(row.recommendations),
      production_highlights: JSON.parse(row.production_highlights),
    };
  }

  /**
   * Gather production metrics for a period
   */
  private async gatherMetricsForPeriod(request: ProductionReportRequest): Promise<ProductionMetricSet> {
    const { startDate, endDate } = this.getPeriodDates(request);

    try {
      // Get production schedule data using correct column names
      const scheduleData = prepare(`
        SELECT
          COALESCE(SUM(planned_production_minutes), 0) / 60.0 as scheduled_hours,
          COALESCE(SUM(actual_production_minutes), 0) / 60.0 as actual_hours,
          COUNT(*) as schedule_count
        FROM production_schedule
        WHERE date >= date(?) AND date <= date(?)
      `).get(startDate, endDate) as any;

      // Get downtime data - downtime_type can be 'planned' or 'unplanned'
      const downtimeData = prepare(`
        SELECT
          COALESCE(SUM(duration_minutes), 0) / 60.0 as total_downtime_hours,
          COALESCE(SUM(CASE WHEN downtime_type = 'planned' THEN duration_minutes ELSE 0 END), 0) / 60.0 as planned_downtime,
          COALESCE(SUM(CASE WHEN downtime_type != 'planned' THEN duration_minutes ELSE 0 END), 0) / 60.0 as unplanned_downtime
        FROM downtime_logs
        WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
      `).get(startDate, endDate) as any;

      const scheduledHours = scheduleData?.scheduled_hours || 0;
      const actualHours = scheduleData?.actual_hours || 0;
      const totalDowntime = downtimeData?.total_downtime_hours || 0;
      const plannedDowntime = downtimeData?.planned_downtime || 0;
      const unplannedDowntime = downtimeData?.unplanned_downtime || 0;

      // Calculate availability based on scheduled vs actual production time
      const actualProductionHours = actualHours > 0 ? actualHours : Math.max(0, scheduledHours - totalDowntime);
      const availabilityRate = scheduledHours > 0 ? (actualProductionHours / scheduledHours) * 100 : 100;

      // Simplified OEE calculation (Availability x Performance x Quality)
      // For now, use estimated values for performance and quality
      const performanceRate = 85; // Placeholder - would need cycle time data
      const qualityRate = 98; // Placeholder - would need reject/good count data
      const oee = (availabilityRate * performanceRate * qualityRate) / 10000;

      return {
        total_scheduled_hours: Math.round(scheduledHours * 10) / 10,
        actual_production_hours: Math.round(actualProductionHours * 10) / 10,
        planned_output: 0, // Would need production target data
        actual_output: 0, // Would need actual production count
        output_achievement_rate: 0,
        total_downtime_hours: Math.round(totalDowntime * 10) / 10,
        planned_downtime_hours: Math.round(plannedDowntime * 10) / 10,
        unplanned_downtime_hours: Math.round(unplannedDowntime * 10) / 10,
        oee_percentage: Math.round(oee * 10) / 10,
        availability_rate: Math.round(availabilityRate * 10) / 10,
        performance_rate: performanceRate,
        quality_rate: qualityRate,
      };
    } catch (error) {
      console.error('Error gathering production metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Get empty metrics object
   */
  private getEmptyMetrics(): ProductionMetricSet {
    return {
      total_scheduled_hours: 0,
      actual_production_hours: 0,
      planned_output: 0,
      actual_output: 0,
      output_achievement_rate: 0,
      total_downtime_hours: 0,
      planned_downtime_hours: 0,
      unplanned_downtime_hours: 0,
      oee_percentage: 0,
      availability_rate: 0,
      performance_rate: 0,
      quality_rate: 0,
    };
  }

  /**
   * Gather metrics for previous period
   */
  private async gatherMetricsForPreviousPeriod(request: ProductionReportRequest): Promise<ProductionMetricSet> {
    const previousRequest = this.getPreviousPeriod(request);
    return this.gatherMetricsForPeriod(previousRequest);
  }

  /**
   * Get previous period request
   */
  private getPreviousPeriod(request: ProductionReportRequest): ProductionReportRequest {
    const prev = { ...request };

    if (request.period_type === 'monthly' && request.month !== undefined && request.year !== undefined) {
      if (request.month === 1) {
        prev.year = request.year - 1;
        prev.month = 12;
      } else {
        prev.month = request.month - 1;
      }
    } else if (request.period_type === 'quarterly' && request.quarter !== undefined && request.year !== undefined) {
      if (request.quarter === 1) {
        prev.year = request.year - 1;
        prev.quarter = 4;
      } else {
        prev.quarter = request.quarter - 1;
      }
    } else if (request.period_type === 'weekly' && request.week !== undefined && request.year !== undefined) {
      if (request.week === 1) {
        prev.year = request.year - 1;
        prev.week = 52;
      } else {
        prev.week = request.week - 1;
      }
    } else if (request.period_type === 'daily' && request.day !== undefined && request.month !== undefined && request.year !== undefined) {
      const current = new Date(request.year, request.month - 1, request.day);
      current.setDate(current.getDate() - 1);
      prev.year = current.getFullYear();
      prev.month = current.getMonth() + 1;
      prev.day = current.getDate();
    } else if (request.period_type === 'custom_range' && request.start_date && request.end_date) {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - diffDays);

      prev.start_date = prevStart.toISOString().split('T')[0];
      prev.end_date = prevEnd.toISOString().split('T')[0];
    }

    return prev;
  }

  /**
   * Get period date range
   */
  private getPeriodDates(request: ProductionReportRequest): { startDate: string; endDate: string } {
    let startDate: Date;
    let endDate: Date;

    if (request.period_type === 'monthly' && request.month !== undefined && request.year !== undefined) {
      startDate = new Date(request.year, request.month - 1, 1);
      endDate = new Date(request.year, request.month, 0);
    } else if (request.period_type === 'quarterly' && request.quarter !== undefined && request.year !== undefined) {
      const startMonth = (request.quarter - 1) * 3;
      startDate = new Date(request.year, startMonth, 1);
      endDate = new Date(request.year, startMonth + 3, 0);
    } else if (request.period_type === 'custom_range' && request.start_date && request.end_date) {
      startDate = new Date(request.start_date);
      endDate = new Date(request.end_date);
    } else if (request.period_type === 'daily' && request.year !== undefined && request.month !== undefined && request.day !== undefined) {
      startDate = new Date(request.year, request.month - 1, request.day);
      endDate = new Date(request.year, request.month - 1, request.day);
    } else if (request.year !== undefined) { // Fallback for yearly or other, current implementation
      startDate = new Date(request.year, 0, 1);
      endDate = new Date(request.year, 11, 31);
    } else {
      // Default to current month if no valid period specified
      const today = new Date();
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }

  /**
   * Calculate trends between periods
   */
  private calculateTrends(
    current: ProductionMetricSet,
    previous: ProductionMetricSet
  ): ProductionTrendIndicator[] {
    const metrics = [
      { key: 'oee_percentage', label: 'OEE', higherIsBetter: true },
      { key: 'availability_rate', label: 'Availability', higherIsBetter: true },
      { key: 'total_downtime_hours', label: 'Total Downtime', higherIsBetter: false },
      { key: 'unplanned_downtime_hours', label: 'Unplanned Downtime', higherIsBetter: false },
      { key: 'actual_production_hours', label: 'Production Hours', higherIsBetter: true },
    ];

    return metrics.map(({ key, label, higherIsBetter }) => {
      const curr = (current as any)[key] || 0;
      const prev = (previous as any)[key] || 0;

      let changePercentage = 0;
      if (prev > 0) {
        changePercentage = Math.round(((curr - prev) / prev) * 100);
      }

      const direction = changePercentage > 2 ? 'up' : changePercentage < -2 ? 'down' : 'stable';
      const isPositive = higherIsBetter ? direction === 'up' : direction === 'down';

      return {
        metric: label,
        change_percentage: Math.abs(changePercentage),
        direction,
        is_positive: direction === 'stable' ? true : isPositive,
      };
    });
  }

  /**
   * Get downtime breakdown by classification
   */
  private async getDowntimeBreakdown(request: ProductionReportRequest): Promise<DowntimeBreakdown[]> {
    const { startDate, endDate } = this.getPeriodDates(request);

    try {
      const rows = prepare(`
        SELECT
          COALESCE(dc.name, 'Lainnya') as classification,
          SUM(dl.duration_minutes) / 60.0 as hours,
          COUNT(*) as count
        FROM downtime_logs dl
        LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
        WHERE date(dl.start_time) >= date(?) AND date(dl.start_time) <= date(?)
        GROUP BY dc.id, dc.name
        ORDER BY hours DESC
        LIMIT 10
      `).all(startDate, endDate) as any[];

      const totalHours = rows.reduce((sum, r) => sum + (r.hours || 0), 0);

      return rows.map(row => ({
        classification: row.classification,
        hours: Math.round(row.hours * 10) / 10,
        percentage: totalHours > 0 ? Math.round((row.hours / totalHours) * 100) : 0,
        count: row.count,
        trend: 'stable' as const,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get production highlights
   */
  private async getProductionHighlights(request: ProductionReportRequest): Promise<ProductionHighlights> {
    const { startDate, endDate } = this.getPeriodDates(request);

    try {
      // Get machine performance - use asset_id for downtime_logs join
      const machineData = prepare(`
        SELECT
          a.id as machine_id,
          a.name as machine_name,
          COALESCE(SUM(dl.duration_minutes), 0) / 60.0 as downtime_hours
        FROM assets a
        LEFT JOIN downtime_logs dl ON a.id = dl.asset_id
          AND date(dl.start_time) >= date(?) AND date(dl.start_time) <= date(?)
        WHERE a.category_id IN (SELECT id FROM asset_categories WHERE name LIKE '%Mesin%' OR name LIKE '%Machine%')
           OR a.asset_type = 'machine'
        GROUP BY a.id, a.name
        ORDER BY downtime_hours ASC
        LIMIT 5
      `).all(startDate, endDate) as any[];

      const bestPerforming: MachinePerformance[] = machineData.slice(0, 3).map(m => ({
        machine_id: m.machine_id,
        machine_name: m.machine_name,
        oee: 85, // Placeholder
        availability: 95,
        output_count: 0,
        downtime_hours: Math.round(m.downtime_hours * 10) / 10,
      }));

      const worstPerforming: MachinePerformance[] = machineData.slice(-3).reverse().map(m => ({
        machine_id: m.machine_id,
        machine_name: m.machine_name,
        oee: 65, // Placeholder
        availability: 75,
        output_count: 0,
        downtime_hours: Math.round(m.downtime_hours * 10) / 10,
      }));

      return {
        best_performing_machines: bestPerforming,
        worst_performing_machines: worstPerforming,
        total_products_produced: 0,
        defect_rate: 2, // Placeholder
      };
    } catch {
      return {
        best_performing_machines: [],
        worst_performing_machines: [],
        total_products_produced: 0,
        defect_rate: 0,
      };
    }
  }

  /**
   * Generate executive summary using AI
   */
  private async generateExecutiveSummary(data: {
    period: ProductionReportRequest;
    currentMetrics: ProductionMetricSet;
    previousMetrics: ProductionMetricSet;
    trends: ProductionTrendIndicator[];
    downtimeBreakdown: DowntimeBreakdown[];
  }): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI analyst untuk production management system.
Buat ringkasan eksekutif laporan produksi bulanan yang profesional dalam bahasa Indonesia.

Format:
- 2-3 paragraf
- Fokus pada OEE, availability, dan downtime
- Bandingkan dengan periode sebelumnya
- Berikan insight yang actionable
- Gunakan data faktual yang diberikan`,
          },
          {
            role: 'user',
            content: JSON.stringify(data),
          },
        ],
        temperature: 0.4,
      });

      return response.choices[0]?.message?.content || 'Ringkasan tidak tersedia.';
    } catch (error) {
      console.error('AI summary generation failed:', error);
      return `Laporan Produksi ${this.getPeriodLabel(data.period)}\n\nOEE: ${data.currentMetrics.oee_percentage}%\nAvailability: ${data.currentMetrics.availability_rate}%\nTotal Downtime: ${data.currentMetrics.total_downtime_hours} jam`;
    }
  }

  /**
   * Generate recommendations using AI
   */
  private async generateRecommendations(data: {
    metrics: ProductionMetricSet;
    trends: ProductionTrendIndicator[];
    downtimeBreakdown: DowntimeBreakdown[];
    productionHighlights: ProductionHighlights;
  }): Promise<ProductionRecommendation[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI production analyst.
Berikan 3-5 rekomendasi untuk meningkatkan efisiensi produksi.

Format JSON array:
[{
  "id": "rec-1",
  "priority": "high|medium|low",
  "title": "Judul singkat",
  "description": "Deskripsi detail",
  "action_type": "optimize_schedule|reduce_changeover|improve_quality|maintenance_action|other"
}]

Fokus pada:
- Pengurangan downtime
- Peningkatan OEE
- Optimasi jadwal produksi`,
          },
          {
            role: 'user',
            content: JSON.stringify(data),
          },
        ],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return parsed.recommendations || parsed || [];
      }
      return this.getDefaultRecommendations(data);
    } catch (error) {
      console.error('AI recommendations failed:', error);
      return this.getDefaultRecommendations(data);
    }
  }

  /**
   * Get default recommendations
   */
  private getDefaultRecommendations(data: {
    metrics: ProductionMetricSet;
    downtimeBreakdown: DowntimeBreakdown[];
  }): ProductionRecommendation[] {
    const recommendations: ProductionRecommendation[] = [];

    if (data.metrics.unplanned_downtime_hours > 10) {
      recommendations.push({
        id: 'rec-1',
        priority: 'high',
        title: 'Kurangi Unplanned Downtime',
        description: `Unplanned downtime ${data.metrics.unplanned_downtime_hours} jam perlu ditelusuri dan dikurangi.`,
        action_type: 'maintenance_action',
      });
    }

    if (data.metrics.oee_percentage < 75) {
      recommendations.push({
        id: 'rec-2',
        priority: 'high',
        title: 'Tingkatkan OEE',
        description: `OEE ${data.metrics.oee_percentage}% di bawah target 85%. Fokus pada availability dan performance.`,
        action_type: 'optimize_schedule',
      });
    }

    if (data.downtimeBreakdown.length > 0) {
      const topDowntime = data.downtimeBreakdown[0];
      recommendations.push({
        id: 'rec-3',
        priority: 'medium',
        title: `Atasi ${topDowntime.classification}`,
        description: `${topDowntime.classification} menyumbang ${topDowntime.percentage}% dari total downtime.`,
        action_type: 'reduce_changeover',
      });
    }

    return recommendations;
  }

  /**
   * Store report in database
   */
  private storeReport(data: any): GeneratedProductionReport {
    const periodLabel = this.getPeriodLabel(data);

    try {
      const result = prepare(`
        INSERT INTO ai_production_reports (
          period_type, period_year, period_month, period_week, period_quarter,
          start_date, end_date, period_label, executive_summary, metrics, downtime_breakdown,
          recommendations, production_highlights, generated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.period_type,
        data.year || null,
        data.month || null,
        data.week || null,
        data.quarter || null,
        data.start_date || null,
        data.end_date || null,
        periodLabel,
        data.executive_summary,
        JSON.stringify(data.metrics),
        JSON.stringify(data.downtime_breakdown),
        JSON.stringify(data.recommendations),
        JSON.stringify(data.production_highlights),
        data.generated_by
      );

      return {
        id: result.lastInsertRowid as number,
        period_type: data.period_type,
        period_label: periodLabel,
        generated_at: new Date().toISOString(),
        generated_by: data.generated_by,
        executive_summary: data.executive_summary,
        metrics: data.metrics,
        downtime_breakdown: data.downtime_breakdown,
        recommendations: data.recommendations,
        production_highlights: data.production_highlights,
      };
    } catch (error) {
      console.error('Failed to store production report:', error);
      throw error;
    }
  }

  /**
   * Get list of generated reports
   */
  getReportList(limit: number = 12): any[] {
    try {
      return prepare(`
        SELECT id, period_type, period_label, generated_at, generated_by
        FROM ai_production_reports
        ORDER BY generated_at DESC
        LIMIT ?
      `).all(limit) as any[];
    } catch {
      return [];
    }
  }

  /**
   * Get report by ID
   */
  getReportById(id: number): GeneratedProductionReport | null {
    try {
      const row = prepare(`SELECT * FROM ai_production_reports WHERE id = ?`).get(id) as any;
      return row ? this.parseReportRow(row) : null;
    } catch {
      return null;
    }
  }
}

// Export singleton
export const aiProductionReportService = new AIProductionReportService();
export default aiProductionReportService;
