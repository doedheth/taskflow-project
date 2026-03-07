/**
 * Machine RCA Summary Widget
 *
 * Story 7.8: Shows historical RCA analyses for a specific machine
 * Displays recurring issues and analysis history
 */

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useMachineRCAs, getConfidenceColor, getConfidenceLabel } from '../hooks/useRootCauseAnalysis';
import type { RCASummary } from '../hooks/useRootCauseAnalysis';
import {
  Brain,
  ChevronRight,
  Clock,
  AlertCircle,
  RefreshCw,
  Target,
  History,
} from 'lucide-react';

interface MachineRCASummaryWidgetProps {
  machineId: number;
  machineName: string;
  onAnalysisClick?: (analysisId: number) => void;
  onRunNewAnalysis?: () => void;
  limit?: number;
}

export default function MachineRCASummaryWidget({
  machineId,
  machineName: _machineName,
  onAnalysisClick,
  onRunNewAnalysis,
  limit = 5,
}: MachineRCASummaryWidgetProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, isError, refetch, isFetching } = useMachineRCAs(machineId, limit);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`rounded-xl border p-4 ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-8 h-8 rounded-lg animate-pulse ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
          <div className={`h-4 w-32 rounded animate-pulse ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-16 rounded-lg animate-pulse ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={`rounded-xl border p-4 ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-center gap-2 text-red-500 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Gagal memuat riwayat analisis</span>
        </div>
        <button
          onClick={handleRefresh}
          className={`px-3 py-1.5 rounded-lg text-sm ${
            isDark ? 'bg-dark-700 hover:bg-dark-600' : 'bg-gray-200 hover:bg-gray-300'
          } transition-colors`}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const analyses = data?.analyses || [];
  const recurringIssues = data?.recurring_issues || [];

  // Empty state
  if (analyses.length === 0) {
    return (
      <div className={`rounded-xl border ${isDark ? 'bg-dark-800/50 border-dark-700' : 'bg-gray-50 border-gray-200'}`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-red-500">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Riwayat Analisis RCA
              </span>
            </div>
          </div>
        </div>
        <div className="p-6 text-center">
          <History className={`w-10 h-10 mx-auto mb-3 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
          <p className={`text-sm font-medium ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
            Belum Ada Analisis
          </p>
          <p className={`text-xs mt-1 ${isDark ? 'text-dark-500' : 'text-gray-500'}`}>
            Jalankan analisis RCA untuk melihat riwayat
          </p>
          {onRunNewAnalysis && (
            <button
              onClick={onRunNewAnalysis}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transition-colors"
            >
              Mulai Analisis
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calculate time ago
  const getTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hari ini';
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
    return `${Math.floor(diffDays / 30)} bulan lalu`;
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
              <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Riwayat Analisis RCA
              </span>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {analyses.length} analisis tersimpan
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isFetching}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-200'
            } disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${(isRefreshing || isFetching) ? 'animate-spin' : ''} ${
              isDark ? 'text-dark-400' : 'text-gray-500'
            }`} />
          </button>
        </div>
      </div>

      {/* Recurring Issues Banner */}
      {recurringIssues.length > 0 && (
        <div className={`px-4 py-3 border-b ${
          isDark ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-yellow-50 border-yellow-100'
        }`}>
          <div className="flex items-start gap-2">
            <AlertCircle className={`w-4 h-4 mt-0.5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                Masalah Berulang Terdeteksi
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {recurringIssues.slice(0, 3).map((issue, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {issue}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis List */}
      <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
        {analyses.map((analysis: RCASummary) => {
          const colors = getConfidenceColor(analysis.confidence_level);

          return (
            <button
              key={analysis.id}
              onClick={() => onAnalysisClick?.(analysis.id)}
              className={`w-full p-3 rounded-lg border transition-all text-left hover:scale-[1.01] ${
                isDark
                  ? 'bg-dark-700/50 border-dark-600 hover:border-dark-500'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colors.bg}`}>
                  <Target className={`w-4 h-4 ${colors.text}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {analysis.probable_root_cause}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className={`w-3 h-3 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                    <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {getTimeAgo(analysis.created_at)}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                      {getConfidenceLabel(analysis.confidence_level)}
                    </span>
                  </div>
                </div>

                {/* Confidence Score */}
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-bold ${colors.text}`}>
                    {analysis.confidence_score}%
                  </span>
                  <ChevronRight className={`w-4 h-4 ${isDark ? 'text-dark-500' : 'text-gray-400'}`} />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      {onRunNewAnalysis && (
        <div className={`px-4 py-3 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <button
            onClick={onRunNewAnalysis}
            className={`w-full px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              isDark
                ? 'bg-dark-700 text-dark-200 hover:bg-dark-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-4 h-4" />
            Jalankan Analisis Baru
          </button>
        </div>
      )}
    </div>
  );
}
