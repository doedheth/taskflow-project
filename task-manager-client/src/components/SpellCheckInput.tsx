import { useState, useCallback, useRef, useEffect } from 'react';
import { SpellCheck, X } from 'lucide-react';
import { useSpellCheck, type SpellCheckResult } from '../hooks/useSpellCheck';

interface SpellCheckInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  language?: 'id' | 'en';
  disabled?: boolean;
  label?: string;
  error?: string;
  required?: boolean;
}

/**
 * SpellCheckInput - Text input/textarea with spell checking
 *
 * Features:
 * - Real-time spell checking
 * - Underlines misspelled words
 * - Click to see suggestions
 * - Add word to dictionary option
 */
export function SpellCheckInput({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 3,
  language = 'id',
  disabled = false,
  label,
  error,
  required,
}: SpellCheckInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedError, setSelectedError] = useState<SpellCheckResult | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { errors, checkText, addCustomWord, isChecking } = useSpellCheck({
    language,
    enabled: !disabled,
  });

  // Check text on value change
  useEffect(() => {
    checkText(value);
  }, [value, checkText]);

  // Handle text change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Handle word click to show suggestions
  const handleWordClick = useCallback(
    (error: SpellCheckResult, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      const containerRect = containerRef.current?.getBoundingClientRect();

      if (containerRect) {
        setSuggestionPosition({
          top: rect.bottom - containerRect.top + 4,
          left: rect.left - containerRect.left,
        });
      }

      setSelectedError(error);
      setShowSuggestions(true);
    },
    []
  );

  // Apply suggestion
  const applySuggestion = useCallback(
    (suggestion: string) => {
      if (selectedError) {
        const newValue =
          value.substring(0, selectedError.startIndex) +
          suggestion +
          value.substring(selectedError.endIndex);
        onChange(newValue);
      }
      setShowSuggestions(false);
      setSelectedError(null);
    },
    [selectedError, value, onChange]
  );

  // Add word to dictionary
  const handleAddToDictionary = useCallback(() => {
    if (selectedError) {
      addCustomWord(selectedError.word);
      checkText(value); // Re-check
    }
    setShowSuggestions(false);
    setSelectedError(null);
  }, [selectedError, addCustomWord, checkText, value]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render text with error highlights
  const renderHighlightedText = () => {
    if (!value || errors.length === 0) {
      return <span className="text-transparent">{value || placeholder}</span>;
    }

    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    errors.forEach((error, index) => {
      // Add text before error
      if (error.startIndex > lastIndex) {
        segments.push(
          <span key={`text-${index}`} className="text-transparent">
            {value.substring(lastIndex, error.startIndex)}
          </span>
        );
      }

      // Add error word with underline
      segments.push(
        <span
          key={`error-${index}`}
          className="text-transparent border-b-2 border-status-error border-wavy cursor-pointer"
          onClick={(e) => handleWordClick(error, e)}
          title="Klik untuk melihat saran"
        >
          {error.word}
        </span>
      );

      lastIndex = error.endIndex;
    });

    // Add remaining text
    if (lastIndex < value.length) {
      segments.push(
        <span key="text-end" className="text-transparent">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Highlight overlay */}
        <div
          className="absolute inset-0 p-3 pointer-events-none overflow-hidden whitespace-pre-wrap break-words font-sans text-base"
          aria-hidden="true"
        >
          {renderHighlightedText()}
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`
            w-full p-3 rounded-xl border bg-transparent relative z-10
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none font-sans text-base
            ${error ? 'border-status-error' : 'border-border'}
            ${className}
          `}
        />

        {/* Spell check indicator */}
        {isChecking && (
          <div className="absolute top-2 right-2 text-text-muted">
            <SpellCheck className="w-4 h-4 animate-pulse" />
          </div>
        )}

        {/* Error count badge */}
        {errors.length > 0 && !isChecking && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-status-error/10 text-status-error text-xs">
            <SpellCheck className="w-3 h-3" />
            {errors.length}
          </div>
        )}
      </div>

      {/* Form error message */}
      {error && <p className="mt-1 text-sm text-status-error">{error}</p>}

      {/* Suggestions popup */}
      {showSuggestions && selectedError && (
        <div
          className="absolute z-50 bg-surface-elevated border border-border rounded-xl shadow-lg p-2 min-w-[200px]"
          style={{ top: suggestionPosition.top, left: suggestionPosition.left }}
        >
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-border-subtle">
            <span className="text-sm font-medium text-text-primary">
              "{selectedError.word}"
            </span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="p-1 rounded hover:bg-surface-hover"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>

          {selectedError.suggestions.length > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-text-muted mb-1">Saran:</p>
              {selectedError.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-hover text-sm text-text-primary"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted py-2">Tidak ada saran</p>
          )}

          <div className="mt-2 pt-2 border-t border-border-subtle">
            <button
              onClick={handleAddToDictionary}
              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-hover text-sm text-primary"
            >
              + Tambah ke kamus
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SpellCheckInput;
