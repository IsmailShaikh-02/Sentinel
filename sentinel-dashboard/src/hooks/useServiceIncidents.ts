import { useQuery } from "@tanstack/react-query";
import { incidentsApi } from "@/api/incidents";
import type { Incident } from "@/schemas/incident.schema";

export function useServiceIncidents(serviceId: string) {
  return useQuery<Incident[], Error>({
    queryKey: ["incidents", serviceId],
    queryFn: async () => {
      const result = await incidentsApi.getServiceIncidents(serviceId);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(serviceId),
    staleTime: 15000,
  });
}
