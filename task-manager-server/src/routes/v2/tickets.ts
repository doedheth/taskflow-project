/**
 * Ticket Routes - v2 (OOP Refactored)
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import { auth } from '../../middleware/auth';
import { ticketController } from '../../controllers/TicketController';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const createValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('description').optional().trim(),
  body('type').optional().isIn(['bug', 'task', 'story', 'epic']).withMessage('Invalid type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('story_points')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Story points must be 0-100'),
  body('assignee_ids').optional().isArray(),
  body('department_id').optional().isInt(),
  body('epic_id').optional().isInt(),
  body('sprint_id').optional().isInt(),
  body('due_date').optional().isISO8601(),
  body('asset_id').optional().isInt(),
];

const updateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters'),
  body('type').optional().isIn(['bug', 'task', 'story', 'epic']).withMessage('Invalid type'),
  body('status')
    .optional()
    .isIn(['todo', 'in_progress', 'review', 'done'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
];

const commentValidation = [
  body('content').trim().notEmpty().withMessage('Comment content is required'),
];

const quickMaintenanceValidation = [
  body('title').trim().isLength({ min: 3 }).withMessage('Title must be at least 3 characters'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('asset_id').isInt().withMessage('Asset is required'),
  body('assignee_ids').isArray({ min: 1 }).withMessage('At least one assignee is required'),
];

const filterValidation = [
  query('status').optional().isIn(['todo', 'in_progress', 'review', 'done']),
  query('type').optional().isIn(['bug', 'task', 'story', 'epic']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('assignee').optional().isInt(),
  query('department').optional().isInt(),
];

// ============================================
// Routes
// ============================================

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Get all tickets with filters
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, review, done]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [bug, task, story, epic]
 *         description: Filter by type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: assignee
 *         schema:
 *           type: integer
 *         description: Filter by assignee ID
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *     responses:
 *       200:
 *         description: List of tickets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, filterValidation, ticketController.getAll);

/**
 * @swagger
 * /api/tickets/search:
 *   get:
 *     summary: Search tickets
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 */
router.get('/search', auth, ticketController.search);

/**
 * @swagger
 * /api/tickets/statistics:
 *   get:
 *     summary: Get ticket statistics
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 byStatus:
 *                   type: object
 *                 byPriority:
 *                   type: object
 *                 byType:
 *                   type: object
 */
router.get('/statistics', auth, ticketController.getStatistics);

/**
 * @swagger
 * /api/tickets/sprint/{sprintId}:
 *   get:
 *     summary: Get tickets by sprint
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sprintId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sprint ID
 *     responses:
 *       200:
 *         description: Tickets in sprint
 */
router.get('/sprint/:sprintId', auth, ticketController.getBySprint);

/**
 * @swagger
 * /api/tickets/epic/{epicId}:
 *   get:
 *     summary: Get tickets by epic
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: epicId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Epic ID
 *     responses:
 *       200:
 *         description: Tickets in epic
 */
router.get('/epic/:epicId', auth, ticketController.getByEpic);

/**
 * @swagger
 * /api/tickets/key/{ticketKey}:
 *   get:
 *     summary: Get ticket by key
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketKey
 *         required: true
 *         schema:
 *           type: string
 *         description: Ticket key (e.g., TASK-123)
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 */
router.get('/key/:ticketKey', auth, ticketController.getByKey);

/**
 * @swagger
 * /api/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Ticket details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       404:
 *         description: Ticket not found
 */
router.get('/:id', auth, ticketController.getById);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Create new ticket
 *     tags: [Tickets]
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
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [bug, task, story, epic]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               story_points:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               department_id:
 *                 type: integer
 *               epic_id:
 *                 type: integer
 *               sprint_id:
 *                 type: integer
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Ticket created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Validation error
 */
router.post('/', auth, createValidation, ticketController.create);

/**
 * @swagger
 * /api/tickets/quick-maintenance:
 *   post:
 *     summary: Create quick maintenance ticket + work order
 *     tags: [Tickets]
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
 *               - priority
 *               - asset_id
 *               - assignee_ids
 *             properties:
 *               title:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               asset_id:
 *                 type: integer
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Maintenance ticket and work order created
 */
router.post(
  '/quick-maintenance',
  auth,
  quickMaintenanceValidation,
  ticketController.quickMaintenance
);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Tickets]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       200:
 *         description: Ticket updated
 *       404:
 *         description: Ticket not found
 */
router.put('/:id', auth, updateValidation, ticketController.update);

/**
 * @swagger
 * /api/tickets/{id}/status:
 *   patch:
 *     summary: Update ticket status
 *     tags: [Tickets]
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', auth, ticketController.updateStatus);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Delete ticket
 *     tags: [Tickets]
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
 *         description: Ticket deleted
 *       404:
 *         description: Ticket not found
 */
router.delete('/:id', auth, ticketController.delete);

/**
 * @swagger
 * /api/tickets/{id}/comments:
 *   post:
 *     summary: Add comment to ticket
 *     tags: [Tickets]
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/:id/comments', auth, commentValidation, ticketController.addComment);

/**
 * @swagger
 * /api/tickets/{id}/assignees:
 *   post:
 *     summary: Add assignee to ticket
 *     tags: [Tickets]
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
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Assignee added
 */
router.post('/:id/assignees', auth, ticketController.addAssignee);

/**
 * @swagger
 * /api/tickets/{id}/assignees/{userId}:
 *   delete:
 *     summary: Remove assignee from ticket
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assignee removed
 */
router.delete('/:id/assignees/:userId', auth, ticketController.removeAssignee);

export default router;
