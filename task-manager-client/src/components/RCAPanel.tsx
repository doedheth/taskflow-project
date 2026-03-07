/**
 * Root Cause Analysis Panel Component
 *
 * Story 7.8: Display AI-generated root cause analysis with recommendations
 */

import { useState } from 'react';
import { aiAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  Brain,
  Search,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Target,
  Lightbulb,
  History,
  Wrench,
  Calendar,
  TrendingUp,
  Activity,
  FileText,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  X,
} from 'lucide-react';

// Types
interface SymptomEvent {
  date: string;
  event_type: 'warning' | 'breakdown' | 'repair' | 'pm';
  description: string;
}

interface ContributingFactor {
  factor: string;
  weight: number;
  evidence: string;
}

interface RCASimilarIncident {
  breakdown_id: number;
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

interface RCARecommendation {
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

interface RCAAnalysis {
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

interface RCAPanelProps {
  machineId: number;
  machineName: string;
  breakdownId?: number;
  onCreateWO?: (data: { title: string; type: string; asset_id: number }) => void;
}

export default function RCAPanel({
  machineId,
  machineName,
  breakdownId,
  onCreateWO,
}: RCAPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [analysis, setAnalysis] = useState<RCAAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('factors');
  const [lookbackDays, setLookbackDays] = useState(90);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'accurate' | 'inaccurate' | 'partial' | null>(null);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [actualRootCause, setActualRootCause] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await aiAPI.analyzeRootCause({
        machine_id: machineId,
        breakdown_id: breakdownId,
        lookback_days: lookbackDays,
      });

      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        setError(result.error || 'Analisis gagal');
      }
    } catch (err) {
      setError('Gagal melakukan analisis root cause');
      console.error('RCA analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-400 bg-green-500/20';
      case 'medium':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'low':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-gray-400 bg-gray-500/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return 'text-red-400 bg-red-500/20 border-red-500/30';
      case 'short_term':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'long_term':
        return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      default:
        return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
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

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'breakdown':
        return <AlertTriangle className="w-3 h-3 text-red-400" />;
      case 'warning':
        return <Activity className="w-3 h-3 text-yellow-400" />;
      case 'repair':
        return <Wrench className="w-3 h-3 text-green-400" />;
      case 'pm':
        return <Calendar className="w-3 h-3 text-blue-400" />;
      default:
        return <FileText className="w-3 h-3 text-gray-400" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleCreateWO = (rec: RCARecommendation) => {
    if (onCreateWO && rec.action_data) {
      onCreateWO({
        title: rec.action_data.wo_title || rec.action,
        type: rec.action_data.wo_type || 'corrective',
        asset_id: rec.action_data.asset_id || machineId,
      });
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!analysis || !feedbackType) return;

    setFeedbackLoading(true);
    try {
      await aiAPI.recordRCAFeedback(analysis.id, {
        feedback_type: feedbackType,
        actual_root_cause: actualRootCause || undefined,
        notes: feedbackNotes || undefined,
      });
      setFeedbackSuccess(true);
      setTimeout(() => {
        setShowFeedbackModal(false);
        setFeedbackSuccess(false);
        setFeedbackType(null);
        setFeedbackNotes('');
        setActualRootCause('');
      }, 2000);
    } catch (err) {
      console.error('Feedback submission error:', err);
      setError('Gagal menyimpan feedback');
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI Root Cause Analysis
              </h4>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {machineName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={lookbackDays}
              onChange={(e) => setLookbackDays(parseInt(e.target.value))}
              className={`px-2 py-1 rounded-lg text-xs ${
                isDark ? 'bg-dark-700 text-white border-dark-600' : 'bg-white text-gray-700 border-gray-300'
              } border`}
            >
              <option value={30}>30 hari</option>
              <option value={60}>60 hari</option>
              <option value={90}>90 hari</option>
              <option value={180}>180 hari</option>
            </select>
            <button
              onClick={handleAnalyze}
              disabled={isLoading}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                isLoading
                  ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  {analysis ? 'Analisis Ulang' : 'Analisis'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-400 text-sm mb-4">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        {!analysis && !isLoading && (
          <div className={`text-center py-8 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            <Target className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm font-medium">Belum Ada Analisis</p>
            <p className="text-xs mt-1 opacity-75">
              Klik "Analisis" untuk mendapatkan root cause analysis dari AI
            </p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Root Cause Summary */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30'
                     : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Probable Root Cause
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getConfidenceColor(analysis.confidence_level)}`}>
                      {analysis.confidence_score}% confidence
                    </span>
                  </div>
                  <p className={`text-sm font-medium mb-2 ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>
                    {analysis.probable_root_cause}
                  </p>
                  <p className={`text-sm ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
                    {analysis.reasoning.summary}
                  </p>
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-orange-500/20">
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <Activity className="w-3 h-3 inline mr-1" />
                  {analysis.analysis_metadata.data_points_analyzed} data points
                </span>
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  {analysis.analysis_metadata.breakdown_count} breakdowns
                </span>
                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  {analysis.analysis_metadata.time_span_days} hari
                </span>
              </div>
            </div>

            {/* Contributing Factors */}
            <div className={`rounded-xl border ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <button
                onClick={() => toggleSection('factors')}
                className={`w-full px-4 py-3 flex items-center justify-between ${
                  isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-100'
                } transition-colors rounded-t-xl`}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Faktor Kontributor ({analysis.reasoning.contributing_factors.length})
                  </span>
                </div>
                {expandedSection === 'factors' ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {expandedSection === 'factors' && (
                <div className={`px-4 pb-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                  <div className="space-y-3 mt-3">
                    {analysis.reasoning.contributing_factors.map((factor, index) => (
                      <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-100'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {factor.factor}
                          </span>
                          <span className={`text-xs font-bold ${
                            factor.weight >= 30 ? 'text-red-400' :
                            factor.weight >= 15 ? 'text-yellow-400' : 'text-green-400'
                          }`}>
                            {factor.weight}%
                          </span>
                        </div>
                        <div className={`h-1.5 rounded-full ${isDark ? 'bg-dark-600' : 'bg-gray-200'} overflow-hidden`}>
                          <div
                            className={`h-full rounded-full ${
                              factor.weight >= 30 ? 'bg-red-500' :
                              factor.weight >= 15 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${factor.weight}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                          {factor.evidence}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Symptom Timeline */}
            {analysis.reasoning.symptom_progression.length > 0 && (
              <div className={`rounded-xl border ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => toggleSection('timeline')}
                  className={`w-full px-4 py-3 flex items-center justify-between ${
                    isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-100'
                  } transition-colors rounded-t-xl`}
                >
                  <div className="flex items-center gap-2">
                    <History className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Timeline Gejala ({analysis.reasoning.symptom_progression.length})
                    </span>
                  </div>
                  {expandedSection === 'timeline' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSection === 'timeline' && (
                  <div className={`px-4 pb-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                    <div className="relative mt-3 ml-2">
                      <div className={`absolute left-1.5 top-2 bottom-2 w-0.5 ${isDark ? 'bg-dark-600' : 'bg-gray-300'}`} />
                      <div className="space-y-3">
                        {analysis.reasoning.symptom_progression.map((event, index) => (
                          <div key={index} className="flex items-start gap-3 relative">
                            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                              isDark ? 'bg-dark-700' : 'bg-white'
                            } border-2 ${
                              event.event_type === 'breakdown' ? 'border-red-500' :
                              event.event_type === 'warning' ? 'border-yellow-500' :
                              event.event_type === 'pm' ? 'border-blue-500' : 'border-green-500'
                            } z-10`} />
                            <div className="flex-1 pb-2">
                              <div className="flex items-center gap-2">
                                {getEventIcon(event.event_type)}
                                <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                                  {new Date(event.date).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <p className={`text-sm mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {event.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Similar Incidents */}
            {analysis.similar_incidents.length > 0 && (
              <div className={`rounded-xl border ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <button
                  onClick={() => toggleSection('similar')}
                  className={`w-full px-4 py-3 flex items-center justify-between ${
                    isDark ? 'hover:bg-dark-700/50' : 'hover:bg-gray-100'
                  } transition-colors rounded-t-xl`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Insiden Serupa ({analysis.similar_incidents.length})
                    </span>
                  </div>
                  {expandedSection === 'similar' ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {expandedSection === 'similar' && (
                  <div className={`px-4 pb-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                    <div className="space-y-3 mt-3">
                      {analysis.similar_incidents.map((incident, index) => (
                        <div key={index} className={`p-3 rounded-lg ${isDark ? 'bg-dark-700/50' : 'bg-gray-100'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                              {new Date(incident.date).toLocaleDateString('id-ID')}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              incident.similarity_score >= 70 ? 'text-green-400 bg-green-500/20' :
                              incident.similarity_score >= 50 ? 'text-yellow-400 bg-yellow-500/20' :
                              'text-gray-400 bg-gray-500/20'
                            }`}>
                              {incident.similarity_score}% match
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {incident.description}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            {incident.resolution}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className={`text-xs mt-3 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {analysis.reasoning.historical_comparison}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className={`rounded-xl border ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-2">
                    <Lightbulb className={`w-4 h-4 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Rekomendasi ({analysis.recommendations.length})
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {analysis.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(rec.priority)}`}>
                              {getPriorityLabel(rec.priority)}
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {rec.action}
                          </p>
                          <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                            {rec.reasoning}
                          </p>
                        </div>
                        {rec.action_type === 'create_wo' && onCreateWO && (
                          <button
                            onClick={() => handleCreateWO(rec)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                              isDark ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                                     : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            } transition-colors`}
                          >
                            <Wrench className="w-3 h-3 inline mr-1" />
                            Buat WO
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-dark-700/30 border-dark-600' : 'bg-gray-100 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Apakah analisis ini akurat?
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setFeedbackType('accurate');
                      setShowFeedbackModal(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                             : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    Akurat
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackType('partial');
                      setShowFeedbackModal(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isDark ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                             : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Sebagian
                  </button>
                  <button
                    onClick={() => {
                      setFeedbackType('inaccurate');
                      setShowFeedbackModal(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      isDark ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                             : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    Tidak Akurat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md mx-4 rounded-xl shadow-xl ${isDark ? 'bg-dark-800' : 'bg-white'}`}>
            <div className={`px-4 py-3 border-b flex items-center justify-between ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Feedback Analisis
              </h3>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackType(null);
                  setFeedbackNotes('');
                  setActualRootCause('');
                }}
                className={`p-1 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {feedbackSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-3" />
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Terima kasih atas feedback Anda!
                  </p>
                  <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                    Feedback membantu kami meningkatkan akurasi AI
                  </p>
                </div>
              ) : (
                <>
                  {/* Feedback Type Selection */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Tingkat Akurasi
                    </label>
                    <div className="flex gap-2">
                      {(['accurate', 'partial', 'inaccurate'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFeedbackType(type)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            feedbackType === type
                              ? type === 'accurate'
                                ? 'bg-green-500 text-white'
                                : type === 'partial'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-red-500 text-white'
                              : isDark
                              ? 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type === 'accurate' && 'Akurat'}
                          {type === 'partial' && 'Sebagian'}
                          {type === 'inaccurate' && 'Tidak Akurat'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actual Root Cause (for inaccurate/partial) */}
                  {(feedbackType === 'inaccurate' || feedbackType === 'partial') && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                        Root Cause Sebenarnya
                      </label>
                      <input
                        type="text"
                        value={actualRootCause}
                        onChange={(e) => setActualRootCause(e.target.value)}
                        placeholder="Masukkan root cause yang benar..."
                        className={`w-full px-3 py-2 rounded-lg border text-sm ${
                          isDark
                            ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-dark-300' : 'text-gray-700'}`}>
                      Catatan Tambahan (opsional)
                    </label>
                    <textarea
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Berikan catatan tambahan..."
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border text-sm resize-none ${
                        isDark
                          ? 'bg-dark-700 border-dark-600 text-white placeholder-dark-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setShowFeedbackModal(false);
                        setFeedbackType(null);
                        setFeedbackNotes('');
                        setActualRootCause('');
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isDark ? 'bg-dark-700 text-dark-300 hover:bg-dark-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackLoading || !feedbackType}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                        feedbackLoading || !feedbackType
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      }`}
                    >
                      {feedbackLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        'Kirim Feedback'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
