import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export function validate(schema: ZodTypeAny, source: "body" | "params" | "query" = "body") {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req[source]);
    if (!parsed.success) return next(parsed.error);
    // assign back with the parsed (coerced/defaulted) data
    Object.defineProperty(req, source, { value: parsed.data, writable: true, configurable: true });
    next();
  };
}