import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import {
  KPISummaryWidget,
  TeamPerformanceWidget,
  AlertsWidget,
  PredictiveInsightsWidget,
  PredictionDetailModal,
} from './widgets';
import { useManagerDashboard } from '../../hooks/useManagerDashboard';
import type { Alert } from '../../hooks/useManagerDashboard';
import { useRunPredictionAnalysis, type PredictionSummary } from '../../hooks/usePredictiveInsights';

/**
 * ManagerDashboard - Executive dashboard for managers

/**
 * ManagerDashboard - Executive dashboard for managers
 *
 * Widgets:
 * - KPI Summary (FR17)
 * - Team Performance (FR18)
 * - Critical Alerts (FR20, FR21, FR22)
 * - Predictive Insights (Story 7.6)
 *
 * Uses useManagerDashboard hook for data fetching with:
 * - 60s polling for executive view
 * - React Query for caching and state management
 */
export function ManagerDashboard() {
  const { data, isLoading, isError, refetch } = useManagerDashboard();
  const navigate = useNavigate();

  const [selectedPrediction, setSelectedPrediction] = useState<PredictionSummary | null>(null);
  const runAnalysisMutation = useRunPredictionAnalysis();

  const handleRetry = () => {
    refetch();
  };

  const handleAlertClick = (alert: Alert) => {
    if (alert.type === 'machine_down' && alert.related_id) {
      navigate(`/assets/${alert.related_id}`);
    } else if (alert.type === 'overdue_pm') {
      navigate('/maintenance-calendar');
    } else if (alert.type === 'high_priority_wo' && alert.related_id) {
      navigate(`/work-orders/${alert.related_id}`);
    }
  };

  const handlePredictionClick = (prediction: PredictionSummary) => {
    setSelectedPrediction(prediction);
  };

  const handleRunAnalysis = async () => {
    try {
      await runAnalysisMutation.mutateAsync(undefined);
    } catch (error) {
      console.error('Failed to run analysis:', error);
    }
  };

  return (
    <DashboardLayout subtitle="KPI summary dan team performance">
      <KPISummaryWidget
        data={data?.kpiSummary}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <TeamPerformanceWidget
        data={data?.teamPerformance}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <PredictiveInsightsWidget
        onPredictionClick={handlePredictionClick}
        onRunAnalysis={handleRunAnalysis}
      />

      <AlertsWidget
        data={data?.alerts}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
        onAlertClick={handleAlertClick}
      />

      <PredictionDetailModal
        prediction={selectedPrediction}
        isOpen={selectedPrediction !== null}
        onClose={() => setSelectedPrediction(null)}
      />
    </DashboardLayout>
  );
}

export default ManagerDashboard;
