import { ClipboardList, ChevronRight, Play, Pause, Clock } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { AssignedWorkOrder } from '../../../hooks/useMemberDashboard';

interface AssignedWorkOrdersWidgetProps {
  data?: AssignedWorkOrder[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onWorkOrderClick?: (wo: AssignedWorkOrder) => void;
}

/**
 * AssignedWorkOrdersWidget - Shows all work orders assigned to the user
 *
 * Features:
 * - Status-based sorting (in_progress first)
 * - Priority badges
 * - Quick status indicators
 */
export function AssignedWorkOrdersWidget({
  data,
  isLoading,
  isError,
  onRetry,
  onWorkOrderClick,
}: AssignedWorkOrdersWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Work Orders"
        message="Tidak dapat memuat data work order"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Work Orders" subtitle="Assigned ke saya">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <ClipboardList className="w-10 h-10 mb-2" />
          <p className="text-sm">Tidak ada work order</p>
        </div>
      </WidgetCard>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return { icon: Play, color: 'text-status-info', bg: 'bg-status-info/10' };
      case 'on_hold':
        return { icon: Pause, color: 'text-status-warning', bg: 'bg-status-warning/10' };
      default:
        return { icon: Clock, color: 'text-text-muted', bg: 'bg-surface' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-status-error';
      case 'high':
        return 'text-status-warning';
      case 'medium':
        return 'text-status-info';
      default:
        return 'text-text-muted';
    }
  };

  // Count by status
  const inProgressCount = data.filter((wo) => wo.status === 'in_progress').length;
  const openCount = data.filter((wo) => wo.status === 'open').length;

  return (
    <WidgetCard
      title="Work Orders"
      subtitle={`${inProgressCount} in progress • ${openCount} open`}
    >
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data.slice(0, 8).map((wo) => {
          const statusInfo = getStatusIcon(wo.status);
          const StatusIcon = statusInfo.icon;

          return (
            <button
              key={wo.id}
              onClick={() => onWorkOrderClick?.(wo)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition-all text-left"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusInfo.bg}`}
                >
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted font-mono">
                      {wo.wo_key}
                    </span>
                    <span className={`text-xs font-medium ${getPriorityColor(wo.priority)}`}>
                      {wo.priority.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="font-medium text-text-primary text-sm truncate">
                    {wo.title}
                  </div>
                  {wo.asset_name && (
                    <div className="text-xs text-text-muted truncate">
                      {wo.asset_name}
                    </div>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            </button>
          );
        })}

        {data.length > 8 && (
          <div className="text-center py-2">
            <span className="text-xs text-text-muted">
              +{data.length - 8} work order lainnya
            </span>
          </div>
        )}
      </div>
    </WidgetCard>
  );
}

export default AssignedWorkOrdersWidget;
