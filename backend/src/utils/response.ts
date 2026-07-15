import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function successResponse<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function paginatedResponse<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Success'
) {
  return res.status(200).json({
    success: true,
    message,
    data,
    meta,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 500,
  errors?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

export function parsePaginationParams(query: Record<string, unknown>) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function parseSortParams(
  query: Record<string, unknown>,
  allowedFields: string[],
  defaultField = 'createdAt'
): { orderBy: Record<string, string> } {
  const sortBy = String(query.sortBy || defaultField);
  const sortOrder = String(query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const field = allowedFields.includes(sortBy) ? sortBy : defaultField;
  return { orderBy: { [field]: sortOrder } };
}
