import { useQuery } from "@tanstack/react-query";
import { checksApi } from "@/api/checks";
import type { Check } from "@/schemas/check.schema";

export function useCheckHistory(serviceId: string, enabled: boolean) {
  return useQuery<Check[], Error>({
    queryKey: ["checks", serviceId],
    queryFn: async () => {
      const result = await checksApi.getRecentChecks(serviceId, 5);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(serviceId) && enabled,
    staleTime: 15000,
    refetchInterval: false,
  });
}
