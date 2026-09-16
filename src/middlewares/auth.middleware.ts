// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError } from '../errors/http.error.js';
import { verifyToken } from '../utils/jwt.js';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Missing token');
    }

    const payload = verifyToken(token);
    req.userId = payload.sub;
    next();
  } catch (error) {
    next(error instanceof UnauthorizedError ? error : new UnauthorizedError('Invalid or expired token'));
  }
};