// src/modules/analytics/analytics.service.ts
import { pool } from '../../db/pool.js';
import { NotFoundError } from '../../errors/http.error.js';
import type { UptimeWindow } from './analytics.schema.js';

export interface UptimeResult {
  serviceId: string;
  window: UptimeWindow;
  totalChecks: number;
  successfulChecks: number;
  uptimePercentage: number;
}

export interface LatencyResult {
  serviceId: string;
  window: UptimeWindow;
  sampleCount: number;
  avgMs: number | null;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
}

export class AnalyticsService {
  private static getInterval(window: UptimeWindow): string {
    switch (window) {
      case '7d':
        return '7 days';
      case '30d':
        return '30 days';
      case '24h':
      default:
        return '24 hours';
    }
  }

  static async getUptime(userId: string, serviceId: string, window: UptimeWindow): Promise<UptimeResult> {
    const interval = this.getInterval(window);

    const query = `
      SELECT 
        COUNT(c.id)::int AS "totalChecks",
        COUNT(c.id) FILTER (WHERE c.ok = true)::int AS "successfulChecks",
        ROUND(
          COALESCE(
            (COUNT(c.id) FILTER (WHERE c.ok = true)::decimal / NULLIF(COUNT(c.id), 0)) * 100,
            100.0
          ), 
          2
        )::float AS "uptimePercentage"
      FROM services s
      LEFT JOIN checks c 
        ON c.service_id = s.id 
        AND c.checked_at >= NOW() - $3::interval
      WHERE s.id = $1 AND s.user_id = $2
      GROUP BY s.id;
    `;

    const result = await pool.query<{
      totalChecks: number;
      successfulChecks: number;
      uptimePercentage: number;
    }>(query, [serviceId, userId, interval]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Service not found');
    }

    const stats = result.rows[0];

    return {
      serviceId,
      window,
      totalChecks: stats.totalChecks,
      successfulChecks: stats.successfulChecks,
      uptimePercentage: stats.uptimePercentage,
    };
  }

  static async getLatency(userId: string, serviceId: string, window: UptimeWindow): Promise<LatencyResult> {
    const interval = this.getInterval(window);

    const query = `
      SELECT 
        COUNT(c.response_time_ms)::int AS "sampleCount",
        ROUND(AVG(c.response_time_ms)::numeric, 2)::float AS "avgMs",
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY c.response_time_ms)::numeric, 2)::float AS "p50Ms",
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY c.response_time_ms)::numeric, 2)::float AS "p95Ms",
        ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY c.response_time_ms)::numeric, 2)::float AS "p99Ms"
      FROM services s
      LEFT JOIN checks c 
        ON c.service_id = s.id 
        AND c.checked_at >= NOW() - $3::interval
        AND c.response_time_ms IS NOT NULL
      WHERE s.id = $1 AND s.user_id = $2
      GROUP BY s.id;
    `;

    const result = await pool.query<{
      sampleCount: number;
      avgMs: number | null;
      p50Ms: number | null;
      p95Ms: number | null;
      p99Ms: number | null;
    }>(query, [serviceId, userId, interval]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Service not found');
    }

    const stats = result.rows[0];

    return {
      serviceId,
      window,
      sampleCount: stats.sampleCount,
      avgMs: stats.avgMs,
      p50Ms: stats.p50Ms,
      p95Ms: stats.p95Ms,
      p99Ms: stats.p99Ms,
    };
  }
}