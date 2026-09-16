import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { HttpError } from '../errors/http.error';

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
): void=>{
    if(err instanceof ZodError){
        res.status(422).json({
            error:"Validation Error",
            issues: err.flatten().fieldErrors
        });
        return;
    }
    if(err instanceof HttpError){
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }
    // 3. Fallback for unhandled/unexpected system errors -> HTTP 500
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
}