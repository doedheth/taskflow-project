import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface KPISummary {
  work_orders_completed_mtd: number;
  work_orders_completed_change: number;
  tickets_resolved_mtd: number;
  tickets_resolved_change: number;
  avg_resolution_time_hours: number;
  resolution_time_change: number;
  machine_uptime_percentage: number;
  uptime_change: number;
}

export interface TeamMemberPerformance {
  id: number;
  name: string;
  avatar: string | null;
  completed_work_orders: number;
  avg_completion_time_hours: number;
  performance_score: number;
}

export interface Alert {
  id: number;
  type: 'machine_down' | 'overdue_pm' | 'high_priority_wo' | 'low_performance';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  created_at: string;
  related_id?: number;
}

export interface ManagerDashboardData {
  kpiSummary: KPISummary;
  teamPerformance: TeamMemberPerformance[];
  alerts: Alert[];
  generatedAt: string;
}

// ============================================
// Hook
// ============================================

/**
 * useManagerDashboard - Fetches all manager executive dashboard data
 *
 * Uses React Query with:
 * - staleTime: 10s (from global config)
 * - refetchInterval: 60s (less frequent for executive view)
 * - retry: 2 (from global config)
 */
export function useManagerDashboard() {
  return useQuery<ManagerDashboardData>({
    queryKey: ['dashboard', 'manager'],
    queryFn: async () => {
      const response = await dashboardAPI.getManagerDashboard();
      return response.data;
    },
    refetchInterval: 60000, // 60 seconds for executive dashboard
  });
}

export default useManagerDashboard;
