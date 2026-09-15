import { pool } from "../db/pool.js";
import { NotFoundError } from "../errors.js";
import { getServiceById, getServiceByIdInternal, type ServiceRow } from "../repositories/serviceRepository.js";
import { incidentAnalyzer } from "./incidentService.js";

export interface CheckOutcome {
  statusCode: number | null;
  responseTimeMs: number | null;
  ok: boolean;
}

/**
 * The domain capability: probe a service and record the outcome.
 * Caller is responsible for ensuring the actor is allowed to check this service:
 *  - HTTP path: runAuthorizedCheck enforces user ownership
 *  - Worker path: runWorkerCheck, authorized by being the system itself
 */
async function performCheck(service: ServiceRow): Promise<CheckOutcome> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  const startedAt = Date.now();

  let outcome: CheckOutcome;
  try {
    const response = await fetch(service.url, {
      method: service.method,
      signal: controller.signal,
      redirect: "follow",
    });
    const responseTimeMs = Date.now() - startedAt;
    await response.arrayBuffer();
    outcome = {
      statusCode: response.status,
      responseTimeMs,
      ok: response.status === service.expected_status,
    };
  } catch {
    outcome = { statusCode: null, responseTimeMs: null, ok: false };
  } finally {
    clearTimeout(timeout);
  }

  await pool.query(
    "INSERT INTO checks (service_id, status_code, response_time_ms, ok) VALUES ($1, $2, $3, $4)",
    [service.id, outcome.statusCode, outcome.responseTimeMs, outcome.ok],
  );

  await incidentAnalyzer.analyzeForIncidents(service.id);

  return outcome;
}

/** HTTP path — ownership enforced: service must belong to userId. */
export async function runCheck(userId: string, serviceId: string): Promise<CheckOutcome> {
  const service = await getServiceById(userId, serviceId);
  return performCheck(service);
}

/** Worker path — the system polls its own registered services. */
export async function runWorkerCheck(serviceId: string): Promise<CheckOutcome> {
  const service = await getServiceByIdInternal(serviceId);
  return performCheck(service);
}