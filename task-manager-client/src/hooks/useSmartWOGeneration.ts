import { useState } from 'react';
import { aiAPI } from '../services/api';

interface GeneratedWOFields {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  wo_type: 'preventive' | 'corrective' | 'emergency';
  estimated_duration: number;
  category?: string;
}

interface TechnicianSuggestion {
  userId: number;
  userName: string;
  matchScore: number;
  reason: string;
}

interface SimilarWO {
  id: number;
  wo_number: string;
  title: string;
  asset_name: string;
  similarity_reason: string;
  root_cause?: string;
  solution?: string;
}

interface GenerateWOResponse {
  success: boolean;
  generated: GeneratedWOFields;
  technicianSuggestion?: TechnicianSuggestion;
  similarWOs: SimilarWO[];
  aiIndicator: string;
  error?: string;
  warning?: string;
}

interface UseSmartWOGenerationOptions {
  onSuccess?: (response: GenerateWOResponse) => void;
  onError?: (error: string) => void;
}

/**
 * useSmartWOGeneration - Hook for AI-powered Work Order generation
 */
export function useSmartWOGeneration(options: UseSmartWOGenerationOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<GenerateWOResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = async (
    description: string,
    assetId?: number,
    woType?: 'preventive' | 'corrective' | 'emergency'
  ) => {
    if (!description || description.trim().length < 3) {
      setError('Deskripsi minimal 3 karakter');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response: GenerateWOResponse = await aiAPI.generateWO({
        description: description.trim(),
        asset_id: assetId,
        wo_type: woType,
      });

      if (response.success) {
        setSuggestion(response);
        options.onSuccess?.(response);
      } else {
        const errorMsg = response.error || 'Gagal generate work order';
        setError(errorMsg);
        options.onError?.(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'Gagal terhubung ke AI service';
      setError(errorMsg);
      options.onError?.(errorMsg);
      console.error('SmartWO generation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setSuggestion(null);
    setError(null);
  };

  return {
    generate,
    regenerate: generate,
    clear,
    isLoading,
    suggestion,
    error,
  };
}

export default useSmartWOGeneration;
