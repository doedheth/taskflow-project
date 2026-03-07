/**
 * Predictive Maintenance Job
 *
 * Background job that runs daily at 5 AM to analyze all machines
 * and generate breakdown risk predictions
 *
 * Story 7.6: Create Predictive Maintenance Analysis
 */

import cron from 'node-cron';
import {
  predictiveMaintenanceService,
  PredictiveMaintenanceService,
} from '../services/ai/PredictiveMaintenanceService';

export class PredictiveMaintenanceJob {
  private service: PredictiveMaintenanceService;
  private isRunning: boolean = false;

  constructor(service: PredictiveMaintenanceService = predictiveMaintenanceService) {
    this.service = service;
  }

  /**
   * Start the cron job scheduler
   */
  start(): void {
    // Run daily at 5 AM
    cron.schedule('0 5 * * *', async () => {
      await this.runDailyAnalysis();
    });

    console.log('[PredictiveMaintenanceJob] Scheduled for 5 AM daily');
  }

  /**
   * Run analysis for all machines
   * Can also be called manually for on-demand analysis
   */
  async runDailyAnalysis(): Promise<{
    success: boolean;
    analyzed: number;
    highRisk: number;
    errors: number;
  }> {
    if (this.isRunning) {
      console.log('[PredictiveMaintenanceJob] Analysis already in progress, skipping...');
      return { success: false, analyzed: 0, highRisk: 0, errors: 0 };
    }

    this.isRunning = true;
    console.log('[PredictiveMaintenanceJob] Starting daily analysis...');

    let analyzed = 0;
    let highRisk = 0;
    let errors = 0;

    try {
      // Clear expired predictions first
      this.service.clearExpiredPredictions();
      console.log('[PredictiveMaintenanceJob] Cleared expired predictions');

      // Get all active machines
      const machines = this.service.getAllMachines();
      console.log(`[PredictiveMaintenanceJob] Found ${machines.length} machines to analyze`);

      // Analyze each machine
      for (const machine of machines) {
        try {
          const prediction = await this.service.analyzeMachine(machine.id);
          await this.service.storePrediction(prediction);

          analyzed++;

          if (prediction.risk_score > 70) {
            highRisk++;
            console.log(
              `[PredictiveMaintenanceJob] High risk: ${machine.name} (score: ${prediction.risk_score})`
            );
          }

          // Small delay to avoid rate limiting on OpenAI API
          await this.delay(1000);
        } catch (machineError) {
          console.error(
            `[PredictiveMaintenanceJob] Error analyzing machine ${machine.id}:`,
            machineError
          );
          errors++;
        }
      }

      console.log(
        `[PredictiveMaintenanceJob] Analysis completed: ${analyzed} analyzed, ${highRisk} high risk, ${errors} errors`
      );

      return { success: true, analyzed, highRisk, errors };
    } catch (error) {
      console.error('[PredictiveMaintenanceJob] Daily analysis failed:', error);
      return { success: false, analyzed, highRisk, errors };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run analysis for a single machine (on-demand)
   */
  async analyzeOneMachine(machineId: number): Promise<{
    success: boolean;
    prediction?: any;
    error?: string;
  }> {
    try {
      const prediction = await this.service.analyzeMachine(machineId);
      await this.service.storePrediction(prediction);

      return { success: true, prediction };
    } catch (error) {
      console.error(`[PredictiveMaintenanceJob] Error analyzing machine ${machineId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get job status
   */
  getStatus(): { isRunning: boolean; lastAnalysis: string | null } {
    return {
      isRunning: this.isRunning,
      lastAnalysis: this.service.getLastAnalysisTime(),
    };
  }

  /**
   * Helper delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const predictiveMaintenanceJob = new PredictiveMaintenanceJob();
export default predictiveMaintenanceJob;
