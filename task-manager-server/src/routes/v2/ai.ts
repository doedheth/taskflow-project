/**
 * AI Routes - v2 (OOP Refactored)
 */

import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { auth } from '../../middleware/auth';
import { aiController } from '../../controllers/AIController';
import { aiSettingsService } from '../../services/ai/AISettingsService';
import { aiUsageTracker } from '../../services/ai/AIUsageTracker';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const chatValidation = [body('message').notEmpty().withMessage('Message is required')];

const smartAssignmentValidation = [
  body('title').notEmpty().withMessage('Title is required'),
  body('type').notEmpty().withMessage('Type is required'),
  body('priority').notEmpty().withMessage('Priority is required'),
];

const writeAssistValidation = [body('prompt').notEmpty().withMessage('Prompt is required')];

// ============================================
// Chat Routes
// ============================================

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Simple AI chat
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response
 */
router.post('/chat', auth, chatValidation, aiController.chat);

/**
 * @swagger
 * /api/ai/chat-with-memory:
 *   post:
 *     summary: Chat with conversation history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: AI response with context
 */
router.post('/chat-with-memory', auth, chatValidation, aiController.chatWithMemory);

/**
 * @swagger
 * /api/ai/smart-chat:
 *   post:
 *     summary: Chat with function calling (tools)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: AI response with tool calls
 */
router.post('/smart-chat', auth, chatValidation, aiController.smartChat);

// ============================================
// Assignment Routes
// ============================================

/**
 * @swagger
 * /api/ai/smart-assignment:
 *   post:
 *     summary: Get smart assignment recommendations
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               priority:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assignment recommendations
 */
router.post('/smart-assignment', auth, smartAssignmentValidation, aiController.smartAssignment);

// ============================================
// Writing Assistant Routes
// ============================================

/**
 * @swagger
 * /api/ai/write-assist:
 *   post:
 *     summary: AI writing assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Writing suggestions
 */
router.post('/write-assist', auth, writeAssistValidation, aiController.writeAssist);

/**
 * @swagger
 * /api/ai/get-writing-context:
 *   post:
 *     summary: Get context for writing assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Writing context
 */
router.post('/get-writing-context', auth, aiController.getWritingContext);

// ============================================
// Tools Routes
// ============================================

/**
 * @swagger
 * /api/ai/tools:
 *   get:
 *     summary: Get available AI tools
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of AI tools
 */
router.get('/tools', auth, aiController.getTools);

/**
 * @swagger
 * /api/ai/execute-tool:
 *   post:
 *     summary: Execute an AI tool directly
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tool:
 *                 type: string
 *               params:
 *                 type: object
 *     responses:
 *       200:
 *         description: Tool execution result
 */
router.post('/execute-tool', auth, aiController.executeTool);

// ============================================
// Insights Routes
// ============================================

/**
 * @swagger
 * /api/ai/team-capacity:
 *   get:
 *     summary: Get team capacity analysis
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team capacity data
 */
router.get('/team-capacity', auth, aiController.getTeamCapacity);

/**
 * @swagger
 * /api/ai/insights/workload:
 *   get:
 *     summary: Get workload insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workload insights
 */
router.get('/insights/workload', auth, aiController.getWorkloadInsights);

/**
 * @swagger
 * /api/ai/insights/downtime:
 *   get:
 *     summary: Get downtime insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Downtime insights
 */
router.get('/insights/downtime', auth, aiController.getDowntimeInsights);

/**
 * @swagger
 * /api/ai/insights/assets:
 *   get:
 *     summary: Get asset health insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset health insights
 */
router.get('/insights/assets', auth, aiController.getAssetInsights);

/**
 * @swagger
 * /api/ai/insights/work-orders:
 *   get:
 *     summary: Get work order insights
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work order insights
 */
router.get('/insights/work-orders', auth, aiController.getWorkOrderInsights);

// ============================================
// Legacy Endpoints (for frontend compatibility)
// ============================================

/**
 * @swagger
 * /api/ai/analyze-ticket:
 *   post:
 *     summary: Analyze ticket and suggest type, priority, epic
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket analysis
 */
router.post('/analyze-ticket', auth, aiController.analyzeTicket);

/**
 * @swagger
 * /api/ai/autocomplete:
 *   post:
 *     summary: Auto-generate description from title
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auto-generated description
 */
router.post('/autocomplete', auth, aiController.autocomplete);

/**
 * @swagger
 * /api/ai/enhance-text:
 *   post:
 *     summary: Enhance/improve text
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enhanced text
 */
router.post('/enhance-text', auth, aiController.enhanceText);

/**
 * @swagger
 * /api/ai/format-text:
 *   post:
 *     summary: Format text based on type
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Formatted text
 */
router.post('/format-text', auth, aiController.formatText);

/**
 * @swagger
 * /api/ai/suggestions:
 *   post:
 *     summary: Get context-aware suggestions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suggestions
 */
router.post('/suggestions', auth, aiController.getSuggestions);

/**
 * @swagger
 * /api/ai/suggest-assignee:
 *   post:
 *     summary: Suggest assignee based on ticket data
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Suggested assignees
 */
router.post('/suggest-assignee', auth, aiController.suggestAssignee);

/**
 * @swagger
 * /api/ai/smart-assign:
 *   post:
 *     summary: Smart assign (alias)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Smart assignment result
 */
router.post('/smart-assign', auth, aiController.smartAssign);

// ============================================
// Task Prioritization Routes (Story 7.3)
// ============================================

/**
 * @swagger
 * /api/ai/prioritize:
 *   post:
 *     summary: Prioritize tasks by AI scoring
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskIds
 *               - taskType
 *             properties:
 *               taskIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               taskType:
 *                 type: string
 *                 enum: [work_order, ticket]
 *     responses:
 *       200:
 *         description: Prioritized tasks
 */
router.post('/prioritize', auth, [
  body('taskIds').isArray().withMessage('taskIds array is required'),
  body('taskType').isIn(['work_order', 'ticket']).withMessage('taskType must be work_order or ticket'),
], aiController.prioritizeTasks);

/**
 * @swagger
 * /api/ai/suggest-technician:
 *   post:
 *     summary: Suggest optimal technician for task
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskType
 *               - title
 *             properties:
 *               taskType:
 *                 type: string
 *                 enum: [work_order, ticket]
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suggested technician
 */
router.post('/suggest-technician', auth, [
  body('taskType').isIn(['work_order', 'ticket']).withMessage('taskType must be work_order or ticket'),
  body('title').notEmpty().withMessage('title is required'),
], aiController.suggestTechnician);

// ============================================
// Preventive Maintenance AI
// ============================================

/**
 * @swagger
 * /api/ai/pm-suggestions:
 *   post:
 *     summary: Get AI suggestions for PM schedule
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - asset_id
 *             properties:
 *               asset_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: PM suggestions
 */
router.post('/pm-suggestions', auth, [
  body('asset_id').notEmpty().withMessage('Asset ID is required'),
], aiController.getPMSuggestions);

// ============================================
// Smart Work Order Generation (Story 7.4)
// ============================================

/**
 * @swagger
 * /api/ai/generate-wo:
 *   post:
 *     summary: Generate work order from description
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated work order data
 */
router.post('/generate-wo', auth, [
  body('description').notEmpty().withMessage('Description is required'),
], aiController.generateWO);

// ============================================
// Duplicate Detection Routes (Story 7.5)
// ============================================

/**
 * @swagger
 * /api/ai/check-duplicate:
 *   post:
 *     summary: Check for potential duplicate tickets/WOs
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - type
 *             properties:
 *               text:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [ticket, wo]
 *     responses:
 *       200:
 *         description: Duplicate check result
 */
router.post('/check-duplicate', auth, [
  body('text').notEmpty().withMessage('Text is required'),
  body('type').isIn(['ticket', 'wo']).withMessage('Type must be ticket or wo'),
], aiController.checkDuplicate);

// ============================================
// Predictive Maintenance Routes (Story 7.6)
// ============================================

/**
 * @swagger
 * /api/ai/predictions:
 *   get:
 *     summary: Get high-risk machine predictions
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of predictions
 */
router.get('/predictions', auth, aiController.getPredictions);

/**
 * @swagger
 * /api/ai/predictions/accuracy:
 *   get:
 *     summary: Get prediction accuracy statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction accuracy stats
 *       403:
 *         description: Admin/Manager access required
 */
router.get('/predictions/accuracy', auth, aiController.getPredictionAccuracy);

/**
 * @swagger
 * /api/ai/predictions/{id}:
 *   get:
 *     summary: Get prediction detail by ID
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Prediction details
 */
router.get('/predictions/:id', auth, aiController.getPredictionDetail);

/**
 * @swagger
 * /api/ai/predictions/{id}/feedback:
 *   post:
 *     summary: Record prediction feedback (actual outcome)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - actual_outcome
 *             properties:
 *               actual_outcome:
 *                 type: string
 *                 enum: [breakdown_occurred, no_breakdown, partial]
 *     responses:
 *       200:
 *         description: Feedback recorded
 */
router.post('/predictions/:id/feedback', auth, [
  body('actual_outcome').isIn(['breakdown_occurred', 'no_breakdown', 'partial']).withMessage('actual_outcome must be breakdown_occurred, no_breakdown, or partial'),
], aiController.recordPredictionFeedback);

/**
 * @swagger
 * /api/ai/predictions/analyze:
 *   post:
 *     summary: Run on-demand prediction analysis
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prediction analysis result
 *       403:
 *         description: Admin/Manager/Supervisor access required
 */
router.post('/predictions/analyze', auth, aiController.runPredictionAnalysis);

// ============================================
// AI Settings & Analytics Routes (Admin Only)
// ============================================

/**
 * @swagger
 * /api/ai/settings:
 *   get:
 *     summary: Get all AI settings
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI settings
 *       403:
 *         description: Admin access required
 */
router.get('/settings', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const settings = aiSettingsService.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get AI settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

/**
 * @swagger
 * /api/ai/settings:
 *   put:
 *     summary: Update AI settings
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated
 *       403:
 *         description: Admin access required
 */
router.put('/settings', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    aiSettingsService.updateSettings(settings, user.id);
    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @swagger
 * /api/ai/usage-stats:
 *   get:
 *     summary: Get AI usage statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI usage statistics
 *       403:
 *         description: Admin/Manager access required
 */
router.get('/usage-stats', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({ error: 'Admin or Manager access required' });
    }

    const stats = aiSettingsService.getUsageStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Get AI usage stats error:', error);
    res.status(500).json({ error: 'Failed to get usage stats' });
  }
});

/**
 * @swagger
 * /api/ai/feature-status:
 *   get:
 *     summary: Get AI feature status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI feature status
 */
router.get('/feature-status', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    const featureStatus = aiSettingsService.getFeatureStatus();
    const isEnabledForRole = aiSettingsService.isAIEnabledForRole(user.role);

    res.json({
      success: true,
      data: {
        ...featureStatus,
        enabledForCurrentRole: isEnabledForRole,
      },
    });
  } catch (error) {
    console.error('Get AI feature status error:', error);
    res.status(500).json({ error: 'Failed to get feature status' });
  }
});

/**
 * @swagger
 * /api/ai/rate-limit:
 *   get:
 *     summary: Get current user's rate limit status
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rate limit status
 */
router.get('/rate-limit', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number };
    const rateLimit = aiSettingsService.checkRateLimit(user.id);

    res.json({ success: true, data: rateLimit });
  } catch (error) {
    console.error('Get AI rate limit error:', error);
    res.status(500).json({ error: 'Failed to get rate limit' });
  }
});

// ============================================
// AI Admin Statistics Routes (Story 7.9)
// ============================================

/**
 * @swagger
 * /api/ai/admin/stats:
 *   get:
 *     summary: Get comprehensive AI usage statistics
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: AI usage statistics
 *       403:
 *         description: Admin access required
 */
router.get('/admin/stats', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const byFeature = aiUsageTracker.getUsageByFeature(days);
    const dailyUsage = aiUsageTracker.getDailyUsage(days);
    const costSummary = aiUsageTracker.getCostSummary();
    const topUsers = aiUsageTracker.getTopUsers(10);

    res.json({
      success: true,
      data: {
        byFeature,
        dailyUsage,
        costSummary,
        topUsers,
      },
    });
  } catch (error) {
    console.error('Get AI admin stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * @swagger
 * /api/ai/admin/stats/daily:
 *   get:
 *     summary: Get daily AI usage statistics
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Daily usage statistics
 *       403:
 *         description: Admin access required
 */
router.get('/admin/stats/daily', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const dailyUsage = aiUsageTracker.getDailyUsage(days);

    res.json({ success: true, data: dailyUsage });
  } catch (error) {
    console.error('Get AI daily stats error:', error);
    res.status(500).json({ error: 'Failed to get daily statistics' });
  }
});

/**
 * @swagger
 * /api/ai/admin/stats/by-feature:
 *   get:
 *     summary: Get AI usage breakdown by feature
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Usage breakdown by feature
 *       403:
 *         description: Admin access required
 */
router.get('/admin/stats/by-feature', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const byFeature = aiUsageTracker.getUsageByFeature(days);

    res.json({ success: true, data: byFeature });
  } catch (error) {
    console.error('Get AI feature stats error:', error);
    res.status(500).json({ error: 'Failed to get feature statistics' });
  }
});

/**
 * @swagger
 * /api/ai/admin/metrics:
 *   get:
 *     summary: Get AI performance metrics
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 *       403:
 *         description: Admin access required
 */
router.get('/admin/metrics', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const metrics = aiUsageTracker.getPerformanceMetrics();

    res.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Get AI metrics error:', error);
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

/**
 * @swagger
 * /api/ai/admin/errors:
 *   get:
 *     summary: Get recent AI errors
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Recent AI errors
 *       403:
 *         description: Admin access required
 */
router.get('/admin/errors', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const errors = aiUsageTracker.getRecentErrors(limit);

    res.json({ success: true, data: errors });
  } catch (error) {
    console.error('Get AI errors error:', error);
    res.status(500).json({ error: 'Failed to get errors' });
  }
});

/**
 * @swagger
 * /api/ai/admin/cost-summary:
 *   get:
 *     summary: Get AI cost summary
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cost summary
 *       403:
 *         description: Admin access required
 */
router.get('/admin/cost-summary', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const costSummary = aiUsageTracker.getCostSummary();

    res.json({ success: true, data: costSummary });
  } catch (error) {
    console.error('Get AI cost summary error:', error);
    res.status(500).json({ error: 'Failed to get cost summary' });
  }
});

/**
 * @swagger
 * /api/ai/admin/feature-toggles:
 *   get:
 *     summary: Get all AI feature toggles
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature toggles matrix
 *       403:
 *         description: Admin access required
 */
router.get('/admin/feature-toggles', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const toggles = aiSettingsService.getAllFeatureToggles();
    const features = aiSettingsService.getAvailableFeatures();

    res.json({
      success: true,
      data: {
        features,
        toggles,
      },
    });
  } catch (error) {
    console.error('Get feature toggles error:', error);
    res.status(500).json({ error: 'Failed to get feature toggles' });
  }
});

/**
 * @swagger
 * /api/ai/admin/feature-toggles:
 *   put:
 *     summary: Update AI feature toggles
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     feature:
 *                       type: string
 *                     role:
 *                       type: string
 *                     enabled:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Feature toggles updated
 *       403:
 *         description: Admin access required
 */
router.put('/admin/feature-toggles', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates array required' });
    }

    const success = aiSettingsService.bulkUpdateFeatureToggles(updates, user.id);

    if (success) {
      res.json({ success: true, message: 'Feature toggles updated' });
    } else {
      res.status(500).json({ error: 'Failed to update feature toggles' });
    }
  } catch (error) {
    console.error('Update feature toggles error:', error);
    res.status(500).json({ error: 'Failed to update feature toggles' });
  }
});

/**
 * @swagger
 * /api/ai/feature-availability:
 *   get:
 *     summary: Get AI feature availability for current user
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature availability for user's role
 */
router.get('/feature-availability', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    const availability = aiSettingsService.getFeatureAvailabilityForRole(user.role);

    res.json({ success: true, data: availability });
  } catch (error) {
    console.error('Get feature availability error:', error);
    res.status(500).json({ error: 'Failed to get feature availability' });
  }
});

// ============================================
// API Key Management Routes (Story 7.9 - Task 8.4)
// ============================================

/**
 * @swagger
 * /api/ai/admin/api-key-status:
 *   get:
 *     summary: Get API key configuration status
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: API key status with masked key
 *       403:
 *         description: Admin access required
 */
router.get('/admin/api-key-status', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const status = aiSettingsService.getAPIKeyStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    console.error('Get API key status error:', error);
    res.status(500).json({ error: 'Failed to get API key status' });
  }
});

/**
 * @swagger
 * /api/ai/admin/api-key:
 *   post:
 *     summary: Update OpenAI API key
 *     tags: [AI Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - apiKey
 *             properties:
 *               apiKey:
 *                 type: string
 *                 description: OpenAI API key (must start with sk-)
 *     responses:
 *       200:
 *         description: API key updated successfully
 *       400:
 *         description: Invalid API key format
 *       403:
 *         description: Admin access required
 */
router.post('/admin/api-key', auth, (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number; role: string };
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { apiKey } = req.body;
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ error: 'Invalid API key format. Must start with sk-' });
    }

    const success = aiSettingsService.updateAPIKey(apiKey, user.id);
    if (success) {
      res.json({ success: true, message: 'API key updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to update API key' });
    }
  } catch (error) {
    console.error('Update API key error:', error);
    res.status(500).json({ error: 'Failed to update API key' });
  }
});

// ============================================
// AI Report Generation Routes (Story 7.7)
// ============================================

/**
 * @swagger
 * /api/ai/generate-report:
 *   post:
 *     summary: Generate AI maintenance report for a period
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period_type
 *               - year
 *             properties:
 *               period_type:
 *                 type: string
 *                 enum: [monthly, weekly, quarterly]
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               week:
 *                 type: integer
 *               quarter:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Generated report
 *       403:
 *         description: Manager/Admin access required
 */
router.post('/generate-report', auth, [
  body('period_type').isIn(['monthly', 'weekly', 'quarterly']).withMessage('period_type must be monthly, weekly, or quarterly'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('year is required'),
], aiController.generateReport);

/**
 * @swagger
 * /api/ai/reports:
 *   get:
 *     summary: Get list of generated reports
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reports
 *       403:
 *         description: Manager/Admin access required
 */
router.get('/reports', auth, aiController.getReports);

/**
 * @swagger
 * /api/ai/reports/{id}:
 *   get:
 *     summary: Get report detail by ID
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Report details
 *       403:
 *         description: Manager/Admin access required
 */
router.get('/reports/:id', auth, aiController.getReportDetail);

/**
 * @swagger
 * /api/ai/reports/{id}/email:
 *   post:
 *     summary: Email report to recipients
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Report emailed
 *       403:
 *         description: Manager/Admin access required
 */
router.post('/reports/:id/email', auth, [
  body('recipients').isArray().withMessage('Recipients array is required'),
  body('recipients.*').isEmail().withMessage('Invalid email address'),
], aiController.emailReport);

// ============================================
// AI Production Report Generation Routes
// ============================================

/**
 * @swagger
 * /api/ai/generate-production-report:
 *   post:
 *     summary: Generate AI production report for a period
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - period_type
 *               - year
 *             properties:
 *               period_type:
 *                 type: string
 *                 enum: [monthly, weekly, quarterly, daily]
 *               year:
 *                 type: integer
 *               month:
 *                 type: integer
 *               week:
 *                 type: integer
 *               quarter:
 *                 type: integer
 *               day:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Generated production report
 *       403:
 *         description: Manager/Admin/Supervisor access required
 */
router.post('/generate-production-report', auth, [
  body('period_type')
    .isIn(['monthly', 'weekly', 'quarterly', 'daily', 'custom_range'])
    .withMessage('period_type must be monthly, weekly, quarterly, daily, or custom_range'),
  body('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('year must be an integer between 2020 and 2100 if provided'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date must be a valid ISO 8601 date string'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date must be a valid ISO 8601 date string'),
], aiController.generateProductionReport);

/**
 * @swagger
 * /api/ai/production-reports:
 *   get:
 *     summary: Get list of generated production reports
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of production reports
 *       403:
 *         description: Manager/Admin/Supervisor access required
 */
router.get('/production-reports', auth, aiController.getProductionReports);

/**
 * @swagger
 * /api/ai/production-reports/{id}:
 *   get:
 *     summary: Get production report detail by ID
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Production report details
 *       403:
 *         description: Manager/Admin/Supervisor access required
 */
router.get('/production-reports/:id', auth, aiController.getProductionReportDetail);

/**
 * @swagger
 * /api/ai/production-reports/{id}/email:
 *   post:
 *     summary: Email production report to recipients
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipients
 *             properties:
 *               recipients:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: email
 *     responses:
 *       200:
 *         description: Production report emailed
 *       403:
 *         description: Manager/Admin access required
 */
router.post('/production-reports/:id/email', auth, [
  body('recipients').isArray().withMessage('Recipients array is required'),
  body('recipients.*').isEmail().withMessage('Invalid email address'),
], aiController.emailProductionReport);

// ============================================
// Root Cause Analysis Routes (Story 7.8)
// ============================================

/**
 * @swagger
 * /api/ai/rca/analyze:
 *   post:
 *     summary: Analyze root cause for machine or breakdown
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - machine_id
 *             properties:
 *               machine_id:
 *                 type: integer
 *               breakdown_id:
 *                 type: integer
 *               lookback_days:
 *                 type: integer
 *     responses:
 *       200:
 *         description: RCA analysis result
 */
router.post('/rca/analyze', auth, [
  body('machine_id').notEmpty().withMessage('machine_id is required'),
], aiController.analyzeRootCause);

/**
 * @swagger
 * /api/ai/rca/accuracy:
 *   get:
 *     summary: Get RCA accuracy statistics
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: RCA accuracy stats
 *       403:
 *         description: Admin/Manager access required
 */
router.get('/rca/accuracy', auth, aiController.getRCAAccuracy);

/**
 * @swagger
 * /api/ai/rca/machine/{machineId}:
 *   get:
 *     summary: Get RCA analyses for a machine
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: machineId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Machine RCA analyses
 */
router.get('/rca/machine/:machineId', auth, aiController.getMachineRCAs);

/**
 * @swagger
 * /api/ai/rca/{id}:
 *   get:
 *     summary: Get RCA analysis by ID
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: RCA analysis details
 */
router.get('/rca/:id', auth, aiController.getRCADetail);

/**
 * @swagger
 * /api/ai/rca/{id}/feedback:
 *   post:
 *     summary: Record RCA feedback (actual outcome)
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback_type
 *             properties:
 *               feedback_type:
 *                 type: string
 *                 enum: [accurate, inaccurate, partial]
 *               actual_root_cause:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feedback recorded
 */
router.post('/rca/:id/feedback', auth, [
  body('feedback_type').isIn(['accurate', 'inaccurate', 'partial']).withMessage('feedback_type must be accurate, inaccurate, or partial'),
], aiController.recordRCAFeedback);

export default router;
