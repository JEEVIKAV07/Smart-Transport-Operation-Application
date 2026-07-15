import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';
import { successResponse } from '../utils/response';

export async function getKPIs(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, status, region } = req.query as Record<string, string>;
    const kpis = await dashboardService.getDashboardKPIs({ type, status, region });
    return successResponse(res, kpis);
  } catch (err) { return next(err); }
}

export async function getRecentTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const trips = await dashboardService.getRecentTrips();
    return successResponse(res, trips);
  } catch (err) { return next(err); }
}

export async function getVehicleStatusChart(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getVehicleStatusChart();
    return successResponse(res, data);
  } catch (err) { return next(err); }
}

export async function getDriverStatusChart(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getDriverStatusChart();
    return successResponse(res, data);
  } catch (err) { return next(err); }
}

export async function getMonthlyCharts(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getMonthlyCharts();
    return successResponse(res, data);
  } catch (err) { return next(err); }
}
