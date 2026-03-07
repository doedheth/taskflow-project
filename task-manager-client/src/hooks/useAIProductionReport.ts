import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiAPI } from '../services/api';

// ============================================
// Types (matching backend AIProductionReportService)
// ============================================

export interface ProductionMetricSet {
  total_scheduled_hours: number;
  actual_production_hours: number;
  planned_output: number;
  actual_output: number;
  output_achievement_rate: number;
  total_downtime_hours: number;
  planned_downtime_hours: number;
  unplanned_downtime_hours: number;
  oee_percentage: number;
  availability_rate: number;
  performance_rate: number;
  quality_rate: number;
}

export interface ProductionTrendIndicator {
  metric: string;
  change_percentage: number;
  direction: 'up' | 'down' | 'stable';
  is_positive: boolean;
}

export interface DowntimeBreakdown {
  classification: string;
  hours: number;
  percentage: number;
  count: number;
  trend: 'up' | 'down' | 'stable';
}

export interface MachinePerformance {
  machine_id: number;
  machine_name: string;
  oee: number;
  availability: number;
  output_count: number;
  downtime_hours: number;
}

export interface ProductionRecommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action_type: 'optimize_schedule' | 'reduce_changeover' | 'improve_quality' | 'maintenance_action' | 'other';
  action_data?: Record<string, unknown>;
}

export interface ProductionHighlights {
  best_performing_machines: MachinePerformance[];
  worst_performing_machines: MachinePerformance[];
  total_products_produced: number;
  defect_rate: number;
}

export interface GeneratedProductionReport {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
  executive_summary: string;
  metrics: {
    current_period: ProductionMetricSet;
    previous_period: ProductionMetricSet;
    trend: ProductionTrendIndicator[];
  };
  downtime_breakdown: DowntimeBreakdown[];
  recommendations: ProductionRecommendation[];
  production_highlights: ProductionHighlights;
}

export interface ProductionReportListItem {
  id: number;
  period_type: string;
  period_label: string;
  generated_at: string;
  generated_by: number;
}

export interface ProductionReportGenerationRequest {
  period_type: 'monthly' | 'weekly' | 'quarterly' | 'daily' | 'custom_range';
  year?: number; // Make year optional for custom_range
  month?: number;
  week?: number;
  quarter?: number;
  machine_ids?: number[];
  shift?: string;
  start_date?: string;
  end_date?: string;
}

// ============================================
// Hooks
// ============================================

/**
 * useProductionReportList - Hook for fetching list of generated production reports
 */
export function useProductionReportList(options?: {
  limit?: number;
  enabled?: boolean;
}) {
  const { limit = 12, enabled = true } = options || {};

  return useQuery<{ success: boolean; reports: ProductionReportListItem[] }>({
    queryKey: ['ai', 'production-reports', 'list', limit],
    queryFn: () => aiAPI.getProductionReports(limit),
    enabled,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * useProductionReportDetail - Hook for fetching a single production report detail
 */
export function useProductionReportDetail(reportId: number, options?: {
  enabled?: boolean;
}) {
  const { enabled = true } = options || {};

  return useQuery<{ success: boolean; report: GeneratedProductionReport }>({
    queryKey: ['ai', 'production-reports', 'detail', reportId],
    queryFn: () => aiAPI.getProductionReportDetail(reportId),
    enabled: enabled && reportId > 0,
    staleTime: 60000, // 1 minute
  });
}

/**
 * useGenerateProductionReport - Mutation hook for generating a new production report
 */
export function useGenerateProductionReport() {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; report: GeneratedProductionReport },
    Error,
    ProductionReportGenerationRequest
  >({
    mutationFn: (request: ProductionReportGenerationRequest) =>
      aiAPI.generateProductionReport(request),
    onSuccess: (data) => {
      // Invalidate reports list to refresh
      queryClient.invalidateQueries({ queryKey: ['ai', 'production-reports', 'list'] });
      // Cache the new report detail
      if (data.report) {
        queryClient.setQueryData(
          ['ai', 'production-reports', 'detail', data.report.id],
          data
        );
      }
    },
  });
}

/**
 * Combined hook for production report management
 */
export function useAIProductionReports() {
  const reportListQuery = useProductionReportList();
  const generateReportMutation = useGenerateProductionReport();

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

export default useAIProductionReports;
