/**
 * Work Order Routes - v2 (OOP Refactored)
 *
 * This is the new slim route file that delegates to controllers.
 * The old routes/workOrders.ts is kept for backward compatibility.
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { auth, managerOrAdmin } from '../../middleware/auth';
import { workOrderController } from '../../controllers/WorkOrderController';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const createValidation = [
  body('asset_id').isInt().withMessage('Asset ID is required'),
  body('type').isIn(['preventive', 'corrective', 'emergency']).withMessage('Invalid type'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('title').notEmpty().withMessage('Title is required'),
  body('assignee_ids').isArray({ min: 1 }).withMessage('At least one assignee is required'),
  body('failure_code_id').optional().isInt().withMessage('Failure code ID must be an integer'),
];

// Validation for creating WO from ticket (title & description are optional - auto-filled from ticket)
const createFromTicketValidation = [
  body('asset_id').isInt().withMessage('Asset ID is required'),
  body('type').isIn(['preventive', 'corrective', 'emergency']).withMessage('Invalid type'),
  body('priority').isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('title').optional(), // Optional - will be auto-filled from ticket
  body('description').optional(), // Optional - will be auto-filled from ticket
  body('assignee_ids').isArray({ min: 1 }).withMessage('At least one assignee is required'),
  body('failure_code_id').optional().isInt().withMessage('Failure code ID must be an integer'),
];

const updateValidation = [
  body('type')
    .optional()
    .isIn(['preventive', 'corrective', 'emergency'])
    .withMessage('Invalid type'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority'),
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
];

// ============================================
// Routes
// ============================================

/**
 * @swagger
 * /api/work-orders:
 *   get:
 *     summary: Get all work orders with filters
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [preventive, corrective, emergency]
 *         description: Filter by type
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: asset_id
 *         schema:
 *           type: integer
 *         description: Filter by asset ID
 *     responses:
 *       200:
 *         description: List of work orders
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WorkOrder'
 */
router.get('/', auth, workOrderController.getAll);

/**
 * @swagger
 * /api/work-orders/statistics:
 *   get:
 *     summary: Get work order statistics
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work order statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 byStatus:
 *                   type: object
 *                 byType:
 *                   type: object
 *                 byPriority:
 *                   type: object
 */
router.get('/statistics', auth, workOrderController.getStatistics);

/**
 * @swagger
 * /api/work-orders/stats/overview:
 *   get:
 *     summary: Get work order stats overview
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Work order statistics overview
 */
router.get('/stats/overview', auth, workOrderController.getStatistics);

/**
 * @swagger
 * /api/work-orders/ticket/{ticketId}:
 *   get:
 *     summary: Get work orders by ticket ID
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Ticket ID
 *     responses:
 *       200:
 *         description: Work orders for ticket
 */
router.get('/ticket/:ticketId', auth, workOrderController.getByTicket);

/**
 * @swagger
 * /api/work-orders/by-ticket/{ticketId}:
 *   get:
 *     summary: Get work orders by ticket ID (alias)
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Work orders for ticket
 */
router.get('/by-ticket/:ticketId', auth, workOrderController.getByTicket);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   get:
 *     summary: Get work order by ID
 *     tags: [Work Orders]
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
 *         description: Work order details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkOrder'
 *       404:
 *         description: Work order not found
 */
router.get('/:id', auth, workOrderController.getById);

/**
 * @swagger
 * /api/work-orders:
 *   post:
 *     summary: Create new work order
 *     tags: [Work Orders]
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
 *               - type
 *               - priority
 *               - title
 *               - assignee_ids
 *             properties:
 *               asset_id:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [preventive, corrective, emergency]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               failure_code_id:
 *                 type: integer
 *               scheduled_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Work order created
 *       400:
 *         description: Validation error
 */
router.post('/', auth, managerOrAdmin, createValidation, workOrderController.create);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   put:
 *     summary: Update work order
 *     tags: [Work Orders]
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
 *               type:
 *                 type: string
 *                 enum: [preventive, corrective, emergency]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order updated
 *       404:
 *         description: Work order not found
 */
router.put('/:id', auth, managerOrAdmin, updateValidation, workOrderController.update);

/**
 * @swagger
 * /api/work-orders/{id}:
 *   delete:
 *     summary: Delete work order
 *     tags: [Work Orders]
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
 *         description: Work order deleted
 *       404:
 *         description: Work order not found
 */
router.delete('/:id', auth, managerOrAdmin, workOrderController.delete);

/**
 * @swagger
 * /api/work-orders/{id}/start:
 *   post:
 *     summary: Start work order
 *     tags: [Work Orders]
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
 *         description: Work order started
 */
router.post('/:id/start', auth, workOrderController.start);

/**
 * @swagger
 * /api/work-orders/{id}/complete:
 *   post:
 *     summary: Complete work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order completed
 */
router.post('/:id/complete', auth, workOrderController.complete);

/**
 * @swagger
 * /api/work-orders/{id}/cancel:
 *   post:
 *     summary: Cancel work order
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Work order cancelled
 */
router.post('/:id/cancel', auth, managerOrAdmin, workOrderController.cancel);

/**
 * @swagger
 * /api/work-orders/from-ticket/{ticketId}:
 *   post:
 *     summary: Create work order from ticket
 *     tags: [Work Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *               - asset_id
 *               - type
 *               - priority
 *               - assignee_ids
 *             properties:
 *               asset_id:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [preventive, corrective, emergency]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               assignee_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       201:
 *         description: Work order created from ticket
 */
router.post('/from-ticket/:ticketId', auth, createFromTicketValidation, workOrderController.createFromTicket);

/**
 * @swagger
 * /api/work-orders/{id}/assignees:
 *   post:
 *     summary: Add assignee to work order
 *     tags: [Work Orders]
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
router.post('/:id/assignees', auth, workOrderController.addAssignee);

/**
 * @swagger
 * /api/work-orders/{id}/assignees/{userId}:
 *   delete:
 *     summary: Remove assignee from work order
 *     tags: [Work Orders]
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
router.delete('/:id/assignees/:userId', auth, workOrderController.removeAssignee);

export default router;
