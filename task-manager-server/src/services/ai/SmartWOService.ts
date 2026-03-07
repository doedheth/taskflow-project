/**
 * Smart Work Order Service (Story 7.4)
 * AI-powered work order generation from brief descriptions
 */

import OpenAI from 'openai';
import db from '../../database/db';
import { AITaskPrioritizer, aiTaskPrioritizer } from './AITaskPrioritizer';
import {
  GenerateWORequest,
  GenerateWOResponse,
  SimilarWO,
  GeneratedWOFields,
} from '../../types/ai';

// Priority keywords for inference
const PRIORITY_KEYWORDS = {
  critical: ['breakdown', 'stop', 'berhenti', 'tidak jalan', 'error', 'emergency', 'mati total', 'rusak parah'],
  high: ['bocor', 'leak', 'panas', 'overheat', 'bunyi', 'noise', 'urgent', 'segera', 'cepat', 'abnormal'],
  medium: ['maintenance', 'periksa', 'check', 'ganti', 'replace', 'pm', 'preventive', 'service'],
  low: ['adjustment', 'fine tune', 'minor', 'kecil', 'rutin', 'normal'],
};

// Base durations by WO type (in minutes)
const BASE_DURATIONS = {
  emergency: 120,   // 2 hours
  corrective: 90,   // 1.5 hours
  preventive: 60,   // 1 hour
};

// WO type keywords
const WO_TYPE_KEYWORDS = {
  emergency: ['breakdown', 'stop', 'berhenti', 'mati', 'error', 'emergency', 'rusak'],
  preventive: ['pm', 'preventive', 'maintenance', 'rutin', 'bulanan', 'mingguan', 'harian', 'scheduled'],
  corrective: ['perbaikan', 'repair', 'fix', 'bocor', 'bunyi', 'abnormal', 'ganti'],
};

export class SmartWOService {
  private openai: OpenAI;
  private taskPrioritizer: AITaskPrioritizer;

  constructor(prioritizer: AITaskPrioritizer = aiTaskPrioritizer) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.taskPrioritizer = prioritizer;
  }

  /**
   * Generate work order from brief description
   */
  async generateWorkOrder(request: GenerateWORequest): Promise<GenerateWOResponse> {
    const { description, asset_id, wo_type: requestedWoType } = request;

    if (!description || description.trim().length < 3) {
      return {
        success: false,
        generated: this.getDefaultFields(),
        similarWOs: [],
        aiIndicator: 'ai-generated',
        error: 'Deskripsi terlalu pendek',
      };
    }

    try {
      // Get machine context if asset_id provided
      const assetContext = asset_id ? this.getAssetContext(asset_id) : null;

      // Infer WO type from description if not provided
      const inferredWoType = requestedWoType || this.inferWOType(description);

      // Generate with OpenAI
      const aiGenerated = await this.generateWithAI(description, assetContext, inferredWoType);

      // Find similar WOs
      const similarWOs = await this.findSimilarWOs(description, asset_id);

      // Suggest technician
      const technicianSuggestion = await this.suggestTechnician(
        aiGenerated.title,
        aiGenerated.priority,
        asset_id
      );

      return {
        success: true,
        generated: aiGenerated,
        technicianSuggestion,
        similarWOs,
        aiIndicator: 'ai-generated',
      };
    } catch (error) {
      console.error('SmartWOService generateWorkOrder error:', error);

      // Return fallback with local inference
      const localGenerated = this.generateLocally(description, requestedWoType);
      const similarWOs = await this.findSimilarWOs(description, asset_id);

      return {
        success: true,
        generated: localGenerated,
        similarWOs,
        aiIndicator: 'ai-generated',
        warning: 'Menggunakan generasi lokal (AI tidak tersedia)',
      };
    }
  }

  /**
   * Generate work order fields using OpenAI
   */
  private async generateWithAI(
    description: string,
    assetContext: AssetContext | null,
    inferredWoType: 'preventive' | 'corrective' | 'emergency'
  ): Promise<GeneratedWOFields> {
    const systemPrompt = `Kamu adalah asisten maintenance engineer untuk pabrik thermoforming.
Analisis deskripsi masalah dan generate work order yang terstruktur.

RULES:
1. Title harus dalam format: "[TYPE] Deskripsi Singkat - Lokasi/Asset"
   - TYPE: CORRECTIVE, PREVENTIVE, atau EMERGENCY
2. Description dalam HTML sederhana dengan sections: Masalah, Scope Pekerjaan, Safety Notes
3. Priority berdasarkan urgency: low, medium, high, critical
4. Estimated duration dalam menit (realistis)

Format output JSON ONLY (no markdown, no explanation):
{
  "title": "string",
  "description": "string (HTML)",
  "priority": "low|medium|high|critical",
  "wo_type": "preventive|corrective|emergency",
  "estimated_duration": number,
  "reasoning": "string"
}`;

    let userPrompt = `Deskripsi masalah: "${description}"`;

    if (assetContext) {
      userPrompt += `\n\nKonteks Mesin:
- Nama: ${assetContext.name}
- Kode: ${assetContext.code}
- Kategori: ${assetContext.category || 'N/A'}
- Lokasi: ${assetContext.location || 'N/A'}`;

      if (assetContext.recentIssues && assetContext.recentIssues.length > 0) {
        userPrompt += `\n- Masalah Terakhir: ${assetContext.recentIssues.join(', ')}`;
      }
    }

    userPrompt += `\n\nTipe WO yang terdeteksi: ${inferredWoType}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content || '';

    try {
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);

        return {
          title: this.sanitizeTitle(result.title || ''),
          description: this.sanitizeHtml(result.description || ''),
          priority: this.validatePriority(result.priority),
          wo_type: this.validateWOType(result.wo_type),
          estimated_duration: this.validateDuration(result.estimated_duration, result.wo_type),
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
    }

    // Fallback to local generation if AI parsing fails
    return this.generateLocally(description, inferredWoType);
  }

  /**
   * Generate work order fields locally (fallback)
   */
  private generateLocally(
    description: string,
    woType?: 'preventive' | 'corrective' | 'emergency'
  ): GeneratedWOFields {
    const inferredType = woType || this.inferWOType(description);
    const inferredPriority = this.inferPriority(description);

    const title = this.generateTitle(description, inferredType);
    const htmlDescription = this.generateDescription(description);
    const duration = this.estimateDuration(inferredType, inferredPriority);

    return {
      title,
      description: htmlDescription,
      priority: inferredPriority,
      wo_type: inferredType,
      estimated_duration: duration,
    };
  }

  /**
   * Infer WO type from description
   */
  private inferWOType(description: string): 'preventive' | 'corrective' | 'emergency' {
    const lowerDesc = description.toLowerCase();

    // Check emergency first (highest priority)
    for (const keyword of WO_TYPE_KEYWORDS.emergency) {
      if (lowerDesc.includes(keyword)) {
        return 'emergency';
      }
    }

    // Check preventive
    for (const keyword of WO_TYPE_KEYWORDS.preventive) {
      if (lowerDesc.includes(keyword)) {
        return 'preventive';
      }
    }

    // Default to corrective
    return 'corrective';
  }

  /**
   * Infer priority from description
   */
  private inferPriority(description: string): 'low' | 'medium' | 'high' | 'critical' {
    const lowerDesc = description.toLowerCase();

    for (const keyword of PRIORITY_KEYWORDS.critical) {
      if (lowerDesc.includes(keyword)) {
        return 'critical';
      }
    }

    for (const keyword of PRIORITY_KEYWORDS.high) {
      if (lowerDesc.includes(keyword)) {
        return 'high';
      }
    }

    for (const keyword of PRIORITY_KEYWORDS.medium) {
      if (lowerDesc.includes(keyword)) {
        return 'medium';
      }
    }

    for (const keyword of PRIORITY_KEYWORDS.low) {
      if (lowerDesc.includes(keyword)) {
        return 'low';
      }
    }

    return 'medium';
  }

  /**
   * Generate standardized title
   */
  private generateTitle(description: string, woType: string): string {
    const typeLabel = woType.toUpperCase();

    // Capitalize first letter of description
    const cleanDesc = description.trim();
    const capitalizedDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);

    // Truncate if too long
    const maxLength = 80;
    const truncatedDesc = capitalizedDesc.length > maxLength
      ? capitalizedDesc.substring(0, maxLength) + '...'
      : capitalizedDesc;

    return `[${typeLabel}] ${truncatedDesc}`;
  }

  /**
   * Generate HTML description
   */
  private generateDescription(description: string): string {
    return `<h3>Masalah</h3>
<p>${description}</p>

<h3>Scope Pekerjaan</h3>
<ul>
  <li>Identifikasi root cause</li>
  <li>Lakukan perbaikan/penggantian yang diperlukan</li>
  <li>Verifikasi hasil pekerjaan</li>
</ul>

<h3>Safety Notes</h3>
<ul>
  <li>Pastikan mesin dalam kondisi mati dan lockout/tagout aktif</li>
  <li>Gunakan APD yang sesuai</li>
</ul>`;
  }

  /**
   * Estimate duration based on WO type and priority
   */
  private estimateDuration(
    woType: 'preventive' | 'corrective' | 'emergency',
    priority: string
  ): number {
    let baseDuration = BASE_DURATIONS[woType] || 90;

    // Adjust based on priority
    if (priority === 'critical') {
      baseDuration *= 1.5;
    } else if (priority === 'high') {
      baseDuration *= 1.2;
    } else if (priority === 'low') {
      baseDuration *= 0.8;
    }

    return Math.round(baseDuration);
  }

  /**
   * Get asset context for AI generation
   */
  private getAssetContext(assetId: number): AssetContext | null {
    try {
      const asset = db.prepare(`
        SELECT a.*, ac.name as category_name
        FROM assets a
        LEFT JOIN asset_categories ac ON a.category_id = ac.id
        WHERE a.id = ?
      `).get(assetId) as any;

      if (!asset) return null;

      // Get recent issues
      const recentIssues = db.prepare(`
        SELECT DISTINCT reason
        FROM downtime_logs
        WHERE asset_id = ?
          AND reason IS NOT NULL
          AND reason != ''
          AND start_time >= datetime('now', '-30 days')
        ORDER BY start_time DESC
        LIMIT 5
      `).all(assetId) as any[];

      return {
        id: asset.id,
        name: asset.name,
        code: asset.asset_code,
        category: asset.category_name,
        location: asset.location,
        recentIssues: recentIssues.map(i => i.reason),
      };
    } catch (error) {
      console.error('getAssetContext error:', error);
      return null;
    }
  }

  /**
   * Find similar work orders using text matching
   */
  async findSimilarWOs(description: string, assetId?: number): Promise<SimilarWO[]> {
    try {
      // Extract keywords from description
      const keywords = this.extractKeywords(description);

      if (keywords.length === 0) {
        return [];
      }

      // Build LIKE conditions for keywords
      const likeConditions = keywords.map(k => `(wo.title LIKE '%${k}%' OR wo.description LIKE '%${k}%')`).join(' OR ');

      // Query for similar WOs
      const query = `
        SELECT
          wo.id,
          wo.wo_number,
          wo.title,
          a.name as asset_name,
          wo.root_cause,
          wo.solution,
          wo.status,
          wo.created_at,
          CASE WHEN wo.asset_id = ? THEN 1 ELSE 0 END as same_asset
        FROM work_orders wo
        LEFT JOIN assets a ON wo.asset_id = a.id
        WHERE wo.status IN ('completed', 'closed')
          AND (${likeConditions})
        ORDER BY same_asset DESC, wo.created_at DESC
        LIMIT 5
      `;

      const results = db.prepare(query).all(assetId || 0) as any[];

      return results.map(wo => ({
        id: wo.id,
        wo_number: wo.wo_number,
        title: wo.title,
        asset_name: wo.asset_name || 'N/A',
        similarity_reason: wo.same_asset
          ? 'Mesin yang sama, masalah serupa'
          : 'Masalah serupa berdasarkan deskripsi',
        root_cause: wo.root_cause,
        solution: wo.solution,
      }));
    } catch (error) {
      console.error('findSimilarWOs error:', error);
      return [];
    }
  }

  /**
   * Extract keywords from description for matching
   */
  private extractKeywords(description: string): string[] {
    // Remove common Indonesian words
    const stopWords = ['yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'adalah', 'ini', 'itu', 'ada', 'tidak', 'akan', 'sudah', 'bisa', 'dapat', 'harus', 'perlu', 'sedang', 'masih', 'juga', 'atau', 'kalau', 'jika', 'maka', 'karena', 'agar', 'supaya', 'tolong', 'mohon'];

    const words = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.includes(word));

    // Return unique keywords (max 5)
    return [...new Set(words)].slice(0, 5);
  }

  /**
   * Suggest technician using AITaskPrioritizer
   */
  private async suggestTechnician(
    title: string,
    priority: string,
    assetId?: number
  ) {
    try {
      const response = await this.taskPrioritizer.suggestAssignee({
        taskType: 'work_order',
        title,
        priority,
        assetId,
      });

      if (response.success && response.suggestions.length > 0) {
        const top = response.suggestions[0];
        return {
          userId: top.userId,
          userName: top.userName,
          matchScore: top.matchScore,
          reason: top.reason,
        };
      }

      return undefined;
    } catch (error) {
      console.error('suggestTechnician error:', error);
      return undefined;
    }
  }

  /**
   * Helper methods
   */
  private sanitizeTitle(title: string): string {
    return title
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 200);
  }

  private sanitizeHtml(html: string): string {
    return html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .trim();
  }

  private validatePriority(priority: string): 'low' | 'medium' | 'high' | 'critical' {
    const valid = ['low', 'medium', 'high', 'critical'];
    return valid.includes(priority) ? priority as any : 'medium';
  }

  private validateWOType(woType: string): 'preventive' | 'corrective' | 'emergency' {
    const valid = ['preventive', 'corrective', 'emergency'];
    return valid.includes(woType) ? woType as any : 'corrective';
  }

  private validateDuration(duration: number | undefined, woType: string): number {
    if (typeof duration === 'number' && duration > 0 && duration <= 480) {
      return Math.round(duration);
    }
    return BASE_DURATIONS[woType as keyof typeof BASE_DURATIONS] || 90;
  }

  private getDefaultFields(): GeneratedWOFields {
    return {
      title: '',
      description: '',
      priority: 'medium',
      wo_type: 'corrective',
      estimated_duration: 90,
    };
  }
}

// Internal types
interface AssetContext {
  id: number;
  name: string;
  code: string;
  category?: string;
  location?: string;
  recentIssues?: string[];
}

// Export singleton
export const smartWOService = new SmartWOService();
export default smartWOService;
