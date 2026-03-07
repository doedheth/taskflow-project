import { ClipboardCheck, Clock, Ticket, TrendingUp } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { YesterdaySummary } from '../../../hooks/useSupervisorDashboard';

interface YesterdaySummaryWidgetProps {
  data?: YesterdaySummary;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * YesterdaySummaryWidget - Displays yesterday's performance summary
 *
 * Features:
 * - Completed work orders count
 * - Pending review work orders count
 * - Completed tickets count
 */
export function YesterdaySummaryWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: YesterdaySummaryWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={3} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Summary"
        message="Tidak dapat memuat data summary kemarin"
        onRetry={onRetry}
      />
    );
  }

  if (!data) {
    return null;
  }

  const summaryItems = [
    {
      label: 'WO Selesai',
      value: data.completed_work_orders,
      icon: ClipboardCheck,
      color: 'text-status-success',
      bgColor: 'bg-status-success/10',
    },
    {
      label: 'Pending Review',
      value: data.pending_review_work_orders,
      icon: Clock,
      color: 'text-status-warning',
      bgColor: 'bg-status-warning/10',
    },
    {
      label: 'Ticket Selesai',
      value: data.completed_tickets,
      icon: Ticket,
      color: 'text-status-info',
      bgColor: 'bg-status-info/10',
    },
  ];

  const totalCompleted = data.completed_work_orders + data.completed_tickets;

  return (
    <WidgetCard
      title="Summary Kemarin"
      subtitle="Performa hari sebelumnya"
    >
      <div className="space-y-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center`}
              >
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <span className="text-sm text-text-secondary">{item.label}</span>
            </div>
            <div className={`text-xl font-bold ${item.color}`}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Total Summary Footer */}
      <div className="mt-4 pt-4 border-t border-border-subtle">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text-muted">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Total selesai kemarin</span>
          </div>
          <span className="text-lg font-bold text-text-primary">
            {totalCompleted}
          </span>
        </div>
      </div>
    </WidgetCard>
  );
}

export default YesterdaySummaryWidget;
