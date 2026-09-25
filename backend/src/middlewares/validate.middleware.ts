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

      // req.body can be reassigned directly
      if (data.body !== undefined) {
        req.body = data.body;
      }

      // req.query has only a getter on IncomingMessage: mutate its keys in place
      if (data.query !== undefined) {
        for (const key of Object.keys(req.query)) {
          delete (req.query as Record<string, unknown>)[key];
        }
        Object.assign(req.query, data.query);
      }

      // req.params can be assigned or safely merged
      if (data.params !== undefined) {
        req.params = data.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};