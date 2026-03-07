import { Sparkles, Check, RefreshCw, Clock, User, FileText, X } from 'lucide-react';

interface GeneratedWOFields {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  wo_type: 'preventive' | 'corrective' | 'emergency';
  estimated_duration: number;
}

interface TechnicianSuggestion {
  userId: number;
  userName: string;
  matchScore: number;
  reason: string;
}

interface SimilarWO {
  id: number;
  wo_number: string;
  title: string;
  asset_name: string;
  similarity_reason: string;
  root_cause?: string;
  solution?: string;
}

interface SmartWOSuggestionPanelProps {
  generated: GeneratedWOFields;
  technicianSuggestion?: TechnicianSuggestion;
  similarWOs: SimilarWO[];
  onAccept: () => void;
  onRegenerate: () => void;
  onClose: () => void;
  isRegenerating?: boolean;
}

const priorityLabels: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300' },
  medium: { label: 'Medium', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

const typeLabels: Record<string, { label: string; color: string }> = {
  preventive: { label: 'Preventive', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  corrective: { label: 'Corrective', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

/**
 * SmartWOSuggestionPanel - Displays AI-generated Work Order suggestions
 */
export function SmartWOSuggestionPanel({
  generated,
  technicianSuggestion,
  similarWOs,
  onAccept,
  onRegenerate,
  onClose,
  isRegenerating = false,
}: SmartWOSuggestionPanelProps) {
  const priority = priorityLabels[generated.priority] || priorityLabels.medium;
  const woType = typeLabels[generated.wo_type] || typeLabels.corrective;

  return (
    <div className="mt-4 p-4 bg-surface-elevated border border-border rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <span className="font-semibold text-text-primary">AI Generated Work Order</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-text-muted hover:text-text-primary rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Generated Fields Preview */}
      <div className="space-y-3 mb-4">
        {/* Title */}
        <div>
          <label className="text-xs text-text-muted">Title</label>
          <p className="text-sm font-medium text-text-primary">{generated.title}</p>
        </div>

        {/* Type, Priority, Duration */}
        <div className="flex flex-wrap gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded ${woType.color}`}>
            {woType.label}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded ${priority.color}`}>
            {priority.label}
          </span>
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            <Clock className="w-3 h-3" />
            {generated.estimated_duration} menit
          </span>
        </div>

        {/* Description Preview */}
        <div>
          <label className="text-xs text-text-muted">Description Preview</label>
          <div
            className="text-sm text-text-secondary max-h-20 overflow-y-auto prose prose-sm dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: generated.description.substring(0, 200) + '...' }}
          />
        </div>
      </div>

      {/* Technician Suggestion */}
      {technicianSuggestion && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Recommended Technician
            </span>
          </div>
          <p className="text-sm text-text-primary">
            {technicianSuggestion.userName}
            <span className="ml-2 text-xs text-text-muted">
              (Match: {technicianSuggestion.matchScore}%)
            </span>
          </p>
          <p className="text-xs text-text-muted mt-1">{technicianSuggestion.reason}</p>
        </div>
      )}

      {/* Similar WOs */}
      {similarWOs.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-text-muted" />
            <span className="text-xs font-medium text-text-muted">Similar Past WOs</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {similarWOs.slice(0, 3).map((wo) => (
              <div
                key={wo.id}
                className="p-2 bg-surface border border-border-subtle rounded text-xs"
              >
                <p className="font-medium text-text-primary truncate">
                  {wo.wo_number}: {wo.title}
                </p>
                <p className="text-text-muted truncate">{wo.similarity_reason}</p>
                {wo.solution && (
                  <p className="text-text-secondary mt-1 truncate">
                    <span className="font-medium">Solusi:</span> {wo.solution}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onAccept}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Check className="w-4 h-4" />
          Accept & Apply
        </button>
        <button
          onClick={onRegenerate}
          disabled={isRegenerating}
          className="flex items-center gap-2 px-4 py-2 border border-border text-text-primary rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>
    </div>
  );
}

export default SmartWOSuggestionPanel;
