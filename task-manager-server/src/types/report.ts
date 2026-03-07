/**
 * Report Type Definitions
 */

// ============================================
// KPI Types
// ============================================

export interface KPIDashboard {
  availability: number;
  mtbf: number; // Mean Time Between Failures (hours)
  mttr: number; // Mean Time To Repair (hours)
  scheduledMinutes: number;
  downtimeMinutes: number;
  operatingMinutes: number;
  failureCount: number;
  downtimeByType: DowntimeBreakdown[];
}

export interface DowntimeBreakdown {
  category: string;
  name: string;
  counts_as_downtime: boolean;
  incidents: number;
  total_minutes: number;
}

// ============================================
// Production KPI Types
// ============================================

export interface ProductionKPI {
  efficiency: number;
  totalAvailableTime: number;
  scheduledProductionTime: number;
  actualProductionTime: number;
  productiveTime: number;
  changeoverTime: number;
  maintenanceDowntime: number;
  productionDowntime: number;
  idleTime: number;
  unscheduledTime: number;
}

export interface ProductionBreakdown {
  date: string;
  scheduledMinutes: number;
  productiveMinutes: number;
  changeoverMinutes: number;
  maintenanceMinutes: number;
  productionDowntimeMinutes: number;
  idleMinutes: number;
}

// ============================================
// Work Order Report Types
// ============================================

export interface WorkOrderReport {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  completedThisMonth: number;
  avgCompletionHours: number;
  topAssets: AssetWorkOrderSummary[];
}

export interface AssetWorkOrderSummary {
  asset_id: number;
  asset_name: string;
  asset_code: string;
  total_wo: number;
  completed_wo: number;
  total_downtime_minutes: number;
}

// ============================================
// Ticket Report Types
// ============================================

export interface TicketReport {
  total: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
  byPriority: { priority: string; count: number }[];
  createdThisMonth: number;
  completedThisMonth: number;
  avgCompletionDays: number;
  overdueCount: number;
}

// ============================================
// Team Report Types
// ============================================

export interface TeamReport {
  totalMembers: number;
  byRole: { role: string; count: number }[];
  topPerformers: {
    user_id: number;
    user_name: string;
    completed_count: number;
    story_points: number;
  }[];
  workloadDistribution: {
    user_id: number;
    user_name: string;
    assigned_count: number;
    in_progress: number;
  }[];
}

// ============================================
// Date Range Types
// ============================================

export interface DateRangeFilter {
  start_date?: string;
  end_date?: string;
  days?: number;
}

// ============================================
// Export Types
// ============================================

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeCharts?: boolean;
  dateRange?: DateRangeFilter;
}
