import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import {
  MyDayWidget,
  AssignedWorkOrdersWidget,
  PMReminderWidget,
  PersonalWorkloadWidget,
} from './widgets';
import { useMemberDashboard } from '../../hooks/useMemberDashboard';
import type { MyDayTask, AssignedWorkOrder, PMReminder } from '../../hooks/useMemberDashboard';

/**
 * MemberDashboard - "My Day" dashboard for technicians/members
 *
 * Widgets:
 * - My Day / Priority Tasks (FR11)
 * - Assigned Work Orders (FR12)
 * - PM Reminders (FR13)
 * - Personal Workload (FR14)
 *
 * Uses useMemberDashboard hook for data fetching with:
 * - 30s polling for real-time updates
 * - React Query for caching and state management
 */
export function MemberDashboard() {
  const { data, isLoading, isError, refetch } = useMemberDashboard();
  const navigate = useNavigate();

  const handleRetry = () => {
    refetch();
  };

  const handleTaskClick = (task: MyDayTask) => {
    if (task.type === 'work_order') {
      navigate(`/work-orders/${task.id}`);
    } else {
      navigate(`/maintenance-calendar`);
    }
  };

  const handleWorkOrderClick = (wo: AssignedWorkOrder) => {
    navigate(`/work-orders/${wo.id}`);
  };

  const handlePMClick = (_pm: PMReminder) => {
    navigate(`/maintenance-calendar`);
  };

  return (
    <DashboardLayout subtitle="Prioritas tugas hari ini">
      <MyDayWidget
        data={data?.myDay}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
        onTaskClick={handleTaskClick}
      />

      <AssignedWorkOrdersWidget
        data={data?.assignedWorkOrders}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
        onWorkOrderClick={handleWorkOrderClick}
      />

      <PMReminderWidget
        data={data?.pmReminders}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
        onPMClick={handlePMClick}
      />

      <PersonalWorkloadWidget
        data={data?.personalWorkload}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />
    </DashboardLayout>
  );
}

export default MemberDashboard;
