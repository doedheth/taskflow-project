/**
 * Migration: Add AI Predictions Tables
 *
 * Creates tables for storing AI-generated predictive maintenance predictions
 * and feedback for accuracy tracking
 */

import { prepare, exec, saveDb } from '../db';

export function migrateAIPredictions(): void {
  console.log('Running AI predictions migration...');

  try {
    // Check if ai_predictions table exists
    const predictionsTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_predictions'
    `).all();

    if (predictionsTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_predictions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          machine_id INTEGER NOT NULL,
          risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
          predicted_failure_window TEXT,
          reasoning TEXT NOT NULL,
          confidence_level TEXT NOT NULL CHECK (confidence_level IN ('low', 'medium', 'high')),
          factors TEXT NOT NULL,
          similar_incidents TEXT,
          recommendations TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          FOREIGN KEY (machine_id) REFERENCES assets(id)
        )
      `);

      // Create indexes for efficient querying
      exec(`CREATE INDEX idx_predictions_machine ON ai_predictions(machine_id)`);
      exec(`CREATE INDEX idx_predictions_risk ON ai_predictions(risk_score)`);
      exec(`CREATE INDEX idx_predictions_expires ON ai_predictions(expires_at)`);
      exec(`CREATE INDEX idx_predictions_created ON ai_predictions(created_at)`);

      console.log('✅ Created ai_predictions table');
    }

    // Check if ai_prediction_feedback table exists
    const feedbackTableExists = prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name='ai_prediction_feedback'
    `).all();

    if (feedbackTableExists.length === 0) {
      exec(`
        CREATE TABLE ai_prediction_feedback (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          prediction_id INTEGER NOT NULL,
          actual_outcome TEXT NOT NULL CHECK (actual_outcome IN ('breakdown_occurred', 'no_breakdown', 'partial')),
          occurred_at DATETIME,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (prediction_id) REFERENCES ai_predictions(id)
        )
      `);

      // Create index for prediction feedback lookup
      exec(`CREATE INDEX idx_feedback_prediction ON ai_prediction_feedback(prediction_id)`);
      exec(`CREATE INDEX idx_feedback_outcome ON ai_prediction_feedback(actual_outcome)`);

      console.log('✅ Created ai_prediction_feedback table');
    }

    saveDb();
    console.log('✅ AI predictions migration completed');
  } catch (error) {
    console.error('AI predictions migration error:', error);
    throw error;
  }
}
