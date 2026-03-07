import { AlertTriangle, AlertCircle, Info, ChevronRight, Cpu, Calendar, ClipboardList } from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { Alert } from '../../../hooks/useManagerDashboard';

interface AlertsWidgetProps {
  data?: Alert[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onAlertClick?: (alert: Alert) => void;
}

/**
 * AlertsWidget - Shows active alerts requiring manager attention
 *
 * Features:
 * - Severity-based styling (critical/warning/info)
 * - Type-based icons
 * - Clickable for navigation
 */
export function AlertsWidget({
  data,
  isLoading,
  isError,
  onRetry,
  onAlertClick,
}: AlertsWidgetProps) {
  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Alerts"
        message="Tidak dapat memuat data alert"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <WidgetCard title="Alerts" subtitle="Perhatian diperlukan">
        <div className="flex flex-col items-center justify-center py-8 text-status-success">
          <AlertCircle className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">Tidak ada alert aktif</p>
          <p className="text-xs text-text-muted mt-1">Semua sistem berjalan normal</p>
        </div>
      </WidgetCard>
    );
  }

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-status-error/5',
          border: 'border-status-error/30',
          iconBg: 'bg-status-error/10',
          iconColor: 'text-status-error',
          badge: 'bg-status-error text-white',
        };
      case 'warning':
        return {
          bg: 'bg-status-warning/5',
          border: 'border-status-warning/30',
          iconBg: 'bg-status-warning/10',
          iconColor: 'text-status-warning',
          badge: 'bg-status-warning text-white',
        };
      default:
        return {
          bg: 'bg-status-info/5',
          border: 'border-status-info/30',
          iconBg: 'bg-status-info/10',
          iconColor: 'text-status-info',
          badge: 'bg-status-info text-white',
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'machine_down':
        return Cpu;
      case 'overdue_pm':
        return Calendar;
      case 'high_priority_wo':
        return ClipboardList;
      default:
        return AlertTriangle;
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return AlertTriangle;
      case 'warning':
        return AlertCircle;
      default:
        return Info;
    }
  };

  // Count by severity
  const criticalCount = data.filter((a) => a.severity === 'critical').length;
  const warningCount = data.filter((a) => a.severity === 'warning').length;

  return (
    <WidgetCard
      title="Alerts"
      subtitle={
        criticalCount > 0
          ? `${criticalCount} critical, ${warningCount} warning`
          : `${warningCount} warning`
      }
    >
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {data.map((alert) => {
          const styles = getSeverityStyles(alert.severity);
          const TypeIcon = getTypeIcon(alert.type);
          const SeverityIcon = getSeverityIcon(alert.severity);

          return (
            <button
              key={alert.id}
              onClick={() => onAlertClick?.(alert)}
              className={`w-full p-3 rounded-xl border transition-all text-left hover:scale-[1.01] ${styles.bg} ${styles.border}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${styles.iconBg}`}
                >
                  <TypeIcon className={`w-5 h-5 ${styles.iconColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <SeverityIcon className={`w-4 h-4 flex-shrink-0 ${styles.iconColor}`} />
                    <span className="font-medium text-text-primary text-sm truncate">
                      {alert.title}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {alert.description}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-1" />
              </div>

              {/* Severity Badge */}
              <div className="flex justify-end mt-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${styles.badge}`}
                >
                  {alert.severity}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default AlertsWidget;
