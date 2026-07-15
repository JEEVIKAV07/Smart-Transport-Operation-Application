import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../validators';
import { loginService, getMeService } from '../services/auth.service';
import { successResponse } from '../utils/response';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginService(data.email, data.password);
    return successResponse(res, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getMeService(req.user!.userId);
    return successResponse(res, user);
  } catch (err) {
    return next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  return successResponse(res, null, 'Logged out successfully');
}
