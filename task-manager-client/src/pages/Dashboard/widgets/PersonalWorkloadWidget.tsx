import { TrendingUp, CheckCircle2, Clock, BarChart3 } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { PersonalWorkload } from '../../../hooks/useMemberDashboard';

interface PersonalWorkloadWidgetProps {
  data?: PersonalWorkload;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * PersonalWorkloadWidget - Shows personal workload and completion stats
 *
 * Features:
 * - Workload percentage with progress bar
 * - Completed today/this week counts
 * - Visual capacity indicator
 */
export function PersonalWorkloadWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: PersonalWorkloadWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Workload"
        message="Tidak dapat memuat data beban kerja"
        onRetry={onRetry}
      />
    );
  }

  if (!data) {
    return null;
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-status-error';
    if (percentage >= 75) return 'bg-status-warning';
    if (percentage >= 50) return 'bg-status-info';
    return 'bg-status-success';
  };

  const getWorkloadLabel = (percentage: number) => {
    if (percentage >= 100) return { text: 'Overload', color: 'text-status-error' };
    if (percentage >= 75) return { text: 'High', color: 'text-status-warning' };
    if (percentage >= 50) return { text: 'Medium', color: 'text-status-info' };
    return { text: 'Low', color: 'text-status-success' };
  };

  const workloadInfo = getWorkloadLabel(data.workload_percentage);

  const stats = [
    {
      label: 'Assigned',
      value: data.assigned_work_orders,
      icon: Clock,
      color: 'text-text-primary',
      bgColor: 'bg-surface',
    },
    {
      label: 'In Progress',
      value: data.in_progress_work_orders,
      icon: BarChart3,
      color: 'text-status-info',
      bgColor: 'bg-status-info/10',
    },
    {
      label: 'Selesai Hari Ini',
      value: data.completed_today,
      icon: CheckCircle2,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
    {
      label: 'Selesai Minggu Ini',
      value: data.completed_this_week,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <WidgetCard title="Workload Saya" subtitle="Beban kerja personal">
      {/* Workload Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">Kapasitas</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-text-primary">
              {data.workload_percentage}%
            </span>
            <span className={`text-xs font-medium ${workloadInfo.color}`}>
              {workloadInfo.text}
            </span>
          </div>
        </div>
        <div className="h-3 bg-surface rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${getWorkloadColor(
              data.workload_percentage
            )}`}
            style={{ width: `${Math.min(data.workload_percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-3 rounded-xl bg-surface border border-border-subtle"
          >
            <div className="flex items-center gap-2 mb-1">
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center ${stat.bgColor}`}
              >
                <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
              </div>
              <span className="text-xl font-bold text-text-primary">
                {stat.value}
              </span>
            </div>
            <div className="text-xs text-text-muted">{stat.label}</div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

export default PersonalWorkloadWidget;
