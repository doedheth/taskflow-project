/**
 * Migration: Add AI Root Cause Analysis Tables
 *
 * Creates tables for storing AI-generated root cause analyses
 * and feedback for accuracy tracking
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIRCA(): void {
  console.log('Running AI RCA migration...');

  try {
    // Check if ai_rca_analyses table exists
    const rcaTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_rca_analyses'
    `).all();

    if (rcaTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_rca_analyses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          machine_id INTEGER NOT NULL,
          breakdown_id INTEGER,
          probable_root_cause TEXT NOT NULL,
          confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
          confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
          reasoning TEXT NOT NULL,
          similar_incidents TEXT,
          recommendations TEXT,
          analysis_metadata TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (machine_id) REFERENCES assets(id)
        )
      `);

      // Create indexes for efficient querying
      exec(`CREATE INDEX idx_rca_machine ON ai_rca_analyses(machine_id)`);
      exec(`CREATE INDEX idx_rca_breakdown ON ai_rca_analyses(breakdown_id)`);
      exec(`CREATE INDEX idx_rca_confidence ON ai_rca_analyses(confidence_level)`);
      exec(`CREATE INDEX idx_rca_created ON ai_rca_analyses(created_at)`);

      console.log('✅ Created ai_rca_analyses table');
    }

    // Check if ai_rca_feedback table exists
    const feedbackTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_rca_feedback'
    `).all();

    if (feedbackTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_rca_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          analysis_id INTEGER NOT NULL,
          feedback_type TEXT NOT NULL CHECK (feedback_type IN ('accurate', 'inaccurate', 'partial')),
          actual_root_cause TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (analysis_id) REFERENCES ai_rca_analyses(id)
        )
      `);

      // Create index for feedback lookup
      exec(`CREATE INDEX idx_rca_feedback_analysis ON ai_rca_feedback(analysis_id)`);
      exec(`CREATE INDEX idx_rca_feedback_type ON ai_rca_feedback(feedback_type)`);

      console.log('✅ Created ai_rca_feedback table');
    }

    saveDb();
    console.log('✅ AI RCA migration completed');
  } catch (error) {
    console.error('AI RCA migration error:', error);
    throw error;
  }
}
