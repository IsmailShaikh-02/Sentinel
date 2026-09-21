import { pool } from '../../db/pool.js';
import { ConflictError, NotFoundError, UnprocessableEntityError } from '../../errors/http.error.js';
import type { CreateServiceInput, UpdateServiceInput } from './service.schema.js';
import { probeUrl } from './checker.js';
import { SchedulerService } from '../scheduler/scheduler.service.js';
import crypto from 'node:crypto';
import { scheduler } from 'node:timers/promises';

export interface ServiceRecord {
  id: string;
  user_id: string;
  name: string;
  type: 'http' | 'heartbeat';
  url: string | null;
  method: string;
  expected_status: number;
  check_interval_sec: number;
  enabled: boolean;
  heartbeat_key: string | null;
  created_at: string;
}

export interface CheckRecord {
  id: string;
  service_id: string;
  status_code: number | null;
  response_time_ms: number;
  ok: boolean;
  checked_at: string;
}

export class ServiceManager {
  static async create(userId: string, input: CreateServiceInput): Promise<ServiceRecord> {
    const {
      name,
      type = 'http',
      url,
      method = 'GET',
      expected_status = 200,
      check_interval_sec = 60,
      enabled = true,
    } = input;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Hard Quota Check: Scoped strictly to the authenticated user
      const countResult = await client.query<{ count: number }>(
        `SELECT COUNT(*)::int AS count 
         FROM services 
         WHERE user_id = $1`,
        [userId]
      );

      const currentServiceCount = countResult.rows[0]?.count ?? 0;
      if (currentServiceCount >= 10) {
        throw new ConflictError('Service limit reached (maximum 10 services per account)');
      }

      // 2. Generate secret key only for passive push monitors
      const heartbeatKey = type === 'heartbeat' 
        ? crypto.randomBytes(16).toString('hex') 
        : null;

      // 3. Insert new service record
      const result = await client.query<ServiceRecord>(
        `INSERT INTO services (
          user_id, name, type, url, method, expected_status, 
          check_interval_sec, enabled, heartbeat_key
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          userId,
          name,
          type,
          url ?? null,
          method,
          expected_status,
          check_interval_sec,
          enabled,
          heartbeatKey,
        ]
      );

      await client.query('COMMIT');

      const service = result.rows[0];

      // 4. Synchronize schedulers outside the database transaction
      if (service.enabled && service.type === 'http') {
        await SchedulerService.scheduleService(service.id, service.check_interval_sec);
      } else if (service.enabled && service.type === 'heartbeat') {
        await SchedulerService.reconcileHeartbeatSweeper();
      }

      return service;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  static async getById(userId: string, serviceId: string): Promise<ServiceRecord> {
    const result = await pool.query<ServiceRecord>(
      `SELECT * FROM services 
       WHERE id = $1 AND user_id = $2`,
      [serviceId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Service not found');
    }

    return result.rows[0];
  }

  static async listAll(userId: string): Promise<ServiceRecord[]> {
    const result = await pool.query<ServiceRecord>(
      `SELECT s.*,
              lc.ok AS last_check_ok,
              lc.status_code AS last_status_code,
              lc.response_time_ms AS last_response_time_ms,
              lc.checked_at AS last_checked_at
       FROM services s
       LEFT JOIN LATERAL (
         SELECT ok, status_code, response_time_ms, checked_at
         FROM checks
         WHERE service_id = s.id
         ORDER BY checked_at DESC
         LIMIT 1
       ) lc ON true
       WHERE s.user_id = $1 
       ORDER BY s.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  static async update(userId: string, serviceId: string, input: UpdateServiceInput): Promise<ServiceRecord> {
  const { name, url, method, expected_status, check_interval_sec, enabled } = input;

  // 1. Ownership verification: throws NotFoundError automatically if not found or unauthorized
  const service = await ServiceManager.getById(userId, serviceId);

  // 2. Perform parameterized update with COALESCE
  const result = await pool.query<ServiceRecord>(
    `UPDATE services
     SET
       name = COALESCE($1, name),
       url = COALESCE($2, url),
       method = COALESCE($3, method),
       expected_status = COALESCE($4, expected_status),
       check_interval_sec = COALESCE($5, check_interval_sec),
       enabled = COALESCE($6, enabled)
     WHERE id = $7 AND user_id = $8
     RETURNING *;`,
    [
      name ?? null,
      url ?? null,
      method ?? null,
      expected_status ?? null,
      check_interval_sec ?? null,
      enabled ?? null,
      serviceId,
      userId,
    ]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Service not found');
  }

  const updated = result.rows[0];

  // 3. Synchronize scheduler only for active HTTP services
  if (service.type === 'http') {
    if (updated.enabled === false) {
      await SchedulerService.removeService(serviceId);
    } else if (updated.enabled === true) {
      await SchedulerService.scheduleService(serviceId, updated.check_interval_sec);
    } 
  }
  if( service.type === 'heartbeat'){
    await SchedulerService.reconcileHeartbeatSweeper();
  }

  return updated;
}
  static async delete(userId: string, serviceId: string): Promise<void> {
    const result = await pool.query(
      `DELETE FROM services 
       WHERE id = $1 AND user_id = $2 
       RETURNING id`,
      [serviceId, userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Service not found');
    }
    // Remove job from Redis
    await SchedulerService.removeService(serviceId);
    await SchedulerService.reconcileHeartbeatSweeper();
  }

static async runManualCheck(userId: string, serviceId: string): Promise<CheckRecord> {
  // 1. Scoped ownership check: verify the service belongs to this user
  const service = await ServiceManager.getById(userId, serviceId);

  // 2. Heartbeat monitors cannot be manually probed via HTTP
  if (service.type === 'heartbeat' || !service.url) {
    throw new UnprocessableEntityError('Manual probe is not supported for passive heartbeat services');
  }

  // 3. Perform the probe with 5s timeout
  const probe = await probeUrl(service.url, service.method, service.expected_status, 5000);

  // 4. Append-only insert into checks table
  const result = await pool.query<CheckRecord>(
    `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
     VALUES ($1, $2, $3, $4)
     RETURNING id, service_id, status_code, response_time_ms, ok, checked_at`,
    [service.id, probe.statusCode, probe.responseTimeMs, probe.ok]
  );

  return result.rows[0];
}
}