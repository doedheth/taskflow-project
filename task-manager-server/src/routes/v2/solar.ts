/**
 * Solar Routes (V2)
 */

import { Router } from 'express';
import { solarController } from '../../controllers/SolarController';
import { auth, adminOnly, managerOrAdmin } from '../../middleware/auth';

const router = Router();

// All solar routes require authentication
router.use(auth);

/**
 * @swagger
 * /api/v2/solar/comparison:
 *   get:
 *     summary: Get Huawei vs Manual energy comparison data
 *     tags: [Solar]
 */
router.get('/comparison', managerOrAdmin, solarController.getComparison);
router.get('/trend', managerOrAdmin, solarController.getTrend);
router.get('/realtime', managerOrAdmin, solarController.getRealtime);
router.get('/export', managerOrAdmin, solarController.exportCsv);

/**
 * @swagger
 * /api/v2/solar/manual:
 *   post:
 *     summary: Input manual KWH meter data
 *     tags: [Solar]
 */
router.post('/manual', solarController.saveManual);

/**
 * @swagger
 * /api/v2/solar/sync:
 *   get:
 *     summary: Manually trigger sync from Huawei
 *     tags: [Solar]
 */
router.get('/sync', adminOnly, solarController.sync);

/**
 * @swagger
 * /api/v2/solar/config:
 *   get:
 *     summary: Get Solar configuration (Safe)
 *     tags: [Solar]
 */
router.get('/config', managerOrAdmin, solarController.getConfig);

/**
 * @swagger
 * /api/v2/solar/config:
 *   post:
 *     summary: Save Solar configuration
 *     tags: [Solar]
 */
router.post('/config', adminOnly, solarController.saveConfig);

export default router;
