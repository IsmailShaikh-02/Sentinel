import { pool } from '../../db/pool.js';
import { NotFoundError } from '../../errors/http.error.js';
import { IncidentEngine } from '../engine/engine.service.js';

export interface HeartbeatAck {
  serviceId: string;
  name: string;
  receivedAt: string;
}

export class HeartbeatService {
  /**
   * Processes an incoming heartbeat ping from a remote cron job or worker
   */
  static async ping(heartbeatKey: string): Promise<HeartbeatAck> {
    // 1. Locate the service by heartbeat_key
    const serviceResult = await pool.query<{ id: string; name: string }>(
      `SELECT id, name 
       FROM services 
       WHERE heartbeat_key = $1 AND enabled = true`,
      [heartbeatKey]
    );

    if (serviceResult.rowCount === 0) {
      throw new NotFoundError('Invalid heartbeat key or service disabled');
    }

    const service = serviceResult.rows[0];

    // 2. Append-only record into checks (status 200, latency 0ms, ok = true)
    await pool.query(
      `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
       VALUES ($1, 200, 0, true)`,
      [service.id]
    );

    // 3. Inform the incident engine to allow recovery if it was previously flagged
    try {
      await IncidentEngine.processHealthProbe(service.id);
    } catch (err) {
      console.error(`❌ Incident Engine error during heartbeat for ${service.id}:`, err);
    }

    return {
      serviceId: service.id,
      name: service.name,
      receivedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Scans for enabled heartbeat monitors that missed their expected check-in deadline.
   * Generates a failure check and notifies the Incident Engine.
   */
  static async evaluateSilentHeartbeats(): Promise<void> {
    const overdueResult = await pool.query<{ id: string; name: string }>(
      `SELECT s.id, s.name
       FROM services s
       LEFT JOIN LATERAL (
         SELECT checked_at 
         FROM checks 
         WHERE service_id = s.id 
         ORDER BY checked_at DESC 
         LIMIT 1
       ) latest ON true
       WHERE s.type = 'heartbeat'
         AND s.enabled = true
         AND (
           latest.checked_at IS NULL 
           OR latest.checked_at < NOW() - (s.check_interval_sec || ' seconds')::interval
         )`
    );

    for (const service of overdueResult.rows) {
      // 1. Record an append-only failure check indicating missed check-in
      await pool.query(
        `INSERT INTO checks (service_id, status_code, response_time_ms, ok)
         VALUES ($1, NULL, 0, false)`,
        [service.id]
      );

      // 2. Feed the failure fact into the hysteresis engine
      try {
        await IncidentEngine.processHealthProbe(service.id);
      } catch (err) {
        console.error(`❌ Incident engine error on silent heartbeat for ${service.name}:`, err);
      }
    }
  }
}