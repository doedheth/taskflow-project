import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface SimilarEntry {
  id: number;
  title: string;
  similarity_score: number;
  status: string;
  created_at: string;
  entity_type: 'ticket' | 'wo';
  entity_number?: string;
}

interface DuplicateWarningBannerProps {
  similar: SimilarEntry[];
  suggestion?: string;
  entityType: 'ticket' | 'wo';
  onDismiss: () => void;
  onViewEntry?: (entry: SimilarEntry) => void;
}

/**
 * DuplicateWarningBanner - Displays warning when potential duplicates are detected
 */
export function DuplicateWarningBanner({
  similar,
  suggestion,
  entityType,
  onDismiss,
  onViewEntry,
}: DuplicateWarningBannerProps) {
  const entityLabel = entityType === 'ticket' ? 'Ticket' : 'Work Order';

  const handleViewEntry = (entry: SimilarEntry) => {
    if (onViewEntry) {
      onViewEntry(entry);
    } else {
      // Default: open in new tab
      const basePath = entry.entity_type === 'ticket' ? '/tickets' : '/work-orders';
      window.open(`${basePath}/${entry.id}`, '_blank');
    }
  };

  const getStatusColor = (status: string): string => {
    const statusLower = status.toLowerCase();
    if (['open', 'in_progress', 'assigned', 'pending'].includes(statusLower)) {
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
    if (['completed', 'resolved', 'closed'].includes(statusLower)) {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    }
    return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {entityLabel} serupa ditemukan
            </p>
            <button
              type="button"
              onClick={onDismiss}
              className="p-1 text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {suggestion && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              {suggestion}
            </p>
          )}

          <ul className="mt-2 space-y-2">
            {similar.map((entry) => (
              <li
                key={`${entry.entity_type}-${entry.id}`}
                className="p-2 bg-white dark:bg-surface border border-yellow-100 dark:border-yellow-800/50 rounded text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">
                      {entry.entity_number && (
                        <span className="text-text-muted">{entry.entity_number}: </span>
                      )}
                      {entry.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 text-xs rounded ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                      <span className="text-text-muted">
                        Kesamaan: {entry.similarity_score}%
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleViewEntry(entry)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 hover:underline flex-shrink-0"
                  >
                    <span>Lihat</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 text-xs text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            Abaikan & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

export default DuplicateWarningBanner;
