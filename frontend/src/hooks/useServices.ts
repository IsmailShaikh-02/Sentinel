import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/api/services";
import type { Service } from "@/schemas/service.schema";

export const SERVICES_QUERY_KEY = ["services"] as const;

export function useServices() {
  return useQuery<Service[], Error>({
    queryKey: SERVICES_QUERY_KEY,
    queryFn: async () => {
      const result = await servicesApi.getServices();
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    staleTime: 10000,
    refetchInterval: 30000,
  });
}
