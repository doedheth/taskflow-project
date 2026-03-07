import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  Cpu,
  AlertTriangle,
  Clock,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import type { QuickAccessItem } from '../../../hooks/useAdminDashboard';

interface SettingsQuickAccessWidgetProps {
  data?: QuickAccessItem[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

/**
 * SettingsQuickAccessWidget - Quick access to admin settings
 *
 * Features:
 * - Grid of admin menu items
 * - Entity counts
 * - Direct navigation
 */
export function SettingsQuickAccessWidget({
  data,
  isLoading,
  isError,
  onRetry,
}: SettingsQuickAccessWidgetProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Quick Access"
        message="Tidak dapat memuat menu cepat"
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, typeof Users> = {
      users: Users,
      building: Building2,
      cpu: Cpu,
      'alert-triangle': AlertTriangle,
      clock: Clock,
      settings: Settings,
    };
    return icons[iconName] || Settings;
  };

  const getIconColor = (iconName: string) => {
    const colors: Record<string, { color: string; bg: string }> = {
      users: { color: 'text-primary', bg: 'bg-primary/10' },
      building: { color: 'text-status-info', bg: 'bg-status-info/10' },
      cpu: { color: 'text-status-success', bg: 'bg-status-success/10' },
      'alert-triangle': { color: 'text-status-error', bg: 'bg-status-error/10' },
      clock: { color: 'text-status-warning', bg: 'bg-status-warning/10' },
      settings: { color: 'text-accent', bg: 'bg-accent/10' },
    };
    return colors[iconName] || { color: 'text-text-primary', bg: 'bg-surface' };
  };

  return (
    <WidgetCard
      title="Quick Access"
      subtitle="Menu administrasi"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.map((item) => {
          const Icon = getIcon(item.icon);
          const colors = getIconColor(item.icon);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.route)}
              className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border-subtle hover:border-border hover:bg-surface-hover transition-all text-left overflow-hidden"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors.bg}`}
              >
                <Icon className={`w-6 h-6 ${colors.color}`} />
              </div>
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-text-primary truncate">
                    {item.label}
                  </span>
                  {item.count !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium flex-shrink-0">
                      {item.count}
                    </span>
                  )}
                </div>
                <div className="text-xs text-text-muted truncate">
                  {item.description}
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </WidgetCard>
  );
}

export default SettingsQuickAccessWidget;
