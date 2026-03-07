import { aiTaskPrioritizer } from './AITaskPrioritizer';

describe('AITaskPrioritizer Scoring Logic', () => {
  // Mock data for tests
  const mockTask = {
    id: 1,
    title: 'Test Task',
    priority: 'high',
    scheduled_end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    criticality_level: 'production',
    cumulative_downtime: 120, // 2 hours
    blocking_count: 1,
  };

  test('should calculate correct total score based on weights', () => {
    // Access private method for testing logic
    const prioritizer = aiTaskPrioritizer as any;
    const score = prioritizer.calculatePriorityScore(mockTask, 'work_order');

    expect(score.totalScore).toBe(79);
    expect(score.colorClass).toBe('bg-orange-100 text-orange-700');
  });

  test('should handle overdue tasks with maximum urgency', () => {
    const overdueTask = {
      ...mockTask,
      scheduled_end: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    };

    const prioritizer = aiTaskPrioritizer as any;
    const score = prioritizer.calculatePriorityScore(overdueTask, 'work_order');
    expect(score.totalScore).toBe(88);
    expect(score.colorClass).toBe('bg-red-100 text-red-700');
  });

  test('should handle tasks with no deadline', () => {
    const noDeadlineTask = {
      ...mockTask,
      scheduled_end: null,
    };

    const prioritizer = aiTaskPrioritizer as any;
    const score = prioritizer.calculatePriorityScore(noDeadlineTask, 'work_order');
    expect(score.totalScore).toBe(73);
  });

  test('should handle non-critical machines', () => {
    const nonCriticalTask = {
      ...mockTask,
      criticality_level: 'low',
    };

    const prioritizer = aiTaskPrioritizer as any;
    const score = prioritizer.calculatePriorityScore(nonCriticalTask, 'work_order');
    expect(score.totalScore).toBe(61);
  });

  test('should determine correct color classes for different ranges', () => {
    const prioritizer = aiTaskPrioritizer as any;
    expect(prioritizer.getColorClass(85)).toBe('bg-red-100 text-red-700');
    expect(prioritizer.getColorClass(70)).toBe('bg-orange-100 text-orange-700');
    expect(prioritizer.getColorClass(50)).toBe('bg-yellow-100 text-yellow-700');
    expect(prioritizer.getColorClass(30)).toBe('bg-green-100 text-green-700');
  });
});
