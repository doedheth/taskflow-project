import { Users, User, BarChart3 } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { TechnicianWorkload } from '../../../hooks/useSupervisorDashboard';

interface TeamWorkloadWidgetProps {
  data?: TechnicianWorkload[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * TeamWorkloadWidget - Displays team workload distribution
 *
 * Features:
 * - Shows each technician's workload percentage
 * - Color-coded progress bars based on capacity
 * - Displays assigned and in-progress work orders count
 */
export function TeamWorkloadWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: TeamWorkloadWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={5} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Data Workload"
        message="Tidak dapat memuat data beban kerja tim"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard
        title="Team Workload"
        subtitle="Beban kerja teknisi"
      >
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Users className="w-10 h-10 mb-2" />
          <p className="text-sm">Belum ada data teknisi</p>
        </div>
      </WidgetCard>
    );
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-status-error';
    if (percentage >= 75) return 'bg-status-warning';
    if (percentage >= 50) return 'bg-status-info';
    return 'bg-status-success';
  };

  const getWorkloadLabel = (percentage: number) => {
    if (percentage >= 100) return 'Overload';
    if (percentage >= 75) return 'High';
    if (percentage >= 50) return 'Medium';
    return 'Low';
  };

  // Sort by workload percentage (highest first)
  const sortedData = [...data].sort(
    (a, b) => b.workload_percentage - a.workload_percentage
  );

  return (
    <WidgetCard
      title="Team Workload"
      subtitle={`${data.length} teknisi aktif`}
    >
      <div className="space-y-4">
        {sortedData.map((technician) => (
          <div key={technician.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {technician.avatar ? (
                    <img
                      src={technician.avatar}
                      alt={technician.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-text-primary">
                    {technician.name}
                  </div>
                  <div className="text-xs text-text-muted">
                    {technician.assigned_work_orders} assigned •{' '}
                    {technician.in_progress_work_orders} in progress
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-text-primary">
                  {technician.workload_percentage}%
                </div>
                <div
                  className={`text-xs ${
                    technician.workload_percentage >= 100
                      ? 'text-status-error'
                      : technician.workload_percentage >= 75
                        ? 'text-status-warning'
                        : 'text-text-muted'
                  }`}
                >
                  {getWorkloadLabel(technician.workload_percentage)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${getWorkloadColor(
                  technician.workload_percentage
                )}`}
                style={{
                  width: `${Math.min(technician.workload_percentage, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <BarChart3 className="w-4 h-4" />
            <span>Rata-rata workload</span>
          </div>
          <span className="font-medium text-text-primary">
            {Math.round(
              data.reduce((sum, t) => sum + t.workload_percentage, 0) /
                data.length
            )}
            %
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

export default TeamWorkloadWidget;
