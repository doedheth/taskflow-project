interface WidgetSkeletonProps {
  /** Number of skeleton lines to show */
  lines?: number;
  /** Show a header skeleton */
  hasHeader?: boolean;
  /** Custom height for the skeleton area */
  height?: string;
  className?: string;
}

/**
 * WidgetSkeleton - Loading placeholder for dashboard widgets
 *
 * Features:
 * - Animated shimmer effect
 * - Configurable number of lines
 * - Optional header skeleton
 * - Matches WidgetCard styling
 */
export function WidgetSkeleton({
  lines = 3,
  hasHeader = true,
  height,
  className = '',
}: WidgetSkeletonProps) {
  return (
    <div
      className={`
        rounded-widget p-4 md:p-6
        bg-surface-elevated border border-border
        animate-pulse
        ${className}
      `}
      style={height ? { minHeight: height } : undefined}
    >
      {/* Header Skeleton */}
      {hasHeader && (
        <div className="mb-4">
          <div className="h-5 w-32 bg-border rounded-lg" />
          <div className="h-3 w-24 bg-border-subtle rounded mt-2" />
        </div>
      )}

      {/* Content Skeleton Lines */}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-border rounded"
            style={{
              width: `${Math.max(40, 100 - index * 15)}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * WidgetSkeletonGrid - Multiple skeleton cards for initial dashboard load
 */
export function WidgetSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <WidgetSkeleton key={index} lines={3} hasHeader />
      ))}
    </>
  );
}

export default WidgetSkeleton;
