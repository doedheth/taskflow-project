import { Sparkles, Loader2 } from 'lucide-react';

interface SmartWOButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * SmartWOButton - AI Generate button for Work Order creation
 * Displays sparkle icon with gradient background
 */
export function SmartWOButton({
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}: SmartWOButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm font-medium
        bg-gradient-to-r from-purple-500 to-blue-500
        text-white rounded-lg
        hover:opacity-90
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-opacity duration-200
        ${className}
      `}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4" />
      )}
      <span>{isLoading ? 'Generating...' : 'AI Generate'}</span>
    </button>
  );
}

export default SmartWOButton;
