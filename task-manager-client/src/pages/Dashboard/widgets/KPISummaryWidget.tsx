import { TrendingUp, TrendingDown, ClipboardCheck, Ticket, Clock, Cpu } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { KPISummary } from '../../../hooks/useManagerDashboard';

interface KPISummaryWidgetProps {
  data?: KPISummary;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * KPISummaryWidget - Displays key performance indicators for managers
 *
 * Features:
 * - Month-to-date metrics
 * - Trend indicators (up/down arrows)
 * - Color-coded performance
 */
export function KPISummaryWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: KPISummaryWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat KPI"
        message="Tidak dapat memuat data KPI"
        onRetry={onRetry}
      />
    );
  }

  if (!data) {
    return null;
  }

  const kpiItems = [
    {
      label: 'WO Selesai (MTD)',
      value: data.work_orders_completed_mtd,
      change: data.work_orders_completed_change,
      icon: ClipboardCheck,
      iconColor: 'text-status-success',
      iconBg: 'bg-status-success/10',
    },
    {
      label: 'Ticket Resolved (MTD)',
      value: data.tickets_resolved_mtd,
      change: data.tickets_resolved_change,
      icon: Ticket,
      iconColor: 'text-status-info',
      iconBg: 'bg-status-info/10',
    },
    {
      label: 'Avg. Resolution Time',
      value: `${data.avg_resolution_time_hours}h`,
      change: data.resolution_time_change,
      invertChange: true, // Lower is better
      icon: Clock,
      iconColor: 'text-status-warning',
      iconBg: 'bg-status-warning/10',
    },
    {
      label: 'Machine Uptime',
      value: `${data.machine_uptime_percentage}%`,
      change: data.uptime_change,
      icon: Cpu,
      iconColor: 'text-primary',
      iconBg: 'bg-primary/10',
    },
  ];

  const getChangeColor = (change: number, invert = false) => {
    if (change === 0) return 'text-text-muted';
    const isPositive = invert ? change < 0 : change > 0;
    return isPositive ? 'text-status-success' : 'text-status-error';
  };

  const getChangeIcon = (change: number, invert = false) => {
    if (change === 0) return null;
    const isPositive = invert ? change < 0 : change > 0;
    return isPositive ? TrendingUp : TrendingDown;
  };

  return (
    <WidgetCard
      title="KPI Summary"
      subtitle="Month-to-Date Performance"
      colSpan={2}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiItems.map((item) => {
          const ChangeIcon = getChangeIcon(item.change, item.invertChange);

          return (
            <div
              key={item.label}
              className="p-4 rounded-xl bg-surface border border-border-subtle"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.iconBg}`}
                >
                  <item.icon className={`w-4 h-4 ${item.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-text-primary mb-1">
                {item.value}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{item.label}</span>
                {ChangeIcon && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${getChangeColor(
                      item.change,
                      item.invertChange
                    )}`}
                  >
                    <ChangeIcon className="w-3 h-3" />
                    {Math.abs(item.change)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default KPISummaryWidget;
