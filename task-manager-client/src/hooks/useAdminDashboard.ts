import { useQuery } from '@tanstack/react-query';
import { dashboardAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface SystemHealth {
  database_size_mb: number;
  total_users: number;
  active_users_today: number;
  total_assets: number;
  total_work_orders: number;
  total_tickets: number;
  server_uptime_hours: number;
}

export interface UserActivityItem {
  id: number;
  user_name: string;
  user_avatar: string | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  created_at: string;
}

export interface QuickAccessItem {
  id: string;
  label: string;
  description: string;
  route: string;
  icon: string;
  count?: number;
}

export interface AdminDashboardData {
  systemHealth: SystemHealth;
  recentActivity: UserActivityItem[];
  quickAccess: QuickAccessItem[];
  generatedAt: string;
}

// ============================================
// Hook
// ============================================

/**
 * useAdminDashboard - Fetches all admin system dashboard data
 *
 * Uses React Query with:
 * - staleTime: 10s (from global config)
 * - refetchInterval: 60s (admin view)
 * - retry: 2 (from global config)
 */
export function useAdminDashboard() {
  return useQuery<AdminDashboardData>({
    queryKey: ['dashboard', 'admin'],
    queryFn: async () => {
      const response = await dashboardAPI.getAdminDashboard();
      return response.data;
    },
    refetchInterval: 60000, // 60 seconds for admin dashboard
  });
}

export default useAdminDashboard;
