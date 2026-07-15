import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/vehicle.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listVehicles);
router.get('/available', ctrl.getAvailableVehicles);
router.get('/:id', ctrl.getVehicle);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.createVehicle);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateVehicle);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.deleteVehicle);

export default router;
