import { pool } from '../../db/pool.js';

export interface ListIncidentsParams {
  status?: string;
  severity?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

export class IncidentsService {
  static async listIncidents(userId: string, params: ListIncidentsParams) {
    const page = params.page && params.page > 0 ? params.page : 1;
    const limit = params.limit && params.limit > 0 ? Math.min(params.limit, 100) : 20;
    const offset = (page - 1) * limit;

    const statusFilter = params.status && params.status !== 'all' ? params.status : null;
    const severityFilter = params.severity && params.severity !== 'all' ? params.severity : null;
    const serviceIdFilter = params.serviceId || null;

    const whereClauses = ['s.user_id = $1'];
    const queryParams: unknown[] = [userId];

    if (statusFilter === 'open') {
      whereClauses.push('i.resolved_at IS NULL');
    } else if (statusFilter === 'resolved') {
      whereClauses.push('i.resolved_at IS NOT NULL');
    }

    if (severityFilter) {
      queryParams.push(severityFilter);
      whereClauses.push(`i.severity = $${queryParams.length}`);
    }

    if (serviceIdFilter) {
      queryParams.push(serviceIdFilter);
      whereClauses.push(`i.service_id = $${queryParams.length}`);
    }

    const whereString = whereClauses.join(' AND ');

    // Total count query
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM incidents i
       JOIN services s ON i.service_id = s.id
       WHERE ${whereString}`,
      queryParams
    );
    const total = parseInt(countResult.rows[0]?.count || '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    // Items query
    const limitOffsetParams = [...queryParams, limit, offset];
    const itemsResult = await pool.query(
      `SELECT 
         i.id,
         i.service_id,
         s.name AS service_name,
         i.summary,
         i.severity,
         i.started_at,
         i.resolved_at,
         ROUND(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.started_at)) / 60)::int AS duration_minutes
       FROM incidents i
       JOIN services s ON i.service_id = s.id
       WHERE ${whereString}
       ORDER BY i.started_at DESC
       LIMIT $${limitOffsetParams.length - 1} OFFSET $${limitOffsetParams.length}`,
      limitOffsetParams
    );

    const incidents = itemsResult.rows.map((row) => ({
      ...row,
      duration_minutes: row.duration_minutes ? Number(row.duration_minutes) : 0,
    }));

    return {
      incidents,
      total,
      page,
      totalPages,
    };
  }

  static async getIncidentById(userId: string, incidentId: string) {
    const incidentResult = await pool.query(
      `SELECT 
         i.id,
         i.service_id,
         s.name AS service_name,
         i.summary,
         i.severity,
         i.started_at,
         i.resolved_at,
         ROUND(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.started_at)) / 60)::int AS duration_minutes
       FROM incidents i
       JOIN services s ON i.service_id = s.id
       WHERE i.id = $1 AND s.user_id = $2`,
      [incidentId, userId]
    );

    if (incidentResult.rows.length === 0) {
      return null;
    }

    const incident = incidentResult.rows[0];

    // Fetch checks for the service around or during the incident window (last 20 checks)
    const checksResult = await pool.query(
      `SELECT id::text, service_id, status_code, response_time_ms, ok, checked_at
       FROM checks
       WHERE service_id = $1
       ORDER BY checked_at DESC
       LIMIT 20`,
      [incident.service_id]
    );

    return {
      ...incident,
      duration_minutes: incident.duration_minutes ? Number(incident.duration_minutes) : 0,
      checks: checksResult.rows,
    };
  }
}
