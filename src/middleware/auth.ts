import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { UnauthorizedError } from "../errors.js";

// Rule #5: extend Express Request for userId
declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new UnauthorizedError("Missing bearer token");
  }
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub?: string };
    if (!payload.sub) throw new UnauthorizedError("Invalid token payload");
    req.userId = payload.sub;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}