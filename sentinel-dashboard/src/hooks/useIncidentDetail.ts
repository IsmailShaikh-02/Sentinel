import { useQuery } from "@tanstack/react-query";
import { incidentsApi } from "@/api/incidents";
import type { IncidentDetail } from "@/schemas/incident.schema";

export function useIncidentDetail(id: string | null) {
  return useQuery<IncidentDetail, Error>({
    queryKey: ["incident", id],
    queryFn: async () => {
      if (!id) throw new Error("Incident ID is required");
      const result = await incidentsApi.getIncidentById(id);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(id),
    staleTime: 15000,
  });
}
