import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as ctrl from '../controllers/trip.controller';

const router = Router();

router.use(authenticate);

router.get('/', ctrl.listTrips);
router.get('/:id', ctrl.getTrip);
router.post('/', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.createTrip);
router.put('/:id', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.updateTrip);
router.patch('/:id/dispatch', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.dispatchTrip);
router.patch('/:id/complete', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.completeTrip);
router.patch('/:id/cancel', authorize('ADMIN', 'FLEET_MANAGER', 'DRIVER'), ctrl.cancelTrip);

export default router;
