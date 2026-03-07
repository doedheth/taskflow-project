import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface MyDayTask {
  id: number;
  type: 'work_order' | 'pm_schedule';
  title: string;
  asset_name: string | null;
  priority: string;
  status: string;
  due_date: string | null;
}

export interface AssignedWorkOrder {
  id: number;
  wo_key: string;
  title: string;
  asset_name: string | null;
  priority: string;
  status: string;
  created_at: string;
}

export interface PMReminder {
  id: number;
  description: string;
  asset_name: string | null;
  next_due: string;
  frequency_type: string;
  is_overdue: boolean;
}

export interface PersonalWorkload {
  assigned_work_orders: number;
  in_progress_work_orders: number;
  completed_today: number;
  completed_this_week: number;
  workload_percentage: number;
}

export interface MemberDashboardData {
  myDay: MyDayTask[];
  assignedWorkOrders: AssignedWorkOrder[];
  pmReminders: PMReminder[];
  personalWorkload: PersonalWorkload;
  generatedAt: string;
}

// ============================================
// Hook
// ============================================

/**
 * useMemberDashboard - Fetches all member "My Day" dashboard data
 *
 * Uses React Query with:
 * - staleTime: 10s (from global config)
 * - refetchInterval: 30s (for real-time updates)
 * - retry: 2 (from global config)
 */
export function useMemberDashboard() {
  return useQuery<MemberDashboardData>({
    queryKey: ['dashboard', 'member'],
    queryFn: async () => {
      const response = await dashboardAPI.getMemberDashboard();
      return response.data;
    },
    refetchInterval: 30000, // 30 seconds polling for real-time updates
  });
}

export default useMemberDashboard;
