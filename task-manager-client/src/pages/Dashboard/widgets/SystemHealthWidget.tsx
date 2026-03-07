import { Server, Users, Cpu, ClipboardList, Ticket, Clock } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { SystemHealth } from '../../../hooks/useAdminDashboard';

interface SystemHealthWidgetProps {
  data?: SystemHealth;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * SystemHealthWidget - Displays system health metrics for admins
 *
 * Features:
 * - Total counts for key entities
 * - Active users indicator
 * - Server uptime display
 */
export function SystemHealthWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: SystemHealthWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat System Health"
        message="Tidak dapat memuat data kesehatan sistem"
        onRetry={onRetry}
      />
    );
  }

  if (!data) {
    return null;
  }

  const formatUptime = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  };

  const healthItems = [
    {
      label: 'Total Users',
      value: data.total_users,
      subValue: `${data.active_users_today} aktif hari ini`,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Total Assets',
      value: data.total_assets,
      subValue: 'Mesin aktif',
      icon: Cpu,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
    {
      label: 'Work Orders',
      value: data.total_work_orders,
      subValue: 'Total WO',
      icon: ClipboardList,
      color: 'text-status-info',
      bgColor: 'bg-status-info/10',
    },
    {
      label: 'Tickets',
      value: data.total_tickets,
      subValue: 'Total ticket',
      icon: Ticket,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
    },
    {
      label: 'Server Uptime',
      value: formatUptime(data.server_uptime_hours),
      subValue: 'Waktu aktif',
      icon: Server,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Active Today',
      value: data.active_users_today,
      subValue: 'Users login hari ini',
      icon: Clock,
      color: 'text-text-primary',
      bgColor: 'bg-surface',
    },
  ];

  return (
    <WidgetCard
      title="System Health"
      subtitle="Status kesehatan sistem"
      colSpan={2}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {healthItems.map((item) => (
          <div
            key={item.label}
            className="p-4 rounded-xl bg-surface border border-border-subtle"
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bgColor}`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
            </div>
            <div className={`text-2xl font-bold ${item.color}`}>
              {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
            </div>
            <div className="text-xs text-text-muted mt-1">{item.label}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

export default SystemHealthWidget;
