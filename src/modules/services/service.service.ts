import { pool } from '../../db/pool.js';
import { NotFoundError } from '../../errors/http.error.js';
import type { CreateServiceInput, UpdateServiceInput } from './service.schema.js';
import { probeUrl } from './checker.js';

export interface ServiceRecord {
  id: string;
  user_id: string;
  name: string;
  url: string;
  method: string;
  expected_status: number;
  check_interval_sec: number;
  enabled: boolean;
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
    const { name, url, method, expected_status, check_interval_sec, enabled } = input;

    const result = await pool.query<ServiceRecord>(
      `INSERT INTO services (user_id, name, url, method, expected_status, check_interval_sec, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [userId, name, url, method, expected_status, check_interval_sec, enabled]
    );

    return result.rows[0];
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

    return result.rows[0];
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
  }

//Fetch the service record while verifying user ownership via getById(userId, serviceId). 
  static async runManualCheck(userId: string, serviceId: string): Promise<CheckRecord> {
    // 1. Scoped ownership check: verify the service belongs to this user
    const service = await ServiceManager.getById(userId, serviceId);

    // 2. Perform the probe with 5s timeout
    const probe = await probeUrl(service.url, service.method, service.expected_status, 5000);

    // 3. Append-only insert into checks table
    const result = await pool.query<CheckRecord>(
      `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
       VALUES ($1, $2, $3, $4)
       RETURNING id, service_id, status_code, response_time_ms, ok, checked_at`,
      [service.id, probe.statusCode, probe.responseTimeMs, probe.ok]
    );

    return result.rows[0];
  }
}