/**
 * Incoming Material Inspection Routes
 */

import { Router } from 'express';
import { inspectionController } from '../../controllers/InspectionController';
import { supplierController } from '../../controllers/SupplierController';
import { producerController } from '../../controllers/ProducerController';
import { materialController } from '../../controllers/MaterialController';
import { plantController } from '../../controllers/PlantController';
import { auth as authMiddleware } from '../../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Inspection routes
router.get('/', inspectionController.getAll);
router.get('/:id', inspectionController.getById);
router.post('/', inspectionController.create);
router.put('/:id', inspectionController.update);
router.delete('/:id', inspectionController.delete);

// Supplier routes
router.get('/suppliers/search', supplierController.search);
router.get('/suppliers', supplierController.getAll);
router.post('/suppliers', supplierController.create);
router.put('/suppliers/:id', supplierController.update);

// Producer routes
router.get('/producers/search', producerController.search);
router.get('/producers', producerController.getAll);
router.post('/producers', producerController.create);
router.put('/producers/:id', producerController.update);

// Material routes
router.get('/materials/search', materialController.search);
router.get('/materials', materialController.getAll);
router.post('/materials', materialController.create);
router.put('/materials/:id', materialController.update);

// Plant routes (Pabrik Danone)
router.get('/plants/search', plantController.search);
router.get('/plants', plantController.getAll);
router.post('/plants', plantController.create);
router.put('/plants/:id', plantController.update);

export default router;
