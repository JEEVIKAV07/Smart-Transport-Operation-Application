import { Request, Response, NextFunction } from 'express';
import { maintenanceSchema, maintenanceCloseSchema } from '../validators';
import * as maintenanceService from '../services/maintenance.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';

export async function listMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const { records, meta } = await maintenanceService.listMaintenance(req.query as Record<string, string>);
    return paginatedResponse(res, records, meta);
  } catch (err) { return next(err); }
}

export async function getMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    return successResponse(res, record);
  } catch (err) { return next(err); }
}

export async function createMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = maintenanceSchema.parse(req.body);
    const record = await maintenanceService.createMaintenance(data as never);
    await createAuditLog(req.user!.userId, 'CREATE', 'Maintenance', record.id, data as Record<string, unknown>);
    return successResponse(res, record, 'Maintenance record created. Vehicle status changed to In Shop.', 201);
  } catch (err) { return next(err); }
}

export async function updateMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = maintenanceSchema.partial().parse(req.body);
    const record = await maintenanceService.updateMaintenance(req.params.id, data as never);
    await createAuditLog(req.user!.userId, 'UPDATE', 'Maintenance', req.params.id, data as Record<string, unknown>);
    return successResponse(res, record, 'Maintenance record updated');
  } catch (err) { return next(err); }
}

export async function closeMaintenance(req: Request, res: Response, next: NextFunction) {
  try {
    const data = maintenanceCloseSchema.parse(req.body);
    const record = await maintenanceService.closeMaintenance(req.params.id, data as never);
    await createAuditLog(req.user!.userId, 'CLOSE', 'Maintenance', req.params.id, data as Record<string, unknown>);
    return successResponse(res, record, 'Maintenance completed. Vehicle status restored to Available.');
  } catch (err) { return next(err); }
}
