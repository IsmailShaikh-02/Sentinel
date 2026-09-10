import { pool } from "../db/pool.js";
import { NotFoundError } from "../errors.js";
import { getServiceById, type ServiceRow } from "../repositories/serviceRepository.js";

export interface CheckOutcome {
  statusCode: number | null;
  responseTimeMs: number | null;
  ok: boolean;
}

export async function runCheck(userId: string, serviceId: string): Promise<CheckOutcome> {
  const service: ServiceRow = await getServiceById(userId, serviceId);

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
    // Consume body so the socket is released; don't load it all into memory
    await response.arrayBuffer();
    outcome = {
      statusCode: response.status,
      responseTimeMs,
      ok: response.status === service.expected_status,
    };
  } catch {
    // Network failure / timeout / DNS error — still append a check row
    outcome = { statusCode: null, responseTimeMs: null, ok: false };
  } finally {
    clearTimeout(timeout);
  }

  await pool.query(
    "INSERT INTO checks (service_id, status_code, response_time_ms, ok) VALUES ($1, $2, $3, $4)",
    [service.id, outcome.statusCode, outcome.responseTimeMs, outcome.ok],
  );

  return outcome;
}