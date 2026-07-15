import { Request, Response, NextFunction } from 'express';
import { tripSchema, tripCompleteSchema } from '../validators';
import * as tripService from '../services/trip.service';
import { successResponse, paginatedResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';

export async function listTrips(req: Request, res: Response, next: NextFunction) {
  try {
    const { trips, meta } = await tripService.listTrips(req.query as Record<string, string>);
    return paginatedResponse(res, trips, meta);
  } catch (err) { return next(err); }
}

export async function getTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.getTripById(req.params.id);
    return successResponse(res, trip);
  } catch (err) { return next(err); }
}

export async function createTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const data = tripSchema.parse(req.body);
    const trip = await tripService.createTrip(data as never);
    await createAuditLog(req.user!.userId, 'CREATE', 'Trip', trip.id, data as Record<string, unknown>);
    return successResponse(res, trip, 'Trip created successfully', 201);
  } catch (err) { return next(err); }
}

export async function updateTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const data = tripSchema.partial().parse(req.body);
    const trip = await tripService.updateTrip(req.params.id, data as never);
    await createAuditLog(req.user!.userId, 'UPDATE', 'Trip', req.params.id, data as Record<string, unknown>);
    return successResponse(res, trip, 'Trip updated successfully');
  } catch (err) { return next(err); }
}

export async function dispatchTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.dispatchTrip(req.params.id);
    await createAuditLog(req.user!.userId, 'DISPATCH', 'Trip', req.params.id);
    return successResponse(res, trip, 'Trip dispatched successfully');
  } catch (err) { return next(err); }
}

export async function completeTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const data = tripCompleteSchema.parse(req.body);
    const trip = await tripService.completeTrip(req.params.id, data);
    await createAuditLog(req.user!.userId, 'COMPLETE', 'Trip', req.params.id, data as Record<string, unknown>);
    return successResponse(res, trip, 'Trip completed successfully');
  } catch (err) { return next(err); }
}

export async function cancelTrip(req: Request, res: Response, next: NextFunction) {
  try {
    const trip = await tripService.cancelTrip(req.params.id);
    await createAuditLog(req.user!.userId, 'CANCEL', 'Trip', req.params.id);
    return successResponse(res, trip, 'Trip cancelled successfully');
  } catch (err) { return next(err); }
}
