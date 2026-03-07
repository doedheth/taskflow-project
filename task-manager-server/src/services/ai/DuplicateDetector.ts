/**
 * Duplicate Detector Service (Story 7.5)
 * Detects potential duplicate tickets/WOs before submission using embedding similarity
 */

import OpenAI from 'openai';
import db from '../../database/db';
import {
  CheckDuplicateRequest,
  CheckDuplicateResponse,
  SimilarEntry,
} from '../../types/ai';

// Similarity threshold for duplicate detection
const SIMILARITY_THRESHOLD = 0.85; // 85%

// Indonesian stop words for keyword extraction
const STOP_WORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'adalah',
  'ini', 'itu', 'ada', 'tidak', 'akan', 'sudah', 'bisa', 'dapat', 'harus',
  'perlu', 'sedang', 'masih', 'juga', 'atau', 'kalau', 'jika', 'maka',
  'karena', 'agar', 'supaya', 'tolong', 'mohon', 'the', 'a', 'an', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had'
]);

export class DuplicateDetector {
  private openai: OpenAI;
  private embeddingModel = 'text-embedding-3-small';

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Check for duplicate entries
   */
  async checkDuplicate(request: CheckDuplicateRequest): Promise<CheckDuplicateResponse> {
    const { text, type, asset_id, exclude_id } = request;

    if (!text || text.trim().length < 20) {
      return {
        success: true,
        hasDuplicates: false,
        similar: [],
      };
    }

    try {
      // Try embedding-based similarity first
      const similar = await this.findSimilarWithEmbeddings(text, type, asset_id, exclude_id);

      if (similar.length === 0) {
        // Fallback to keyword-based similarity
        const keywordSimilar = await this.findSimilarWithKeywords(text, type, asset_id, exclude_id);

        if (keywordSimilar.length === 0) {
          return {
            success: true,
            hasDuplicates: false,
            similar: [],
          };
        }

        return this.buildResponse(keywordSimilar);
      }

      return this.buildResponse(similar);
    } catch (error) {
      console.error('DuplicateDetector checkDuplicate error:', error);

      // Fallback to keyword-based on error
      try {
        const keywordSimilar = await this.findSimilarWithKeywords(text, type, asset_id, exclude_id);
        return this.buildResponse(keywordSimilar);
      } catch (fallbackError) {
        console.error('Fallback keyword similarity also failed:', fallbackError);
        return {
          success: false,
          hasDuplicates: false,
          similar: [],
          warning: 'Gagal memeriksa duplikat. Silakan lanjutkan.',
        };
      }
    }
  }

  /**
   * Build response with context-aware suggestions
   */
  private buildResponse(similar: SimilarEntry[]): CheckDuplicateResponse {
    if (similar.length === 0) {
      return {
        success: true,
        hasDuplicates: false,
        similar: [],
      };
    }

    // Check if any similar entry is still open
    const hasOpenEntry = similar.some(entry =>
      ['open', 'in_progress', 'assigned', 'pending'].includes(entry.status.toLowerCase())
    );

    let suggestion: string;
    if (hasOpenEntry) {
      suggestion = 'Pertimbangkan update ticket/WO existing daripada membuat baru.';
    } else {
      suggestion = 'Masalah serupa sudah resolved sebelumnya. Mungkin issue berulang?';
    }

    return {
      success: true,
      hasDuplicates: true,
      similar,
      suggestion,
    };
  }

  /**
   * Find similar entries using OpenAI embeddings
   */
  private async findSimilarWithEmbeddings(
    text: string,
    type: 'ticket' | 'wo',
    assetId?: number,
    excludeId?: number
  ): Promise<SimilarEntry[]> {
    // Generate embedding for input text
    const inputEmbedding = await this.generateEmbedding(text);
    if (!inputEmbedding) {
      throw new Error('Failed to generate embedding');
    }

    // Get existing embeddings from database
    const tableName = type === 'ticket' ? 'ticket_embeddings' : 'wo_embeddings';
    const entityTable = type === 'ticket' ? 'tickets' : 'work_orders';
    const idColumn = type === 'ticket' ? 'ticket_id' : 'wo_id';
    const numberColumn = type === 'ticket' ? 'ticket_number' : 'wo_number';

    let query = `
      SELECT
        e.${idColumn} as entity_id,
        e.embedding,
        t.${numberColumn} as entity_number,
        t.title,
        t.status,
        t.created_at,
        t.asset_id
      FROM ${tableName} e
      INNER JOIN ${entityTable} t ON e.${idColumn} = t.id
      WHERE t.created_at >= datetime('now', '-90 days')
    `;

    const params: (number | undefined)[] = [];

    if (excludeId) {
      query += ` AND e.${idColumn} != ?`;
      params.push(excludeId);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 100';

    try {
      const results = db.prepare(query).all(...params) as any[];

      if (results.length === 0) {
        return [];
      }

      // Calculate similarity scores
      const scored: SimilarEntry[] = [];

      for (const row of results) {
        try {
          const storedEmbedding = JSON.parse(row.embedding);
          let similarity = this.cosineSimilarity(inputEmbedding, storedEmbedding);

          // Boost score by 10% if same asset
          if (assetId && row.asset_id === assetId) {
            similarity = Math.min(1, similarity * 1.1);
          }

          if (similarity >= SIMILARITY_THRESHOLD) {
            scored.push({
              id: row.entity_id,
              title: row.title,
              similarity_score: Math.round(similarity * 100),
              status: row.status,
              created_at: row.created_at,
              entity_type: type,
              entity_number: row.entity_number,
            });
          }
        } catch (parseError) {
          // Skip malformed embeddings
          continue;
        }
      }

      // Sort by similarity score descending and limit to top 5
      return scored
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, 5);

    } catch (dbError: any) {
      // Table might not exist yet
      if (dbError.message?.includes('no such table')) {
        console.log(`Embedding table ${tableName} does not exist yet. Using keyword fallback.`);
        return [];
      }
      throw dbError;
    }
  }

  /**
   * Find similar entries using keyword matching (fallback)
   */
  private async findSimilarWithKeywords(
    text: string,
    type: 'ticket' | 'wo',
    assetId?: number,
    excludeId?: number
  ): Promise<SimilarEntry[]> {
    const keywords = this.extractKeywords(text);

    if (keywords.length === 0) {
      return [];
    }

    const entityTable = type === 'ticket' ? 'tickets' : 'work_orders';
    const numberColumn = type === 'ticket' ? 'ticket_number' : 'wo_number';

    // Build LIKE conditions for keywords
    const likeConditions = keywords
      .map(k => `(t.title LIKE '%${k.replace(/'/g, "''")}%' OR t.description LIKE '%${k.replace(/'/g, "''")}%')`)
      .join(' OR ');

    let query = `
      SELECT
        t.id,
        t.${numberColumn} as entity_number,
        t.title,
        t.description,
        t.status,
        t.created_at,
        t.asset_id
      FROM ${entityTable} t
      WHERE t.created_at >= datetime('now', '-90 days')
        AND (${likeConditions})
    `;

    const params: number[] = [];

    if (excludeId) {
      query += ` AND t.id != ?`;
      params.push(excludeId);
    }

    query += ' ORDER BY t.created_at DESC LIMIT 20';

    const results = db.prepare(query).all(...params) as any[];

    if (results.length === 0) {
      return [];
    }

    // Calculate Jaccard similarity for each result
    const inputKeywordsSet = new Set(keywords);
    const scored: SimilarEntry[] = [];

    for (const row of results) {
      const rowText = `${row.title} ${row.description || ''}`;
      const rowKeywords = new Set(this.extractKeywords(rowText));

      let similarity = this.jaccardSimilarity(inputKeywordsSet, rowKeywords);

      // Boost score by 10% if same asset
      if (assetId && row.asset_id === assetId) {
        similarity = Math.min(1, similarity * 1.1);
      }

      if (similarity >= SIMILARITY_THRESHOLD) {
        scored.push({
          id: row.id,
          title: row.title,
          similarity_score: Math.round(similarity * 100),
          status: row.status,
          created_at: row.created_at,
          entity_type: type,
          entity_number: row.entity_number,
        });
      }
    }

    return scored
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, 5);
  }

  /**
   * Generate embedding for text using OpenAI
   */
  private async generateEmbedding(text: string): Promise<number[] | null> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text.substring(0, 8000), // Limit input length
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      return null;
    }
  }

  /**
   * Store embedding for a ticket or work order
   */
  async storeEmbedding(entityId: number, type: 'ticket' | 'wo', text: string): Promise<boolean> {
    try {
      const embedding = await this.generateEmbedding(text);
      if (!embedding) {
        return false;
      }

      const tableName = type === 'ticket' ? 'ticket_embeddings' : 'wo_embeddings';
      const idColumn = type === 'ticket' ? 'ticket_id' : 'wo_id';

      // Ensure table exists
      this.ensureEmbeddingTableExists(type);

      // Insert or update embedding
      const embeddingJson = JSON.stringify(embedding);

      db.prepare(`
        INSERT OR REPLACE INTO ${tableName} (${idColumn}, embedding, created_at)
        VALUES (?, ?, datetime('now'))
      `).run(entityId, embeddingJson);

      return true;
    } catch (error) {
      console.error('Failed to store embedding:', error);
      return false;
    }
  }

  /**
   * Ensure embedding table exists
   */
  private ensureEmbeddingTableExists(type: 'ticket' | 'wo'): void {
    const tableName = type === 'ticket' ? 'ticket_embeddings' : 'wo_embeddings';
    const idColumn = type === 'ticket' ? 'ticket_id' : 'wo_id';
    const refTable = type === 'ticket' ? 'tickets' : 'work_orders';

    db.prepare(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ${idColumn} INTEGER NOT NULL UNIQUE,
        embedding TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (${idColumn}) REFERENCES ${refTable}(id)
      )
    `).run();

    // Create index for faster lookups
    db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_${tableName}_entity ON ${tableName}(${idColumn})
    `).run();
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Calculate Jaccard similarity between two sets
   */
  private jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);

    if (union.size === 0) {
      return 0;
    }

    return intersection.size / union.size;
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOP_WORDS.has(word));

    // Return unique keywords (max 10)
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Batch generate embeddings for existing entries (migration)
   */
  async batchGenerateEmbeddings(type: 'ticket' | 'wo', limit = 100): Promise<{ processed: number; errors: number }> {
    const entityTable = type === 'ticket' ? 'tickets' : 'work_orders';
    const embeddingTable = type === 'ticket' ? 'ticket_embeddings' : 'wo_embeddings';
    const idColumn = type === 'ticket' ? 'ticket_id' : 'wo_id';

    // Ensure table exists
    this.ensureEmbeddingTableExists(type);

    // Get entries without embeddings
    const query = `
      SELECT t.id, t.title, t.description
      FROM ${entityTable} t
      LEFT JOIN ${embeddingTable} e ON t.id = e.${idColumn}
      WHERE e.id IS NULL
        AND t.created_at >= datetime('now', '-90 days')
      LIMIT ?
    `;

    const entries = db.prepare(query).all(limit) as any[];

    let processed = 0;
    let errors = 0;

    for (const entry of entries) {
      const text = `${entry.title} ${entry.description || ''}`;
      const success = await this.storeEmbedding(entry.id, type, text);

      if (success) {
        processed++;
      } else {
        errors++;
      }

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { processed, errors };
  }
}

// Export singleton
export const duplicateDetector = new DuplicateDetector();
export default duplicateDetector;
