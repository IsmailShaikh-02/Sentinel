import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../errors.js";
import * as repo from "../repositories/incidentRepository.js";
import { getServiceById } from "../repositories/serviceRepository.js";

function requireUserId(req: Request): string {
  const userId = req.userId;
  if (!userId) throw new NotFoundError("User not found");
  return userId;
}

function requireUuidParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value !== "string" || value.length === 0) {
    throw new NotFoundError("Missing or invalid path parameter");
  }
  return value;
}

export async function listIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = requireUserId(req);
    const service_id = typeof req.query["service_id"] === "string" ? req.query["service_id"] : undefined;

    const incidents = await repo.listActiveIncidents(userId, service_id);
    res.json(incidents);
  } catch (err) {
    next(err);
  }
}

export async function getServiceIncidents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = requireUserId(req);
    const serviceId = requireUuidParam(req, "id");

    // Enforce ownership: will throw NotFoundError if service doesn't exist or belong to user
    await getServiceById(userId, serviceId);

    const incidents = await repo.listHistoricalIncidents(serviceId);
    res.json(incidents);
  } catch (err) {
    next(err);
  }
}
