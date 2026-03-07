/**
 * Predictive Maintenance Service
 *
 * AI-powered service for predicting machine breakdown risk based on historical patterns
 * Story 7.6: Create Predictive Maintenance Analysis
 */

import OpenAI from 'openai';
import db from '../../database/db';
import { aiUsageTracker } from './AIUsageTracker';

// ============================================
// Types
// ============================================

export interface RiskFactors {
  daysSinceLastPM: number;
  breakdownCount90Days: number;
  averageMTBF: number;
  machineAgeYears: number;
  patternMatchScore: number;
}

export interface RiskFactorBreakdown {
  daysSinceLastPM: { value: number; score: number; };
  breakdownCount90Days: { value: number; score: number; };
  averageMTBF: { value: number; score: number; };
  machineAgeYears: { value: number; score: number; };
  patternMatchScore: { value: number; score: number; };
}

export interface SimilarIncident {
  date: string;
  description: string;
  resolution: string;
  similarity_score: number;
}

export interface Recommendation {
  priority: 'immediate' | 'short_term' | 'long_term';
  action: string;
  reasoning: string;
}

export interface MachinePrediction {
  machine_id: number;
  machine_name: string;
  risk_score: number;
  predicted_failure_window: string;
  reasoning: string;
  confidence_level: 'low' | 'medium' | 'high';
  factors: RiskFactorBreakdown;
  similar_incidents: SimilarIncident[];
  recommendations: Recommendation[];
}

export interface MachineData {
  id: number;
  name: string;
  asset_code: string;
  category_name: string;
  installation_date: string | null;
  last_pm_date: string | null;
  breakdown_count_90_days: number;
  avg_mtbf_hours: number;
  total_downtime_hours: number;
  recent_issues: string[];
}

// ============================================
// Predictive Maintenance Service
// ============================================

export class PredictiveMaintenanceService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze a single machine and generate prediction
   */
  async analyzeMachine(machineId: number): Promise<MachinePrediction> {
    // Gather all data for this machine
    const machineData = await this.gatherMachineData(machineId);

    // Calculate risk factors
    const factors = this.calculateRiskFactors(machineData);

    // Calculate overall risk score
    const riskScore = this.calculateRiskScore(factors);

    // Find similar historical incidents
    const similarIncidents = await this.findSimilarIncidents(machineId, machineData.recent_issues);

    // Generate AI reasoning and recommendations
    const { reasoning, recommendations, predictedWindow, confidenceLevel } =
      await this.generateReasoning(machineData, factors, riskScore, similarIncidents);

    return {
      machine_id: machineId,
      machine_name: machineData.name,
      risk_score: riskScore,
      predicted_failure_window: predictedWindow,
      reasoning,
      confidence_level: confidenceLevel,
      factors: this.buildFactorBreakdown(factors, machineData),
      similar_incidents: similarIncidents,
      recommendations,
    };
  }

  /**
   * Gather comprehensive data for a machine
   */
  private async gatherMachineData(machineId: number): Promise<MachineData> {
    // Get basic machine info
    const machine = db.prepare(`
      SELECT
        a.id, a.name, a.asset_code, a.installation_date,
        ac.name as category_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      WHERE a.id = ?
    `).get(machineId) as any;

    if (!machine) {
      throw new Error(`Machine with ID ${machineId} not found`);
    }

    // Get last PM date
    const lastPM = db.prepare(`
      SELECT MAX(actual_end) as last_pm_date
      FROM work_orders
      WHERE asset_id = ? AND type = 'preventive' AND status = 'completed'
    `).get(machineId) as any;

    // Get breakdown count in last 90 days
    const breakdownCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM downtime_logs
      WHERE asset_id = ?
        AND downtime_type = 'unplanned'
        AND start_time >= datetime('now', '-90 days')
    `).get(machineId) as any;

    // Calculate average MTBF (Mean Time Between Failures)
    const mtbfData = db.prepare(`
      SELECT
        COUNT(*) as failure_count,
        (julianday('now') - julianday(MIN(start_time))) * 24 as total_hours
      FROM downtime_logs
      WHERE asset_id = ?
        AND downtime_type = 'unplanned'
        AND start_time >= datetime('now', '-365 days')
    `).get(machineId) as any;

    const avgMTBF = mtbfData.failure_count > 1
      ? mtbfData.total_hours / mtbfData.failure_count
      : 8760; // Default to 1 year if no failures

    // Get total downtime hours
    const downtimeData = db.prepare(`
      SELECT COALESCE(SUM(duration_minutes), 0) / 60.0 as total_hours
      FROM downtime_logs
      WHERE asset_id = ?
        AND start_time >= datetime('now', '-90 days')
    `).get(machineId) as any;

    // Get recent issues/reasons
    const recentIssues = db.prepare(`
      SELECT DISTINCT reason
      FROM downtime_logs
      WHERE asset_id = ?
        AND reason IS NOT NULL AND reason != ''
        AND start_time >= datetime('now', '-90 days')
      ORDER BY start_time DESC
      LIMIT 5
    `).all(machineId) as any[];

    return {
      id: machine.id,
      name: machine.name,
      asset_code: machine.asset_code,
      category_name: machine.category_name || 'Uncategorized',
      installation_date: machine.installation_date,
      last_pm_date: lastPM?.last_pm_date || null,
      breakdown_count_90_days: breakdownCount?.count || 0,
      avg_mtbf_hours: avgMTBF,
      total_downtime_hours: downtimeData?.total_hours || 0,
      recent_issues: recentIssues.map(r => r.reason),
    };
  }

  /**
   * Calculate risk factors from machine data
   */
  private calculateRiskFactors(data: MachineData): RiskFactors {
    // Days since last PM
    let daysSinceLastPM = 365; // Default if no PM recorded
    if (data.last_pm_date) {
      const lastPM = new Date(data.last_pm_date);
      const now = new Date();
      daysSinceLastPM = Math.floor((now.getTime() - lastPM.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Machine age in years
    let machineAgeYears = 5; // Default
    if (data.installation_date) {
      const installDate = new Date(data.installation_date);
      const now = new Date();
      machineAgeYears = (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    }

    return {
      daysSinceLastPM,
      breakdownCount90Days: data.breakdown_count_90_days,
      averageMTBF: data.avg_mtbf_hours,
      machineAgeYears,
      patternMatchScore: 0, // Will be calculated by AI
    };
  }

  /**
   * Calculate overall risk score (0-100)
   */
  calculateRiskScore(factors: RiskFactors): number {
    const weights = {
      pmOverdue: 0.25,
      breakdownFreq: 0.25,
      mtbfRisk: 0.20,
      ageRisk: 0.15,
      patternMatch: 0.15,
    };

    // Normalize PM overdue (0-100)
    // 0 days = 0 risk, 30+ days = 100 risk
    const pmScore = Math.min(100, (factors.daysSinceLastPM / 30) * 100);

    // Normalize breakdown frequency (0-100)
    // 0 breakdowns = 0 risk, 5+ breakdowns = 100 risk
    const breakdownScore = Math.min(100, (factors.breakdownCount90Days / 5) * 100);

    // Normalize MTBF (0-100) - inverse relationship
    // 720+ hours (30 days) = 0 risk, 24 hours = 100 risk
    const mtbfScore = Math.max(0, Math.min(100, 100 - ((factors.averageMTBF - 24) / 696) * 100));

    // Normalize age (0-100)
    // 0 years = 0 risk, 10+ years = 100 risk
    const ageScore = Math.min(100, (factors.machineAgeYears / 10) * 100);

    // Pattern match score (already 0-100)
    const patternScore = factors.patternMatchScore;

    const totalScore =
      (pmScore * weights.pmOverdue) +
      (breakdownScore * weights.breakdownFreq) +
      (mtbfScore * weights.mtbfRisk) +
      (ageScore * weights.ageRisk) +
      (patternScore * weights.patternMatch);

    return Math.min(100, Math.max(0, Math.round(totalScore)));
  }

  /**
   * Build factor breakdown for response
   */
  private buildFactorBreakdown(factors: RiskFactors, data: MachineData): RiskFactorBreakdown {
    return {
      daysSinceLastPM: {
        value: factors.daysSinceLastPM,
        score: Math.min(100, (factors.daysSinceLastPM / 30) * 100),
      },
      breakdownCount90Days: {
        value: factors.breakdownCount90Days,
        score: Math.min(100, (factors.breakdownCount90Days / 5) * 100),
      },
      averageMTBF: {
        value: Math.round(factors.averageMTBF),
        score: Math.max(0, Math.min(100, 100 - ((factors.averageMTBF - 24) / 696) * 100)),
      },
      machineAgeYears: {
        value: Math.round(factors.machineAgeYears * 10) / 10,
        score: Math.min(100, (factors.machineAgeYears / 10) * 100),
      },
      patternMatchScore: {
        value: factors.patternMatchScore,
        score: factors.patternMatchScore,
      },
    };
  }

  /**
   * Find similar historical incidents
   */
  async findSimilarIncidents(machineId: number, recentIssues: string[]): Promise<SimilarIncident[]> {
    if (recentIssues.length === 0) {
      return [];
    }

    // Get historical work orders with similar issues
    const historicalWOs = db.prepare(`
      SELECT
        wo.created_at as date,
        wo.title as description,
        wo.solution as resolution,
        wo.root_cause
      FROM work_orders wo
      WHERE wo.asset_id = ?
        AND wo.status = 'completed'
        AND wo.solution IS NOT NULL
      ORDER BY wo.created_at DESC
      LIMIT 10
    `).all(machineId) as any[];

    // Simple keyword matching for similarity
    return historicalWOs
      .map(wo => {
        const issueKeywords = recentIssues.join(' ').toLowerCase();
        const woText = `${wo.description} ${wo.root_cause || ''}`.toLowerCase();

        // Calculate simple similarity based on keyword overlap
        const issueWords = issueKeywords.split(/\s+/);
        const matchCount = issueWords.filter(word => woText.includes(word)).length;
        const similarity = Math.min(100, (matchCount / Math.max(1, issueWords.length)) * 100);

        return {
          date: wo.date,
          description: wo.description,
          resolution: wo.resolution || 'Tidak ada solusi tercatat',
          similarity_score: Math.round(similarity),
        };
      })
      .filter(incident => incident.similarity_score > 20)
      .slice(0, 5);
  }

  /**
   * Generate AI reasoning and recommendations
   */
  async generateReasoning(
    machineData: MachineData,
    factors: RiskFactors,
    riskScore: number,
    similarIncidents: SimilarIncident[],
    userId: number = 0
  ): Promise<{
    reasoning: string;
    recommendations: Recommendation[];
    predictedWindow: string;
    confidenceLevel: 'low' | 'medium' | 'high';
  }> {
    const startTime = Date.now();
    try {
      const prompt = `Kamu adalah AI maintenance analyst untuk pabrik thermoforming. Analisis data mesin berikut dan berikan prediksi risiko breakdown.

DATA MESIN:
- Nama: ${machineData.name}
- Kode: ${machineData.asset_code}
- Kategori: ${machineData.category_name}
- Usia: ${Math.round(factors.machineAgeYears * 10) / 10} tahun
- Hari sejak PM terakhir: ${factors.daysSinceLastPM}
- Jumlah breakdown (90 hari): ${factors.breakdownCount90Days}
- Rata-rata MTBF: ${Math.round(factors.averageMTBF)} jam
- Total downtime (90 hari): ${machineData.total_downtime_hours.toFixed(1)} jam

MASALAH TERBARU:
${machineData.recent_issues.length > 0 ? machineData.recent_issues.join('\n') : 'Tidak ada masalah tercatat'}

INSIDEN SERUPA SEBELUMNYA:
${similarIncidents.length > 0
  ? similarIncidents.map(i => `- ${i.description} (${i.date}): ${i.resolution}`).join('\n')
  : 'Tidak ada insiden serupa'}

RISK SCORE: ${riskScore}/100

Berikan analisis dalam format JSON:
{
  "reasoning": "Penjelasan lengkap tentang risiko breakdown dalam 2-3 paragraf bahasa Indonesia",
  "predicted_window": "estimasi waktu potensial breakdown (contoh: '7-14 hari' atau '2-4 minggu')",
  "confidence_level": "low|medium|high",
  "recommendations": [
    {"priority": "immediate|short_term|long_term", "action": "tindakan spesifik", "reasoning": "alasan"}
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'Kamu adalah AI maintenance analyst expert. Berikan analisis yang akurat dan rekomendasi yang actionable dalam bahasa Indonesia. Respons HANYA dalam format JSON yang valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      // Track AI usage
      const usage = aiUsageTracker.extractTokenUsage(response);
      aiUsageTracker.logUsage({
        userId,
        feature: 'predictive_maintenance',
        model: 'gpt-4o',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        responseTimeMs: Date.now() - startTime,
        success: true,
      });

      const content = response.choices[0].message.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          reasoning: result.reasoning || 'Tidak dapat menghasilkan analisis',
          recommendations: result.recommendations || [],
          predictedWindow: result.predicted_window || 'Tidak dapat diprediksi',
          confidenceLevel: result.confidence_level || 'low',
        };
      }
    } catch (error: any) {
      // Track error
      aiUsageTracker.logUsage({
        userId,
        feature: 'predictive_maintenance',
        model: 'gpt-4o',
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage: error?.message || 'AI reasoning generation error',
      });
      console.error('AI reasoning generation error:', error);
    }

    // Fallback response
    return {
      reasoning: `Mesin ${machineData.name} memiliki risk score ${riskScore}/100. Perlu perhatian lebih lanjut berdasarkan data historis.`,
      recommendations: [
        {
          priority: riskScore > 85 ? 'immediate' : 'short_term',
          action: 'Lakukan inspeksi preventive maintenance',
          reasoning: 'Berdasarkan risk score yang tinggi',
        },
      ],
      predictedWindow: riskScore > 85 ? '1-7 hari' : riskScore > 70 ? '7-14 hari' : '14-30 hari',
      confidenceLevel: 'low',
    };
  }

  /**
   * Store prediction in database
   */
  async storePrediction(prediction: MachinePrediction): Promise<number> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const result = db.prepare(`
      INSERT INTO ai_predictions (
        machine_id, risk_score, predicted_failure_window, reasoning,
        confidence_level, factors, similar_incidents, recommendations,
        created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `).run(
      prediction.machine_id,
      prediction.risk_score,
      prediction.predicted_failure_window,
      prediction.reasoning,
      prediction.confidence_level,
      JSON.stringify(prediction.factors),
      JSON.stringify(prediction.similar_incidents),
      JSON.stringify(prediction.recommendations),
      expiresAt.toISOString()
    );

    return Number(result.lastInsertRowid);
  }

  /**
   * Get high-risk predictions
   */
  getHighRiskPredictions(minRiskScore: number = 70, limit: number = 10): any[] {
    return db.prepare(`
      SELECT
        p.id, p.machine_id, p.risk_score, p.predicted_failure_window,
        p.confidence_level, p.reasoning, p.factors, p.similar_incidents,
        p.recommendations, p.created_at,
        a.name as machine_name, a.asset_code
      FROM ai_predictions p
      JOIN assets a ON p.machine_id = a.id
      WHERE p.risk_score >= ?
        AND p.expires_at > datetime('now')
      ORDER BY p.risk_score DESC
      LIMIT ?
    `).all(minRiskScore, limit) as any[];
  }

  /**
   * Get prediction by ID
   */
  getPredictionById(id: number): any {
    return db.prepare(`
      SELECT
        p.*,
        a.name as machine_name, a.asset_code
      FROM ai_predictions p
      JOIN assets a ON p.machine_id = a.id
      WHERE p.id = ?
    `).get(id);
  }

  /**
   * Record prediction feedback
   */
  recordFeedback(data: {
    prediction_id: number;
    actual_outcome: string;
    occurred_at?: string;
    notes?: string;
  }): { id: number; prediction_id: number; actual_outcome: string } {
    const result = db.prepare(`
      INSERT INTO ai_prediction_feedback (prediction_id, actual_outcome, occurred_at, notes)
      VALUES (?, ?, ?, ?)
    `).run(
      data.prediction_id,
      data.actual_outcome,
      data.occurred_at || new Date().toISOString(),
      data.notes || null
    );

    return {
      id: result.lastInsertRowid as number,
      prediction_id: data.prediction_id,
      actual_outcome: data.actual_outcome,
    };
  }

  /**
   * Clear expired predictions
   */
  clearExpiredPredictions(): void {
    db.prepare(`
      DELETE FROM ai_predictions
      WHERE expires_at < datetime('now')
    `).run();
  }

  /**
   * Get all active machines for analysis
   */
  getAllMachines(): any[] {
    return db.prepare(`
      SELECT id, name, asset_code
      FROM assets
      WHERE status = 'active' OR status IS NULL
      ORDER BY name
    `).all() as any[];
  }

  /**
   * Get last analysis timestamp
   */
  getLastAnalysisTime(): string | null {
    const result = db.prepare(`
      SELECT MAX(created_at) as last_analysis
      FROM ai_predictions
    `).get() as any;
    return result?.last_analysis || null;
  }

  /**
   * Get prediction accuracy statistics
   */
  getPredictionAccuracy(): {
    total_predictions: number;
    total_feedback: number;
    accuracy_rate: number;
    breakdown_by_outcome: { outcome: string; count: number }[];
    accuracy_by_risk_level: { level: string; accuracy: number; count: number }[];
  } {
    // Total predictions
    const totalPredictions = (db.prepare(`
      SELECT COUNT(*) as count FROM ai_predictions
    `).get() as any)?.count || 0;

    // Total feedback
    const totalFeedback = (db.prepare(`
      SELECT COUNT(*) as count FROM ai_prediction_feedback
    `).get() as any)?.count || 0;

    // Breakdown by outcome
    const breakdownByOutcome = db.prepare(`
      SELECT actual_outcome as outcome, COUNT(*) as count
      FROM ai_prediction_feedback
      GROUP BY actual_outcome
    `).all() as { outcome: string; count: number }[];

    // Calculate accuracy rate (predictions with breakdown that correctly predicted high risk)
    const correctPredictions = (db.prepare(`
      SELECT COUNT(*) as count
      FROM ai_prediction_feedback f
      JOIN ai_predictions p ON f.prediction_id = p.id
      WHERE (p.risk_score >= 70 AND f.actual_outcome = 'breakdown_occurred')
         OR (p.risk_score < 50 AND f.actual_outcome = 'no_breakdown')
    `).get() as any)?.count || 0;

    const accuracyRate = totalFeedback > 0
      ? Math.round((correctPredictions / totalFeedback) * 100)
      : 0;

    // Accuracy by risk level
    const accuracyByRiskLevel = db.prepare(`
      SELECT
        CASE
          WHEN p.risk_score >= 85 THEN 'critical'
          WHEN p.risk_score >= 70 THEN 'high'
          WHEN p.risk_score >= 50 THEN 'medium'
          ELSE 'low'
        END as level,
        COUNT(*) as total,
        SUM(CASE
          WHEN (p.risk_score >= 70 AND f.actual_outcome = 'breakdown_occurred')
            OR (p.risk_score < 50 AND f.actual_outcome = 'no_breakdown')
          THEN 1 ELSE 0
        END) as correct
      FROM ai_prediction_feedback f
      JOIN ai_predictions p ON f.prediction_id = p.id
      GROUP BY level
    `).all() as any[];

    return {
      total_predictions: totalPredictions,
      total_feedback: totalFeedback,
      accuracy_rate: accuracyRate,
      breakdown_by_outcome: breakdownByOutcome,
      accuracy_by_risk_level: accuracyByRiskLevel.map(r => ({
        level: r.level,
        accuracy: r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0,
        count: r.total,
      })),
    };
  }
}

// Export singleton
export const predictiveMaintenanceService = new PredictiveMaintenanceService();
export default predictiveMaintenanceService;
