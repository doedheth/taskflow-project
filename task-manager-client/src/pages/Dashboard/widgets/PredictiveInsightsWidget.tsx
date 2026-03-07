import { useState } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  TrendingUp,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { WidgetCard } from './WidgetCard';
import { WidgetSkeleton } from './WidgetSkeleton';
import { WidgetError } from './WidgetError';
import {
  usePredictiveInsights,
  getRiskLevel,
  getRiskLevelColor,
  getConfidenceLabel,
  type PredictionSummary
} from '../../../hooks/usePredictiveInsights';

interface PredictiveInsightsWidgetProps {
  onPredictionClick?: (prediction: PredictionSummary) => void;
  onRunAnalysis?: () => void;
  minRiskScore?: number;
  limit?: number;
}

/**
 * PredictiveInsightsWidget - Shows AI-powered predictive maintenance insights
 *
 * Features:
 * - Displays high-risk machines based on AI analysis
 * - Risk score with color-coded severity
 * - Predicted failure window
 * - Confidence level indicator
 * - Click to view detailed prediction
 *
 * Story 7.6: Create Predictive Maintenance Analysis
 */
export function PredictiveInsightsWidget({
  onPredictionClick,
  onRunAnalysis,
  minRiskScore = 70,
  limit = 5,
}: PredictiveInsightsWidgetProps) {
  const { data, isLoading, isError, refetch, isFetching } = usePredictiveInsights({
    minRiskScore,
    limit,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <WidgetSkeleton lines={4} hasHeader />;
  }

  if (isError) {
    return (
      <WidgetError
        title="Gagal Memuat Prediksi"
        message="Tidak dapat memuat data prediktif maintenance"
        onRetry={handleRefresh}
      />
    );
  }

  const predictions = data?.predictions || [];
  const lastAnalysisAt = data?.last_analysis_at;

  // Format last analysis time
  const formatLastAnalysis = (dateStr: string | null) => {
    if (!dateStr) return 'Belum pernah dianalisis';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Baru saja';
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} hari yang lalu`;
  };

  // Empty state
  if (predictions.length === 0) {
    return (
      <WidgetCard
        title="Predictive Insights"
        subtitle="AI Maintenance Analysis"
        action={
          <button
            onClick={onRunAnalysis}
            className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
            title="Jalankan analisis"
          >
            <RefreshCw className="w-4 h-4 text-text-muted" />
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center py-8 text-status-success">
          <TrendingUp className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">Semua mesin dalam kondisi baik</p>
          <p className="text-xs text-text-muted mt-1">
            Tidak ada risiko tinggi terdeteksi
          </p>
          {lastAnalysisAt && (
            <p className="text-xs text-text-muted mt-2">
              Analisis terakhir: {formatLastAnalysis(lastAnalysisAt)}
            </p>
          )}
        </div>
      </WidgetCard>
    );
  }

  // Count by risk level
  const criticalCount = predictions.filter(p => getRiskLevel(p.risk_score) === 'critical').length;
  const highCount = predictions.filter(p => getRiskLevel(p.risk_score) === 'high').length;

  return (
    <WidgetCard
      title="Predictive Insights"
      subtitle={
        criticalCount > 0
          ? `${criticalCount} kritikal, ${highCount} tinggi`
          : `${highCount} risiko tinggi`
      }
      action={
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || isFetching}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
          title="Refresh prediksi"
        >
          <RefreshCw className={`w-4 h-4 text-text-muted ${(isRefreshing || isFetching) ? 'animate-spin' : ''}`} />
        </button>
      }
    >
      <div className="space-y-2 max-h-[350px] overflow-y-auto">
        {predictions.map((prediction) => {
          const riskLevel = getRiskLevel(prediction.risk_score);
          const colors = getRiskLevelColor(prediction.risk_score);

          return (
            <button
              key={prediction.id}
              onClick={() => onPredictionClick?.(prediction)}
              className={`w-full p-3 rounded-xl border transition-all text-left hover:scale-[1.01] ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-start gap-3">
                {/* Machine Icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                  <Cpu className={`w-5 h-5 ${colors.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {riskLevel === 'critical' && (
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
                    )}
                    <span className="font-medium text-text-primary text-sm truncate">
                      {prediction.machine_name}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted mb-1">
                    {prediction.asset_code}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <Clock className="w-3 h-3" />
                    <span>Estimasi: {prediction.predicted_failure_window}</span>
                  </div>
                </div>

                {/* Risk Score & Chevron */}
                <div className="flex flex-col items-end gap-1">
                  <div className={`px-2 py-1 rounded-lg font-bold text-lg ${colors.bg} ${colors.text}`}>
                    {prediction.risk_score}
                  </div>
                  <span className="text-xs text-text-muted">
                    {getConfidenceLabel(prediction.confidence_level)}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0 mt-3" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer with last analysis time */}
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>Analisis terakhir: {formatLastAnalysis(lastAnalysisAt || null)}</span>
        {onRunAnalysis && (
          <button
            onClick={onRunAnalysis}
            className="text-primary hover:underline"
          >
            Jalankan Ulang
          </button>
        )}
      </div>
    </WidgetCard>
  );
}

export default PredictiveInsightsWidget;
