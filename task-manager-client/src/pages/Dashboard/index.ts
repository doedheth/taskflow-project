// Dashboard module exports
export { DashboardLayout } from './DashboardLayout';

// Widget building blocks
export { WidgetCard, WidgetSkeleton, WidgetSkeletonGrid, WidgetError } from './widgets';

// Role-specific dashboards
export { AdminDashboard } from './AdminDashboard';
export { ManagerDashboard } from './ManagerDashboard';
export { SupervisorDashboard } from './SupervisorDashboard';
export { MemberDashboard } from './MemberDashboard';

// Role-based router (main entry point)
export { RoleDashboardRouter } from './RoleDashboardRouter';

// Default export for route usage
export { RoleDashboardRouter as default } from './RoleDashboardRouter';
