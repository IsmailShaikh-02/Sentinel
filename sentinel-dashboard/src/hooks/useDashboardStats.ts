import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type DashboardSummary } from "@/api/dashboard";

export const DASHBOARD_STATS_QUERY_KEY = ["dashboard", "stats"] as const;

export function useDashboardStats() {
  return useQuery<DashboardSummary, Error>({
    queryKey: DASHBOARD_STATS_QUERY_KEY,
    queryFn: async () => {
      const result = await dashboardApi.getDashboardSummary();
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
}
