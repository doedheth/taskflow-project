import { Router } from 'express';
import { SparepartController } from '../../controllers/SparepartController';
import { auth, supervisorOrAbove } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all sparepart routes
router.use(auth);

/**
 * @swagger
 * /api/v2/spareparts/comparison:
 *   get:
 *     summary: Get sparepart stock comparison between BC and CMMS
 *     tags: [Spareparts]
 *     security:
 *       - bearerAuth: []
 */
router.get('/comparison', supervisorOrAbove, SparepartController.getComparison);

export default router;
