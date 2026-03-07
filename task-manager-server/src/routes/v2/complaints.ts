import { Router } from 'express';
import { complaintController } from '../../controllers/ComplaintController';
import { auth as authMiddleware } from '../../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/', complaintController.create);
router.put('/:id', complaintController.update);
router.get('/', complaintController.getByInspection);
router.get('/:id', complaintController.getById);
router.delete('/:id', complaintController.delete);

export default router;
