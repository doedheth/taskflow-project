import { Router } from 'express';
import { energyController } from '../../controllers/EnergyController';
import { auth } from '../../middleware/auth';

const router = Router();

router.use(auth);

/**
 * @swagger
 * /api/v2/energy/latest:
 *   get:
 *     summary: Get latest real-time energy status
 *     tags: [Energy]
 */
router.get('/latest', energyController.getLatest);

/**
 * @swagger
 * /api/v2/energy/revenue:
 *   get:
 *     summary: Get energy revenue/savings calculation
 *     tags: [Energy]
 */
router.get('/revenue', energyController.getRevenue);

/**
 * @swagger
 * /api/v2/energy/history:
 *   get:
 *     summary: Get energy load history
 *     tags: [Energy]
 */
router.get('/history', energyController.getHistory);

export default router;
