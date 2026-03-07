import { useState } from 'react';
import {
  X,
  Brain,
  Cpu,
  AlertTriangle,
  Clock,
  Wrench,
  History,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  usePredictionDetail,
  usePredictionFeedback,
  getRiskLevel,
  getRiskLevelColor,
  getConfidenceLabel,
  type PredictionSummary,
  type Recommendation,
} from '../../../hooks/usePredictiveInsights';

interface PredictionDetailModalProps {
  prediction: PredictionSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * PredictionDetailModal - Shows detailed prediction analysis
 *
 * Features:
 * - Risk score breakdown with factor analysis
 * - Similar historical incidents
 * - AI-generated recommendations
 * - Feedback mechanism for accuracy tracking
 *
 * Story 7.6: Create Predictive Maintenance Analysis
 */
export function PredictionDetailModal({
  prediction,
  isOpen,
  onClose,
}: PredictionDetailModalProps) {
  const [showFactors, setShowFactors] = useState(true);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const { data: detailData, isLoading: isLoadingDetail } = usePredictionDetail(
    isOpen ? prediction?.id ?? null : null
  );

  const feedbackMutation = usePredictionFeedback();

  if (!isOpen || !prediction) return null;

  const detail = detailData?.prediction;
  const colors = getRiskLevelColor(prediction.risk_score);
  const riskLevel = getRiskLevel(prediction.risk_score);

  const handleFeedback = async (outcome: 'breakdown_occurred' | 'no_breakdown' | 'partial') => {
    if (!prediction) return;

    try {
      await feedbackMutation.mutateAsync({
        predictionId: prediction.id,
        actual_outcome: outcome,
        notes: feedbackNotes || undefined,
      });
      setSelectedOutcome(outcome);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
      case 'immediate':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'short_term':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'long_term':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityLabel = (priority: Recommendation['priority']) => {
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
  };

  // Parse JSON fields if needed
  const factors = typeof detail?.factors === 'string'
    ? JSON.parse(detail.factors)
    : detail?.factors;
  const recommendations = typeof detail?.recommendations === 'string'
    ? JSON.parse(detail.recommendations)
    : detail?.recommendations || [];
  const similarIncidents = typeof detail?.similar_incidents === 'string'
    ? JSON.parse(detail.similar_incidents)
    : detail?.similar_incidents || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-surface rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`p-4 ${colors.bg} border-b ${colors.border}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors.bg}`}>
                <Brain className={`w-6 h-6 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                  {prediction.machine_name}
                  {riskLevel === 'critical' && (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                </h2>
                <p className="text-sm text-text-muted">{prediction.asset_code}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          {/* Risk Score Summary */}
          <div className="mt-4 flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl ${colors.bg} ${colors.border} border`}>
              <div className={`text-3xl font-bold ${colors.text}`}>
                {prediction.risk_score}
              </div>
              <div className="text-xs text-text-muted">Risk Score</div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-text-muted" />
                <span>Estimasi: {prediction.predicted_failure_window}</span>
              </div>
              <div className="text-sm text-text-muted mt-1">
                Confidence: {getConfidenceLabel(prediction.confidence_level)}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {isLoadingDetail ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {/* AI Reasoning */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                <h3 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" />
                  Analisis AI
                </h3>
                <p className="text-sm text-text-secondary whitespace-pre-line">
                  {detail?.reasoning || prediction.reasoning}
                </p>
              </div>

              {/* Risk Factors */}
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowFactors(!showFactors)}
                  className="w-full p-3 flex items-center justify-between bg-surface-hover/50 hover:bg-surface-hover transition-colors"
                >
                  <span className="font-medium text-text-primary flex items-center gap-2">
                    <Cpu className="w-4 h-4" />
                    Faktor Risiko
                  </span>
                  {showFactors ? (
                    <ChevronUp className="w-4 h-4 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-text-muted" />
                  )}
                </button>
                {showFactors && factors && (
                  <div className="p-4 space-y-3">
                    <FactorBar
                      label="PM Overdue"
                      value={`${factors.daysSinceLastPM?.value || 0} hari`}
                      score={factors.daysSinceLastPM?.score || 0}
                    />
                    <FactorBar
                      label="Breakdown (90 hari)"
                      value={`${factors.breakdownCount90Days?.value || 0}x`}
                      score={factors.breakdownCount90Days?.score || 0}
                    />
                    <FactorBar
                      label="MTBF"
                      value={`${factors.averageMTBF?.value || 0} jam`}
                      score={factors.averageMTBF?.score || 0}
                    />
                    <FactorBar
                      label="Usia Mesin"
                      value={`${factors.machineAgeYears?.value || 0} tahun`}
                      score={factors.machineAgeYears?.score || 0}
                    />
                    <FactorBar
                      label="Pattern Match"
                      value={`${factors.patternMatchScore?.value || 0}%`}
                      score={factors.patternMatchScore?.score || 0}
                    />
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {recommendations.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="w-full p-3 flex items-center justify-between bg-surface-hover/50 hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-medium text-text-primary flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Rekomendasi ({recommendations.length})
                    </span>
                    {showRecommendations ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  {showRecommendations && (
                    <div className="p-4 space-y-3">
                      {recommendations.map((rec: Recommendation, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded">
                              {getPriorityLabel(rec.priority)}
                            </span>
                          </div>
                          <p className="text-sm font-medium">{rec.action}</p>
                          <p className="text-xs text-text-muted mt-1">{rec.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Similar Historical Incidents */}
              {similarIncidents.length > 0 && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full p-3 flex items-center justify-between bg-surface-hover/50 hover:bg-surface-hover transition-colors"
                  >
                    <span className="font-medium text-text-primary flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Insiden Serupa ({similarIncidents.length})
                    </span>
                    {showHistory ? (
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  {showHistory && (
                    <div className="p-4 space-y-3">
                      {similarIncidents.map((incident: any, idx: number) => (
                        <div key={idx} className="p-3 bg-surface-hover rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-text-primary">
                              {incident.description}
                            </span>
                            <span className="text-xs text-text-muted">
                              {new Date(incident.date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted">
                            Resolusi: {incident.resolution}
                          </p>
                          <div className="mt-1 text-xs text-primary">
                            Similarity: {incident.similarity_score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Section */}
              <div className="border border-border rounded-xl p-4">
                <h3 className="font-medium text-text-primary mb-3">
                  Apakah prediksi ini akurat?
                </h3>
                {selectedOutcome ? (
                  <div className="flex items-center gap-2 text-status-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Feedback berhasil disimpan. Terima kasih!</span>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => handleFeedback('breakdown_occurred')}
                        disabled={feedbackMutation.isPending}
                        className="flex-1 p-2 rounded-lg border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Breakdown Terjadi</span>
                      </button>
                      <button
                        onClick={() => handleFeedback('no_breakdown')}
                        disabled={feedbackMutation.isPending}
                        className="flex-1 p-2 rounded-lg border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Tidak Terjadi</span>
                      </button>
                      <button
                        onClick={() => handleFeedback('partial')}
                        disabled={feedbackMutation.isPending}
                        className="flex-1 p-2 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span className="text-sm">Sebagian</span>
                      </button>
                    </div>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Catatan tambahan (opsional)..."
                      className="w-full p-2 border border-border rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-surface-hover hover:bg-surface-hover/80 transition-colors text-text-primary"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

// Factor progress bar component
function FactorBar({
  label,
  value,
  score,
}: {
  label: string;
  value: string;
  score: number;
}) {
  const getBarColor = (score: number) => {
    if (score >= 70) return 'bg-red-500';
    if (score >= 50) return 'bg-orange-500';
    if (score >= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium">{value}</span>
      </div>
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${getBarColor(score)}`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

export default PredictionDetailModal;
