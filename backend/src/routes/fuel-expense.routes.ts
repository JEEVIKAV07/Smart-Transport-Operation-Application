import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as ctrl from '../controllers/fuel-expense.controller';

const router = Router();

router.use(authenticate);

// Fuel logs
router.get('/fuel', ctrl.listFuelLogs);
router.post('/fuel', ctrl.createFuelLog);
router.put('/fuel/:id', ctrl.updateFuelLog);
router.delete('/fuel/:id', ctrl.deleteFuelLog);

// Expenses
router.get('/expenses', ctrl.listExpenses);
router.post('/expenses', ctrl.createExpense);
router.put('/expenses/:id', ctrl.updateExpense);
router.delete('/expenses/:id', ctrl.deleteExpense);

// Summary
router.get('/summary', ctrl.getOperationalCostSummary);

export default router;
