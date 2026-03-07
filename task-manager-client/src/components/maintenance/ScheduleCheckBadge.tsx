interface ScheduleCheckBadgeProps {
  status: 'scheduled' | 'no_order' | 'holiday' | 'maintenance_window' | string;
  countsAsDowntime?: boolean;
  message?: string;
  compact?: boolean;
}

const statusConfig: Record<string, { icon: string; label: string; bg: string; text: string }> = {
  scheduled: {
    icon: '🟢',
    label: 'Jadwal Produksi Aktif',
    bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300',
  },
  no_order: {
    icon: '⚪',
    label: 'Tidak Ada Order',
    bg: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
    text: 'text-gray-600 dark:text-gray-400',
  },
  holiday: {
    icon: '🔴',
    label: 'Hari Libur',
    bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
  },
  maintenance_window: {
    icon: '🟡',
    label: 'Maintenance Window',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
  },
  none: {
    icon: '⚫',
    label: 'Tidak Ada Jadwal',
    bg: 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600',
    text: 'text-gray-500 dark:text-gray-500',
  },
};

export default function ScheduleCheckBadge({
  status,
  countsAsDowntime,
  message,
  compact = false,
}: ScheduleCheckBadgeProps) {
  const config = statusConfig[status] || statusConfig.none;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border ${config.bg}`}>
        <span>{config.icon}</span>
        <span className={`text-xs font-medium ${config.text}`}>{config.label}</span>
        {countsAsDowntime !== undefined && (
          <span className={`text-xs ${countsAsDowntime ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
            {countsAsDowntime ? '✓' : '✗'}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border-2 ${config.bg}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{config.icon}</span>
        <span className={`font-medium ${config.text}`}>{config.label}</span>
      </div>
      
      {message && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{message}</p>
      )}
      
      {countsAsDowntime !== undefined && (
        <div className="text-sm">
          {countsAsDowntime ? (
            <span className="text-yellow-700 dark:text-yellow-300 font-medium">
              ⚠️ Downtime ini akan DIHITUNG dalam KPI
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">
              ℹ️ Downtime ini TIDAK akan dihitung dalam KPI
            </span>
          )}
        </div>
      )}
    </div>
  );
}


