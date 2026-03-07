import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface PredictionSummary {
  id: number;
  machine_id: number;
  machine_name: string;
  asset_code: string;
  risk_score: number;
  predicted_failure_window: string;
  confidence_level: 'low' | 'medium' | 'high';
  reasoning: string;
  created_at: string;
}

export interface PredictionFactorBreakdown {
  daysSinceLastPM: { value: number; score: number };
  breakdownCount90Days: { value: number; score: number };
  averageMTBF: { value: number; score: number };
  machineAgeYears: { value: number; score: number };
  patternMatchScore: { value: number; score: number };
}

export interface SimilarIncident {
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

export interface Recommendation {
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  reasoning: string;
}

export interface PredictionDetail extends PredictionSummary {
  factors: PredictionFactorBreakdown;
  similar_incidents: SimilarIncident[];
  recommendations: Recommendation[];
}

export interface GetPredictionsResponse {
  success: boolean;
  predictions: PredictionSummary[];
  total_high_risk: number;
  last_analysis_at: string | null;
}

export interface PredictionAccuracy {
  total_predictions: number;
  total_feedback: number;
  accuracy_rate: number;
  breakdown_by_outcome: { outcome: string; count: number }[];
  accuracy_by_risk_level: { level: string; accuracy: number; count: number }[];
}

// ============================================
// Hooks
// ============================================

/**
 * usePredictiveInsights - Hook for fetching high-risk machine predictions
 */
export function usePredictiveInsights(options?: {
  minRiskScore?: number;
  limit?: number;
  enabled?: boolean;
  refetchInterval?: number;
}) {
  const {
    minRiskScore = 70,
    limit = 10,
    enabled = true,
    refetchInterval = 60000, // 1 minute default
  } = options || {};

  return useQuery<GetPredictionsResponse>({
    queryKey: ['predictions', 'high-risk', minRiskScore, limit],
    queryFn: () => aiAPI.getPredictions({ minRiskScore, limit }),
    enabled,
    refetchInterval,
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}

/**
 * usePredictionDetail - Hook for fetching a single prediction detail
 */
export function usePredictionDetail(predictionId: number | null) {
  return useQuery<{ success: boolean; prediction: PredictionDetail }>({
    queryKey: ['predictions', 'detail', predictionId],
    queryFn: () => aiAPI.getPredictionDetail(predictionId!),
    enabled: predictionId !== null,
    staleTime: 60000, // 1 minute
  });
}

/**
 * usePredictionFeedback - Hook for recording prediction feedback
 */
export function usePredictionFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      predictionId: number;
      actual_outcome: 'breakdown_occurred' | 'no_breakdown' | 'partial';
      occurred_at?: string;
      notes?: string;
    }) => {
      const { predictionId, ...feedbackData } = data;
      return aiAPI.recordPredictionFeedback(predictionId, feedbackData);
    },
    onSuccess: () => {
      // Invalidate predictions to refresh the list
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
}

/**
 * useRunPredictionAnalysis - Hook for running on-demand analysis
 */
export function useRunPredictionAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (machineId: number | undefined = undefined) => aiAPI.runPredictionAnalysis(machineId),
    onSuccess: () => {
      // Invalidate predictions to refresh with new analysis
      queryClient.invalidateQueries({ queryKey: ['predictions'] });
    },
  });
}

/**
 * usePredictionAccuracy - Hook for fetching accuracy statistics (admin only)
 */
export function usePredictionAccuracy(enabled: boolean = true) {
  return useQuery<{ success: boolean; accuracy: PredictionAccuracy }>({
    queryKey: ['predictions', 'accuracy'],
    queryFn: () => aiAPI.getPredictionAccuracy(),
    enabled,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get risk level label from score
 */
export function getRiskLevel(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score >= 85) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

/**
 * Get risk level color classes
 */
export function getRiskLevelColor(score: number): {
  bg: string;
  text: string;
  border: string;
} {
  const level = getRiskLevel(score);
  switch (level) {
    case 'critical':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-500',
      };
    case 'high':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-500',
      };
    default:
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-500',
      };
  }
}

/**
 * Get confidence level label in Indonesian
 */
export function getConfidenceLabel(level: 'low' | 'medium' | 'high'): string {
  switch (level) {
    case 'high':
      return 'Tinggi';
    case 'medium':
      return 'Sedang';
    case 'low':
      return 'Rendah';
    default:
      return level;
  }
}

export default usePredictiveInsights;
