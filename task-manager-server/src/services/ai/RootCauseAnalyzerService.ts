/**
 * Root Cause Analyzer Service
 *
 * AI-powered service for analyzing breakdown root causes using historical data
 * Story 7.8: Create Root Cause Analysis
 */

import OpenAI from 'openai';
import db from '../../database/db';
import { aiUsageTracker } from './AIUsageTracker';
import {
  RCAAnalysis,
  RCASummary,
  SymptomEvent,
  ContributingFactor,
  RCASimilarIncident,
  RCARecommendation,
} from '../../types/ai';

// ============================================
// Internal Types
// ============================================

interface MachineHistoryData {
  id: number;
  name: string;
  asset_code: string;
  category_name: string;
  installation_date: string | null;
  downtime_logs: DowntimeLog[];
  work_orders: WorkOrderHistory[];
  pm_schedules: PMSchedule[];
}

interface DowntimeLog {
  id: number;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  reason: string;
  downtime_type: string;
  classification_name: string | null;
  failure_code: string | null;
  failure_description: string | null;
}

interface WorkOrderHistory {
  id: number;
  wo_number: string;
  title: string;
  type: string;
  status: string;
  root_cause: string | null;
  solution: string | null;
  created_at: string;
  actual_end: string | null;
}

interface PMSchedule {
  id: number;
  title: string;
  frequency_type: string;
  last_completed_date: string | null;
}

// ============================================
// Root Cause Analyzer Service
// ============================================

export class RootCauseAnalyzerService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Analyze root cause for a specific breakdown or machine
   */
  async analyzeRootCause(
    machineId: number,
    breakdownId?: number,
    lookbackDays: number = 90
  ): Promise<RCAAnalysis> {
    // Gather comprehensive history data
    const historyData = await this.gatherMachineHistory(machineId, lookbackDays);

    // Build symptom progression timeline
    const symptomProgression = this.buildSymptomTimeline(historyData);

    // Calculate contributing factors
    const contributingFactors = this.calculateContributingFactors(historyData);

    // Find similar historical incidents
    const similarIncidents = await this.findSimilarIncidents(machineId, breakdownId);

    // Generate AI analysis
    const { probableRootCause, reasoning, confidenceLevel, confidenceScore, recommendations } =
      await this.generateAIAnalysis(historyData, symptomProgression, contributingFactors, similarIncidents);

    // Store analysis
    const analysisId = this.storeAnalysis({
      machine_id: machineId,
      breakdown_id: breakdownId,
      probable_root_cause: probableRootCause,
      confidence_level: confidenceLevel,
      confidence_score: confidenceScore,
      reasoning: {
        summary: reasoning,
        symptom_progression: symptomProgression,
        contributing_factors: contributingFactors,
        historical_comparison: this.generateHistoricalComparison(similarIncidents),
      },
      similar_incidents: similarIncidents,
      recommendations,
      analysis_metadata: {
        data_points_analyzed:
          historyData.downtime_logs.length + historyData.work_orders.length,
        breakdown_count: historyData.downtime_logs.filter(d => d.downtime_type === 'unplanned').length,
        time_span_days: lookbackDays,
      },
    });

    return {
      id: analysisId,
      breakdown_id: breakdownId,
      machine_id: machineId,
      machine_name: historyData.name,
      probable_root_cause: probableRootCause,
      confidence_level: confidenceLevel,
      confidence_score: confidenceScore,
      reasoning: {
        summary: reasoning,
        symptom_progression: symptomProgression,
        contributing_factors: contributingFactors,
        historical_comparison: this.generateHistoricalComparison(similarIncidents),
      },
      similar_incidents: similarIncidents,
      recommendations,
      analysis_metadata: {
        data_points_analyzed:
          historyData.downtime_logs.length + historyData.work_orders.length,
        breakdown_count: historyData.downtime_logs.filter(d => d.downtime_type === 'unplanned').length,
        time_span_days: lookbackDays,
      },
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Gather comprehensive machine history
   */
  private async gatherMachineHistory(
    machineId: number,
    lookbackDays: number
  ): Promise<MachineHistoryData> {
    // Get machine info
    const machine = db
      .prepare(
        `
      SELECT a.id, a.name, a.asset_code, a.purchase_date,
             ac.name as category_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.id
      WHERE a.id = ?
    `
      )
      .get(machineId) as any;

    if (!machine) {
      throw new Error(`Machine with ID ${machineId} not found`);
    }

    // Get downtime logs
    const downtimeLogs = db
      .prepare(
        `
      SELECT
        dl.id, dl.start_time, dl.end_time, dl.duration_minutes,
        dl.reason, dl.downtime_type,
        dc.name as classification_name,
        fc.code as failure_code, fc.description as failure_description
      FROM downtime_logs dl
      LEFT JOIN downtime_classifications dc ON dl.classification_id = dc.id
      LEFT JOIN failure_codes fc ON dl.failure_code_id = fc.id
      WHERE dl.asset_id = ?
        AND dl.start_time >= datetime('now', '-' || ? || ' days')
      ORDER BY dl.start_time DESC
    `
      )
      .all(machineId, lookbackDays) as DowntimeLog[];

    // Get work orders
    const workOrders = db
      .prepare(
        `
      SELECT
        wo.id, wo.wo_number, wo.title, wo.type, wo.status,
        wo.root_cause, wo.solution, wo.created_at, wo.actual_end
      FROM work_orders wo
      WHERE wo.asset_id = ?
        AND wo.created_at >= datetime('now', '-' || ? || ' days')
      ORDER BY wo.created_at DESC
    `
      )
      .all(machineId, lookbackDays) as WorkOrderHistory[];

    // Get PM schedules
    const pmSchedules = db
      .prepare(
        `
      SELECT
        ms.id, ms.title, ms.frequency_type,
        MAX(wo.actual_end) as last_completed_date
      FROM maintenance_schedules ms
      LEFT JOIN work_orders wo ON wo.maintenance_schedule_id = ms.id AND wo.status = 'completed'
      WHERE ms.asset_id = ?
      GROUP BY ms.id
    `
      )
      .all(machineId) as PMSchedule[];

    return {
      id: machine.id,
      name: machine.name,
      asset_code: machine.asset_code,
      category_name: machine.category_name || 'Uncategorized',
      installation_date: machine.purchase_date,
      downtime_logs: downtimeLogs,
      work_orders: workOrders,
      pm_schedules: pmSchedules,
    };
  }

  /**
   * Build symptom progression timeline
   */
  private buildSymptomTimeline(data: MachineHistoryData): SymptomEvent[] {
    const events: SymptomEvent[] = [];

    // Add downtime events
    for (const log of data.downtime_logs) {
      events.push({
        date: log.start_time,
        event_type: log.downtime_type === 'unplanned' ? 'breakdown' : 'warning',
        description: log.reason || log.failure_description || 'Downtime recorded',
      });
    }

    // Add work order events
    for (const wo of data.work_orders) {
      if (wo.status === 'completed' && wo.actual_end) {
        events.push({
          date: wo.actual_end,
          event_type: wo.type === 'preventive' ? 'pm' : 'repair',
          description: wo.title,
        });
      }
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return events.slice(-20); // Last 20 events
  }

  /**
   * Calculate contributing factors from history
   */
  private calculateContributingFactors(data: MachineHistoryData): ContributingFactor[] {
    const factors: ContributingFactor[] = [];

    // Factor 1: PM Compliance
    const pmComplianceIssue = this.checkPMCompliance(data.pm_schedules);
    if (pmComplianceIssue.hasIssue) {
      factors.push({
        factor: 'PM Tidak Terpenuhi',
        weight: pmComplianceIssue.weight,
        evidence: pmComplianceIssue.evidence,
      });
    }

    // Factor 2: Recurring Issues
    const recurringIssues = this.detectRecurringIssues(data.downtime_logs);
    if (recurringIssues.length > 0) {
      factors.push({
        factor: 'Masalah Berulang',
        weight: Math.min(40, recurringIssues.length * 10),
        evidence: `Masalah serupa terdeteksi ${recurringIssues.length} kali: ${recurringIssues.slice(0, 3).join(', ')}`,
      });
    }

    // Factor 3: Increasing Frequency
    const frequencyTrend = this.analyzeFrequencyTrend(data.downtime_logs);
    if (frequencyTrend.increasing) {
      factors.push({
        factor: 'Frekuensi Breakdown Meningkat',
        weight: frequencyTrend.weight,
        evidence: frequencyTrend.evidence,
      });
    }

    // Factor 4: Machine Age
    if (data.installation_date) {
      const ageYears =
        (Date.now() - new Date(data.installation_date).getTime()) /
        (1000 * 60 * 60 * 24 * 365);
      if (ageYears > 5) {
        factors.push({
          factor: 'Usia Mesin',
          weight: Math.min(25, ageYears * 3),
          evidence: `Mesin berusia ${ageYears.toFixed(1)} tahun`,
        });
      }
    }

    // Factor 5: Incomplete Repairs
    const incompleteRepairs = this.detectIncompleteRepairs(data.work_orders);
    if (incompleteRepairs.count > 0) {
      factors.push({
        factor: 'Perbaikan Tidak Tuntas',
        weight: incompleteRepairs.weight,
        evidence: incompleteRepairs.evidence,
      });
    }

    // Normalize weights
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    if (totalWeight > 0) {
      factors.forEach(f => {
        f.weight = Math.round((f.weight / totalWeight) * 100);
      });
    }

    return factors.sort((a, b) => b.weight - a.weight);
  }

  /**
   * Check PM compliance
   */
  private checkPMCompliance(pmSchedules: PMSchedule[]): {
    hasIssue: boolean;
    weight: number;
    evidence: string;
  } {
    if (pmSchedules.length === 0) {
      return { hasIssue: false, weight: 0, evidence: '' };
    }

    const now = Date.now();
    const overdueSchedules: string[] = [];

    for (const pm of pmSchedules) {
      if (!pm.last_completed_date) {
        overdueSchedules.push(pm.title);
        continue;
      }

      const lastCompleted = new Date(pm.last_completed_date).getTime();
      const daysSinceLastPM = (now - lastCompleted) / (1000 * 60 * 60 * 24);

      const expectedDays: Record<string, number> = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        yearly: 365,
      };

      const expected = expectedDays[pm.frequency_type] || 30;
      if (daysSinceLastPM > expected * 1.5) {
        overdueSchedules.push(pm.title);
      }
    }

    if (overdueSchedules.length === 0) {
      return { hasIssue: false, weight: 0, evidence: '' };
    }

    return {
      hasIssue: true,
      weight: Math.min(35, overdueSchedules.length * 15),
      evidence: `PM terlambat: ${overdueSchedules.join(', ')}`,
    };
  }

  /**
   * Detect recurring issues from downtime logs
   */
  private detectRecurringIssues(logs: DowntimeLog[]): string[] {
    const issueCount: Record<string, number> = {};

    for (const log of logs) {
      const key = log.failure_description || log.reason || 'unknown';
      if (key && key !== 'unknown') {
        issueCount[key] = (issueCount[key] || 0) + 1;
      }
    }

    return Object.entries(issueCount)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .map(([issue]) => issue);
  }

  /**
   * Analyze frequency trend
   */
  private analyzeFrequencyTrend(logs: DowntimeLog[]): {
    increasing: boolean;
    weight: number;
    evidence: string;
  } {
    const unplannedLogs = logs.filter(l => l.downtime_type === 'unplanned');
    if (unplannedLogs.length < 4) {
      return { increasing: false, weight: 0, evidence: '' };
    }

    // Split into two halves
    const half = Math.floor(unplannedLogs.length / 2);
    const recentHalf = unplannedLogs.slice(0, half);
    const olderHalf = unplannedLogs.slice(half);

    // Compare counts (note: logs are sorted desc, so "recent" is first)
    const recentCount = recentHalf.length;
    const olderCount = olderHalf.length;

    // If recent half has more breakdowns in same timeframe, it's increasing
    if (recentCount > olderCount) {
      const increasePercent = Math.round(((recentCount - olderCount) / olderCount) * 100);
      return {
        increasing: true,
        weight: Math.min(30, increasePercent / 2),
        evidence: `Peningkatan frekuensi ${increasePercent}% dalam periode terbaru`,
      };
    }

    return { increasing: false, weight: 0, evidence: '' };
  }

  /**
   * Detect incomplete repairs
   */
  private detectIncompleteRepairs(workOrders: WorkOrderHistory[]): {
    count: number;
    weight: number;
    evidence: string;
  } {
    // Look for multiple corrective WOs in short succession
    const correctiveWOs = workOrders.filter(wo => wo.type === 'corrective');
    if (correctiveWOs.length < 2) {
      return { count: 0, weight: 0, evidence: '' };
    }

    // Check if any WO was followed by another within 7 days
    let repeatCount = 0;
    for (let i = 0; i < correctiveWOs.length - 1; i++) {
      const current = new Date(correctiveWOs[i].created_at).getTime();
      const next = new Date(correctiveWOs[i + 1].created_at).getTime();
      const daysDiff = (current - next) / (1000 * 60 * 60 * 24);
      if (daysDiff <= 14) {
        repeatCount++;
      }
    }

    if (repeatCount === 0) {
      return { count: 0, weight: 0, evidence: '' };
    }

    return {
      count: repeatCount,
      weight: Math.min(25, repeatCount * 12),
      evidence: `${repeatCount} perbaikan korektif dalam waktu berdekatan`,
    };
  }

  /**
   * Find similar historical incidents
   */
  async findSimilarIncidents(
    machineId: number,
    breakdownId?: number
  ): Promise<RCASimilarIncident[]> {
    // Get completed work orders with solutions
    const historicalWOs = db
      .prepare(
        `
      SELECT
        wo.id, wo.created_at as date, wo.title as description,
        wo.solution, wo.root_cause
      FROM work_orders wo
      WHERE wo.asset_id = ?
        AND wo.status = 'completed'
        AND wo.solution IS NOT NULL
        ${breakdownId ? 'AND wo.id != ?' : ''}
      ORDER BY wo.created_at DESC
      LIMIT 10
    `
      )
      .all(breakdownId ? [machineId, breakdownId] : [machineId]) as any[];

    if (historicalWOs.length === 0) {
      return [];
    }

    // Return formatted incidents with basic similarity
    return historicalWOs.slice(0, 5).map((wo, index) => ({
      breakdown_id: wo.id,
      date: wo.date,
      description: wo.description,
      resolution: wo.solution || wo.root_cause || 'Tidak ada solusi tercatat',
      similarity_score: Math.max(50, 100 - index * 10), // Simple scoring by recency
    }));
  }

  /**
   * Generate AI analysis
   */
  async generateAIAnalysis(
    historyData: MachineHistoryData,
    symptomProgression: SymptomEvent[],
    contributingFactors: ContributingFactor[],
    similarIncidents: RCASimilarIncident[],
    userId: number = 0
  ): Promise<{
    probableRootCause: string;
    reasoning: string;
    confidenceLevel: 'low' | 'medium' | 'high';
    confidenceScore: number;
    recommendations: RCARecommendation[];
  }> {
    const startTime = Date.now();
    try {
      const prompt = `Kamu adalah AI maintenance analyst expert untuk pabrik thermoforming. Analisis data berikut dan identifikasi ROOT CAUSE dari breakdown/masalah yang terjadi.

DATA MESIN:
- Nama: ${historyData.name}
- Kode: ${historyData.asset_code}
- Kategori: ${historyData.category_name}

TIMELINE GEJALA (${symptomProgression.length} event terakhir):
${symptomProgression.map(e => `- ${e.date}: [${e.event_type}] ${e.description}`).join('\n')}

FAKTOR KONTRIBUTOR (dari analisis data):
${contributingFactors.map(f => `- ${f.factor} (bobot: ${f.weight}%): ${f.evidence}`).join('\n')}

INSIDEN SERUPA SEBELUMNYA:
${similarIncidents.length > 0
  ? similarIncidents.map(i => `- ${i.date}: ${i.description} → ${i.resolution}`).join('\n')
  : 'Tidak ada data insiden serupa'
}

STATISTIK:
- Total breakdown (unplanned): ${historyData.downtime_logs.filter(d => d.downtime_type === 'unplanned').length}
- Total work order: ${historyData.work_orders.length}
- PM Schedule aktif: ${historyData.pm_schedules.length}

Berikan analisis dalam format JSON:
{
  "probable_root_cause": "Root cause utama dalam 1-2 kalimat bahasa Indonesia",
  "reasoning": "Penjelasan lengkap mengapa ini adalah root cause, 2-3 paragraf bahasa Indonesia",
  "confidence_level": "low|medium|high",
  "confidence_score": 0-100,
  "recommendations": [
    {
      "id": "rec_1",
      "priority": "immediate|short_term|long_term",
      "action": "Tindakan spesifik yang harus dilakukan",
      "reasoning": "Mengapa tindakan ini penting",
      "action_type": "create_wo|update_pm|review_asset|training|other"
    }
  ]
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'Kamu adalah AI root cause analyst expert untuk maintenance industri. Berikan analisis yang akurat dan rekomendasi actionable dalam bahasa Indonesia. Respons HANYA dalam format JSON yang valid.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      });

      // Track AI usage
      const usage = aiUsageTracker.extractTokenUsage(response);
      aiUsageTracker.logUsage({
        userId,
        feature: 'root_cause_analysis',
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
          probableRootCause: result.probable_root_cause || 'Tidak dapat menentukan root cause',
          reasoning: result.reasoning || 'Tidak cukup data untuk analisis',
          confidenceLevel: result.confidence_level || 'low',
          confidenceScore: result.confidence_score || 30,
          recommendations: (result.recommendations || []).map((r: any, index: number) => ({
            id: r.id || `rec_${index + 1}`,
            priority: r.priority || 'short_term',
            action: r.action || 'Review kondisi mesin',
            reasoning: r.reasoning || 'Berdasarkan analisis data',
            action_type: r.action_type || 'other',
            action_data: r.action_data,
          })),
        };
      }
    } catch (error: any) {
      // Track error
      aiUsageTracker.logUsage({
        userId,
        feature: 'root_cause_analysis',
        model: 'gpt-4o',
        inputTokens: 0,
        outputTokens: 0,
        responseTimeMs: Date.now() - startTime,
        success: false,
        errorMessage: error?.message || 'AI RCA analysis error',
      });
      console.error('AI RCA analysis error:', error);
    }

    // Fallback response
    return this.generateFallbackAnalysis(contributingFactors);
  }

  /**
   * Generate fallback analysis when AI fails
   */
  private generateFallbackAnalysis(contributingFactors: ContributingFactor[]): {
    probableRootCause: string;
    reasoning: string;
    confidenceLevel: 'low' | 'medium' | 'high';
    confidenceScore: number;
    recommendations: RCARecommendation[];
  } {
    const topFactor = contributingFactors[0];
    const probableRootCause = topFactor
      ? `${topFactor.factor} - ${topFactor.evidence}`
      : 'Tidak dapat menentukan root cause dari data yang tersedia';

    return {
      probableRootCause,
      reasoning: `Berdasarkan analisis data historis, faktor utama yang berkontribusi adalah: ${contributingFactors.map(f => f.factor).join(', ')}. Diperlukan investigasi lebih lanjut untuk konfirmasi.`,
      confidenceLevel: 'low',
      confidenceScore: 30,
      recommendations: [
        {
          id: 'rec_1',
          priority: 'immediate',
          action: 'Lakukan inspeksi menyeluruh pada mesin',
          reasoning: 'Diperlukan verifikasi kondisi aktual mesin',
          action_type: 'create_wo',
        },
      ],
    };
  }

  /**
   * Generate historical comparison text
   */
  private generateHistoricalComparison(incidents: RCASimilarIncident[]): string {
    if (incidents.length === 0) {
      return 'Tidak ada insiden serupa yang tercatat dalam riwayat.';
    }

    return `Ditemukan ${incidents.length} insiden serupa dalam riwayat. Masalah yang paling sering terjadi: ${incidents.slice(0, 3).map(i => i.description).join('; ')}.`;
  }

  /**
   * Store analysis in database
   */
  private storeAnalysis(analysis: Omit<RCAAnalysis, 'id' | 'created_at' | 'machine_name'>): number {
    const result = db
      .prepare(
        `
      INSERT INTO ai_rca_analyses (
        machine_id, breakdown_id, probable_root_cause, confidence_level,
        confidence_score, reasoning, similar_incidents, recommendations,
        analysis_metadata, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `
      )
      .run(
        analysis.machine_id,
        analysis.breakdown_id || null,
        analysis.probable_root_cause,
        analysis.confidence_level,
        analysis.confidence_score,
        JSON.stringify(analysis.reasoning),
        JSON.stringify(analysis.similar_incidents),
        JSON.stringify(analysis.recommendations),
        JSON.stringify(analysis.analysis_metadata)
      );

    return Number(result.lastInsertRowid);
  }

  /**
   * Get RCA analysis by ID
   */
  getAnalysisById(id: number): RCAAnalysis | null {
    const row = db
      .prepare(
        `
      SELECT r.*, a.name as machine_name
      FROM ai_rca_analyses r
      JOIN assets a ON r.machine_id = a.id
      WHERE r.id = ?
    `
      )
      .get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      breakdown_id: row.breakdown_id,
      machine_id: row.machine_id,
      machine_name: row.machine_name,
      probable_root_cause: row.probable_root_cause,
      confidence_level: row.confidence_level,
      confidence_score: row.confidence_score,
      reasoning: JSON.parse(row.reasoning),
      similar_incidents: JSON.parse(row.similar_incidents),
      recommendations: JSON.parse(row.recommendations),
      analysis_metadata: JSON.parse(row.analysis_metadata),
      created_at: row.created_at,
    };
  }

  /**
   * Get RCA analyses for a machine
   */
  getMachineAnalyses(machineId: number, limit: number = 10): RCASummary[] {
    const rows = db
      .prepare(
        `
      SELECT r.id, r.machine_id, a.name as machine_name,
             r.probable_root_cause, r.confidence_level, r.confidence_score, r.created_at
      FROM ai_rca_analyses r
      JOIN assets a ON r.machine_id = a.id
      WHERE r.machine_id = ?
      ORDER BY r.created_at DESC
      LIMIT ?
    `
      )
      .all(machineId, limit) as any[];

    return rows.map(row => ({
      id: row.id,
      machine_id: row.machine_id,
      machine_name: row.machine_name,
      probable_root_cause: row.probable_root_cause,
      confidence_level: row.confidence_level,
      confidence_score: row.confidence_score,
      created_at: row.created_at,
    }));
  }

  /**
   * Get recurring issues for a machine
   */
  getRecurringIssues(machineId: number): string[] {
    const rows = db
      .prepare(
        `
      SELECT probable_root_cause, COUNT(*) as count
      FROM ai_rca_analyses
      WHERE machine_id = ?
      GROUP BY probable_root_cause
      HAVING count >= 2
      ORDER BY count DESC
      LIMIT 5
    `
      )
      .all(machineId) as any[];

    return rows.map(r => r.probable_root_cause);
  }

  /**
   * Record feedback for RCA
   */
  recordFeedback(data: {
    analysis_id: number;
    feedback_type: 'accurate' | 'inaccurate' | 'partial';
    actual_root_cause?: string;
    notes?: string;
  }): { id: number; analysis_id: number; feedback_type: string } {
    const result = db
      .prepare(
        `
      INSERT INTO ai_rca_feedback (analysis_id, feedback_type, actual_root_cause, notes, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `
      )
      .run(data.analysis_id, data.feedback_type, data.actual_root_cause || null, data.notes || null);

    return {
      id: result.lastInsertRowid as number,
      analysis_id: data.analysis_id,
      feedback_type: data.feedback_type,
    };
  }

  /**
   * Get RCA accuracy statistics
   */
  getAccuracyStats(): {
    total_analyses: number;
    total_feedback: number;
    accuracy_rate: number;
    feedback_breakdown: { type: string; count: number }[];
  } {
    const totalAnalyses = (
      db.prepare('SELECT COUNT(*) as count FROM ai_rca_analyses').get() as any
    )?.count || 0;

    const totalFeedback = (
      db.prepare('SELECT COUNT(*) as count FROM ai_rca_feedback').get() as any
    )?.count || 0;

    const accurateCount = (
      db
        .prepare("SELECT COUNT(*) as count FROM ai_rca_feedback WHERE feedback_type = 'accurate'")
        .get() as any
    )?.count || 0;

    const feedbackBreakdown = db
      .prepare(
        `
      SELECT feedback_type as type, COUNT(*) as count
      FROM ai_rca_feedback
      GROUP BY feedback_type
    `
      )
      .all() as { type: string; count: number }[];

    return {
      total_analyses: totalAnalyses,
      total_feedback: totalFeedback,
      accuracy_rate: totalFeedback > 0 ? Math.round((accurateCount / totalFeedback) * 100) : 0,
      feedback_breakdown: feedbackBreakdown,
    };
  }
}

// Export singleton
export const rootCauseAnalyzerService = new RootCauseAnalyzerService();
export default rootCauseAnalyzerService;
