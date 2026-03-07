import { DashboardLayout } from './DashboardLayout';
import {
  SystemHealthWidget,
  UserActivityWidget,
  SettingsQuickAccessWidget,
} from './widgets';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';

/**
 * AdminDashboard - Dashboard for system administrators

/**
 * AdminDashboard - Dashboard for system administrators
 *
 * Widgets:
 * - System Health (FR33)
 * - User Activity (FR34)
 * - Settings Quick Access (FR35)
 *
 * Uses useAdminDashboard hook for data fetching with:
 * - 60s polling for admin view
 * - React Query for caching and state management
 */
export function AdminDashboard() {
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  const handleRetry = () => {
    refetch();
  };

  return (
    <DashboardLayout subtitle="System health dan user activity">
      <SystemHealthWidget
        data={data?.systemHealth}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <UserActivityWidget
        data={data?.recentActivity}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <SettingsQuickAccessWidget
        data={data?.quickAccess}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />
    </DashboardLayout>
  );
}

export default AdminDashboard;
