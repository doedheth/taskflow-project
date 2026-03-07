import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================
// Types
// ============================================

export interface SpellCheckResult {
  word: string;
  startIndex: number;
  endIndex: number;
  suggestions: string[];
}

export interface UseSpellCheckOptions {
  language?: 'id' | 'en';
  enabled?: boolean;
  debounceMs?: number;
}

// ============================================
// Indonesian Common Words Dictionary
// ============================================

// Common Indonesian words for maintenance/work order context
const INDONESIAN_WORDS = new Set([
  // Common words
  'dan', 'atau', 'yang', 'untuk', 'dengan', 'pada', 'dari', 'ini', 'itu',
  'adalah', 'akan', 'sudah', 'belum', 'tidak', 'bisa', 'harus', 'perlu',
  'ada', 'jika', 'maka', 'karena', 'agar', 'supaya', 'sehingga', 'oleh',
  'ke', 'di', 'se', 'ter', 'ber', 'me', 'pe', 'kan', 'an', 'nya',

  // Maintenance context
  'mesin', 'motor', 'pompa', 'valve', 'bearing', 'seal', 'gasket', 'filter',
  'oli', 'minyak', 'pelumas', 'grease', 'baut', 'mur', 'pipa', 'selang',
  'kabel', 'listrik', 'elektrik', 'hidrolik', 'pneumatik', 'sensor',
  'komponen', 'spare', 'part', 'suku', 'cadang', 'alat', 'peralatan',

  // Actions
  'ganti', 'mengganti', 'periksa', 'memeriksa', 'cek', 'mengecek',
  'perbaiki', 'memperbaiki', 'bersihkan', 'membersihkan', 'lumasi',
  'kencangkan', 'longgarkan', 'pasang', 'memasang', 'lepas', 'melepas',
  'setting', 'adjust', 'kalibrasi', 'inspeksi', 'maintenance', 'overhaul',

  // Status
  'rusak', 'bocor', 'aus', 'patah', 'retak', 'kendor', 'macet', 'bunyi',
  'panas', 'dingin', 'getaran', 'vibrasi', 'normal', 'abnormal',
  'operasional', 'breakdown', 'down', 'berjalan', 'berhenti', 'mati',

  // Time
  'hari', 'minggu', 'bulan', 'tahun', 'jam', 'menit', 'detik',
  'pagi', 'siang', 'sore', 'malam', 'kemarin', 'besok', 'sekarang',

  // Numbers
  'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan',
  'sembilan', 'sepuluh', 'puluh', 'ratus', 'ribu', 'juta',

  // Locations
  'area', 'zona', 'lantai', 'gedung', 'ruang', 'gudang', 'workshop',
  'produksi', 'pabrik', 'line', 'stasiun', 'pos', 'titik',

  // People
  'teknisi', 'operator', 'supervisor', 'manager', 'admin', 'user',
  'tim', 'team', 'shift', 'regu', 'petugas', 'staff',

  // Priority/Status
  'urgent', 'prioritas', 'tinggi', 'rendah', 'sedang', 'kritis',
  'selesai', 'pending', 'proses', 'ditunda', 'dibatalkan',

  // Common technical terms
  'rpm', 'bar', 'psi', 'volt', 'ampere', 'watt', 'kg', 'mm', 'cm', 'm',
  'liter', 'ml', 'derajat', 'celsius', 'fahrenheit',
]);

// English common words for technical context
const ENGLISH_WORDS = new Set([
  // Common
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where', 'why',
  'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'not', 'only', 'same', 'so', 'than', 'too',
  'very', 'just', 'also', 'now', 'here', 'there', 'this', 'that',

  // Technical
  'check', 'replace', 'repair', 'fix', 'clean', 'inspect', 'test',
  'install', 'remove', 'adjust', 'calibrate', 'lubricate', 'tighten',
  'loosen', 'start', 'stop', 'run', 'operate', 'maintain', 'service',
  'machine', 'motor', 'pump', 'valve', 'bearing', 'seal', 'filter',
  'oil', 'grease', 'bolt', 'nut', 'pipe', 'hose', 'cable', 'wire',
  'sensor', 'switch', 'button', 'panel', 'control', 'system',
  'pressure', 'temperature', 'speed', 'flow', 'level', 'voltage',
  'current', 'power', 'frequency', 'vibration', 'noise', 'leak',
  'wear', 'damage', 'failure', 'fault', 'error', 'alarm', 'warning',
  'normal', 'abnormal', 'ok', 'good', 'bad', 'high', 'low', 'medium',
  'critical', 'urgent', 'priority', 'status', 'complete', 'pending',
  'progress', 'done', 'open', 'closed', 'cancelled', 'hold',
]);

// ============================================
// Hook Implementation
// ============================================

export function useSpellCheck(options: UseSpellCheckOptions = {}) {
  const { language = 'id', enabled = true, debounceMs = 300 } = options;

  const [errors, setErrors] = useState<SpellCheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customWordsRef = useRef<Set<string>>(new Set());

  // Get the appropriate dictionary
  const getDictionary = useCallback(() => {
    const baseDictionary = language === 'id' ? INDONESIAN_WORDS : ENGLISH_WORDS;
    return new Set([...baseDictionary, ...customWordsRef.current]);
  }, [language]);

  // Check if a word is spelled correctly
  const isWordCorrect = useCallback((word: string): boolean => {
    const dictionary = getDictionary();
    const normalizedWord = word.toLowerCase().trim();

    // Skip checking for:
    // - Empty strings
    // - Single characters
    // - Numbers
    // - Words starting with @ or # (mentions/hashtags)
    // - URLs
    // - Email addresses
    if (
      !normalizedWord ||
      normalizedWord.length <= 1 ||
      /^\d+$/.test(normalizedWord) ||
      /^[@#]/.test(normalizedWord) ||
      /^https?:\/\//.test(normalizedWord) ||
      /@.*\./.test(normalizedWord)
    ) {
      return true;
    }

    return dictionary.has(normalizedWord);
  }, [getDictionary]);

  // Get suggestions for a misspelled word
  const getSuggestions = useCallback((word: string): string[] => {
    const dictionary = getDictionary();
    const normalizedWord = word.toLowerCase();
    const suggestions: string[] = [];

    // Simple Levenshtein-based suggestions
    dictionary.forEach((dictWord) => {
      if (Math.abs(dictWord.length - normalizedWord.length) <= 2) {
        const distance = levenshteinDistance(normalizedWord, dictWord);
        if (distance <= 2) {
          suggestions.push(dictWord);
        }
      }
    });

    return suggestions.slice(0, 5);
  }, [getDictionary]);

  // Check text for spelling errors
  const checkText = useCallback((text: string): SpellCheckResult[] => {
    if (!enabled || !text) return [];

    const results: SpellCheckResult[] = [];
    // Match words (including Indonesian characters)
    const wordRegex = /[a-zA-Z\u00C0-\u024F]+/g;
    let match;

    while ((match = wordRegex.exec(text)) !== null) {
      const word = match[0];
      if (!isWordCorrect(word)) {
        results.push({
          word,
          startIndex: match.index,
          endIndex: match.index + word.length,
          suggestions: getSuggestions(word),
        });
      }
    }

    return results;
  }, [enabled, isWordCorrect, getSuggestions]);

  // Debounced check function
  const debouncedCheck = useCallback((text: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsChecking(true);

    timeoutRef.current = setTimeout(() => {
      const results = checkText(text);
      setErrors(results);
      setIsChecking(false);
    }, debounceMs);
  }, [checkText, debounceMs]);

  // Add custom word to dictionary
  const addCustomWord = useCallback((word: string) => {
    customWordsRef.current.add(word.toLowerCase());
    // Re-trigger check if needed
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    errors,
    isChecking,
    checkText: debouncedCheck,
    addCustomWord,
    clearErrors,
    isWordCorrect,
    getSuggestions,
  };
}

// ============================================
// Utility Functions
// ============================================

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export default useSpellCheck;
