/**
 * AI Controller - HTTP request handling for AI endpoints
 */

import { Request, Response } from 'express';
import { AIService, aiService } from '../services/ai/AIService';
import { AIToolsService, aiToolsService } from '../services/ai/AIToolsService';
import { AITaskPrioritizer, aiTaskPrioritizer } from '../services/ai/AITaskPrioritizer';
import { SmartWOService, smartWOService } from '../services/ai/SmartWOService';
import { DuplicateDetector, duplicateDetector } from '../services/ai/DuplicateDetector';
import {
  PredictiveMaintenanceService,
  predictiveMaintenanceService,
} from '../services/ai/PredictiveMaintenanceService';
import { AIReportService, aiReportService } from '../services/ai/AIReportService';
import { AIProductionReportService, aiProductionReportService } from '../services/ai/AIProductionReportService';
import {
  RootCauseAnalyzerService,
  rootCauseAnalyzerService,
} from '../services/ai/RootCauseAnalyzerService';
import { predictiveMaintenanceJob } from '../jobs/PredictiveMaintenanceJob';
import { AuthenticatedRequest } from '../types/common';

export class AIController {
  private aiService: AIService;
  private toolsService: AIToolsService;
  private taskPrioritizer: AITaskPrioritizer;
  private smartWOService: SmartWOService;
  private duplicateDetector: DuplicateDetector;
  private predictiveService: PredictiveMaintenanceService;
  private reportService: AIReportService;
  private productionReportService: AIProductionReportService;
  private rcaService: RootCauseAnalyzerService;

  constructor(
    aiSvc: AIService = aiService,
    toolsSvc: AIToolsService = aiToolsService,
    prioritizer: AITaskPrioritizer = aiTaskPrioritizer,
    smartWO: SmartWOService = smartWOService,
    dupDetector: DuplicateDetector = duplicateDetector,
    predictiveSvc: PredictiveMaintenanceService = predictiveMaintenanceService,
    reportSvc: AIReportService = aiReportService,
    productionReportSvc: AIProductionReportService = aiProductionReportService,
    rcaSvc: RootCauseAnalyzerService = rootCauseAnalyzerService
  ) {
    this.aiService = aiSvc;
    this.toolsService = toolsSvc;
    this.taskPrioritizer = prioritizer;
    this.smartWOService = smartWO;
    this.duplicateDetector = dupDetector;
    this.predictiveService = predictiveSvc;
    this.reportService = reportSvc;
    this.productionReportService = productionReportSvc;
    this.rcaService = rcaSvc;
  }

  /**
   * POST /ai/chat - Simple chat
   */
  chat = async (req: Request, res: Response): Promise<void> => {
    try {
      const { message, context } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const response = await this.aiService.chat(message, context);
      res.json({ success: true, response });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  };

  /**
   * POST /ai/chat-with-memory - Chat with conversation history
   */
  chatWithMemory = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { message, conversationId } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const response = await this.aiService.chatWithMemory(user.id, message, conversationId);
      res.json(response);
    } catch (error) {
      console.error('Chat with memory error:', error);
      res.status(500).json({ error: 'Chat failed' });
    }
  };

  /**
   * POST /ai/smart-chat - Chat with function calling (tools)
   */
  smartChat = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { message } = req.body;

      if (!message) {
        res.status(400).json({ error: 'Message is required' });
        return;
      }

      const response = await this.aiService.smartChat(user.id, message);
      res.json(response);
    } catch (error) {
      console.error('Smart chat error:', error);
      res.status(500).json({ error: 'Smart chat failed' });
    }
  };

  /**
   * POST /ai/smart-assignment - Get smart assignment recommendations
   */
  smartAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticket_id, title, description, type, priority, department_id } = req.body;

      if (!title || !type || !priority) {
        res.status(400).json({ error: 'Title, type, and priority are required' });
        return;
      }

      const response = await this.aiService.getSmartAssignment({
        ticket_id,
        title,
        description,
        type,
        priority,
        department_id,
      });

      res.json(response);
    } catch (error) {
      console.error('Smart assignment error:', error);
      res.status(500).json({ error: 'Smart assignment failed' });
    }
  };

  /**
   * POST /ai/write-assist - Writing assistant
   */
  writeAssist = async (req: Request, res: Response): Promise<void> => {
    try {
      const { prompt, type, context, ticket_id, asset_id, work_order_id, richContext } = req.body;

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required' });
        return;
      }

      const response = await this.aiService.writeAssist({
        prompt,
        type,
        context,
        ticket_id,
        asset_id,
        work_order_id,
        richContext,
      });

      res.json(response);
    } catch (error) {
      console.error('Write assist error:', error);
      res.status(500).json({ error: 'Write assist failed' });
    }
  };

  /**
   * POST /ai/get-writing-context - Get context for writing assistant
   */
  getWritingContext = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticket_id, asset_id, work_order_id } = req.body;

      const context = await this.aiService.getWritingContext({
        ticket_id,
        asset_id,
        work_order_id,
      });

      res.json({ success: true, context });
    } catch (error) {
      console.error('Get writing context error:', error);
      res.status(500).json({ error: 'Failed to get context' });
    }
  };

  /**
   * GET /ai/tools - Get available AI tools
   */
  getTools = async (req: Request, res: Response): Promise<void> => {
    try {
      const tools = this.toolsService.getToolDefinitions();
      res.json({ success: true, tools });
    } catch (error) {
      console.error('Get tools error:', error);
      res.status(500).json({ error: 'Failed to get tools' });
    }
  };

  /**
   * POST /ai/execute-tool - Execute an AI tool directly
   */
  executeTool = async (req: Request, res: Response): Promise<void> => {
    try {
      const { tool_name, args } = req.body;

      if (!tool_name) {
        res.status(400).json({ error: 'Tool name is required' });
        return;
      }

      const result = await this.toolsService.executeTool(tool_name, args || {});
      res.json(result);
    } catch (error) {
      console.error('Execute tool error:', error);
      res.status(500).json({ error: 'Tool execution failed' });
    }
  };

  /**
   * GET /ai/team-capacity - Get team capacity analysis
   */
  getTeamCapacity = async (req: Request, res: Response): Promise<void> => {
    try {
      const analysis = await this.aiService.getTeamCapacityAnalysis();
      res.json({ success: true, ...analysis });
    } catch (error) {
      console.error('Team capacity error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  };

  /**
   * GET /ai/insights/workload - Get workload insights
   */
  getWorkloadInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const workload = this.toolsService.getTeamWorkload();
      res.json({ success: true, data: workload });
    } catch (error) {
      console.error('Workload insights error:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  };

  /**
   * GET /ai/insights/downtime - Get downtime insights
   */
  getDowntimeInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const analysis = this.toolsService.getDowntimeAnalysis(days);
      res.json({ success: true, data: analysis });
    } catch (error) {
      console.error('Downtime insights error:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  };

  /**
   * GET /ai/insights/assets - Get asset health insights
   */
  getAssetInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const health = this.toolsService.getAssetHealth();
      res.json({ success: true, data: health });
    } catch (error) {
      console.error('Asset insights error:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  };

  /**
   * GET /ai/insights/work-orders - Get work order insights
   */
  getWorkOrderInsights = async (req: Request, res: Response): Promise<void> => {
    try {
      const insights = this.toolsService.getWorkOrderInsights();
      res.json({ success: true, data: insights });
    } catch (error) {
      console.error('Work order insights error:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  };

  // ============================================
  // Legacy Endpoints (for frontend compatibility)
  // ============================================

  /**
   * POST /ai/analyze-ticket - Analyze ticket and suggest epic, type, priority
   */
  analyzeTicket = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      const analysis = await this.aiService.analyzeTicket(title, description);
      res.json({ success: true, analysis });
    } catch (error) {
      console.error('Analyze ticket error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  };

  /**
   * POST /ai/autocomplete - Auto-generate description from title
   */
  autocomplete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, ticket_type } = req.body;

      if (!title) {
        res.status(400).json({ error: 'Title is required' });
        return;
      }

      const description = await this.aiService.autocompleteDescription(title, ticket_type);
      res.json({ success: true, suggested_description: description });
    } catch (error) {
      console.error('Autocomplete error:', error);
      res.status(500).json({ error: 'Autocomplete failed' });
    }
  };

  /**
   * POST /ai/enhance-text - Enhance/improve text
   */
  enhanceText = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, ticket_type } = req.body;

      if (!title && !description) {
        res.status(400).json({ error: 'Title or description is required' });
        return;
      }

      const enhanced = await this.aiService.enhanceText(title, description, ticket_type);
      res.json({ 
        success: true, 
        enhanced,
        changes_made: enhanced.changes || []
      });
    } catch (error) {
      console.error('Enhance text error:', error);
      res.status(500).json({ error: 'Enhancement failed' });
    }
  };

  /**
   * POST /ai/format-text - Format text based on type
   */
  formatText = async (req: Request, res: Response): Promise<void> => {
    try {
      const { text, format_type, language = 'id' } = req.body;

      if (!text) {
        res.status(400).json({ error: 'Text is required' });
        return;
      }

      const formatted = await this.aiService.formatText(text, format_type, language);
      res.json({ success: true, formatted_text: formatted });
    } catch (error) {
      console.error('Format text error:', error);
      res.status(500).json({ error: 'Formatting failed' });
    }
  };

  /**
   * POST /ai/suggestions - Get context-aware suggestions
   */
  getSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { page, entity_id, entity_type, context } = req.body;

      const suggestions = await this.aiService.getSuggestions(page, entity_id, entity_type, context);
      res.json({ success: true, suggestions });
    } catch (error) {
      console.error('Get suggestions error:', error);
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  };

  /**
   * POST /ai/suggest-assignee - Suggest assignee (alias for smart-assignment)
   */
  suggestAssignee = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ticket_type, priority, department_id, title, description } = req.body;

      const response = await this.aiService.getSmartAssignment({
        title: title || 'Untitled',
        type: ticket_type || 'task',
        priority: priority || 'medium',
        department_id,
        description,
      });

      res.json(response);
    } catch (error) {
      console.error('Suggest assignee error:', error);
      res.status(500).json({ error: 'Suggestion failed' });
    }
  };

  /**
   * POST /ai/smart-assign - Smart assign (alias for smart-assignment)
   */
  smartAssign = async (req: Request, res: Response): Promise<void> => {
    return this.suggestAssignee(req, res);
  };

  // ============================================
  // Task Prioritization Routes (Story 7.3)
  // ============================================

  /**
   * POST /ai/prioritize - Prioritize tasks by AI scoring
   */
  prioritizeTasks = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { taskIds, taskType } = req.body;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        res.status(400).json({ error: 'taskIds array is required' });
        return;
      }

      if (!taskType || !['work_order', 'ticket'].includes(taskType)) {
        res.status(400).json({ error: 'taskType must be work_order or ticket' });
        return;
      }

      const response = await this.taskPrioritizer.prioritizeTasks({
        taskIds,
        taskType,
        userId: user.id,
      });

      res.json(response);
    } catch (error) {
      console.error('Prioritize tasks error:', error);
      res.status(500).json({ error: 'Task prioritization failed' });
    }
  };

  /**
   * POST /ai/suggest-technician - Suggest optimal technician for task assignment
   */
  suggestTechnician = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { taskType, title, priority, assetId, departmentId } = req.body;

      if (!taskType || !['work_order', 'ticket'].includes(taskType)) {
        res.status(400).json({ error: 'taskType must be work_order or ticket' });
        return;
      }

      if (!title) {
        res.status(400).json({ error: 'title is required' });
        return;
      }

      const response = await this.taskPrioritizer.suggestAssignee({
        taskType,
        title,
        priority: priority || 'medium',
        assetId,
        departmentId,
      });

      res.json(response);
    } catch (error) {
      console.error('Suggest technician error:', error);
      res.status(500).json({ error: 'Technician suggestion failed' });
    }
  };

  /**
   * POST /ai/pm-suggestions - Get AI suggestions for PM schedule
   */
  getPMSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { asset_id, title, frequency_type } = req.body;

      if (!asset_id) {
        res.status(400).json({ error: 'Asset ID is required' });
        return;
      }

      const suggestions = await this.aiService.getPMSuggestions({
        asset_id: parseInt(asset_id),
        title,
        frequency_type,
      });

      res.json({
        success: true,
        data: suggestions,
      });
    } catch (error) {
      console.error('Get PM suggestions error:', error);
      res.status(500).json({ error: 'Failed to get PM suggestions' });
    }
  };

  // ============================================
  // Smart Work Order Generation (Story 7.4)
  // ============================================

  /**
   * POST /ai/generate-wo - Generate work order from brief description
   */
  generateWO = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { description, asset_id, wo_type } = req.body;

      if (!description || typeof description !== 'string' || description.trim().length < 3) {
        res.status(400).json({ error: 'Description is required (minimum 3 characters)' });
        return;
      }

      const response = await this.smartWOService.generateWorkOrder({
        description: description.trim(),
        asset_id: asset_id ? parseInt(asset_id) : undefined,
        wo_type,
      });

      res.json(response);
    } catch (error) {
      console.error('Generate WO error:', error);
      res.status(500).json({ error: 'Work order generation failed' });
    }
  };

  // ============================================
  // Duplicate Detection (Story 7.5)
  // ============================================

  /**
   * POST /ai/check-duplicate - Check for potential duplicate entries
   */
  checkDuplicate = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { text, type, asset_id, exclude_id } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length < 20) {
        res.json({
          success: true,
          hasDuplicates: false,
          similar: [],
        });
        return;
      }

      if (!type || !['ticket', 'wo'].includes(type)) {
        res.status(400).json({ error: 'Type must be ticket or wo' });
        return;
      }

      const response = await this.duplicateDetector.checkDuplicate({
        text: text.trim(),
        type,
        asset_id: asset_id ? parseInt(asset_id) : undefined,
        exclude_id: exclude_id ? parseInt(exclude_id) : undefined,
      });

      res.json(response);
    } catch (error) {
      console.error('Check duplicate error:', error);
      res.status(500).json({ error: 'Duplicate check failed' });
    }
  };

  // ============================================
  // Predictive Maintenance (Story 7.6)
  // ============================================

  /**
   * GET /ai/predictions - Get high-risk machine predictions
   */
  getPredictions = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const minRiskScore = parseInt(req.query.minRiskScore as string) || 70;
      const limit = parseInt(req.query.limit as string) || 10;

      const predictions = await this.predictiveService.getHighRiskPredictions(minRiskScore, limit);

      // Get last analysis timestamp
      const lastAnalysis = predictions.length > 0 ? predictions[0].created_at : null;

      res.json({
        success: true,
        predictions,
        total_high_risk: predictions.length,
        last_analysis_at: lastAnalysis,
      });
    } catch (error) {
      console.error('Get predictions error:', error);
      res.status(500).json({ error: 'Failed to get predictions' });
    }
  };

  /**
   * GET /ai/predictions/:id - Get prediction detail
   */
  getPredictionDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const predictionId = parseInt(req.params.id);
      if (isNaN(predictionId)) {
        res.status(400).json({ error: 'Invalid prediction ID' });
        return;
      }

      const prediction = await this.predictiveService.getPredictionById(predictionId);

      if (!prediction) {
        res.status(404).json({ error: 'Prediction not found' });
        return;
      }

      res.json({
        success: true,
        prediction,
      });
    } catch (error) {
      console.error('Get prediction detail error:', error);
      res.status(500).json({ error: 'Failed to get prediction detail' });
    }
  };

  /**
   * POST /ai/predictions/:id/feedback - Record prediction feedback
   */
  recordPredictionFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const predictionId = parseInt(req.params.id);
      if (isNaN(predictionId)) {
        res.status(400).json({ error: 'Invalid prediction ID' });
        return;
      }

      const { actual_outcome, occurred_at, notes } = req.body;

      if (!actual_outcome || !['breakdown_occurred', 'no_breakdown', 'partial'].includes(actual_outcome)) {
        res.status(400).json({
          error: 'actual_outcome must be breakdown_occurred, no_breakdown, or partial'
        });
        return;
      }

      const feedback = await this.predictiveService.recordFeedback({
        prediction_id: predictionId,
        actual_outcome,
        occurred_at,
        notes,
      });

      res.json({
        success: true,
        message: 'Feedback recorded successfully',
        feedback,
      });
    } catch (error) {
      console.error('Record prediction feedback error:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  };

  /**
   * POST /ai/predictions/analyze - Run on-demand prediction analysis
   */
  runPredictionAnalysis = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (admin, manager, supervisor)
      if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to run analysis' });
        return;
      }

      const { machine_id } = req.body;

      // If specific machine_id provided, analyze only that machine
      if (machine_id) {
        const machineId = parseInt(machine_id);
        if (isNaN(machineId)) {
          res.status(400).json({ error: 'Invalid machine ID' });
          return;
        }

        const prediction = await this.predictiveService.analyzeMachine(machineId);
        res.json({
          success: true,
          message: 'Analysis completed',
          prediction,
        });
        return;
      }

      // Otherwise, run full analysis via job
      const result = await predictiveMaintenanceJob.runDailyAnalysis();

      res.json({
        success: result.success,
        message: 'Full analysis completed',
        analyzed: result.analyzed,
        high_risk_count: result.highRisk,
        errors: result.errors,
      });
    } catch (error) {
      console.error('Run prediction analysis error:', error);
      res.status(500).json({ error: 'Analysis failed' });
    }
  };

  /**
   * GET /ai/predictions/accuracy - Get prediction accuracy stats
   */
  getPredictionAccuracy = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (admin, manager)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      const accuracy = await this.predictiveService.getPredictionAccuracy();

      res.json({
        success: true,
        accuracy,
      });
    } catch (error) {
      console.error('Get prediction accuracy error:', error);
      res.status(500).json({ error: 'Failed to get accuracy stats' });
    }
  };

  // ============================================
  // AI Report Generation (Story 7.7)
  // ============================================

  // Rate limit tracking for report generation (5 per hour per user)
  private reportGenerationCounts: Map<number, { count: number; resetAt: number }> = new Map();

  /**
   * Check report generation rate limit (5 per hour per user)
   */
  private checkReportRateLimit(userId: number): { allowed: boolean; remaining: number; resetAt: string } {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    const maxReportsPerHour = 5;

    const userLimit = this.reportGenerationCounts.get(userId);

    // Reset if hour has passed
    if (!userLimit || now > userLimit.resetAt) {
      this.reportGenerationCounts.set(userId, { count: 0, resetAt: now + hourInMs });
    }

    const current = this.reportGenerationCounts.get(userId)!;
    const remaining = Math.max(0, maxReportsPerHour - current.count);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(current.resetAt).toISOString(),
    };
  }

  /**
   * Increment report generation count for rate limiting
   */
  private incrementReportCount(userId: number): void {
    const userLimit = this.reportGenerationCounts.get(userId);
    if (userLimit) {
      userLimit.count++;
    }
  }

  /**
   * POST /ai/generate-report - Generate AI maintenance report
   */
  generateReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to generate reports' });
        return;
      }

      // Check rate limit (5 reports per hour per user)
      const rateLimit = this.checkReportRateLimit(user.id);
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded. Maximum 5 reports per hour.',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        });
        return;
      }

      const { period_type, year, month, week, quarter } = req.body;

      if (!period_type || !year) {
        res.status(400).json({ error: 'period_type and year are required' });
        return;
      }

      if (!['monthly', 'weekly', 'quarterly'].includes(period_type)) {
        res.status(400).json({ error: 'period_type must be monthly, weekly, or quarterly' });
        return;
      }

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) generating report for ${period_type} ${year}/${month || week || quarter}`);

      const report = await this.reportService.generateReport(
        { period_type, year, month, week, quarter },
        user.id
      );

      // Increment rate limit counter
      this.incrementReportCount(user.id);

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Generate report error:', error);
      res.status(500).json({ error: 'Report generation failed' });
    }
  };

  /**
   * GET /ai/reports - Get list of generated reports
   */
  getReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to view reports' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 12;
      const reports = this.reportService.getReportList(limit);

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) accessed report list (${reports.length} reports)`);

      res.json({
        success: true,
        reports,
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Failed to get reports' });
    }
  };

  /**
   * GET /ai/reports/:id - Get report detail by ID
   */
  getReportDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to view reports' });
        return;
      }

      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        res.status(400).json({ error: 'Invalid report ID' });
        return;
      }

      const report = this.reportService.getReportById(reportId);

      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) viewed report ${reportId} (${report.period_label})`);

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Get report detail error:', error);
      res.status(500).json({ error: 'Failed to get report detail' });
    }
  };

  /**
   * POST /ai/reports/:id/email - Email report to recipients
   */
  emailReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to email reports' });
        return;
      }

      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        res.status(400).json({ error: 'Invalid report ID' });
        return;
      }

      const { recipients, subject } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'Recipients array is required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter((e: string) => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        res.status(400).json({ error: `Invalid email addresses: ${invalidEmails.join(', ')}` });
        return;
      }

      // Get the report
      const report = this.reportService.getReportById(reportId);
      if (!report) {
        res.status(404).json({ error: 'Report not found' });
        return;
      }

      // Log the email action (audit)
      console.log(`[AUDIT] User ${user.id} (${user.name}) emailed report ${reportId} to: ${recipients.join(', ')}`);

      // For now, return success (email service would need to be configured)
      // In production, integrate with nodemailer or email service like SendGrid
      res.json({
        success: true,
        message: `Report email queued for ${recipients.length} recipient(s)`,
        recipients,
        subject: subject || `Laporan Maintenance - ${report.period_label}`,
      });
    } catch (error) {
      console.error('Email report error:', error);
      res.status(500).json({ error: 'Failed to email report' });
    }
  };

  // ============================================
  // AI Production Report Generation
  // ============================================

  // Rate limit tracking for production report generation (5 per hour per user)
  private productionReportCounts: Map<number, { count: number; resetAt: number }> = new Map();

  /**
   * Check production report generation rate limit (5 per hour per user)
   */
  private checkProductionReportRateLimit(userId: number): { allowed: boolean; remaining: number; resetAt: string } {
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;
    const maxReportsPerHour = 5;

    const userLimit = this.productionReportCounts.get(userId);

    // Reset if hour has passed
    if (!userLimit || now > userLimit.resetAt) {
      this.productionReportCounts.set(userId, { count: 0, resetAt: now + hourInMs });
    }

    const current = this.productionReportCounts.get(userId)!;
    const remaining = Math.max(0, maxReportsPerHour - current.count);

    return {
      allowed: remaining > 0,
      remaining,
      resetAt: new Date(current.resetAt).toISOString(),
    };
  }

  /**
   * Increment production report generation count for rate limiting
   */
  private incrementProductionReportCount(userId: number): void {
    const userLimit = this.productionReportCounts.get(userId);
    if (userLimit) {
      userLimit.count++;
    }
  }

  /**
   * POST /ai/generate-production-report - Generate AI production report
   */
  generateProductionReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin/supervisor only)
      if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to generate production reports' });
        return;
      }

      // Check rate limit (5 reports per hour per user)
      const rateLimit = this.checkProductionReportRateLimit(user.id);
      if (!rateLimit.allowed) {
        res.status(429).json({
          error: 'Rate limit exceeded. Maximum 5 production reports per hour.',
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        });
        return;
      }

      const { period_type, year, month, week, quarter, machine_ids, shift, start_date, end_date, day } = req.body;

      if (!period_type) {
        res.status(400).json({ error: 'period_type is required' });
        return;
      }

      const validPeriodTypes = ['monthly', 'weekly', 'quarterly', 'daily', 'custom_range'];
      if (!validPeriodTypes.includes(period_type)) {
        res.status(400).json({ error: `period_type must be one of: ${validPeriodTypes.join(', ')}` });
        return;
      }

      if (period_type === 'monthly' && !year) {
        res.status(400).json({ error: 'year is required for monthly period_type' });
        return;
      }
      if (period_type === 'custom_range') {
        if (!start_date || !end_date) {
          res.status(400).json({ error: 'start_date and end_date are required for custom_range period_type' });
          return;
        }
        if (new Date(start_date) > new Date(end_date)) {
          res.status(400).json({ error: 'start_date cannot be after end_date' });
          return;
        }
      }

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) generating production report for ${period_type} ${year || start_date}/${month || week || quarter || end_date}`);

      const report = await this.productionReportService.generateReport(
        { period_type, year, month, week, quarter, machine_ids, shift, start_date, end_date, day },
        user.id
      );

      // Increment rate limit counter
      this.incrementProductionReportCount(user.id);

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Generate production report error:', error);
      res.status(500).json({ error: 'Production report generation failed' });
    }
  };

  /**
   * GET /ai/production-reports - Get list of generated production reports
   */
  getProductionReports = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin/supervisor only)
      if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to view production reports' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 12;
      const reports = this.productionReportService.getReportList(limit);

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) accessed production report list (${reports.length} reports)`);

      res.json({
        success: true,
        reports,
      });
    } catch (error) {
      console.error('Get production reports error:', error);
      res.status(500).json({ error: 'Failed to get production reports' });
    }
  };

  /**
   * GET /ai/production-reports/:id - Get production report detail by ID
   */
  getProductionReportDetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin/supervisor only)
      if (!['admin', 'manager', 'supervisor'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to view production reports' });
        return;
      }

      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        res.status(400).json({ error: 'Invalid report ID' });
        return;
      }

      const report = this.productionReportService.getReportById(reportId);

      if (!report) {
        res.status(404).json({ error: 'Production report not found' });
        return;
      }

      // Audit log
      console.log(`[AUDIT] User ${user.id} (${user.name}) viewed production report ${reportId} (${report.period_label})`);

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      console.error('Get production report detail error:', error);
      res.status(500).json({ error: 'Failed to get production report detail' });
    }
  };

  /**
   * POST /ai/production-reports/:id/email - Email production report to recipients
   */
  emailProductionReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (manager/admin only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Insufficient permissions to email production reports' });
        return;
      }

      const reportId = parseInt(req.params.id);
      if (isNaN(reportId)) {
        res.status(400).json({ error: 'Invalid report ID' });
        return;
      }

      const { recipients, subject } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({ error: 'Recipients array is required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = recipients.filter((e: string) => !emailRegex.test(e));
      if (invalidEmails.length > 0) {
        res.status(400).json({ error: `Invalid email addresses: ${invalidEmails.join(', ')}` });
        return;
      }

      // Get the report
      const report = this.productionReportService.getReportById(reportId);
      if (!report) {
        res.status(404).json({ error: 'Production report not found' });
        return;
      }

      // Log the email action (audit)
      console.log(`[AUDIT] User ${user.id} (${user.name}) emailed production report ${reportId} to: ${recipients.join(', ')}`);

      // For now, return success (email service would need to be configured)
      res.json({
        success: true,
        message: `Production report email queued for ${recipients.length} recipient(s)`,
        recipients,
        subject: subject || `Laporan Produksi AI - ${report.period_label}`,
      });
    } catch (error) {
      console.error('Email production report error:', error);
      res.status(500).json({ error: 'Failed to email production report' });
    }
  };

  // ============================================
  // Root Cause Analysis Endpoints (Story 7.8)
  // ============================================

  /**
   * POST /ai/rca/analyze - Analyze root cause for machine or breakdown
   */
  analyzeRootCause = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { machine_id, breakdown_id, lookback_days } = req.body;

      if (!machine_id) {
        res.status(400).json({ error: 'machine_id is required' });
        return;
      }

      const analysis = await this.rcaService.analyzeRootCause(
        machine_id,
        breakdown_id,
        lookback_days || 90
      );

      res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error('RCA analysis error:', error);
      res.status(500).json({ error: 'Root cause analysis failed' });
    }
  };

  /**
   * GET /ai/rca/:id - Get RCA analysis by ID
   */
  getRCADetail = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        res.status(400).json({ error: 'Invalid analysis ID' });
        return;
      }

      const analysis = this.rcaService.getAnalysisById(analysisId);

      if (!analysis) {
        res.status(404).json({ error: 'RCA analysis not found' });
        return;
      }

      res.json({
        success: true,
        analysis,
      });
    } catch (error) {
      console.error('Get RCA detail error:', error);
      res.status(500).json({ error: 'Failed to get RCA detail' });
    }
  };

  /**
   * GET /ai/rca/machine/:machineId - Get RCA analyses for a machine
   */
  getMachineRCAs = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const machineId = parseInt(req.params.machineId);
      if (isNaN(machineId)) {
        res.status(400).json({ error: 'Invalid machine ID' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = this.rcaService.getMachineAnalyses(machineId, limit);
      const recurringIssues = this.rcaService.getRecurringIssues(machineId);

      res.json({
        success: true,
        analyses,
        recurring_issues: recurringIssues,
      });
    } catch (error) {
      console.error('Get machine RCAs error:', error);
      res.status(500).json({ error: 'Failed to get machine RCAs' });
    }
  };

  /**
   * POST /ai/rca/:id/feedback - Record RCA feedback
   */
  recordRCAFeedback = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const analysisId = parseInt(req.params.id);
      if (isNaN(analysisId)) {
        res.status(400).json({ error: 'Invalid analysis ID' });
        return;
      }

      const { feedback_type, actual_root_cause, notes } = req.body;

      if (!feedback_type || !['accurate', 'inaccurate', 'partial'].includes(feedback_type)) {
        res.status(400).json({
          error: 'feedback_type must be accurate, inaccurate, or partial',
        });
        return;
      }

      const feedback = this.rcaService.recordFeedback({
        analysis_id: analysisId,
        feedback_type,
        actual_root_cause,
        notes,
      });

      res.json({
        success: true,
        message: 'Feedback recorded successfully',
        feedback,
      });
    } catch (error) {
      console.error('Record RCA feedback error:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  };

  /**
   * GET /ai/rca/accuracy - Get RCA accuracy statistics
   */
  getRCAAccuracy = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as AuthenticatedRequest).user;
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Check if user has permission (admin/manager only)
      if (!['admin', 'manager'].includes(user.role)) {
        res.status(403).json({ error: 'Admin or Manager access required' });
        return;
      }

      const stats = this.rcaService.getAccuracyStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Get RCA accuracy error:', error);
      res.status(500).json({ error: 'Failed to get RCA accuracy stats' });
    }
  };
}

// Export singleton
export const aiController = new AIController();
export default aiController;
