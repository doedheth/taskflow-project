/**
 * Report Service - Business logic for reports and KPIs
 */

import { ReportRepository, reportRepository } from '../models/ReportRepository';
import {
  KPIDashboard,
  ProductionKPI,
  ProductionBreakdown,
  WorkOrderReport,
  TicketReport,
  TeamReport,
  DateRangeFilter,
} from '../types/report';

export class ReportService {
  private repository: ReportRepository;

  constructor(repository: ReportRepository = reportRepository) {
    this.repository = repository;
  }

  /**
   * Get KPI Dashboard
   */
  getKPIDashboard(filter: DateRangeFilter & { asset_id?: number }): KPIDashboard {
    return this.repository.getKPIDashboard(filter);
  }

  /**
   * Get Production KPI
   */
  getProductionKPI(filter: DateRangeFilter & { asset_id?: number }): any {
    return this.repository.getProductionKPI(filter);
  }

  /**
   * Get Production Summary
   */
  getProductionSummary(filter: DateRangeFilter & { asset_id?: number }): {
    kpi: ProductionKPI;
    dailyBreakdown: ProductionBreakdown[];
  } {
    return {
      kpi: this.repository.getProductionKPI(filter),
      dailyBreakdown: this.repository.getDailyBreakdown(filter),
    };
  }

  /**
   * Get Work Order Report
   */
  getWorkOrderReport(filter: DateRangeFilter): WorkOrderReport {
    return this.repository.getWorkOrderReport(filter);
  }

  /**
   * Get Ticket Report
   */
  getTicketReport(filter: DateRangeFilter): TicketReport {
    return this.repository.getTicketReport(filter);
  }

  /**
   * Get Team Report
   */
  getTeamReport(): TeamReport {
    return this.repository.getTeamReport();
  }

  /**
   * Get Daily Production Breakdown
   */
  getDailyBreakdown(filter: DateRangeFilter & { asset_id?: number }): ProductionBreakdown[] {
    return this.repository.getDailyBreakdown(filter);
  }

  /**
   * Get comprehensive dashboard
   */
  getDashboard(filter: DateRangeFilter): {
    kpi: KPIDashboard;
    workOrders: WorkOrderReport;
    tickets: TicketReport;
    team: TeamReport;
  } {
    return {
      kpi: this.repository.getKPIDashboard(filter),
      workOrders: this.repository.getWorkOrderReport(filter),
      tickets: this.repository.getTicketReport(filter),
      team: this.repository.getTeamReport(),
    };
  }

  /**
   * Get maintenance metrics
   */
  getMaintenanceMetrics(filter: DateRangeFilter & { asset_id?: number }): {
    availability: number;
    mtbf: number;
    mttr: number;
    totalDowntime: number;
    plannedMaintenance: number;
    unplannedMaintenance: number;
  } {
    const kpi = this.repository.getKPIDashboard(filter);

    const planned = kpi.downtimeByType
      .filter(d => d.category === 'maintenance' && d.name.includes('Planned'))
      .reduce((sum, d) => sum + d.total_minutes, 0);

    const unplanned = kpi.downtimeByType
      .filter(d => d.category === 'maintenance' && !d.name.includes('Planned'))
      .reduce((sum, d) => sum + d.total_minutes, 0);

    return {
      availability: kpi.availability,
      mtbf: kpi.mtbf,
      mttr: kpi.mttr,
      totalDowntime: kpi.downtimeMinutes,
      plannedMaintenance: planned,
      unplannedMaintenance: unplanned,
    };
  }

  /**
   * Get Asset KPI
   */
  getAssetKPI(assetId: number, days: number = 30): any {
    return this.repository.getAssetKPI(assetId, days);
  }

  /**
   * Get Downtime Report
   */
  getDowntimeReport(filter: DateRangeFilter & { asset_id?: number }): any {
    return this.repository.getDowntimeReport(filter);
  }

  /**
   * Get Maintenance Compliance
   */
  getMaintenanceCompliance(days: number = 30): any {
    return this.repository.getMaintenanceCompliance(days);
  }

  /**
   * Get Technician Performance
   */
  getTechnicianPerformance(days: number = 30): any {
    return this.repository.getTechnicianPerformance(days);
  }
}

// Export singleton
export const reportService = new ReportService();
export default reportService;
