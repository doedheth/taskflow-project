import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface SymptomEvent {
  date: string;
  event_type: 'warning' | 'breakdown' | 'repair' | 'pm';
  description: string;
}

export interface ContributingFactor {
  factor: string;
  weight: number;
  evidence: string;
}

export interface RCASimilarIncident {
  breakdown_id: number;
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

export interface RCARecommendation {
  id: string;
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  reasoning: string;
  action_type: 'create_wo' | 'update_pm' | 'review_asset' | 'training' | 'other';
  action_data?: {
    wo_type?: string;
    wo_title?: string;
    pm_schedule_id?: number;
    asset_id?: number;
  };
}

export interface RCAAnalysis {
  id: number;
  breakdown_id?: number;
  machine_id: number;
  machine_name: string;
  probable_root_cause: string;
  confidence_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  reasoning: {
    summary: string;
    symptom_progression: SymptomEvent[];
    contributing_factors: ContributingFactor[];
    historical_comparison: string;
  };
  similar_incidents: RCASimilarIncident[];
  recommendations: RCARecommendation[];
  analysis_metadata: {
    data_points_analyzed: number;
    breakdown_count: number;
    time_span_days: number;
  };
  created_at: string;
}

export interface RCASummary {
  id: number;
  machine_id: number;
  machine_name: string;
  probable_root_cause: string;
  confidence_level: 'low' | 'medium' | 'high';
  confidence_score: number;
  created_at: string;
}

export interface GetMachineRCAsResponse {
  success: boolean;
  analyses: RCASummary[];
  recurring_issues: string[];
}

export interface RCAAccuracy {
  total_analyses: number;
  total_feedback: number;
  accuracy_rate: number;
  feedback_breakdown: { type: string; count: number }[];
}

// ============================================
// Hooks
// ============================================

/**
 * useRootCauseAnalysis - Hook for performing RCA analysis
 */
export function useRootCauseAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      machine_id: number;
      breakdown_id?: number;
      lookback_days?: number;
    }) => aiAPI.analyzeRootCause(data),
    onSuccess: (_, variables) => {
      // Invalidate machine RCAs to refresh the list
      queryClient.invalidateQueries({ queryKey: ['rca', 'machine', variables.machine_id] });
      queryClient.invalidateQueries({ queryKey: ['rca', 'accuracy'] });
    },
  });
}

/**
 * useRCADetail - Hook for fetching a single RCA analysis detail
 */
export function useRCADetail(analysisId: number | null) {
  return useQuery<{ success: boolean; analysis: RCAAnalysis }>({
    queryKey: ['rca', 'detail', analysisId],
    queryFn: () => aiAPI.getRCADetail(analysisId!),
    enabled: analysisId !== null,
    staleTime: 60000, // 1 minute
  });
}

/**
 * useMachineRCAs - Hook for fetching RCA analyses for a machine
 */
export function useMachineRCAs(machineId: number | null, limit: number = 10) {
  return useQuery<GetMachineRCAsResponse>({
    queryKey: ['rca', 'machine', machineId, limit],
    queryFn: () => aiAPI.getMachineRCAs(machineId!, limit),
    enabled: machineId !== null,
    staleTime: 60000, // 1 minute
  });
}

/**
 * useRCAFeedback - Hook for recording RCA feedback
 */
export function useRCAFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      analysisId: number;
      feedback_type: 'accurate' | 'inaccurate' | 'partial';
      actual_root_cause?: string;
      notes?: string;
    }) => {
      const { analysisId, ...feedbackData } = data;
      return aiAPI.recordRCAFeedback(analysisId, feedbackData);
    },
    onSuccess: () => {
      // Invalidate RCA queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['rca'] });
    },
  });
}

/**
 * useRCAAccuracy - Hook for fetching accuracy statistics (admin only)
 */
export function useRCAAccuracy(enabled: boolean = true) {
  return useQuery<{ success: boolean; data: RCAAccuracy }>({
    queryKey: ['rca', 'accuracy'],
    queryFn: () => aiAPI.getRCAAccuracy(),
    enabled,
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Utility Functions
// ============================================

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

/**
 * Get confidence level color classes
 */
export function getConfidenceColor(level: 'low' | 'medium' | 'high'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-500',
      };
    case 'medium':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-500',
      };
    case 'low':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-500',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-500',
      };
  }
}

/**
 * Get priority label in Indonesian
 */
export function getPriorityLabel(priority: 'immediate' | 'short_term' | 'long_term'): string {
  switch (priority) {
    case 'immediate':
      return 'Segera';
    case 'short_term':
      return 'Jangka Pendek';
    case 'long_term':
      return 'Jangka Panjang';
    default:
      return priority;
  }
}

/**
 * Get priority color classes
 */
export function getPriorityColor(priority: 'immediate' | 'short_term' | 'long_term'): {
  bg: string;
  text: string;
  border: string;
} {
  switch (priority) {
    case 'immediate':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-500',
      };
    case 'short_term':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-500',
      };
    case 'long_term':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-500',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-500',
      };
  }
}

export default useRootCauseAnalysis;
