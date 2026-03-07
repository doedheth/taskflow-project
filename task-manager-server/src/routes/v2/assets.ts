/**
 * Asset Routes - v2 (OOP Refactored)
 */

import { Router } from 'express';
import { body } from 'express-validator';
import { auth, managerOrAdmin } from '../../middleware/auth';
import { assetController } from '../../controllers/AssetController';

const router = Router();

// ============================================
// Validation Middleware
// ============================================

const createValidation = [
  body('asset_code').trim().notEmpty().withMessage('Asset code is required'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('status').optional().isIn(['operational', 'down', 'maintenance', 'retired']),
  body('criticality').optional().isIn(['low', 'medium', 'high', 'critical']),
];

const updateValidation = [
  body('asset_code').optional().trim().notEmpty().withMessage('Asset code cannot be empty'),
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('status').optional().isIn(['operational', 'down', 'maintenance', 'retired']),
  body('criticality').optional().isIn(['low', 'medium', 'high', 'critical']),
];

// ============================================
// Routes
// ============================================

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Get all assets with filters
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [operational, down, maintenance, retired]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asset'
 */
router.get('/', auth, assetController.getAll);

/**
 * @swagger
 * /api/assets/categories:
 *   get:
 *     summary: Get asset categories
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', auth, assetController.getCategories);

/**
 * @swagger
 * /api/assets/categories/list:
 *   get:
 *     summary: Get asset categories (alias)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories/list', auth, assetController.getCategories);

/**
 * @swagger
 * /api/assets/categories:
 *   post:
 *     summary: Create asset category
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/categories', auth, managerOrAdmin, assetController.createCategory);

/**
 * @swagger
 * /api/assets/failure-codes:
 *   get:
 *     summary: Get failure codes
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of failure codes
 */
router.get('/failure-codes', auth, assetController.getFailureCodes);

/**
 * @swagger
 * /api/assets/failure-codes/list:
 *   get:
 *     summary: Get failure codes (alias)
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of failure codes
 */
router.get('/failure-codes/list', auth, assetController.getFailureCodes);

/**
 * @swagger
 * /api/assets/failure-codes/by-asset/{assetId}:
 *   get:
 *     summary: Get failure codes by asset
 *     tags: [Assets]
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
 *         description: Failure codes for asset
 */
router.get('/failure-codes/by-asset/:assetId', auth, assetController.getFailureCodesByAsset);

/**
 * @swagger
 * /api/assets/failure-codes/generate/{category}:
 *   get:
 *     summary: Generate next failure code for category
 *     tags: [Assets]
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
 *         description: Generated failure code
 */
router.get('/failure-codes/generate/:category', auth, managerOrAdmin, assetController.generateFailureCode);

/**
 * @swagger
 * /api/assets/failure-codes:
 *   post:
 *     summary: Create failure code
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Failure code created
 */
router.post('/failure-codes', auth, managerOrAdmin, assetController.createFailureCode);

/**
 * @swagger
 * /api/assets/failure-codes/{id}:
 *   put:
 *     summary: Update failure code
 *     tags: [Assets]
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
 *         description: Failure code updated
 */
router.put('/failure-codes/:id', auth, managerOrAdmin, assetController.updateFailureCode);

/**
 * @swagger
 * /api/assets/failure-codes/{id}:
 *   delete:
 *     summary: Delete failure code
 *     tags: [Assets]
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
 *         description: Failure code deleted
 */
router.delete('/failure-codes/:id', auth, managerOrAdmin, assetController.deleteFailureCode);

/**
 * @swagger
 * /api/assets/statistics:
 *   get:
 *     summary: Get asset statistics
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset statistics
 */
router.get('/statistics', auth, assetController.getStatistics);

/**
 * @swagger
 * /api/assets/stats/overview:
 *   get:
 *     summary: Get asset stats overview
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Asset statistics overview
 */
router.get('/stats/overview', auth, assetController.getStatistics);

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Get asset by ID
 *     tags: [Assets]
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
 *         description: Asset details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Asset not found
 */
router.get('/:id', auth, assetController.getById);

/**
 * @swagger
 * /api/assets/{id}/work-orders:
 *   get:
 *     summary: Get asset work orders
 *     tags: [Assets]
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
 *         description: Work orders for asset
 */
router.get('/:id/work-orders', auth, assetController.getWorkOrders);

/**
 * @swagger
 * /api/assets/{id}/downtime:
 *   get:
 *     summary: Get asset downtime history
 *     tags: [Assets]
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
 *         description: Downtime history
 */
router.get('/:id/downtime', auth, assetController.getDowntimeHistory);

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Create new asset
 *     tags: [Assets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - asset_code
 *               - name
 *             properties:
 *               asset_code:
 *                 type: string
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [operational, down, maintenance, retired]
 *               criticality:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Asset created
 */
router.post('/', auth, managerOrAdmin, createValidation, assetController.create);

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Update asset
 *     tags: [Assets]
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
 *         description: Asset updated
 */
router.put('/:id', auth, managerOrAdmin, updateValidation, assetController.update);

/**
 * @swagger
 * /api/assets/{id}/status:
 *   patch:
 *     summary: Update asset status
 *     tags: [Assets]
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
 *                 enum: [operational, down, maintenance, retired]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', auth, assetController.updateStatus);

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Delete asset
 *     tags: [Assets]
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
 *         description: Asset deleted
 */
router.delete('/:id', auth, managerOrAdmin, assetController.delete);

export default router;
