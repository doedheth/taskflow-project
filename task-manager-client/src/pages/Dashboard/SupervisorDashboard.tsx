import { useState } from 'react';
import { DashboardLayout } from './DashboardLayout';
import {
  MachineStatusWidget,
  TeamWorkloadWidget,
  YesterdaySummaryWidget,
  PredictiveInsightsWidget,
  PredictionDetailModal,
} from './widgets';
import { useSupervisorDashboard } from '../../hooks/useSupervisorDashboard';
import { useRunPredictionAnalysis, type PredictionSummary } from '../../hooks/usePredictiveInsights';

/**
 * SupervisorDashboard - Dashboard for supervisors
 *
 * Widgets:
 * - Machine Status (FR7, FR8, FR9, FR10)
 * - Team Workload (FR19)
 * - Yesterday Summary (FR15, FR16)
 * - Predictive Insights (Story 7.6)
 *
 * Uses useSupervisorDashboard hook for data fetching with:
 * - 30s polling for real-time updates
 * - React Query for caching and state management
 */
export function SupervisorDashboard() {
  const { data, isLoading, isError, refetch } = useSupervisorDashboard();
  const [selectedPrediction, setSelectedPrediction] = useState<PredictionSummary | null>(null);
  const runAnalysisMutation = useRunPredictionAnalysis();

  const handleRetry = () => {
    refetch();
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
    <DashboardLayout subtitle="Pantau status mesin dan team workload">
      <MachineStatusWidget
        data={data?.machineStatus}
        machines={data?.machines}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <TeamWorkloadWidget
        data={data?.teamWorkload}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <PredictiveInsightsWidget
        onPredictionClick={handlePredictionClick}
        onRunAnalysis={handleRunAnalysis}
      />

      <YesterdaySummaryWidget
        data={data?.yesterdaySummary}
        isLoading={isLoading}
        isError={isError}
        onRetry={handleRetry}
      />

      <PredictionDetailModal
        prediction={selectedPrediction}
        isOpen={selectedPrediction !== null}
        onClose={() => setSelectedPrediction(null)}
      />
    </DashboardLayout>
  );
}

export default SupervisorDashboard;
