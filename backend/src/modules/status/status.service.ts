import { pool } from '../../db/pool.js';
import { NotFoundError } from '../../errors/http.error.js';

export interface ServiceStatusSummary {
  id: string;
  name: string;
  type: 'http' | 'heartbeat';
  status: 'operational' | 'incident';
  uptimePercentage24h: number;
  p95LatencyMs: number | null;
}

export interface ActiveIncidentSummary {
  id: string;
  serviceId: string;
  serviceName: string;
  summary: string;
  severity: string;
  startedAt: string;
}

export interface PublicStatusResponse {
  systemStatus: 'operational' | 'degraded' | 'outage';
  activeIncidents: ActiveIncidentSummary[];
  services: ServiceStatusSummary[];
}

export class StatusPageService {
  /**
   * Aggregates public system health, active incidents, and rolling 24h metrics for a user's services
   */
  static async getOverview(userId: string): Promise<PublicStatusResponse> {
    // 1. Verify user exists
    const userCheck = await pool.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userCheck.rowCount === 0) {
      throw new NotFoundError('Status page not found');
    }

    // 2. Fetch all currently open incidents for this user's services
    const incidentResult = await pool.query<ActiveIncidentSummary>(
      `SELECT 
         i.id,
         s.id AS "serviceId",
         s.name AS "serviceName",
         i.summary,
         i.severity,
         i.started_at AS "startedAt"
       FROM incidents i
       JOIN services s ON s.id = i.service_id
       WHERE s.user_id = $1 
         AND s.enabled = true
         AND i.resolved_at IS NULL
       ORDER BY i.started_at DESC`,
      [userId]
    );

    const activeIncidents = incidentResult.rows;

    // 3. Aggregate service metrics over a rolling 24-hour window
    const metricsResult = await pool.query<{
      id: string;
      name: string;
      type: 'http' | 'heartbeat';
      hasIncident: boolean;
      uptimePercentage: number;
      p95Latency: number | null;
    }>(
      `SELECT 
         s.id,
         s.name,
         s.type,
         EXISTS (
           SELECT 1 FROM incidents i 
           WHERE i.service_id = s.id AND i.resolved_at IS NULL
         ) AS "hasIncident",
         ROUND(
           COALESCE(
             (COUNT(c.id) FILTER (WHERE c.ok = true)::decimal / NULLIF(COUNT(c.id), 0)) * 100,
             100.0
           ), 
           2
         )::float AS "uptimePercentage",
         ROUND(
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY c.response_time_ms)::numeric, 
           2
         )::float AS "p95Latency"
       FROM services s
       LEFT JOIN checks c 
         ON c.service_id = s.id 
         AND c.checked_at >= NOW() - INTERVAL '24 hours'
       WHERE s.user_id = $1 AND s.enabled = true
       GROUP BY s.id, s.name, s.type
       ORDER BY s.name ASC`,
      [userId]
    );

    const services: ServiceStatusSummary[] = metricsResult.rows.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      status: row.hasIncident ? 'incident' : 'operational',
      uptimePercentage24h: row.uptimePercentage,
      p95LatencyMs: row.type === 'heartbeat' ? 0 : row.p95Latency,
    }));

    // 4. Determine overall system health state
    let systemStatus: 'operational' | 'degraded' | 'outage' = 'operational';
    if (activeIncidents.length === 1) {
      systemStatus = 'degraded';
    } else if (activeIncidents.length >= 2) {
      systemStatus = 'outage';
    }

    return {
      systemStatus,
      activeIncidents,
      services,
    };
  }
}