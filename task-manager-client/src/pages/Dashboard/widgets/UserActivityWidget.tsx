import { Activity, User, Clock } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { UserActivityItem } from '../../../hooks/useAdminDashboard';

interface UserActivityWidgetProps {
  data?: UserActivityItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * UserActivityWidget - Shows recent user activity log
 *
 * Features:
 * - Chronological activity feed
 * - User avatars
 * - Action type formatting
 */
export function UserActivityWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: UserActivityWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={5} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Activity"
        message="Tidak dapat memuat log aktivitas"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Recent Activity" subtitle="Log aktivitas terbaru">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Activity className="w-10 h-10 mb-2" />
          <p className="text-sm">Belum ada aktivitas</p>
        </div>
      </WidgetCard>
    );
  }

  const formatAction = (action: string, entityType: string) => {
    const actionMap: Record<string, string> = {
      create: 'membuat',
      update: 'mengubah',
      delete: 'menghapus',
      complete: 'menyelesaikan',
      assign: 'meng-assign',
      comment: 'mengomentari',
    };

    const entityMap: Record<string, string> = {
      work_order: 'work order',
      ticket: 'ticket',
      asset: 'asset',
      user: 'user',
      pm_schedule: 'jadwal PM',
      department: 'department',
    };

    const actionText = actionMap[action] || action;
    const entityText = entityMap[entityType] || entityType;

    return `${actionText} ${entityText}`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <WidgetCard
      title="Recent Activity"
      subtitle="Log aktivitas terbaru"
    >
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {data.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start gap-3 p-3 rounded-xl bg-surface border border-border-subtle"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              {activity.user_avatar ? (
                <img
                  src={activity.user_avatar}
                  alt={activity.user_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium text-text-primary">
                  {activity.user_name || 'Unknown User'}
                </span>{' '}
                <span className="text-text-secondary">
                  {formatAction(activity.action, activity.entity_type)}
                </span>
                {activity.entity_id && (
                  <span className="text-text-muted font-mono text-xs ml-1">
                    #{activity.entity_id}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-text-muted mt-1">
                <Clock className="w-3 h-3" />
                {formatTimeAgo(activity.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}

export default UserActivityWidget;
