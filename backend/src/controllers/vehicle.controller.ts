import { Request, Response, NextFunction } from 'express';
import { vehicleSchema } from '../validators';
import * as vehicleService from '../services/vehicle.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';

export async function listVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicles, meta } = await vehicleService.listVehicles(req.query as Record<string, string>);
    return paginatedResponse(res, vehicles, meta);
  } catch (err) { return next(err); }
}

export async function getVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    return successResponse(res, vehicle);
  } catch (err) { return next(err); }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await vehicleService.createVehicle(data as never);
    await createAuditLog(req.user!.userId, 'CREATE', 'Vehicle', vehicle.id, data as Record<string, unknown>);
    return successResponse(res, vehicle, 'Vehicle created successfully', 201);
  } catch (err) { return next(err); }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const data = vehicleSchema.partial().parse(req.body);
    const vehicle = await vehicleService.updateVehicle(req.params.id, data as never);
    await createAuditLog(req.user!.userId, 'UPDATE', 'Vehicle', req.params.id, data as Record<string, unknown>);
    return successResponse(res, vehicle, 'Vehicle updated successfully');
  } catch (err) { return next(err); }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    await vehicleService.deleteVehicle(req.params.id);
    await createAuditLog(req.user!.userId, 'DELETE', 'Vehicle', req.params.id);
    return successResponse(res, null, 'Vehicle deleted successfully');
  } catch (err) { return next(err); }
}

export async function getAvailableVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicles = await vehicleService.getAvailableVehicles();
    return successResponse(res, vehicles);
  } catch (err) { return next(err); }
}
