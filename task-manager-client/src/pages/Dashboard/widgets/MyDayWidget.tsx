import { CalendarClock, Wrench, AlertCircle, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import { PriorityBadge } from '../../../components/Dashboard/PriorityBadge';
import { usePriorityScoreMap } from '../../../hooks/useTaskPrioritization';
import type { MyDayTask } from '../../../hooks/useMemberDashboard';

interface MyDayWidgetProps {
  data?: MyDayTask[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onTaskClick?: (task: MyDayTask) => void;
  enableAIPrioritization?: boolean;
}

// AI-generated priority reasoning based on task attributes
const getAIPriorityReason = (task: MyDayTask, index: number): string => {
  return 'Analisis prioritas AI belum tersedia untuk tugas ini.';
};

/**
 * MyDayWidget - Displays priority tasks for today
 *
 * Features:
 * - Combined list of WOs and PM schedules
 * - Priority-sorted with color coding
 * - Shows due date and status
 */
export function MyDayWidget({
  data,
  isLoading,
  isError,
  onRetry,
  onTaskClick,
  enableAIPrioritization = true,
}: MyDayWidgetProps) {
  // Extract work order IDs for AI prioritization
  const workOrderIds = useMemo(() => {
    if (!data) return [];
    return data.filter(t => t.type === 'work_order').map(t => t.id);
  }, [data]);

  // Fetch AI priority scores (only for work orders, 5-min cache)
  const { scoreMap, isLoading: isPriorityLoading } = usePriorityScoreMap(
    workOrderIds,
    'work_order',
    enableAIPrioritization && workOrderIds.length > 0
  );

  // Sort tasks by AI priority score (if available)
  const sortedData = useMemo(() => {
    if (!data) return [];
    if (scoreMap.size === 0) return data;

    return [...data].sort((a, b) => {
      const scoreA = scoreMap.get(a.id)?.totalScore ?? 50;
      const scoreB = scoreMap.get(b.id)?.totalScore ?? 50;
      return scoreB - scoreA;
    });
  }, [data, scoreMap]);

  if (isLoading) {
    return <WidgetSkeleton lines={5} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat My Day"
        message="Tidak dapat memuat data tugas hari ini"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard
        title="My Day"
        subtitle="Tugas prioritas hari ini"
        colSpan={2}
      >
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <CalendarClock className="w-10 h-10 mb-2" />
          <p className="text-sm">Tidak ada tugas prioritas hari ini</p>
          <p className="text-xs mt-1">Selamat! Anda sudah menyelesaikan semua tugas</p>
        </div>
      </WidgetCard>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-status-error bg-status-error/10 border-status-error/30';
      case 'high':
        return 'text-status-warning bg-status-warning/10 border-status-warning/30';
      case 'medium':
        return 'text-status-info bg-status-info/10 border-status-info/30';
      default:
        return 'text-text-muted bg-surface border-border-subtle';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'work_order' ? Wrench : CalendarClock;
  };

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Overdue', color: 'text-status-error' };
    if (diffDays === 0) return { text: 'Hari ini', color: 'text-status-warning' };
    if (diffDays === 1) return { text: 'Besok', color: 'text-status-info' };
    return { text: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), color: 'text-text-muted' };
  };

  return (
    <WidgetCard
      title="My Day"
      subtitle={`${sortedData.length} tugas prioritas`}
      colSpan={2}
      action={
        <div className="flex items-center gap-1 text-xs text-primary">
          <Sparkles className="w-3 h-3" />
          <span>{isPriorityLoading ? 'Loading AI...' : 'AI Prioritized'}</span>
        </div>
      }
    >
      <div className="space-y-2">
        {sortedData.map((task, index) => {
          const TypeIcon = getTypeIcon(task.type);
          const dueInfo = formatDueDate(task.due_date);
          const aiReason = getAIPriorityReason(task, index);
          const priorityScore = scoreMap.get(task.id);

          return (
            <button
              key={`${task.type}-${task.id}`}
              onClick={() => onTaskClick?.(task)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle hover:border-border transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                {/* AI Priority Badge */}
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      task.type === 'work_order'
                        ? 'bg-primary/10'
                        : 'bg-accent/10'
                    }`}
                  >
                    <TypeIcon
                      className={`w-5 h-5 ${
                        task.type === 'work_order' ? 'text-primary' : 'text-accent'
                      }`}
                    />
                  </div>
                  {/* AI Ranking Badge */}
                  {index < 3 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-text-primary truncate">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    {task.asset_name && (
                      <span className="truncate max-w-[120px]">{task.asset_name}</span>
                    )}
                    {task.asset_name && dueInfo && <span>•</span>}
                    {dueInfo && (
                      <span className={`flex items-center gap-1 ${dueInfo.color}`}>
                        <Clock className="w-3 h-3" />
                        {dueInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* AI Priority Score Badge */}
                {priorityScore ? (
                  <PriorityBadge score={priorityScore} compact />
                ) : (
                  <>
                    {/* Fallback AI Insight Tooltip */}
                    <div className="relative group/ai">
                      <div className="p-1 rounded bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity cursor-help">
                        <Sparkles className="w-3 h-3" />
                      </div>
                      <div className="absolute right-0 bottom-full mb-2 w-64 p-2 bg-surface-elevated border border-border rounded-lg shadow-lg text-xs text-text-secondary opacity-0 group-hover/ai:opacity-100 pointer-events-none transition-opacity z-10">
                        <div className="flex items-center gap-1 text-primary font-medium mb-1">
                          <Sparkles className="w-3 h-3" />
                          AI Insight
                        </div>
                        {aiReason}
                      </div>
                    </div>
                  </>
                )}
                <span
                  className={`px-2 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  {task.priority.toUpperCase()}
                </span>
                {task.status === 'in_progress' && (
                  <span className="flex items-center gap-1 text-xs text-status-info">
                    <AlertCircle className="w-3 h-3" />
                    In Progress
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-text-muted" />
              </div>
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default MyDayWidget;
