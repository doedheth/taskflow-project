import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../services/api';

// ============================================
// Types
// ============================================

export interface MetricSet {
  total_work_orders: number;
  completed_work_orders: number;
  pm_compliance_rate: number;
  mttr_hours: number;
  mtbf_hours: number;
  downtime_hours: number;
  breakdown_count: number;
}

export interface TrendIndicator {
  metric: string;
  change_percentage: number;
  direction: 'up' | 'down' | 'stable';
  is_positive: boolean;
}

export interface TopIssue {
  issue: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_type: 'create_wo' | 'update_pm' | 'review_asset' | 'other';
  action_data?: Record<string, unknown>;
}

export interface TeamMember {
  user_id: number;
  user_name: string;
  completion_count: number;
  completion_rate: number;
}

export interface TeamHighlights {
  top_performers: TeamMember[];
  completion_rate: number;
  average_response_time: string;
}

export interface GeneratedReport {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
  executive_summary: string;
  metrics: {
    current_period: MetricSet;
    previous_period: MetricSet;
    trend: TrendIndicator[];
  };
  top_issues: TopIssue[];
  recommendations: ReportRecommendation[];
  team_highlights: TeamHighlights;
}

export interface ReportListItem {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
}

export interface ReportGenerationRequest {
  period_type: 'monthly' | 'weekly' | 'quarterly';
  year: number;
  month?: number;
  week?: number;
  quarter?: number;
}

// ============================================
// Hooks
// ============================================

/**
 * useReportList - Hook for fetching list of generated reports
 */
export function useReportList(options?: {
  limit?: number;
  enabled?: boolean;
}) {
  const { limit = 12, enabled = true } = options || {};

  return useQuery<{ success: boolean; reports: ReportListItem[] }>({
    queryKey: ['ai', 'reports', 'list', limit],
    queryFn: () => aiAPI.getReports(limit),
    enabled,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * useReportDetail - Hook for fetching a single report detail
 */
export function useReportDetail(reportId: number, options?: {
  enabled?: boolean;
}) {
  const { enabled = true } = options || {};

  return useQuery<{ success: boolean; report: GeneratedReport }>({
    queryKey: ['ai', 'reports', 'detail', reportId],
    queryFn: () => aiAPI.getReportDetail(reportId),
    enabled: enabled && reportId > 0,
    staleTime: 60000, // 1 minute
  });
}

/**
 * useGenerateReport - Mutation hook for generating a new report
 */
export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; report: GeneratedReport },
    Error,
    ReportGenerationRequest
  >({
    mutationFn: (request: ReportGenerationRequest) =>
      aiAPI.generateReport(request),
    onSuccess: (data) => {
      // Invalidate reports list to refresh
      queryClient.invalidateQueries({ queryKey: ['ai', 'reports', 'list'] });
      // Cache the new report detail
      if (data.report) {
        queryClient.setQueryData(
          ['ai', 'reports', 'detail', data.report.id],
          data
        );
      }
    },
  });
}

/**
 * Combined hook for report management
 */
export function useAIReports() {
  const reportListQuery = useReportList();
  const generateReportMutation = useGenerateReport();

  return {
    // Report list
    reports: reportListQuery.data?.reports || [],
    isLoadingList: reportListQuery.isLoading,
    listError: reportListQuery.error,
    refetchList: reportListQuery.refetch,

    // Generate report
    generateReport: generateReportMutation.mutateAsync,
    isGenerating: generateReportMutation.isPending,
    generatedReport: generateReportMutation.data?.report || null,
    generateError: generateReportMutation.error,
    resetGeneration: generateReportMutation.reset,
  };
}

export default useAIReports;
