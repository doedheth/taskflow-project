/**
 * Report Routes - v2 (OOP Refactored)
 */

import { Router } from 'express';
import { auth } from '../../middleware/auth';
import { reportController } from '../../controllers/ReportController';

const router = Router();

// ============================================
// KPI Routes
// ============================================

/**
 * @swagger
 * /api/reports/kpi/dashboard:
 *   get:
 *     summary: Get KPI dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: KPI dashboard data
 */
router.get('/kpi/dashboard', auth, reportController.getKPIDashboard);

/**
 * @swagger
 * /api/reports/kpi/production:
 *   get:
 *     summary: Get production KPI
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Production KPI data
 */
router.get('/kpi/production', auth, reportController.getProductionKPI);

// ============================================
// Production Routes
// ============================================

/**
 * @swagger
 * /api/reports/production/summary:
 *   get:
 *     summary: Get production summary
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Production summary
 */
router.get('/production/summary', auth, reportController.getProductionSummary);

/**
 * @swagger
 * /api/reports/production/daily:
 *   get:
 *     summary: Get daily production breakdown
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily production breakdown
 */
router.get('/production/daily', auth, reportController.getDailyBreakdown);

// ============================================
// Entity Reports
// ============================================

/**
 * @swagger
 * /api/reports/work-orders:
 *   get:
 *     summary: Get work order report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Work order report
 */
router.get('/work-orders', auth, reportController.getWorkOrderReport);

/**
 * @swagger
 * /api/reports/tickets:
 *   get:
 *     summary: Get ticket report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket report
 */
router.get('/tickets', auth, reportController.getTicketReport);

/**
 * @swagger
 * /api/reports/team:
 *   get:
 *     summary: Get team report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Team performance report
 */
router.get('/team', auth, reportController.getTeamReport);

// ============================================
// Dashboard Routes
// ============================================

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Get comprehensive dashboard
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Comprehensive dashboard data
 */
router.get('/dashboard', auth, reportController.getDashboard);

/**
 * @swagger
 * /api/reports/maintenance/metrics:
 *   get:
 *     summary: Get maintenance metrics
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance metrics (MTBF, MTTR, OEE)
 */
router.get('/maintenance/metrics', auth, reportController.getMaintenanceMetrics);

/**
 * @swagger
 * /api/reports/kpi/asset/{assetId}:
 *   get:
 *     summary: Get asset KPI
 *     tags: [Reports]
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
 *         description: Asset KPI data
 */
router.get('/kpi/asset/:assetId', auth, reportController.getAssetKPI);

/**
 * @swagger
 * /api/reports/downtime:
 *   get:
 *     summary: Get downtime report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Downtime report
 */
router.get('/downtime', auth, reportController.getDowntimeReport);

/**
 * @swagger
 * /api/reports/maintenance-compliance:
 *   get:
 *     summary: Get maintenance compliance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance compliance report
 */
router.get('/maintenance-compliance', auth, reportController.getMaintenanceCompliance);

/**
 * @swagger
 * /api/reports/technician-performance:
 *   get:
 *     summary: Get technician performance report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Technician performance report
 */
router.get('/technician-performance', auth, reportController.getTechnicianPerformance);

export default router;
