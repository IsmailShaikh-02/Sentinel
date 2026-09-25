import { apiClient, type Result } from "@/api/client";
import {
  uptimeSchema,
  latencySchema,
  type UptimeData,
  type LatencyData,
  type WindowOption,
} from "@/schemas/analytics.schema";

export const analyticsApi = {
  async getServiceUptime(
    serviceId: string,
    window: WindowOption = "24h"
  ): Promise<Result<UptimeData>> {
    return apiClient<UptimeData>(`/api/services/${serviceId}/uptime?window=${window}`, {
      method: "GET",
      schema: uptimeSchema,
    });
  },

  async getServiceLatency(
    serviceId: string,
    window: WindowOption = "24h"
  ): Promise<Result<LatencyData>> {
    return apiClient<LatencyData>(`/api/services/${serviceId}/latency?window=${window}`, {
      method: "GET",
      schema: latencySchema,
    });
  },
};
