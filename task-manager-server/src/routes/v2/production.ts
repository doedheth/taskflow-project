import express from 'express';
import { MachineParameterController } from '../../controllers/MachineParameterController';
import { ProductionReportController } from '../../controllers/ProductionReportController';
import { auth } from '../../middleware/auth';

const router = express.Router();
const controller = new MachineParameterController();
const reportController = new ProductionReportController();

// Get parameters for an asset
router.get('/parameters/:assetId', auth, controller.getParameters);

// Submit a log
router.post('/logs', auth, controller.submitLog);

// Get logs for an asset
router.get('/logs/:assetId', auth, controller.getLogs);

// Get log detail
router.get('/logs/detail/:id', auth, controller.getLogDetail);

// Parameter Management
router.put('/parameters/order', auth, controller.updateParametersOrder);
router.post('/parameters', auth, controller.createParameter);
router.put('/parameters/:id', auth, controller.updateParameter);
router.delete('/parameters/:id', auth, controller.deleteParameter);

// Downtime by shift (auto-fetch for production form)
router.get('/downtime-by-shift', auth, controller.getDowntimeByShift);

// Production Report
router.get('/reports/:parameter_set_id', auth, reportController.getReport);
router.post('/reports', auth, reportController.saveReport);

export default router;
