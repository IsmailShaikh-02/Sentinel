// src/db/incidents.repo.ts
import { pool } from './pool.js';

export interface ActiveIncident {
  id: string;
  service_id: string;
  summary: string;
  severity: string;
  started_at: string;
}

/**
 * Returns the active (unresolved) incident for a service, if one exists.
 */
export async function getActiveIncident(serviceId: string): Promise<ActiveIncident | null> {
  const result = await pool.query<ActiveIncident>(
    `SELECT id, service_id, summary, severity, started_at
     FROM incidents
     WHERE service_id = $1 AND resolved_at IS NULL
     LIMIT 1`,
    [serviceId]
  );
  return result.rows[0] ?? null;
}

/**
 * Checks if the last N probes were all failures (ok = false).
 * Returns the timestamp of the earliest failure in that streak, or null.
 */
export async function determineFailureStreak(
  serviceId: string,
  streakThreshold = 3
): Promise<string | null> {
  const result = await pool.query<{ started_at_check: string }>(
    `WITH latest_probes AS (
        SELECT checked_at, ok
        FROM checks
        WHERE service_id = $1
        ORDER BY checked_at DESC
        LIMIT $2
    )
    SELECT MIN(checked_at) AS started_at_check
    FROM latest_probes
    HAVING COUNT(*) = $2 AND BOOL_AND(ok) = false;`,
    [serviceId, streakThreshold]
  );

  return result.rows[0]?.started_at_check ?? null;
}

/**
 * Checks if the last N probes were all successes (ok = true).
 * Returns true if the recovery condition is satisfied, otherwise false.
 */
export async function determineRecoveryStreak(
  serviceId: string,
  streakThreshold = 2
): Promise<boolean> {
  const result = await pool.query<{ is_recovered: boolean }>(
    `WITH latest_probes AS (
        SELECT checked_at, ok
        FROM checks
        WHERE service_id = $1
        ORDER BY checked_at DESC
        LIMIT $2
    )
    SELECT BOOL_AND(ok) AS is_recovered
    FROM latest_probes
    HAVING COUNT(*) = $2 AND BOOL_AND(ok) = true;`,
    [serviceId, streakThreshold]
  );

  return result.rows[0]?.is_recovered ?? false;
}

export class IncidentRepo {
  /**
   * Opens a new incident safely inside a transaction with row-level locks.
   */
  static async open(
    serviceId: string,
    summary: string,
    failureStartTime: string
  ): Promise<ActiveIncident> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query<ActiveIncident>(
        `SELECT id, service_id, summary, severity, started_at 
         FROM incidents 
         WHERE service_id = $1 AND resolved_at IS NULL 
         LIMIT 1 FOR UPDATE`,
        [serviceId]
      );

      if (existing.rowCount && existing.rowCount > 0) {
        await client.query('ROLLBACK');
        return existing.rows[0];
      }

      // Hardcoding 'critical' directly in SQL avoids any parameter index swapping
      const result = await client.query<ActiveIncident>(
        `INSERT INTO incidents (service_id, summary, severity, started_at, checks_triggered_at)
         VALUES ($1, $2, 'critical', $3, NOW())
         RETURNING id, service_id, summary, severity, started_at`,
        [serviceId, summary, failureStartTime]
      );

      await client.query('COMMIT');
      console.log(`🚨 [Incident Engine] Incident #${result.rows[0].id} OPENED for service ${serviceId}`);
      return result.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
  
  /**
   * Resolves an open incident safely inside a transaction.
   */
  static async resolve(incidentId: string): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE incidents
         SET resolved_at = NOW()
         WHERE id = $1 AND resolved_at IS NULL`,
        [incidentId]
      );

      await client.query('COMMIT');
      console.log(`✅ [Incident Engine] Incident #${incidentId} RESOLVED`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}