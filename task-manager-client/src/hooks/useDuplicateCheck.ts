import { useState, useCallback, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';

interface SimilarEntry {
  id: number;
  title: string;
  similarity_score: number;
  status: string;
  created_at: string;
  entity_type: 'ticket' | 'wo';
  entity_number?: string;
}

interface CheckDuplicateResponse {
  success: boolean;
  hasDuplicates: boolean;
  similar: SimilarEntry[];
  suggestion?: string;
  warning?: string;
}

interface UseDuplicateCheckOptions {
  debounceMs?: number;
  minLength?: number;
  onDuplicatesFound?: (similar: SimilarEntry[]) => void;
  onError?: (error: string) => void;
}

/**
 * useDuplicateCheck - Hook for checking potential duplicate tickets/WOs
 */
export function useDuplicateCheck(
  entityType: 'ticket' | 'wo',
  options: UseDuplicateCheckOptions = {}
) {
  const {
    debounceMs = 500,
    minLength = 20,
    onDuplicatesFound,
    onError,
  } = options;

  const [isChecking, setIsChecking] = useState(false);
  const [hasDuplicates, setHasDuplicates] = useState(false);
  const [similarEntries, setSimilarEntries] = useState<SimilarEntry[]>([]);
  const [suggestion, setSuggestion] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTextRef = useRef<string>('');

  // Perform the duplicate check
  const performCheck = useCallback(async (
    text: string,
    assetId?: number,
    excludeId?: number
  ) => {
    if (text.length < minLength) {
      setHasDuplicates(false);
      setSimilarEntries([]);
      setSuggestion(undefined);
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response: CheckDuplicateResponse = await aiAPI.checkDuplicate({
        text,
        type: entityType,
        asset_id: assetId,
        exclude_id: excludeId,
      });

      if (response.success) {
        setHasDuplicates(response.hasDuplicates);
        setSimilarEntries(response.similar);
        setSuggestion(response.suggestion);

        if (response.hasDuplicates && onDuplicatesFound) {
          onDuplicatesFound(response.similar);
        }

        if (response.warning) {
          setError(response.warning);
        }
      } else {
        setHasDuplicates(false);
        setSimilarEntries([]);
      }
    } catch (err) {
      const errorMsg = 'Gagal memeriksa duplikat';
      setError(errorMsg);
      onError?.(errorMsg);
      console.error('Duplicate check error:', err);
    } finally {
      setIsChecking(false);
    }
  }, [entityType, minLength, onDuplicatesFound, onError]);

  // Debounced check function
  const checkDuplicate = useCallback((
    text: string,
    assetId?: number,
    excludeId?: number
  ) => {
    // Clear any pending timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Reset dismissed state when text changes significantly
    if (text !== lastTextRef.current) {
      const textDiff = Math.abs(text.length - lastTextRef.current.length);
      if (textDiff > 5) {
        setIsDismissed(false);
      }
    }
    lastTextRef.current = text;

    // Don't check if too short
    if (text.length < minLength) {
      setHasDuplicates(false);
      setSimilarEntries([]);
      setSuggestion(undefined);
      return;
    }

    // Schedule the check
    debounceTimerRef.current = setTimeout(() => {
      performCheck(text, assetId, excludeId);
    }, debounceMs);
  }, [debounceMs, minLength, performCheck]);

  // Dismiss the warning
  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setHasDuplicates(false);
    setSimilarEntries([]);
    setSuggestion(undefined);
    setError(null);
    setIsDismissed(false);
    lastTextRef.current = '';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    checkDuplicate,
    isChecking,
    hasDuplicates: hasDuplicates && !isDismissed,
    similarEntries,
    suggestion,
    error,
    dismiss,
    reset,
    isDismissed,
  };
}

export default useDuplicateCheck;
