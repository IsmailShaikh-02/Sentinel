import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors.js";
import * as repo from "../repositories/serviceRepository.js";
import { runCheck } from "../services/checkService.js";

function requireUserId(req: Request): string {
  const userId = req.userId;
  if (!userId) throw new NotFoundError(); // unreachable behind requireAuth, but keeps TS strict
  return userId;
}

// @types/express v5 types param values as `string | string[]`; our
// uuidParamSchema validation middleware guarantees a single string at
// runtime, so this guard satisfies TS and stays honest about ownership.
function requireUuidParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new NotFoundError("Missing or invalid path parameter");
  }
  return value;
}

export async function createService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await repo.createService(requireUserId(req), req.body);
    res.status(201).json(service);
  } catch (err) {
    next(err);
  }
}

export async function listServices(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await repo.listServices(requireUserId(req)));
  } catch (err) {
    next(err);
  }
}

export async function getService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await repo.getServiceById(requireUserId(req), requireUuidParam(req, "id")));
  } catch (err) {
    next(err);
  }
}

export async function updateService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(
      await repo.updateService(requireUserId(req), requireUuidParam(req, "id"), req.body),
    );
  } catch (err) {
    next(err);
  }
}

export async function deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await repo.deleteService(requireUserId(req), requireUuidParam(req, "id"));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function manualCheck(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const serviceId = requireUuidParam(req, "id");
    // ensure ownership before running
    await repo.getServiceById(requireUserId(req), serviceId);
    const outcome = await runCheck(requireUserId(req), serviceId);
    res.json(outcome);
  } catch (err) {
    next(err);
  }
}