import type { Pool, PoolClient } from "pg";
import { pool } from "../db/pool.js";

type Queryable = Pool | PoolClient;

export interface OpenIncident {
  id: string;
  severity: string;
}

export interface ActiveIncident {
  id: string;
  service_name: string;
  started_at: Date;
  severity: string;
  summary: string;
}

export interface HistoricalIncident {
  id: string;
  started_at: Date;
  resolved_at: Date | null;
  severity: string;
  summary: string;
}

export async function hasOpenIncident(serviceId: string, db: Queryable = pool): Promise<boolean> {
  const result = await db.query<{ exists: boolean }>(
    "SELECT EXISTS(SELECT 1 FROM incidents WHERE service_id = $1 AND resolved_at IS NULL) as exists",
    [serviceId],
  );
  return Boolean(result.rows[0]?.exists);
}

export async function findOpenIncident(
  serviceId: string,
  db: Queryable = pool,
): Promise<OpenIncident | null> {
  const result = await db.query<OpenIncident>(
    "SELECT id, severity FROM incidents WHERE service_id = $1 AND resolved_at IS NULL LIMIT 1",
    [serviceId],
  );
  return result.rows[0] ?? null;
}

export async function createIncident(
  serviceId: string,
  severity: string,
  summary: string,
  db: Queryable = pool,
): Promise<{ id: string }> {
  const result = await db.query<{ id: string }>(
    `INSERT INTO incidents (service_id, severity, summary)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [serviceId, severity, summary],
  );
  return result.rows[0]!;
}

export async function resolveIncident(
  incidentId: string,
  _reason: string,
  db: Queryable = pool,
): Promise<void> {
  await db.query(
    "UPDATE incidents SET resolved_at = now() WHERE id = $1 AND resolved_at IS NULL",
    [incidentId],
  );
}

export async function listActiveIncidents(
  userId: string,
  serviceId?: string,
  db: Queryable = pool,
): Promise<ActiveIncident[]> {
  let query = `
    SELECT i.id, s.name AS service_name, i.started_at, i.severity, i.summary
    FROM incidents i
    JOIN services s ON s.id = i.service_id
    WHERE s.user_id = $1 AND i.resolved_at IS NULL
  `;
  const params: unknown[] = [userId];

  if (serviceId) {
    params.push(serviceId);
    query += ` AND i.service_id = $${params.length}`;
  }

  query += " ORDER BY i.started_at DESC";

  const result = await db.query<ActiveIncident>(query, params);
  return result.rows;
}

export async function listHistoricalIncidents(
  serviceId: string,
  db: Queryable = pool,
): Promise<HistoricalIncident[]> {
  const result = await db.query<HistoricalIncident>(
    `SELECT id, started_at, resolved_at, severity, summary
     FROM incidents
     WHERE service_id = $1
     ORDER BY started_at DESC`,
    [serviceId],
  );
  return result.rows;
}
