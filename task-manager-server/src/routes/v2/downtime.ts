/**
 * Downtime Routes - v2 (OOP Refactored)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { auth, managerOrAdmin } from '../../middleware/auth';
import { downtimeController } from '../../controllers/DowntimeController';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const startValidation = [
  body('asset_id').isInt().withMessage('Asset ID is required'),
  body('downtime_type')
    .optional()
    .isIn(['unplanned', 'planned'])
    .withMessage('Invalid downtime type'),
  body('classification_id').optional().isInt(),
  body('reason').optional().isString(),
  body('work_order_id').optional().isInt(),
];

const endValidation = [
  body('reason').optional().isString(),
  body('production_impact').optional().isString(),
];

const updateValidation = [
  body('reason').optional().isString(),
  body('production_impact').optional().isString(),
  body('classification_id').optional().isInt(),
  body('failure_code_id').optional().isInt(),
];

// ============================================
// Routes
// ============================================

/**
 * @swagger
 * /api/downtime:
 *   get:
 *     summary: Get all downtime logs with filters
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: asset_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of downtime logs
 */
router.get('/', auth, downtimeController.getAll);

/**
 * @swagger
 * /api/downtime/active:
 *   get:
 *     summary: Get all active downtime logs
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active downtime logs
 */
router.get('/active', auth, downtimeController.getAllActive);

/**
 * @swagger
 * /api/downtime/dashboard:
 *   get:
 *     summary: Get dashboard data (active + recent)
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', auth, downtimeController.getDashboard);

/**
 * @swagger
 * /api/downtime/statistics:
 *   get:
 *     summary: Get downtime statistics
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Downtime statistics
 */
router.get('/statistics', auth, downtimeController.getStatistics);

/**
 * @swagger
 * /api/downtime/stats/summary:
 *   get:
 *     summary: Get downtime stats summary
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats summary
 */
router.get('/stats/summary', auth, downtimeController.getStatsSummary);

/**
 * @swagger
 * /api/downtime/check-schedule/{assetId}:
 *   get:
 *     summary: Check production schedule for asset
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Production schedule info
 */
router.get('/check-schedule/:assetId', auth, downtimeController.checkSchedule);

/**
 * @swagger
 * /api/downtime/classifications:
 *   get:
 *     summary: Get all classifications
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classifications
 */
router.get('/classifications', auth, downtimeController.getClassifications);

/**
 * @swagger
 * /api/downtime/classifications/list:
 *   get:
 *     summary: Get all classifications (alias)
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classifications
 */
router.get('/classifications/list', auth, downtimeController.getClassifications);

/**
 * @swagger
 * /api/downtime/classifications/generate/{category}:
 *   get:
 *     summary: Generate next code for category
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Generated code
 */
router.get('/classifications/generate/:category', auth, downtimeController.generateClassificationCode);

/**
 * @swagger
 * /api/downtime/classifications:
 *   post:
 *     summary: Create a new classification
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Classification created
 */
router.post('/classifications', auth, downtimeController.createClassification);

/**
 * @swagger
 * /api/downtime/classifications/{id}:
 *   get:
 *     summary: Get classification by ID
 *     tags: [Downtime]
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
 *         description: Classification details
 */
router.get('/classifications/:id', auth, downtimeController.getClassificationById);

/**
 * @swagger
 * /api/downtime/classifications/{id}:
 *   put:
 *     summary: Update a classification
 *     tags: [Downtime]
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
 *         description: Classification updated
 */
router.put('/classifications/:id', auth, downtimeController.updateClassification);

/**
 * @swagger
 * /api/downtime/classifications/{id}:
 *   delete:
 *     summary: Delete a classification
 *     tags: [Downtime]
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
 *         description: Classification deleted
 */
router.delete('/classifications/:id', auth, downtimeController.deleteClassification);

/**
 * @swagger
 * /api/downtime/asset/{assetId}/active:
 *   get:
 *     summary: Get active downtime for asset
 *     tags: [Downtime]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Active downtime for asset
 */
router.get('/asset/:assetId/active', auth, downtimeController.getActiveByAsset);

/**
 * @swagger
 * /api/downtime/{id}:
 *   get:
 *     summary: Get downtime log by ID
 *     tags: [Downtime]
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
 *         description: Downtime log details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DowntimeEvent'
 */
router.get('/:id', auth, downtimeController.getById);

/**
 * @swagger
 * /api/downtime/start:
 *   post:
 *     summary: Start new downtime
 *     tags: [Downtime]
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
 *               downtime_type:
 *                 type: string
 *                 enum: [unplanned, planned]
 *               classification_id:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Downtime started
 */
router.post('/start', auth, startValidation, downtimeController.start);

/**
 * @swagger
 * /api/downtime:
 *   post:
 *     summary: Create downtime log
 *     tags: [Downtime]
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
 *               start_time:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Downtime created
 */
router.post('/', auth, startValidation, downtimeController.create);

/**
 * @swagger
 * /api/downtime/{id}/end:
 *   post:
 *     summary: End downtime
 *     tags: [Downtime]
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
 *               production_impact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Downtime ended
 */
router.post('/:id/end', auth, endValidation, downtimeController.end);

/**
 * @swagger
 * /api/downtime/{id}:
 *   put:
 *     summary: Update downtime log
 *     tags: [Downtime]
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
 *         description: Downtime updated
 */
router.put('/:id', auth, updateValidation, downtimeController.update);

/**
 * @swagger
 * /api/downtime/{id}:
 *   delete:
 *     summary: Delete downtime log
 *     tags: [Downtime]
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
 *         description: Downtime deleted
 */
router.delete('/:id', auth, managerOrAdmin, downtimeController.delete);

export default router;
