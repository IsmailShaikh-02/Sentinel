import { pool } from '../../db/pool.js';
import { NotFoundError, UnprocessableEntityError } from '../../errors/http.error.js';
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
    const { name, type, url, method, expected_status, check_interval_sec, enabled } = input;

    // Generate heartbeat_key ONLY for passive heartbeat monitors
    const heartbeatKey = type === 'heartbeat' ? crypto.randomBytes(16).toString('hex') : null;
    
    const result = await pool.query<ServiceRecord>(
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

    const service = result.rows[0];

    // Only active HTTP monitors are registered for outbound polling
    if (service.enabled && service.type === 'http') {
      await SchedulerService.scheduleService(service.id, service.check_interval_sec);
    } else if(service.type === 'heartbeat' && service.enabled){
      await SchedulerService.reconcileHeartbeatSweeper();
    }

    return service;
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
      `SELECT * FROM services 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
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