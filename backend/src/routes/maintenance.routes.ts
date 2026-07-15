import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/maintenance.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listMaintenance);
router.get('/:id', ctrl.getMaintenance);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.createMaintenance);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.updateMaintenance);
router.patch('/:id/close', authorize('ADMIN', 'FLEET_MANAGER'), ctrl.closeMaintenance);

export default router;
