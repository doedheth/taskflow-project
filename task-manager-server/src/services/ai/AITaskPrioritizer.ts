/**
 * AI Task Prioritizer Service
 * Calculates priority scores for tasks based on multiple factors (Story 7.3)
 */

import db from '../../database/db';
import {
  TaskPriorityScore,
  PriorityScoreBreakdown,
  PrioritizeTasksRequest,
  PrioritizeTasksResponse,
  TechnicianSuggestion,
  SuggestAssigneeRequest,
  SuggestAssigneeResponse,
} from '../../types/ai';

// Cache configuration
const priorityCache = new Map<string, { scores: TaskPriorityScore[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Weight constants
const WEIGHTS = {
  dueDate: 0.30,
  machineCriticality: 0.25,
  issueSeverity: 0.20,
  cumulativeDowntime: 0.15,
  dependencyChain: 0.10,
};

// Technician suggestion weights
const TECH_WEIGHTS = {
  workload: 0.40,
  skillMatch: 0.30,
  availability: 0.20,
  responseTime: 0.10,
};

interface DBTaskRecord {
  id: number;
  title: string;
  priority: string;
  status: string;
  asset_id?: number;
  asset_name?: string;
  criticality_level?: string;
  cumulative_downtime?: number;
  blocking_count?: number;
  scheduled_end?: string; // for work_orders
  due_date?: string;      // for tickets
}

interface DBTechnicianRecord {
  user_id: number;
  user_name: string;
  role: string;
  department_id: number;
  open_tickets: number;
  open_wos: number;
  avg_resolution_days: number | null;
}

export class AITaskPrioritizer {
  /**
   * Prioritize tasks and return scores
   */
  async prioritizeTasks(request: PrioritizeTasksRequest): Promise<PrioritizeTasksResponse> {
    const { taskIds, taskType, userId } = request;

    if (!taskIds || taskIds.length === 0) {
      return { success: true, scores: [] };
    }

    // Check cache
    const cacheKey = `${taskType}:${userId || 'all'}:${taskIds.sort().join(',')}`;
    const cached = priorityCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        success: true,
        scores: cached.scores,
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    try {
      // Fetch task details based on type
      const tasks = taskType === 'work_order'
        ? this.fetchWorkOrders(taskIds)
        : this.fetchTickets(taskIds);

      // Calculate scores for each task
      const scores: TaskPriorityScore[] = tasks.map((task) =>
        this.calculatePriorityScore(task, taskType)
      );

      // Sort by total score descending
      scores.sort((a, b) => b.totalScore - a.totalScore);

      // Cache the result
      priorityCache.set(cacheKey, { scores, timestamp: Date.now() });

      return { success: true, scores };
    } catch (error) {
      console.error('AITaskPrioritizer error:', error);
      return { success: false, scores: [] };
    }
  }

  /**
   * Suggest optimal technician for a task
   */
  async suggestAssignee(request: SuggestAssigneeRequest): Promise<SuggestAssigneeResponse> {
    const { taskType, title, priority, assetId, departmentId } = request;

    try {
      // Get all available technicians
      const technicians = this.getAvailableTechnicians(departmentId);

      // Calculate match scores for each
      const suggestions: TechnicianSuggestion[] = technicians.map((tech) =>
        this.calculateTechnicianMatch(tech, { title, priority, assetId, taskType })
      );

      // Sort by match score descending
      suggestions.sort((a, b) => b.matchScore - a.matchScore);

      // Return top 5
      return {
        success: true,
        suggestions: suggestions.slice(0, 5),
      };
    } catch (error) {
      console.error('Suggest assignee error:', error);
      return { success: false, suggestions: [] };
    }
  }

  /**
   * Fetch work orders by IDs
   */
  private fetchWorkOrders(ids: number[]): DBTaskRecord[] {
    const placeholders = ids.map(() => '?').join(',');
    return db
      .prepare(
        `
        SELECT
          wo.id, wo.wo_number, wo.title, wo.priority, wo.status,
          wo.scheduled_start, wo.scheduled_end, wo.actual_start,
          a.id as asset_id, a.name as asset_name, a.criticality_level,
          (SELECT SUM(duration_minutes) FROM downtime_logs WHERE asset_id = a.id AND start_time >= date('now', '-30 days')) as cumulative_downtime,
          (SELECT COUNT(*) FROM work_orders wo2 WHERE wo2.parent_wo_id = wo.id AND wo2.status NOT IN ('completed', 'cancelled')) as blocking_count
        FROM work_orders wo
        LEFT JOIN assets a ON wo.asset_id = a.id
        WHERE wo.id IN (${placeholders})
      `
      )
      .all(...ids) as DBTaskRecord[];
  }

  /**
   * Fetch tickets by IDs
   */
  private fetchTickets(ids: number[]): DBTaskRecord[] {
    const placeholders = ids.map(() => '?').join(',');
    return db
      .prepare(
        `
        SELECT
          t.id, t.ticket_key, t.title, t.priority, t.status,
          t.due_date, t.created_at,
          a.id as asset_id, a.name as asset_name, a.criticality_level,
          (SELECT SUM(duration_minutes) FROM downtime_logs WHERE asset_id = a.id AND start_time >= date('now', '-30 days')) as cumulative_downtime,
          (SELECT COUNT(*) FROM tickets t2 WHERE t2.parent_id = t.id AND t2.status NOT IN ('done', 'cancelled')) as blocking_count
        FROM tickets t
        LEFT JOIN assets a ON t.asset_id = a.id
        WHERE t.id IN (${placeholders})
      `
      )
      .all(...ids) as DBTaskRecord[];
  }

  /**
   * Calculate priority score for a single task
   */
  private calculatePriorityScore(task: DBTaskRecord, taskType: 'work_order' | 'ticket'): TaskPriorityScore {
    // Calculate each component
    const dueDate = this.scoreDueDate(task, taskType);
    const machineCriticality = this.scoreMachineCriticality(task.criticality_level);
    const issueSeverity = this.scoreSeverity(task.priority);
    const cumulativeDowntime = this.scoreDowntime(task.cumulative_downtime);
    const dependencyChain = this.scoreDependencies(task.blocking_count);

    // Calculate weighted total
    const totalScore = Math.round(
      dueDate.score * WEIGHTS.dueDate +
      machineCriticality.score * WEIGHTS.machineCriticality +
      issueSeverity.score * WEIGHTS.issueSeverity +
      cumulativeDowntime.score * WEIGHTS.cumulativeDowntime +
      dependencyChain.score * WEIGHTS.dependencyChain
    );

    // Build breakdown
    const breakdown: PriorityScoreBreakdown = {
      dueDate: { ...dueDate, weight: WEIGHTS.dueDate },
      machineCriticality: { ...machineCriticality, weight: WEIGHTS.machineCriticality },
      issueSeverity: { ...issueSeverity, weight: WEIGHTS.issueSeverity },
      cumulativeDowntime: { ...cumulativeDowntime, weight: WEIGHTS.cumulativeDowntime },
      dependencyChain: { ...dependencyChain, weight: WEIGHTS.dependencyChain },
    };

    // Generate overall reason
    const overallReason = this.generateOverallReason(breakdown, totalScore);

    // Determine color class
    const colorClass = this.getColorClass(totalScore);

    return {
      taskId: task.id,
      taskType,
      totalScore,
      breakdown,
      overallReason,
      colorClass,
    };
  }

  /**
   * Score based on due date urgency (30% weight)
   */
  private scoreDueDate(task: DBTaskRecord, taskType: 'work_order' | 'ticket'): { score: number; reason: string } {
    const dueDateField = taskType === 'work_order' ? task.scheduled_end : task.due_date;

    if (!dueDateField) {
      return { score: 50, reason: 'Tanpa deadline' };
    }

    const dueDate = new Date(dueDateField);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { score: 100, reason: `Terlambat ${Math.abs(diffDays)} hari` };
    } else if (diffDays === 0) {
      return { score: 90, reason: 'Jatuh tempo hari ini' };
    } else if (diffDays === 1) {
      return { score: 70, reason: 'Besok' };
    } else if (diffDays <= 7) {
      return { score: 50, reason: `${diffDays} hari lagi` };
    } else if (diffDays <= 14) {
      return { score: 30, reason: 'Minggu depan' };
    } else {
      return { score: 10, reason: 'Lebih dari 2 minggu' };
    }
  }

  /**
   * Score based on machine/asset criticality (25% weight)
   */
  private scoreMachineCriticality(criticalityLevel?: string): { score: number; reason: string } {
    if (!criticalityLevel) {
      return { score: 30, reason: 'Tidak terkait aset' };
    }

    const level = criticalityLevel.toLowerCase();

    if (level === 'critical' || level === 'production') {
      return { score: 100, reason: 'Lini produksi (kritis)' };
    } else if (level === 'high' || level === 'support') {
      return { score: 60, reason: 'Peralatan pendukung' };
    } else {
      return { score: 30, reason: 'Non-kritis' };
    }
  }

  /**
   * Score based on issue severity/priority (20% weight)
   */
  private scoreSeverity(priority?: string): { score: number; reason: string } {
    if (!priority) {
      return { score: 50, reason: 'Prioritas tidak diset' };
    }

    const p = priority.toLowerCase();

    if (p === 'critical') {
      return { score: 100, reason: 'Prioritas Kritis' };
    } else if (p === 'high') {
      return { score: 80, reason: 'Prioritas Tinggi' };
    } else if (p === 'medium') {
      return { score: 50, reason: 'Prioritas Sedang' };
    } else {
      return { score: 20, reason: 'Prioritas Rendah' };
    }
  }

  /**
   * Score based on cumulative downtime (15% weight)
   */
  private scoreDowntime(downtimeMinutes?: number): { score: number; reason: string } {
    if (!downtimeMinutes || downtimeMinutes === 0) {
      return { score: 0, reason: 'Tidak ada downtime' };
    }

    const hours = downtimeMinutes / 60;

    if (hours > 4) {
      return { score: 100, reason: `>${Math.round(hours)} jam downtime` };
    } else if (hours >= 2) {
      return { score: 80, reason: `${Math.round(hours)} jam downtime` };
    } else if (hours >= 1) {
      return { score: 60, reason: '1-2 jam downtime' };
    } else if (downtimeMinutes >= 30) {
      return { score: 40, reason: '30-60 menit downtime' };
    } else {
      return { score: 20, reason: '<30 menit downtime' };
    }
  }

  /**
   * Score based on dependency chain (10% weight)
   */
  private scoreDependencies(blockingCount?: number): { score: number; reason: string } {
    if (!blockingCount || blockingCount === 0) {
      return { score: 0, reason: 'Standalone' };
    }

    if (blockingCount >= 3) {
      return { score: 100, reason: `Memblokir ${blockingCount} tugas lain` };
    } else if (blockingCount >= 1) {
      return { score: 50, reason: `Memblokir ${blockingCount} tugas` };
    }

    return { score: 0, reason: 'Standalone' };
  }

  /**
   * Generate overall reason text
   */
  private generateOverallReason(breakdown: PriorityScoreBreakdown, totalScore: number): string {
    const parts: string[] = [];

    // Add top 3 contributing factors
    const factors = [
      { name: 'Due', score: breakdown.dueDate.score * breakdown.dueDate.weight, reason: breakdown.dueDate.reason },
      { name: 'Mesin', score: breakdown.machineCriticality.score * breakdown.machineCriticality.weight, reason: breakdown.machineCriticality.reason },
      { name: 'Prioritas', score: breakdown.issueSeverity.score * breakdown.issueSeverity.weight, reason: breakdown.issueSeverity.reason },
      { name: 'Downtime', score: breakdown.cumulativeDowntime.score * breakdown.cumulativeDowntime.weight, reason: breakdown.cumulativeDowntime.reason },
      { name: 'Blocking', score: breakdown.dependencyChain.score * breakdown.dependencyChain.weight, reason: breakdown.dependencyChain.reason },
    ];

    factors.sort((a, b) => b.score - a.score);

    // Take top 3 non-zero factors
    const topFactors = factors.filter(f => f.score > 0).slice(0, 3);
    topFactors.forEach(f => parts.push(f.reason));

    if (parts.length === 0) {
      return 'Prioritas standar';
    }

    let recommendation = '';
    if (totalScore >= 80) {
      recommendation = 'Rekomendasi: Tangani segera';
    } else if (totalScore >= 60) {
      recommendation = 'Rekomendasi: Prioritaskan';
    } else if (totalScore >= 40) {
      recommendation = 'Rekomendasi: Jadwalkan';
    } else {
      recommendation = 'Rekomendasi: Bisa ditunda';
    }

    return `${parts.join(' + ')}. ${recommendation}`;
  }

  /**
   * Get color class based on score
   */
  private getColorClass(score: number): string {
    if (score >= 80) {
      return 'bg-red-100 text-red-700';
    } else if (score >= 60) {
      return 'bg-orange-100 text-orange-700';
    } else if (score >= 40) {
      return 'bg-yellow-100 text-yellow-700';
    } else {
      return 'bg-green-100 text-green-700';
    }
  }

  /**
   * Get available technicians
   */
  private getAvailableTechnicians(departmentId?: number): DBTechnicianRecord[] {
    let sql = `
      SELECT
        u.id as user_id, u.name as user_name, u.role, u.department_id,
        (SELECT COUNT(*) FROM ticket_assignees ta
         JOIN tickets t ON ta.ticket_id = t.id
         WHERE ta.user_id = u.id AND t.status NOT IN ('done', 'cancelled')) as open_tickets,
        (SELECT COUNT(*) FROM work_order_assignees woa
         JOIN work_orders wo ON woa.work_order_id = wo.id
         WHERE woa.user_id = u.id AND wo.status NOT IN ('completed', 'cancelled')) as open_wos,
        (SELECT AVG(julianday(wo.actual_end) - julianday(wo.actual_start))
         FROM work_order_assignees woa
         JOIN work_orders wo ON woa.work_order_id = wo.id
         WHERE woa.user_id = u.id AND wo.actual_end IS NOT NULL
         LIMIT 20) as avg_resolution_days
      FROM users u
      WHERE u.role IN ('technician', 'operator', 'supervisor')
        AND u.status = 'active'
    `;

    const params: any[] = [];
    if (departmentId) {
      sql += ' AND u.department_id = ?';
      params.push(departmentId);
    }

    return db.prepare(sql).all(...params) as DBTechnicianRecord[];
  }

  /**
   * Calculate technician match score
   */
  private calculateTechnicianMatch(
    tech: DBTechnicianRecord,
    task: { title: string; priority: string; assetId?: number; taskType: string }
  ): TechnicianSuggestion {
    // Calculate workload score (lower is better)
    const totalTasks = (tech.open_tickets || 0) + (tech.open_wos || 0);
    let workloadScore: number;
    if (totalTasks === 0) {
      workloadScore = 100;
    } else if (totalTasks <= 3) {
      workloadScore = 80;
    } else if (totalTasks <= 6) {
      workloadScore = 50;
    } else {
      workloadScore = 20;
    }

    // Calculate skill match score based on past work
    const skillScore = this.calculateSkillMatch(tech.user_id, task.assetId, task.title);

    // Availability score (simplified - assume all active users are available)
    const availabilityScore = 80;

    // Response time score
    let responseScore = 50;
    if (tech.avg_resolution_days) {
      if (tech.avg_resolution_days <= 1) {
        responseScore = 100;
      } else if (tech.avg_resolution_days <= 3) {
        responseScore = 70;
      } else {
        responseScore = 40;
      }
    }

    // Calculate total match score
    const matchScore = Math.round(
      workloadScore * TECH_WEIGHTS.workload +
      skillScore * TECH_WEIGHTS.skillMatch +
      availabilityScore * TECH_WEIGHTS.availability +
      responseScore * TECH_WEIGHTS.responseTime
    );

    // Generate reason
    const reasons: string[] = [];
    if (workloadScore >= 80) reasons.push('Beban kerja rendah');
    if (skillScore >= 70) reasons.push('Pengalaman relevan');
    if (responseScore >= 70) reasons.push('Response cepat');

    return {
      userId: tech.user_id,
      userName: tech.user_name,
      matchScore,
      reason: reasons.length > 0 ? reasons.join(', ') : 'Tersedia',
      currentWorkload: totalTasks,
      skillMatch: skillScore,
      estimatedAvailability: totalTasks <= 3 ? 'Segera' : totalTasks <= 6 ? 'Dalam 1-2 hari' : 'Dalam 3+ hari',
    };
  }

  /**
   * Calculate skill match based on past work history
   */
  private calculateSkillMatch(userId: number, assetId?: number, title?: string): number {
    let score = 50; // Default score

    // Check if technician has worked on the same asset before
    if (assetId) {
      const assetExperience = db
        .prepare(
          `
          SELECT COUNT(*) as count FROM work_order_assignees woa
          JOIN work_orders wo ON woa.work_order_id = wo.id
          WHERE woa.user_id = ? AND wo.asset_id = ? AND wo.status = 'completed'
        `
        )
        .get(userId, assetId) as { count: number };

      if (assetExperience.count > 0) {
        score += Math.min(assetExperience.count * 10, 30); // Up to 30 bonus
      }
    }

    // Check keyword match in past work
    if (title) {
      const keywords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (keywords.length > 0) {
        const likeClause = keywords.map(() => 'wo.title LIKE ?').join(' OR ');
        const likeParams = keywords.map(k => `%${k}%`);

        const keywordMatch = db
          .prepare(
            `
            SELECT COUNT(*) as count FROM work_order_assignees woa
            JOIN work_orders wo ON woa.work_order_id = wo.id
            WHERE woa.user_id = ? AND (${likeClause}) AND wo.status = 'completed'
          `
          )
          .get(userId, ...likeParams) as { count: number };

        if (keywordMatch.count > 0) {
          score += Math.min(keywordMatch.count * 5, 20); // Up to 20 bonus
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of priorityCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        priorityCache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    priorityCache.clear();
  }
}

// Set up periodic cache cleanup every hour
setInterval(() => {
  aiTaskPrioritizer.clearExpiredCache();
}, 60 * 60 * 1000);

// Export singleton
export const aiTaskPrioritizer = new AITaskPrioritizer();
export default aiTaskPrioritizer;
