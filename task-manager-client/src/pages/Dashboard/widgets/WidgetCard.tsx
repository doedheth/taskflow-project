import { ReactNode } from 'react';

interface WidgetCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  /** Column span for grid layout (1-4) */
  colSpan?: 1 | 2 | 3 | 4;
  /** Row span for grid layout (1-2) */
  rowSpan?: 1 | 2;
  /** Optional action button in header */
  action?: ReactNode;
}

/**
 * WidgetCard - Base card component for dashboard widgets
 *
 * Features:
 * - Consistent card styling with design tokens
 * - Optional title and subtitle
 * - Configurable grid span
 * - Optional action button in header
 */
export function WidgetCard({
  children,
  title,
  subtitle,
  className = '',
  colSpan = 1,
  rowSpan = 1,
  action,
}: WidgetCardProps) {
  const colSpanClasses: Record<number, string> = {
    1: '',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 lg:col-span-3',
    4: 'sm:col-span-2 lg:col-span-3 xl:col-span-4',
  };

  const rowSpanClasses: Record<number, string> = {
    1: '',
    2: 'row-span-2',
  };

  return (
    <div
      className={`
        rounded-widget p-4 md:p-6
        bg-surface-elevated border border-border
        transition-colors
        ${colSpanClasses[colSpan]}
        ${rowSpanClasses[rowSpan]}
        ${className}
      `}
    >
      {/* Widget Header */}
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && (
              <h3 className="text-base md:text-lg font-semibold text-text-primary">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-text-secondary mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Widget Content */}
      {children}
    </div>
  );
}

export default WidgetCard;
