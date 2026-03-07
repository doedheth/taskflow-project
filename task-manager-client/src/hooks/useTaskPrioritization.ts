import { useQuery } from '@tanstack/react-query';
import { aiAPI } from '../services/api';
import type { TaskPriorityScore } from '../components/Dashboard/PriorityBadge';

// ============================================
// Types
// ============================================

export interface PrioritizeTasksResponse {
  success: boolean;
  scores: TaskPriorityScore[];
  cachedAt?: string;
}

// ============================================
// Hook
// ============================================

/**
 * useTaskPrioritization - Fetches AI-calculated priority scores for tasks
 *
 * Features:
 * - 5-minute cache (synced with backend cache)
 * - Only fetches when taskIds are provided
 * - Returns prioritized scores with breakdowns
 */
export function useTaskPrioritization(
  taskIds: number[],
  taskType: 'work_order' | 'ticket',
  enabled: boolean = true
) {
  return useQuery<PrioritizeTasksResponse>({
    queryKey: ['ai', 'prioritize', taskType, taskIds.sort().join(',')],
    queryFn: async () => {
      const response = await aiAPI.prioritizeTasks(taskIds, taskType);
      return response;
    },
    enabled: enabled && taskIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes - matches backend cache
    refetchOnWindowFocus: false,
  });
}

/**
 * Create a map of taskId to priority score for quick lookup
 */
export function usePriorityScoreMap(
  taskIds: number[],
  taskType: 'work_order' | 'ticket',
  enabled: boolean = true
) {
  const query = useTaskPrioritization(taskIds, taskType, enabled);

  const scoreMap = new Map<number, TaskPriorityScore>();
  if (query.data?.scores) {
    query.data.scores.forEach((score) => {
      scoreMap.set(score.taskId, score);
    });
  }

  return {
    ...query,
    scoreMap,
  };
}

export default useTaskPrioritization;
