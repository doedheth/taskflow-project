import { Users, User, Trophy, Clock } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { TeamMemberPerformance } from '../../../hooks/useManagerDashboard';

interface TeamPerformanceWidgetProps {
  data?: TeamMemberPerformance[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * TeamPerformanceWidget - Shows team member performance ranking
 *
 * Features:
 * - Performance score with progress bar
 * - Completion count and average time
 * - Top performer highlighting
 */
export function TeamPerformanceWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: TeamPerformanceWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={5} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Performance"
        message="Tidak dapat memuat data performa tim"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Team Performance" subtitle="Last 30 days">
        <div className="flex flex-col items-center justify-center py-8 text-text-muted">
          <Users className="w-10 h-10 mb-2" />
          <p className="text-sm">Belum ada data performa</p>
        </div>
      </WidgetCard>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-status-success';
    if (score >= 60) return 'bg-status-info';
    if (score >= 40) return 'bg-status-warning';
    return 'bg-status-error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: 'Excellent', color: 'text-status-success' };
    if (score >= 60) return { text: 'Good', color: 'text-status-info' };
    if (score >= 40) return { text: 'Fair', color: 'text-status-warning' };
    return { text: 'Needs Improvement', color: 'text-status-error' };
  };

  return (
    <WidgetCard
      title="Team Performance"
      subtitle="Performa 30 hari terakhir"
    >
      <div className="space-y-3">
        {data.map((member, index) => {
          const scoreInfo = getScoreLabel(member.performance_score);
          const isTopPerformer = index === 0 && member.completed_work_orders > 0;

          return (
            <div
              key={member.id}
              className={`p-3 rounded-xl border transition-all ${
                isTopPerformer
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-surface border-border-subtle'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isTopPerformer
                      ? 'bg-primary text-white'
                      : 'bg-surface-elevated text-text-muted'
                  }`}
                >
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary truncate">
                      {member.name}
                    </span>
                    {isTopPerformer && (
                      <Trophy className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    <span>{member.completed_work_orders} WO selesai</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {member.avg_completion_time_hours}h avg
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-lg font-bold text-text-primary">
                    {member.performance_score}
                  </div>
                  <div className={`text-xs font-medium ${scoreInfo.color}`}>
                    {scoreInfo.text}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1.5 bg-surface-elevated rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${getScoreColor(
                    member.performance_score
                  )}`}
                  style={{ width: `${member.performance_score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default TeamPerformanceWidget;
