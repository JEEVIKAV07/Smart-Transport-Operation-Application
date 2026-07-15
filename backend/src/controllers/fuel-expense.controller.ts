import { Request, Response, NextFunction } from 'express';
import { fuelLogSchema, expenseSchema } from '../validators';
import * as fuelExpenseService from '../services/fuel-expense.service';
import { successResponse, paginatedResponse } from '../utils/response';

// ─── Fuel Logs ────────────────────────────────────────────────────────────────

export async function listFuelLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { logs, meta } = await fuelExpenseService.listFuelLogs(req.query as Record<string, string>);
    return paginatedResponse(res, logs, meta);
  } catch (err) { return next(err); }
}

export async function createFuelLog(req: Request, res: Response, next: NextFunction) {
  try {
    const data = fuelLogSchema.parse(req.body);
    const log = await fuelExpenseService.createFuelLog(data as never);
    return successResponse(res, log, 'Fuel log created', 201);
  } catch (err) { return next(err); }
}

export async function updateFuelLog(req: Request, res: Response, next: NextFunction) {
  try {
    const data = fuelLogSchema.partial().parse(req.body);
    const log = await fuelExpenseService.updateFuelLog(req.params.id, data as never);
    return successResponse(res, log, 'Fuel log updated');
  } catch (err) { return next(err); }
}

export async function deleteFuelLog(req: Request, res: Response, next: NextFunction) {
  try {
    await fuelExpenseService.deleteFuelLog(req.params.id);
    return successResponse(res, null, 'Fuel log deleted');
  } catch (err) { return next(err); }
}

// ─── Expenses ──────────────────────────────────────────────────────────────────

export async function listExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { expenses, meta } = await fuelExpenseService.listExpenses(req.query as Record<string, string>);
    return paginatedResponse(res, expenses, meta);
  } catch (err) { return next(err); }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await fuelExpenseService.createExpense(data as never);
    return successResponse(res, expense, 'Expense created', 201);
  } catch (err) { return next(err); }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const data = expenseSchema.partial().parse(req.body);
    const expense = await fuelExpenseService.updateExpense(req.params.id, data as never);
    return successResponse(res, expense, 'Expense updated');
  } catch (err) { return next(err); }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction) {
  try {
    await fuelExpenseService.deleteExpense(req.params.id);
    return successResponse(res, null, 'Expense deleted');
  } catch (err) { return next(err); }
}

export async function getOperationalCostSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await fuelExpenseService.getOperationalCostSummary();
    return successResponse(res, summary);
  } catch (err) { return next(err); }
}
