import { Request, Response, NextFunction } from 'express';
import { driverSchema } from '../validators';
import * as driverService from '../services/driver.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';
import { DriverStatus } from '@prisma/client';

export async function listDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { drivers, meta } = await driverService.listDrivers(req.query as Record<string, string>);
    return paginatedResponse(res, drivers, meta);
  } catch (err) { return next(err); }
}

export async function getDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    return successResponse(res, driver);
  } catch (err) { return next(err); }
}

export async function createDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const data = driverSchema.parse(req.body);
    const driver = await driverService.createDriver(data as never);
    await createAuditLog(req.user!.userId, 'CREATE', 'Driver', driver.id, data as Record<string, unknown>);
    return successResponse(res, driver, 'Driver created successfully', 201);
  } catch (err) { return next(err); }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const data = driverSchema.partial().parse(req.body);
    const driver = await driverService.updateDriver(req.params.id, data as never);
    await createAuditLog(req.user!.userId, 'UPDATE', 'Driver', req.params.id, data as Record<string, unknown>);
    return successResponse(res, driver, 'Driver updated successfully');
  } catch (err) { return next(err); }
}

export async function deleteDriver(req: Request, res: Response, next: NextFunction) {
  try {
    await driverService.deleteDriver(req.params.id);
    await createAuditLog(req.user!.userId, 'DELETE', 'Driver', req.params.id);
    return successResponse(res, null, 'Driver deleted successfully');
  } catch (err) { return next(err); }
}

export async function updateDriverStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body as { status: DriverStatus };
    const driver = await driverService.updateDriverStatus(req.params.id, status);
    await createAuditLog(req.user!.userId, 'STATUS_CHANGE', 'Driver', req.params.id, { status });
    return successResponse(res, driver, 'Driver status updated');
  } catch (err) { return next(err); }
}

export async function getAvailableDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const drivers = await driverService.getAvailableDrivers();
    return successResponse(res, drivers);
  } catch (err) { return next(err); }
}
