import { pool } from "../db/pool.js";
import * as repo from "../repositories/incidentRepository.js";

export interface IncidentDecision {
  action: "open" | "close" | "none";
  incidentId?: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface CheckAnalyzer {
  analyzeForIncidents(serviceId: string): Promise<IncidentDecision>;
}

export const incidentAnalyzer: CheckAnalyzer = {
  async analyzeForIncidents(serviceId: string): Promise<IncidentDecision> {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`incident:${serviceId}`]);

      const checksResult = await client.query<{
        ok: boolean;
        status_code: number | null;
        checked_at: Date;
      }>(
        "SELECT ok, status_code, checked_at FROM checks WHERE service_id = $1 ORDER BY checked_at DESC LIMIT 5",
        [serviceId],
      );

      const checks = checksResult.rows;

      let consecutiveFailures = 0;
      for (const c of checks) {
        if (c.ok === false) {
          consecutiveFailures++;
        } else {
          break;
        }
      }

      let consecutiveSuccesses = 0;
      for (const c of checks) {
        if (c.ok === true) {
          consecutiveSuccesses++;
        } else {
          break;
        }
      }

      const openIncident = await repo.findOpenIncident(serviceId, client);

      let decision: IncidentDecision;

      if (consecutiveFailures >= 3 && !openIncident) {
        let severity: "low" | "medium" | "high" = "low";
        if (consecutiveFailures >= 10) {
          severity = "high";
        } else if (consecutiveFailures >= 5) {
          severity = "medium";
        }

        const summary = `${consecutiveFailures} consecutive failures`;
        const created = await repo.createIncident(serviceId, severity, summary, client);
        decision = {
          action: "open",
          incidentId: created.id,
          reason: summary,
          severity,
        };
      } else if (consecutiveSuccesses >= 2 && openIncident) {
        const reason = "2 consecutive successes";
        await repo.resolveIncident(openIncident.id, reason, client);
        decision = {
          action: "close",
          incidentId: openIncident.id,
          reason,
          severity: (openIncident.severity as "low" | "medium" | "high") || "low",
        };
      } else {
        decision = {
          action: "none",
          reason: "Thresholds not met",
          severity: "low",
        };
      }

      await client.query("COMMIT");
      return decision;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },
};
