// src/middlewares/demo-guard.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const blockDestructiveForDemo = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.isDemo) {
    return next();
  }

  // Allow safe reads, manual checks, and non-destructive service setting updates (PATCH)
  const isCheckProbe = req.method === 'POST' && req.path.endsWith('/check');
  if (req.method === 'GET' || req.method === 'PATCH' || isCheckProbe) {
    return next();
  }

  // Block DELETE, PUT, and new service creation for demo user
  res.status(403).json({
    error: 'Action prohibited: Destructive actions are disabled on the shared demo account.',
  });
};