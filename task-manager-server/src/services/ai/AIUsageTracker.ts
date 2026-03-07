/**
 * AI Usage Tracker Service
 *
 * Centralized service for tracking AI API usage with:
 * - Token counting and estimation
 * - Cost calculation based on OpenAI pricing
 * - Feature-based categorization
 * - Performance metrics
 *
 * Story 7.9: Implement AI Admin Controls & Analytics
 */

import { prepare } from '../../database/db';

// ============================================
// Types
// ============================================

export type AIFeature =
  | 'chatbot'
  | 'smart_wo'
  | 'duplicate_detection'
  | 'task_prioritization'
  | 'predictive_maintenance'
  | 'report_generation'
  | 'root_cause_analysis'
  | 'writing_assistant'
  | 'pm_suggestion';

export type AIModel = 'gpt-4o' | 'gpt-4o-mini' | 'gpt-3.5-turbo' | 'text-embedding-3-small';

export interface AIUsageLogEntry {
  userId: number;
  feature: AIFeature;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  responseTimeMs: number;
  success: boolean;
  errorMessage?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

// ============================================
// OpenAI Pricing (per 1M tokens, as of 2024)
// ============================================

const OPENAI_PRICING: Record<AIModel, { input: number; output: number }> = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'text-embedding-3-small': { input: 0.02, output: 0 },
};

// ============================================
// AI Usage Tracker Service
// ============================================

export class AIUsageTracker {
  /**
   * Log AI usage to database
   */
  logUsage(entry: AIUsageLogEntry): void {
    try {
      const totalTokens = entry.inputTokens + entry.outputTokens;
      const estimatedCost = this.calculateCost(entry.model, entry.inputTokens, entry.outputTokens);

      prepare(`
        INSERT INTO ai_usage_logs (
          user_id, endpoint, model, tokens_input, tokens_output,
          tokens_total, estimated_cost, response_time_ms, success, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        entry.userId,
        entry.feature,
        entry.model,
        entry.inputTokens,
        entry.outputTokens,
        totalTokens,
        estimatedCost,
        entry.responseTimeMs,
        entry.success ? 1 : 0,
        entry.errorMessage || null
      );
    } catch (error) {
      // Silent fail - logging should not break AI functionality
      // Error is not logged to avoid console pollution in production
    }
  }

  /**
   * Calculate cost based on OpenAI pricing
   */
  calculateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    const pricing = OPENAI_PRICING[model] || OPENAI_PRICING['gpt-3.5-turbo'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return Number((inputCost + outputCost).toFixed(6));
  }

  /**
   * Estimate token count from text (rough approximation)
   * Rule of thumb: ~4 characters per token for English, ~2-3 for Indonesian
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    // Average of 3 characters per token for mixed content
    return Math.ceil(text.length / 3);
  }

  /**
   * Extract token usage from OpenAI response
   */
  extractTokenUsage(response: any): TokenUsage {
    if (response?.usage) {
      return {
        inputTokens: response.usage.prompt_tokens || 0,
        outputTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      };
    }
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  /**
   * Create a tracking wrapper for AI calls
   * Returns a function to call after the AI operation completes
   */
  startTracking(userId: number, feature: AIFeature, model: AIModel): {
    complete: (response: any, success: boolean, error?: string) => void;
    startTime: number;
  } {
    const startTime = Date.now();

    return {
      startTime,
      complete: (response: any, success: boolean, error?: string) => {
        const responseTimeMs = Date.now() - startTime;
        const usage = this.extractTokenUsage(response);

        this.logUsage({
          userId,
          feature,
          model,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          responseTimeMs,
          success,
          errorMessage: error,
        });
      },
    };
  }

  /**
   * Track AI call with async wrapper
   */
  async trackCall<T>(
    userId: number,
    feature: AIFeature,
    model: AIModel,
    operation: () => Promise<{ response: T; rawResponse?: any }>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const responseTimeMs = Date.now() - startTime;
      const usage = this.extractTokenUsage(result.rawResponse);

      this.logUsage({
        userId,
        feature,
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        responseTimeMs,
        success: true,
      });

      return result.response;
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      this.logUsage({
        userId,
        feature,
        model,
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs,
        success: false,
        errorMessage: error?.message || 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Get usage statistics by feature
   */
  getUsageByFeature(days: number = 30): Array<{
    feature: AIFeature;
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    avgResponseTime: number;
    successRate: number;
  }> {
    const rows = prepare(`
      SELECT
        endpoint as feature,
        COUNT(*) as totalCalls,
        COALESCE(SUM(tokens_total), 0) as totalTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COALESCE(AVG(response_time_ms), 0) as avgResponseTime,
        ROUND(SUM(CASE WHEN success = 1 THEN 1.0 ELSE 0 END) / COUNT(*) * 100, 1) as successRate
      FROM ai_usage_logs
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY endpoint
      ORDER BY totalCalls DESC
    `).all(days) as any[];

    return rows.map(r => ({
      feature: r.feature as AIFeature,
      totalCalls: r.totalCalls,
      totalTokens: r.totalTokens,
      totalCost: r.totalCost,
      avgResponseTime: Math.round(r.avgResponseTime),
      successRate: r.successRate,
    }));
  }

  /**
   * Get daily usage statistics
   */
  getDailyUsage(days: number = 30): Array<{
    date: string;
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    uniqueUsers: number;
  }> {
    return prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as totalCalls,
        COALESCE(SUM(tokens_total), 0) as totalTokens,
        COALESCE(SUM(estimated_cost), 0) as totalCost,
        COUNT(DISTINCT user_id) as uniqueUsers
      FROM ai_usage_logs
      WHERE created_at >= datetime('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date DESC
    `).all(days) as any[];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    errorRate: number;
    totalCalls: number;
  } {
    const stats = prepare(`
      SELECT
        COALESCE(AVG(response_time_ms), 0) as avgResponseTime,
        COUNT(*) as totalCalls,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errorCount
      FROM ai_usage_logs
      WHERE created_at >= datetime('now', '-30 days')
    `).get() as any;

    // Get P95 response time
    const p95 = prepare(`
      SELECT response_time_ms
      FROM ai_usage_logs
      WHERE created_at >= datetime('now', '-30 days')
      ORDER BY response_time_ms DESC
      LIMIT 1 OFFSET (
        SELECT CAST(COUNT(*) * 0.05 AS INTEGER)
        FROM ai_usage_logs
        WHERE created_at >= datetime('now', '-30 days')
      )
    `).get() as any;

    const totalCalls = stats?.totalCalls || 0;

    return {
      avgResponseTime: Math.round(stats?.avgResponseTime || 0),
      p95ResponseTime: p95?.response_time_ms || 0,
      successRate: totalCalls > 0 ? Math.round((stats.successCount / totalCalls) * 100) : 100,
      errorRate: totalCalls > 0 ? Math.round((stats.errorCount / totalCalls) * 100) : 0,
      totalCalls,
    };
  }

  /**
   * Get top users by AI usage
   */
  getTopUsers(limit: number = 10): Array<{
    userId: number;
    userName: string;
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
  }> {
    return prepare(`
      SELECT
        al.user_id as userId,
        u.name as userName,
        COUNT(*) as totalCalls,
        COALESCE(SUM(al.tokens_total), 0) as totalTokens,
        COALESCE(SUM(al.estimated_cost), 0) as totalCost
      FROM ai_usage_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.created_at >= datetime('now', '-30 days')
      GROUP BY al.user_id
      ORDER BY totalCalls DESC
      LIMIT ?
    `).all(limit) as any[];
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 20): Array<{
    id: number;
    userId: number;
    userName: string;
    feature: AIFeature;
    model: AIModel;
    errorMessage: string;
    createdAt: string;
  }> {
    return prepare(`
      SELECT
        al.id,
        al.user_id as userId,
        u.name as userName,
        al.endpoint as feature,
        al.model,
        al.error_message as errorMessage,
        al.created_at as createdAt
      FROM ai_usage_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.success = 0
      ORDER BY al.created_at DESC
      LIMIT ?
    `).all(limit) as any[];
  }

  /**
   * Get cost summary
   */
  getCostSummary(): {
    todayCost: number;
    weekCost: number;
    monthCost: number;
    todayTokens: number;
    weekTokens: number;
    monthTokens: number;
  } {
    const today = prepare(`
      SELECT
        COALESCE(SUM(estimated_cost), 0) as cost,
        COALESCE(SUM(tokens_total), 0) as tokens
      FROM ai_usage_logs
      WHERE date(created_at) = date('now')
    `).get() as any;

    const week = prepare(`
      SELECT
        COALESCE(SUM(estimated_cost), 0) as cost,
        COALESCE(SUM(tokens_total), 0) as tokens
      FROM ai_usage_logs
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as any;

    const month = prepare(`
      SELECT
        COALESCE(SUM(estimated_cost), 0) as cost,
        COALESCE(SUM(tokens_total), 0) as tokens
      FROM ai_usage_logs
      WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
    `).get() as any;

    return {
      todayCost: today?.cost || 0,
      weekCost: week?.cost || 0,
      monthCost: month?.cost || 0,
      todayTokens: today?.tokens || 0,
      weekTokens: week?.tokens || 0,
      monthTokens: month?.tokens || 0,
    };
  }
}

// Export singleton
export const aiUsageTracker = new AIUsageTracker();
export default aiUsageTracker;
