/**
 * AI Settings Service - Manages AI feature settings and usage tracking
 */

import db, { prepare } from '../../database/db';

export interface AIUsageStats {
  today: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    estimatedCost: number;
    avgResponseTime: number;
  };
  thisMonth: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    totalTokens: number;
    estimatedCost: number;
  };
  byEndpoint: Array<{
    endpoint: string;
    calls: number;
    tokens: number;
    cost: number;
  }>;
  byUser: Array<{
    userId: number;
    userName: string;
    calls: number;
    tokens: number;
  }>;
  recentErrors: Array<{
    id: number;
    userId: number;
    userName: string;
    endpoint: string;
    errorMessage: string;
    createdAt: string;
  }>;
}

export interface AISetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_by: number | null;
  updated_at: string;
}

export class AISettingsService {
  /**
   * Get all AI settings
   */
  getSettings(): AISetting[] {
    try {
      return prepare(`
        SELECT * FROM ai_settings ORDER BY setting_key
      `).all() as AISetting[];
    } catch {
      // Return defaults if table doesn't exist
      return this.getDefaultSettings();
    }
  }

  /**
   * Get a specific setting value
   */
  getSetting(key: string): string | null {
    try {
      const row = prepare(`
        SELECT setting_value FROM ai_settings WHERE setting_key = ?
      `).get(key) as { setting_value: string } | undefined;
      return row?.setting_value || null;
    } catch {
      return null;
    }
  }

  /**
   * Update a setting
   */
  updateSetting(key: string, value: string, updatedBy: number): boolean {
    try {
      const result = prepare(`
        UPDATE ai_settings
        SET setting_value = ?, updated_by = ?, updated_at = datetime('now')
        WHERE setting_key = ?
      `).run(value, updatedBy, key);
      return result.changes > 0;
    } catch (error) {
      console.error('Update AI setting error:', error);
      return false;
    }
  }

  /**
   * Update multiple settings at once
   */
  updateSettings(settings: Record<string, string>, updatedBy: number): boolean {
    try {
      const stmt = prepare(`
        UPDATE ai_settings
        SET setting_value = ?, updated_by = ?, updated_at = datetime('now')
        WHERE setting_key = ?
      `);

      for (const [key, value] of Object.entries(settings)) {
        stmt.run(value, updatedBy, key);
      }
      return true;
    } catch (error) {
      console.error('Update AI settings error:', error);
      return false;
    }
  }

  /**
   * Log AI usage
   */
  logUsage(data: {
    userId: number;
    endpoint: string;
    model?: string;
    tokensInput?: number;
    tokensOutput?: number;
    tokensTotal?: number;
    estimatedCost?: number;
    responseTimeMs?: number;
    success?: boolean;
    errorMessage?: string;
  }): void {
    try {
      prepare(`
        INSERT INTO ai_usage_logs (
          user_id, endpoint, model, tokens_input, tokens_output,
          tokens_total, estimated_cost, response_time_ms, success, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.userId,
        data.endpoint,
        data.model || 'gpt-3.5-turbo',
        data.tokensInput || 0,
        data.tokensOutput || 0,
        data.tokensTotal || 0,
        data.estimatedCost || 0,
        data.responseTimeMs || 0,
        data.success !== false ? 1 : 0,
        data.errorMessage || null
      );
    } catch (error) {
      console.error('Log AI usage error:', error);
    }
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): AIUsageStats {
    try {
      // Today's stats
      const todayStats = prepare(`
        SELECT
          COUNT(*) as totalCalls,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulCalls,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedCalls,
          COALESCE(SUM(tokens_total), 0) as totalTokens,
          COALESCE(SUM(estimated_cost), 0) as estimatedCost,
          COALESCE(AVG(response_time_ms), 0) as avgResponseTime
        FROM ai_usage_logs
        WHERE date(created_at) = date('now')
      `).get() as any;

      // This month's stats
      const monthStats = prepare(`
        SELECT
          COUNT(*) as totalCalls,
          SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successfulCalls,
          SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failedCalls,
          COALESCE(SUM(tokens_total), 0) as totalTokens,
          COALESCE(SUM(estimated_cost), 0) as estimatedCost
        FROM ai_usage_logs
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
      `).get() as any;

      // By endpoint (this month)
      const byEndpoint = prepare(`
        SELECT
          endpoint,
          COUNT(*) as calls,
          COALESCE(SUM(tokens_total), 0) as tokens,
          COALESCE(SUM(estimated_cost), 0) as cost
        FROM ai_usage_logs
        WHERE strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
        GROUP BY endpoint
        ORDER BY calls DESC
        LIMIT 10
      `).all() as any[];

      // By user (this month)
      const byUser = prepare(`
        SELECT
          al.user_id as userId,
          u.name as userName,
          COUNT(*) as calls,
          COALESCE(SUM(al.tokens_total), 0) as tokens
        FROM ai_usage_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE strftime('%Y-%m', al.created_at) = strftime('%Y-%m', 'now')
        GROUP BY al.user_id
        ORDER BY calls DESC
        LIMIT 10
      `).all() as any[];

      // Recent errors
      const recentErrors = prepare(`
        SELECT
          al.id,
          al.user_id as userId,
          u.name as userName,
          al.endpoint,
          al.error_message as errorMessage,
          al.created_at as createdAt
        FROM ai_usage_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.success = 0
        ORDER BY al.created_at DESC
        LIMIT 10
      `).all() as any[];

      return {
        today: {
          totalCalls: todayStats.totalCalls || 0,
          successfulCalls: todayStats.successfulCalls || 0,
          failedCalls: todayStats.failedCalls || 0,
          totalTokens: todayStats.totalTokens || 0,
          estimatedCost: todayStats.estimatedCost || 0,
          avgResponseTime: Math.round(todayStats.avgResponseTime || 0),
        },
        thisMonth: {
          totalCalls: monthStats.totalCalls || 0,
          successfulCalls: monthStats.successfulCalls || 0,
          failedCalls: monthStats.failedCalls || 0,
          totalTokens: monthStats.totalTokens || 0,
          estimatedCost: monthStats.estimatedCost || 0,
        },
        byEndpoint,
        byUser,
        recentErrors,
      };
    } catch (error) {
      console.error('Get AI usage stats error:', error);
      return {
        today: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalTokens: 0,
          estimatedCost: 0,
          avgResponseTime: 0,
        },
        thisMonth: {
          totalCalls: 0,
          successfulCalls: 0,
          failedCalls: 0,
          totalTokens: 0,
          estimatedCost: 0,
        },
        byEndpoint: [],
        byUser: [],
        recentErrors: [],
      };
    }
  }

  /**
   * Check if user has exceeded rate limit
   */
  checkRateLimit(userId: number): { allowed: boolean; remaining: number; resetAt: string } {
    try {
      const limitPerHour = parseInt(this.getSetting('ai_rate_limit_per_user_per_hour') || '50');

      const usageThisHour = prepare(`
        SELECT COUNT(*) as count
        FROM ai_usage_logs
        WHERE user_id = ?
          AND created_at >= datetime('now', '-1 hour')
      `).get(userId) as { count: number };

      const remaining = Math.max(0, limitPerHour - usageThisHour.count);
      const resetAt = new Date(Date.now() + 3600000).toISOString();

      return {
        allowed: remaining > 0,
        remaining,
        resetAt,
      };
    } catch {
      return { allowed: true, remaining: 50, resetAt: '' };
    }
  }

  /**
   * Check if AI is enabled for a specific role
   */
  isAIEnabledForRole(role: string): boolean {
    try {
      const masterEnabled = this.getSetting('ai_enabled') === 'true';
      if (!masterEnabled) return false;

      const allowedRoles = this.getSetting('ai_allowed_roles') || '';
      return allowedRoles.split(',').map(r => r.trim()).includes(role);
    } catch {
      return true; // Default to enabled if settings table doesn't exist
    }
  }

  /**
   * Get feature status
   */
  getFeatureStatus(): Record<string, boolean> {
    return {
      ai_enabled: this.getSetting('ai_enabled') === 'true',
      chatbot: this.getSetting('ai_chatbot_enabled') === 'true',
      writingAssistant: this.getSetting('ai_writing_assistant_enabled') === 'true',
      smartAssignment: this.getSetting('ai_smart_assignment_enabled') === 'true',
      priorityRecommendations: this.getSetting('ai_priority_recommendations_enabled') === 'true',
      predictiveMaintenance: this.getSetting('ai_predictive_maintenance_enabled') === 'true',
      rootCauseAnalysis: this.getSetting('ai_root_cause_analysis_enabled') === 'true',
      smartWO: this.getSetting('ai_smart_wo_enabled') === 'true',
      duplicateDetection: this.getSetting('ai_duplicate_detection_enabled') === 'true',
      reportGeneration: this.getSetting('ai_report_generation_enabled') === 'true',
      pmSuggestion: this.getSetting('ai_pm_suggestion_enabled') === 'true',
    };
  }

  /**
   * Check if a specific AI feature is enabled for a role
   */
  isFeatureEnabledForRole(feature: string, role: string): boolean {
    try {
      // First check if master switch is on
      const masterEnabled = this.getSetting('ai_enabled') === 'true';
      if (!masterEnabled) return false;

      // Check feature-specific global toggle
      const featureSettingKey = `ai_${feature}_enabled`;
      const featureEnabled = this.getSetting(featureSettingKey);
      if (featureEnabled === 'false') return false;

      // Check role-specific toggle from ai_feature_toggles table
      const toggle = prepare(`
        SELECT enabled FROM ai_feature_toggles
        WHERE feature = ? AND role = ?
      `).get(feature, role) as { enabled: number } | undefined;

      // Default to enabled if no specific toggle found
      return toggle ? toggle.enabled === 1 : true;
    } catch {
      return true; // Default to enabled if table doesn't exist
    }
  }

  /**
   * Get all feature toggles for all roles
   */
  getAllFeatureToggles(): Array<{
    feature: string;
    role: string;
    enabled: boolean;
  }> {
    try {
      const rows = prepare(`
        SELECT feature, role, enabled
        FROM ai_feature_toggles
        ORDER BY feature, role
      `).all() as { feature: string; role: string; enabled: number }[];

      return rows.map(r => ({
        feature: r.feature,
        role: r.role,
        enabled: r.enabled === 1,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Get feature toggles for a specific feature
   */
  getFeatureToggles(feature: string): Record<string, boolean> {
    try {
      const rows = prepare(`
        SELECT role, enabled
        FROM ai_feature_toggles
        WHERE feature = ?
      `).all(feature) as { role: string; enabled: number }[];

      const result: Record<string, boolean> = {};
      rows.forEach(r => {
        result[r.role] = r.enabled === 1;
      });
      return result;
    } catch {
      return {};
    }
  }

  /**
   * Update feature toggle for a specific feature and role
   */
  updateFeatureToggle(
    feature: string,
    role: string,
    enabled: boolean,
    updatedBy: number
  ): boolean {
    try {
      const result = prepare(`
        UPDATE ai_feature_toggles
        SET enabled = ?, updated_by = ?, updated_at = datetime('now')
        WHERE feature = ? AND role = ?
      `).run(enabled ? 1 : 0, updatedBy, feature, role);

      return result.changes > 0;
    } catch (error) {
      console.error('Update feature toggle error:', error);
      return false;
    }
  }

  /**
   * Bulk update feature toggles
   */
  bulkUpdateFeatureToggles(
    updates: Array<{ feature: string; role: string; enabled: boolean }>,
    updatedBy: number
  ): boolean {
    try {
      const stmt = prepare(`
        UPDATE ai_feature_toggles
        SET enabled = ?, updated_by = ?, updated_at = datetime('now')
        WHERE feature = ? AND role = ?
      `);

      for (const update of updates) {
        stmt.run(update.enabled ? 1 : 0, updatedBy, update.feature, update.role);
      }
      return true;
    } catch (error) {
      console.error('Bulk update feature toggles error:', error);
      return false;
    }
  }

  /**
   * Get available AI features list
   */
  getAvailableFeatures(): string[] {
    return [
      'chatbot',
      'smart_wo',
      'duplicate_detection',
      'task_prioritization',
      'predictive_maintenance',
      'report_generation',
      'root_cause_analysis',
      'writing_assistant',
      'pm_suggestion',
    ];
  }

  /**
   * Get feature availability for current user role
   */
  getFeatureAvailabilityForRole(role: string): Record<string, boolean> {
    const features = this.getAvailableFeatures();
    const result: Record<string, boolean> = {};

    for (const feature of features) {
      result[feature] = this.isFeatureEnabledForRole(feature, role);
    }

    return result;
  }

  /**
   * Get API Key status (masked display)
   * Story 7.9 - Task 8.4
   */
  getAPIKeyStatus(): {
    configured: boolean;
    lastUpdated: string | null;
    maskedKey: string | null;
  } {
    try {
      const row = prepare(`
        SELECT setting_value, updated_at
        FROM ai_settings
        WHERE setting_key = 'openai_api_key'
      `).get() as { setting_value: string; updated_at: string } | undefined;

      if (!row || !row.setting_value) {
        return { configured: false, lastUpdated: null, maskedKey: null };
      }

      // Mask the API key for display (show first 7 chars and last 4)
      const key = row.setting_value;
      const maskedKey = key.length > 11
        ? `${key.substring(0, 7)}...${key.substring(key.length - 4)}`
        : '***';

      return {
        configured: true,
        lastUpdated: row.updated_at,
        maskedKey,
      };
    } catch {
      return { configured: false, lastUpdated: null, maskedKey: null };
    }
  }

  /**
   * Update OpenAI API Key
   * Story 7.9 - Task 8.4
   */
  updateAPIKey(apiKey: string, updatedBy: number): boolean {
    try {
      // First try to update existing record
      const result = prepare(`
        UPDATE ai_settings
        SET setting_value = ?, updated_by = ?, updated_at = datetime('now')
        WHERE setting_key = 'openai_api_key'
      `).run(apiKey, updatedBy);

      if (result.changes === 0) {
        // Insert if not exists
        prepare(`
          INSERT INTO ai_settings (setting_key, setting_value, description, updated_by, updated_at)
          VALUES ('openai_api_key', ?, 'OpenAI API Key', ?, datetime('now'))
        `).run(apiKey, updatedBy);
      }

      // Also update environment variable for current session
      process.env.OPENAI_API_KEY = apiKey;

      return true;
    } catch (error) {
      console.error('Update API key error:', error);
      return false;
    }
  }

  private getDefaultSettings(): AISetting[] {
    return [
      { id: 1, setting_key: 'ai_enabled', setting_value: 'true', description: 'Master switch for AI features', updated_by: null, updated_at: '' },
      { id: 2, setting_key: 'ai_chatbot_enabled', setting_value: 'true', description: 'Enable AI Chatbot globally', updated_by: null, updated_at: '' },
      { id: 3, setting_key: 'ai_writing_assistant_enabled', setting_value: 'true', description: 'Enable AI Writing Assistant', updated_by: null, updated_at: '' },
      { id: 4, setting_key: 'ai_smart_assignment_enabled', setting_value: 'true', description: 'Enable AI Smart Assignment', updated_by: null, updated_at: '' },
      { id: 5, setting_key: 'ai_priority_recommendations_enabled', setting_value: 'true', description: 'Enable AI Priority Recommendations', updated_by: null, updated_at: '' },
    ];
  }
}

export const aiSettingsService = new AISettingsService();
export default aiSettingsService;
