import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { alertsApi } from "@/api/alerts";
import type { AlertHistoryResponse } from "@/schemas/channel.schema";

export function useAlertHistory(page: number = 1, limit: number = 20) {
  return useQuery<AlertHistoryResponse, Error>({
    queryKey: ["alerts", "history", page, limit],
    queryFn: async () => {
      const result = await alertsApi.getAlertHistory(page, limit);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 15000,
  });
}
