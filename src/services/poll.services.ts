// src/services/poll.service.ts
import { pool } from '../db/pool.js';
import { NotFoundError } from '../errors.js';

const FETCH_TIMEOUT_MS = 5000;

interface ServiceRow {
  id: string;
  url: string;
  method: string;
  expected_status: number;
  enabled?: boolean;
}

/**
 * Fetches the service URL, records the result in `checks` (append-only),
 * and returns the outcome. Network/DNS/timeout failures are recorded as
 * `status_code = NULL, ok = false` — a failed check is still a fact.
 */
export async function pollService(userId: string, serviceId: string) {
  const service = await getServiceForUser(userId, serviceId);
  if (!service) throw new NotFoundError('Service not found');
  return recordCheck(service);
}

/** Worker path: scoped to a service id only. Returns null if gone/disabled. */
export async function pollServiceById(serviceId: string) {
  const { rows } = await pool.query<ServiceRow>(
    `SELECT id, url, method, expected_status, enabled FROM services WHERE id = $1`,
    [serviceId],
  );
  const service = rows[0];
  if (!service || service.enabled === false) return null;
  return recordCheck(service);
}

async function getServiceForUser(userId: string, serviceId: string) {
  const { rows } = await pool.query<ServiceRow>(
    `SELECT id, url, method, expected_status, enabled
       FROM services WHERE id = $1 AND user_id = $2 AND enabled = true`,
    [serviceId, userId],
  );
  return rows[0] ?? null;
}

async function recordCheck(service: ServiceRow) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let statusCode: number | null = null;
  let responseTimeMs: number | null = null;
  let ok = false;

  const startedAt = Date.now();
  try {
    const res = await fetch(service.url, {
      method: service.method,
      signal: controller.signal,
      redirect: 'follow',
    });
    responseTimeMs = Date.now() - startedAt;
    statusCode = res.status;
    ok = res.status === service.expected_status;
  } catch {
    responseTimeMs = Date.now() - startedAt;
    ok = false; // status_code stays NULL for network-level failures
  } finally {
    clearTimeout(timer);
  }

  await pool.query(
    `INSERT INTO checks (service_id, status_code, response_time_ms, ok, checked_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [service.id, statusCode, responseTimeMs, ok],
  );

  return { statusCode, responseTimeMs, ok };
}