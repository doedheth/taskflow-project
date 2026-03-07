import { AlertTriangle, RefreshCw } from 'lucide-react';

interface WidgetErrorProps {
  /** Error message to display */
  message?: string;
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Custom title for the error */
  title?: string;
  className?: string;
}

/**
 * WidgetError - Error state component for dashboard widgets
 *
 * Features:
 * - User-friendly error message in Indonesian
 * - "Coba Lagi" retry button
 * - Consistent styling with design tokens
 */
export function WidgetError({
  message = 'Terjadi kesalahan saat memuat data',
  onRetry,
  title = 'Gagal Memuat',
  className = '',
}: WidgetErrorProps) {
  return (
    <div
      className={`
        rounded-widget p-4 md:p-6
        bg-surface-elevated border border-border
        flex flex-col items-center justify-center text-center
        min-h-[160px]
        ${className}
      `}
    >
      {/* Error Icon */}
      <div className="w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6 text-status-error" />
      </div>

      {/* Error Title */}
      <h4 className="text-base font-semibold text-text-primary mb-1">
        {title}
      </h4>

      {/* Error Message */}
      <p className="text-sm text-text-secondary mb-4 max-w-xs">
        {message}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            inline-flex items-center gap-2 px-4 py-2
            text-sm font-medium
            rounded-xl
            bg-primary text-white
            hover:bg-primary-hover
            transition-colors
          "
        >
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}

export default WidgetError;
