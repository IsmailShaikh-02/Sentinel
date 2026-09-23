import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "@/api/services";
import type { Service } from "@/schemas/service.schema";

export function useServiceDetail(serviceId: string | undefined) {
  return useQuery<Service, Error>({
    queryKey: ["service", serviceId],
    queryFn: async () => {
      if (!serviceId) throw new Error("Service ID is required");
      const result = await servicesApi.getServiceById(serviceId);
      if (!result.ok) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: Boolean(serviceId),
    staleTime: 10000,
  });
}
