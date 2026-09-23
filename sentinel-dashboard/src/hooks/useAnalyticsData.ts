import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/api/analytics";
import type { UptimeData, LatencyData, WindowOption } from "@/schemas/analytics.schema";

export function useAnalyticsData(serviceId: string, window: WindowOption) {
  const uptimeQuery = useQuery<UptimeData, Error>({
    queryKey: ["analytics", "uptime", serviceId, window],
    queryFn: async () => {
      const result = await analyticsApi.getServiceUptime(serviceId, window);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(serviceId),
    staleTime: 30000,
  });

  const latencyQuery = useQuery<LatencyData, Error>({
    queryKey: ["analytics", "latency", serviceId, window],
    queryFn: async () => {
      const result = await analyticsApi.getServiceLatency(serviceId, window);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(serviceId),
    staleTime: 30000,
  });

  return {
    uptime: uptimeQuery.data,
    latency: latencyQuery.data,
    isLoading: uptimeQuery.isLoading || latencyQuery.isLoading,
    isError: uptimeQuery.isError || latencyQuery.isError,
    error: uptimeQuery.error || latencyQuery.error,
    refetch: () => {
      uptimeQuery.refetch();
      latencyQuery.refetch();
    },
  };
}
