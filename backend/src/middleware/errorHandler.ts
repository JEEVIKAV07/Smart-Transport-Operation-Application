import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { errorResponse } from '../utils/response';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error(`[Error] ${req.method} ${req.path}:`, err);

  if (err instanceof ZodError) {
    return errorResponse(res, 'Validation error', 422, err.errors);
  }

  // Prisma unique constraint violation
  if ((err as NodeJS.ErrnoException).message?.includes('Unique constraint')) {
    return errorResponse(res, 'A record with this value already exists', 409);
  }

  // Prisma record not found
  if ((err as NodeJS.ErrnoException).message?.includes('Record to update not found')) {
    return errorResponse(res, 'Record not found', 404);
  }

  const statusCode = (err as { statusCode?: number }).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Internal server error'
    : err.message || 'Internal server error';

  return errorResponse(res, message, statusCode);
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}
