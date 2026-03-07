import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { SupervisorDashboard } from './SupervisorDashboard';
import { MemberDashboard } from './MemberDashboard';

/**
 * RoleDashboardRouter - Routes to appropriate dashboard based on user role
 *
 * Role Mapping:
 * - admin → AdminDashboard
 * - manager → ManagerDashboard
 * - supervisor → SupervisorDashboard
 * - member (default) → MemberDashboard
 */
export function RoleDashboardRouter() {
  const { user } = useAuth();
  const role = user?.role || 'member';

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'supervisor':
      return <SupervisorDashboard />;
    case 'member':
    default:
      return <MemberDashboard />;
  }
}

export default RoleDashboardRouter;
