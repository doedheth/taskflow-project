import { CalendarClock, AlertTriangle, ChevronRight, RefreshCw } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { PMReminder } from '../../../hooks/useMemberDashboard';

interface PMReminderWidgetProps {
  data?: PMReminder[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onPMClick?: (pm: PMReminder) => void;
}

/**
 * PMReminderWidget - Shows upcoming preventive maintenance schedules
 *
 * Features:
 * - Overdue items highlighted
 * - Frequency type indicator
 * - Due date countdown
 */
export function PMReminderWidget({
  data,
  isLoading,
  isError,
  onRetry,
  onPMClick,
}: PMReminderWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat PM Reminders"
        message="Tidak dapat memuat jadwal PM"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard title="PM Reminders" subtitle="Jadwal maintenance">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <CalendarClock className="w-10 h-10 mb-2" />
          <p className="text-sm">Tidak ada jadwal PM</p>
        </div>
      </WidgetCard>
    );
  }

  const formatFrequency = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      quarterly: 'Per 3 Bulan',
      yearly: 'Tahunan',
      runtime_hours: 'Runtime',
    };
    return labels[type] || type;
  };

  const formatDueDate = (dateStr: string, isOverdue: boolean) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    if (isOverdue) {
      const diffDays = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${diffDays} hari terlambat`, color: 'text-status-error' };
    }

    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Hari ini', color: 'text-status-warning' };
    if (diffDays === 1) return { text: 'Besok', color: 'text-status-info' };
    if (diffDays <= 7) return { text: `${diffDays} hari lagi`, color: 'text-text-secondary' };
    return { text: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), color: 'text-text-muted' };
  };

  // Count overdue
  const overdueCount = data.filter((pm) => pm.is_overdue).length;

  return (
    <WidgetCard
      title="PM Reminders"
      subtitle={overdueCount > 0 ? `${overdueCount} terlambat` : 'Jadwal minggu ini'}
    >
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {data.map((pm) => {
          const dueInfo = formatDueDate(pm.next_due, pm.is_overdue);

          return (
            <button
              key={pm.id}
              onClick={() => onPMClick?.(pm)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                pm.is_overdue
                  ? 'bg-status-error/5 border-status-error/30'
                  : 'bg-surface border-border-subtle hover:border-border'
              }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    pm.is_overdue ? 'bg-status-error/10' : 'bg-accent/10'
                  }`}
                >
                  {pm.is_overdue ? (
                    <AlertTriangle className="w-4 h-4 text-status-error" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary text-sm truncate">
                    {pm.description}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {pm.asset_name && (
                      <span className="text-text-muted truncate max-w-[100px]">
                        {pm.asset_name}
                      </span>
                    )}
                    <span className="text-text-muted">•</span>
                    <span className="text-text-muted">
                      {formatFrequency(pm.frequency_type)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${dueInfo.color}`}>
                  {dueInfo.text}
                </span>
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default PMReminderWidget;
