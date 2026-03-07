import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface MachineStatus {
  operational: number;
  maintenance: number;
  down: number;
  total: number;
}

export interface Machine {
  id: number;
  asset_code: string;
  name: string;
  status: 'operational' | 'maintenance' | 'down';
  criticality: 'low' | 'medium' | 'high' | 'critical';
  location: string | null;
  category_name: string | null;
}

export interface TechnicianWorkload {
  id: number;
  name: string;
  avatar: string | null;
  assigned_work_orders: number;
  in_progress_work_orders: number;
  workload_percentage: number;
}

export interface YesterdaySummary {
  completed_work_orders: number;
  pending_review_work_orders: number;
  completed_tickets: number;
}

export interface SupervisorDashboardData {
  machineStatus: MachineStatus;
  machines: Machine[];
  teamWorkload: TechnicianWorkload[];
  yesterdaySummary: YesterdaySummary;
  generatedAt: string;
}

// ============================================
// Hook
// ============================================

/**
 * useSupervisorDashboard - Fetches all supervisor dashboard data
 *
 * Uses React Query with:
 * - staleTime: 10s (from global config)
 * - refetchInterval: 30s (for real-time updates)
 * - retry: 2 (from global config)
 */
export function useSupervisorDashboard() {
  return useQuery<SupervisorDashboardData>({
    queryKey: ['dashboard', 'supervisor'],
    queryFn: async () => {
      const response = await dashboardAPI.getSupervisorDashboard();
      return response.data;
    },
    refetchInterval: 30000, // 30 seconds polling for real-time updates
  });
}

export default useSupervisorDashboard;
