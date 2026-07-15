import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../config/database';
import { errorResponse } from '../utils/response';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse(res, 'Unauthorized: No token provided', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwtSecret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return errorResponse(res, 'Unauthorized: User not found', 401);
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    return next();
  } catch {
    return errorResponse(res, 'Unauthorized: Invalid token', 401);
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, 'Unauthorized', 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Forbidden: Insufficient permissions', 403);
    }
    return next();
  };
}
