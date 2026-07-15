import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/driver.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listDrivers);
router.get('/available', ctrl.getAvailableDrivers);
router.get('/:id', ctrl.getDriver);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), ctrl.createDriver);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), ctrl.updateDriver);
router.patch('/:id/status', authorize('ADMIN', 'FLEET_MANAGER', 'SAFETY_OFFICER'), ctrl.updateDriverStatus);
router.delete('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.deleteDriver);

export default router;
