import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface AIFeatureUsage {
  feature: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  avgResponseTime: number;
  successRate: number;
}

export interface AIDailyUsage {
  date: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
}

export interface AICostSummary {
  todayCost: number;
  weekCost: number;
  monthCost: number;
  todayTokens: number;
  weekTokens: number;
  monthTokens: number;
}

export interface AITopUser {
  userId: number;
  userName: string;
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
}

export interface AIPerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  successRate: number;
  errorRate: number;
  totalCalls: number;
}

export interface AIError {
  id: number;
  userId: number;
  userName: string;
  feature: string;
  model: string;
  errorMessage: string;
  createdAt: string;
}

export interface AIFeatureToggle {
  feature: string;
  role: string;
  enabled: boolean;
}

export interface AIAdminStats {
  byFeature: AIFeatureUsage[];
  dailyUsage: AIDailyUsage[];
  costSummary: AICostSummary;
  topUsers: AITopUser[];
}

// ============================================
// Hooks
// ============================================

/**
 * useAIAdminStats - Get comprehensive AI usage statistics
 */
export function useAIAdminStats(days: number = 30) {
  return useQuery<{ success: boolean; data: AIAdminStats }>({
    queryKey: ['ai', 'admin', 'stats', days],
    queryFn: () => aiAPI.getAdminStats(days),
    staleTime: 60000, // 1 minute
  });
}

/**
 * useAIDailyStats - Get daily AI usage statistics
 */
export function useAIDailyStats(days: number = 30) {
  return useQuery<{ success: boolean; data: AIDailyUsage[] }>({
    queryKey: ['ai', 'admin', 'stats', 'daily', days],
    queryFn: () => aiAPI.getAdminDailyStats(days),
    staleTime: 60000,
  });
}

/**
 * useAIFeatureStats - Get usage breakdown by feature
 */
export function useAIFeatureStats(days: number = 30) {
  return useQuery<{ success: boolean; data: AIFeatureUsage[] }>({
    queryKey: ['ai', 'admin', 'stats', 'by-feature', days],
    queryFn: () => aiAPI.getAdminFeatureStats(days),
    staleTime: 60000,
  });
}

/**
 * useAIPerformanceMetrics - Get AI performance metrics
 */
export function useAIPerformanceMetrics() {
  return useQuery<{ success: boolean; data: AIPerformanceMetrics }>({
    queryKey: ['ai', 'admin', 'metrics'],
    queryFn: () => aiAPI.getAdminMetrics(),
    staleTime: 30000, // 30 seconds
  });
}

/**
 * useAICostSummary - Get AI cost summary
 */
export function useAICostSummary() {
  return useQuery<{ success: boolean; data: AICostSummary }>({
    queryKey: ['ai', 'admin', 'cost-summary'],
    queryFn: () => aiAPI.getAdminCostSummary(),
    staleTime: 60000,
  });
}

/**
 * useAIErrors - Get recent AI errors
 */
export function useAIErrors(limit: number = 20) {
  return useQuery<{ success: boolean; data: AIError[] }>({
    queryKey: ['ai', 'admin', 'errors', limit],
    queryFn: () => aiAPI.getAdminErrors(limit),
    staleTime: 30000,
  });
}

/**
 * useAIFeatureToggles - Get all feature toggles
 */
export function useAIFeatureToggles() {
  return useQuery<{ success: boolean; data: { features: string[]; toggles: AIFeatureToggle[] } }>({
    queryKey: ['ai', 'admin', 'feature-toggles'],
    queryFn: () => aiAPI.getFeatureToggles(),
    staleTime: 60000,
  });
}

/**
 * useUpdateFeatureToggles - Update feature toggles
 */
export function useUpdateFeatureToggles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ feature: string; role: string; enabled: boolean }>) =>
      aiAPI.updateFeatureToggles(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'admin', 'feature-toggles'] });
    },
  });
}

/**
 * useAISettings - Get AI settings
 */
export function useAISettings() {
  return useQuery<{ success: boolean; data: Record<string, string> }>({
    queryKey: ['ai', 'settings'],
    queryFn: () => aiAPI.getSettings(),
    staleTime: 60000,
  });
}

/**
 * useUpdateAISettings - Update AI settings
 */
export function useUpdateAISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Record<string, string>) => aiAPI.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'settings'] });
    },
  });
}

/**
 * useAIFeatureAvailability - Get feature availability for current user
 */
export function useAIFeatureAvailability() {
  return useQuery<{ success: boolean; data: Record<string, boolean> }>({
    queryKey: ['ai', 'feature-availability'],
    queryFn: () => aiAPI.getFeatureAvailability(),
    staleTime: 300000, // 5 minutes
  });
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get feature display name in Indonesian
 */
export function getFeatureDisplayName(feature: string): string {
  const displayNames: Record<string, string> = {
    chatbot: 'AI Chatbot',
    smart_wo: 'Smart Work Order',
    duplicate_detection: 'Deteksi Duplikat',
    task_prioritization: 'Prioritas Tugas AI',
    predictive_maintenance: 'Predictive Maintenance',
    report_generation: 'Report AI',
    root_cause_analysis: 'Root Cause Analysis',
    writing_assistant: 'Writing Assistant',
    pm_suggestion: 'PM Suggestion',
  };
  return displayNames[feature] || feature;
}

/**
 * Get role display name in Indonesian
 */
export function getRoleDisplayName(role: string): string {
  const displayNames: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    supervisor: 'Supervisor',
    technician: 'Teknisi',
    operator: 'Operator',
    member: 'Member',
  };
  return displayNames[role] || role;
}

/**
 * Format cost in USD
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`;
}

/**
 * Format large numbers
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export default useAIAdminStats;
