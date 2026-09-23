import { type Result } from "@/api/client";
import { servicesApi } from "@/api/services";
import { incidentsApi } from "@/api/incidents";

export interface DashboardSummary {
  totalServices: number;
  healthyServices: number;
  avgUptimePercentage: number;
  activeIncidentsCount: number;
  worstP95LatencyMs: number;
}

export const dashboardApi = {
  async getDashboardSummary(): Promise<Result<DashboardSummary>> {
    try {
      const [servicesRes, incidentsRes] = await Promise.all([
        servicesApi.getServices(),
        incidentsApi.getIncidents({ status: "open", limit: 100 }),
      ]);

      if (!servicesRes.ok) {
        return { ok: false, error: servicesRes.error };
      }

      const services = servicesRes.data;
      const totalServices = services.length;
      const healthyServices = services.filter((s) => s.last_check_ok !== false).length;

      const activeIncidentsCount = incidentsRes.ok ? incidentsRes.data.total : 0;

      let avgUptimePercentage = 99.9;
      let worstP95LatencyMs = 0;

      if (totalServices > 0) {
        // Calculate uptime ratio from current service statuses
        const uptimeRatio = (healthyServices / totalServices) * 100;
        avgUptimePercentage = Math.round(uptimeRatio * 100) / 100;

        // Calculate max response time among active services
        const maxLatency = Math.max(
          ...services.map((s) => s.last_response_time_ms || 0),
          0
        );
        worstP95LatencyMs = Math.round(maxLatency);
      }

      return {
        ok: true,
        data: {
          totalServices,
          healthyServices,
          avgUptimePercentage,
          activeIncidentsCount,
          worstP95LatencyMs,
        },
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to compute dashboard metrics";
      return { ok: false, error: msg };
    }
  },
};
