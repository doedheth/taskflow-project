import { useState, useCallback, useEffect, useRef } from 'react';
import { SpellCheck, AlertCircle, ChevronDown } from 'lucide-react';
import { useSpellCheck, type SpellCheckResult } from '../hooks/useSpellCheck';

interface SpellCheckTextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  language?: 'id' | 'en';
  label?: string;
  error?: string;
  helperText?: string;
}

/**
 * SpellCheckTextarea - Simple textarea with spell check status bar
 *
 * Shows spell check errors in a dropdown rather than inline highlights.
 * More compatible with existing form styles.
 */
export function SpellCheckTextarea({
  value,
  onChange,
  language = 'id',
  label,
  error,
  helperText,
  className = '',
  ...props
}: SpellCheckTextareaProps) {
  const [showErrors, setShowErrors] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { errors, checkText, addCustomWord, isChecking } = useSpellCheck({
    language,
    enabled: !props.disabled,
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

  // Apply correction
  const applyCorrection = useCallback(
    (error: SpellCheckResult, suggestion: string) => {
      const newValue =
        value.substring(0, error.startIndex) +
        suggestion +
        value.substring(error.endIndex);
      onChange(newValue);
    },
    [value, onChange]
  );

  // Add to dictionary
  const handleAddToDictionary = useCallback(
    (word: string) => {
      addCustomWord(word);
      checkText(value);
    },
    [addCustomWord, checkText, value]
  );

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowErrors(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
          {props.required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <textarea
          value={value}
          onChange={handleChange}
          className={`
            w-full p-3 rounded-xl border bg-surface
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-status-error' : 'border-border'}
            ${className}
          `}
          {...props}
        />
      </div>

      {/* Spell check status bar */}
      {value && (
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isChecking ? (
              <span className="flex items-center gap-1 text-text-muted">
                <SpellCheck className="w-3 h-3 animate-pulse" />
                Memeriksa...
              </span>
            ) : errors.length > 0 ? (
              <button
                type="button"
                onClick={() => setShowErrors(!showErrors)}
                className="flex items-center gap-1 text-status-warning hover:text-status-warning/80"
              >
                <AlertCircle className="w-3 h-3" />
                {errors.length} kata perlu diperiksa
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    showErrors ? 'rotate-180' : ''
                  }`}
                />
              </button>
            ) : (
              <span className="flex items-center gap-1 text-status-success">
                <SpellCheck className="w-3 h-3" />
                Ejaan OK
              </span>
            )}
          </div>

          <span className="text-text-muted">
            {language === 'id' ? 'Indonesia' : 'English'}
          </span>
        </div>
      )}

      {/* Errors dropdown */}
      {showErrors && errors.length > 0 && (
        <div className="bg-surface-elevated border border-border rounded-xl shadow-lg p-3 space-y-2 max-h-[200px] overflow-y-auto">
          {errors.map((err, index) => (
            <div
              key={`${err.word}-${index}`}
              className="flex items-start justify-between gap-2 p-2 rounded-lg bg-surface"
            >
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-status-warning">
                  "{err.word}"
                </span>
                {err.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {err.suggestions.slice(0, 3).map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applyCorrection(err, suggestion)}
                        className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs hover:bg-primary/20"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleAddToDictionary(err.word)}
                className="text-xs text-text-muted hover:text-text-primary whitespace-nowrap"
              >
                Abaikan
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper/Error text */}
      {error && <p className="text-sm text-status-error">{error}</p>}
      {helperText && !error && (
        <p className="text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}

export default SpellCheckTextarea;
