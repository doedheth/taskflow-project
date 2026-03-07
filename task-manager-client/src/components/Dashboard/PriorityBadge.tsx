import { Sparkles, Zap, AlertTriangle, Clock, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface PriorityScoreBreakdown {
  dueDate: { score: number; weight: number; reason: string };
  machineCriticality: { score: number; weight: number; reason: string };
  issueSeverity: { score: number; weight: number; reason: string };
  cumulativeDowntime: { score: number; weight: number; reason: string };
  dependencyChain: { score: number; weight: number; reason: string };
}

export interface TaskPriorityScore {
  taskId: number;
  taskType: 'work_order' | 'ticket';
  totalScore: number;
  breakdown: PriorityScoreBreakdown;
  overallReason: string;
  colorClass: string;
}

interface PriorityBadgeProps {
  score: TaskPriorityScore;
  showTooltip?: boolean;
  compact?: boolean;
}

/**
 * PriorityBadge - Displays AI-calculated priority score
 *
 * Features:
 * - Color-coded based on score (red > orange > yellow > green)
 * - Tooltip with detailed breakdown on hover
 * - Compact mode for inline use
 */
export function PriorityBadge({ score, showTooltip = true, compact = false }: PriorityBadgeProps) {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  // Get color classes based on score
  const getColorClasses = (totalScore: number) => {
    if (totalScore >= 80) {
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'text-red-500',
      };
    } else if (totalScore >= 60) {
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        icon: 'text-orange-500',
      };
    } else if (totalScore >= 40) {
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: 'text-yellow-500',
      };
    } else {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: 'text-green-500',
      };
    }
  };

  const colors = getColorClasses(score.totalScore);

  // Get icon based on score
  const getIcon = () => {
    if (score.totalScore >= 80) {
      return <AlertTriangle className={`w-3 h-3 ${colors.icon}`} />;
    } else if (score.totalScore >= 60) {
      return <Zap className={`w-3 h-3 ${colors.icon}`} />;
    } else {
      return <Clock className={`w-3 h-3 ${colors.icon}`} />;
    }
  };

  // Format breakdown item
  const formatBreakdownItem = (
    icon: string,
    label: string,
    breakdown: { score: number; weight: number; reason: string }
  ) => {
    const contribution = Math.round(breakdown.score * breakdown.weight);
    return (
      <div className="flex items-start gap-2 text-xs">
        <span className="w-4 text-center">{icon}</span>
        <div className="flex-1">
          <div className="flex justify-between">
            <span className="text-text-secondary">{label}</span>
            <span className="font-medium">+{contribution}</span>
          </div>
          <div className="text-text-muted text-[10px]">{breakdown.reason}</div>
        </div>
      </div>
    );
  };

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
      >
        {getIcon()}
        {score.totalScore}
      </span>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsTooltipVisible(true)}
      onMouseLeave={() => setIsTooltipVisible(false)}
    >
      {/* Badge */}
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border cursor-help ${colors.bg} ${colors.text} ${colors.border}`}
      >
        {getIcon()}
        <span className="font-semibold text-sm">{score.totalScore}</span>
        {showTooltip && <ChevronDown className="w-3 h-3 opacity-50" />}
      </div>

      {/* Tooltip */}
      {showTooltip && isTooltipVisible && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-surface-elevated border border-border rounded-xl shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-border-subtle mb-2">
            <div className={`p-1 rounded ${colors.bg}`}>
              <Sparkles className={`w-4 h-4 ${colors.icon}`} />
            </div>
            <div>
              <div className="font-semibold text-text-primary">
                AI Priority: {score.totalScore}/100
              </div>
              <div className="text-xs text-text-muted">{score.overallReason}</div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2">
            {formatBreakdownItem('📅', 'Due Date (30%)', score.breakdown.dueDate)}
            {formatBreakdownItem('🏭', 'Mesin (25%)', score.breakdown.machineCriticality)}
            {formatBreakdownItem('🔴', 'Prioritas (20%)', score.breakdown.issueSeverity)}
            {formatBreakdownItem('⏱️', 'Downtime (15%)', score.breakdown.cumulativeDowntime)}
            {formatBreakdownItem('🔗', 'Dependensi (10%)', score.breakdown.dependencyChain)}
          </div>

          {/* Recommendation */}
          <div className="mt-3 pt-2 border-t border-border-subtle">
            <div className={`text-xs font-medium ${colors.text}`}>
              {score.totalScore >= 80
                ? '⚡ Rekomendasi: Tangani segera'
                : score.totalScore >= 60
                ? '🔔 Rekomendasi: Prioritaskan'
                : score.totalScore >= 40
                ? '📋 Rekomendasi: Jadwalkan'
                : '✓ Rekomendasi: Bisa ditunda'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PriorityBadge;
