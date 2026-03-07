interface AssetStatusBadgeProps {
  status: 'operational' | 'maintenance' | 'breakdown' | 'retired' | string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const statusConfig: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  operational: { 
    bg: 'bg-green-100 dark:bg-green-900/30', 
    text: 'text-green-800 dark:text-green-300',
    label: 'Operational',
    dot: 'bg-green-500'
  },
  maintenance: { 
    bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
    text: 'text-yellow-800 dark:text-yellow-300',
    label: 'Maintenance',
    dot: 'bg-yellow-500'
  },
  breakdown: { 
    bg: 'bg-red-100 dark:bg-red-900/30', 
    text: 'text-red-800 dark:text-red-300',
    label: 'Breakdown',
    dot: 'bg-red-500 animate-pulse'
  },
  retired: { 
    bg: 'bg-gray-100 dark:bg-gray-700/50', 
    text: 'text-gray-800 dark:text-gray-300',
    label: 'Retired',
    dot: 'bg-gray-400'
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export default function AssetStatusBadge({ 
  status, 
  size = 'md',
  showDot = false 
}: AssetStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.operational;
  
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses[size]}`}>
      {showDot && (
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      )}
      {config.label}
    </span>
  );
}


