// src/middlewares/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import type { ParamsDictionary, Query } from 'express-serve-static-core';

export const validate = (schema: ZodType) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      const data = parsed as {
        body?: unknown;
        query?: Query;
        params?: ParamsDictionary;
      };

      if (data.body !== undefined) req.body = data.body;
      if (data.query !== undefined) req.query = data.query;
      if (data.params !== undefined) req.params = data.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};