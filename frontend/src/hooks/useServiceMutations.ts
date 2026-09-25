import { useMutation, useQueryClient } from "@tanstack/react-query";
import { servicesApi } from "@/api/services";
import { SERVICES_QUERY_KEY } from "@/hooks/useServices";
import type {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
} from "@/schemas/service.schema";

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateServiceInput) => {
      const result = await servicesApi.createService(input);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateServiceInput;
    }) => {
      const result = await servicesApi.updateService(id, input);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onMutate: async ({ id, input }) => {
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });
      const previousServices = queryClient.getQueryData<Service[]>(SERVICES_QUERY_KEY);

      queryClient.setQueryData<Service[]>(SERVICES_QUERY_KEY, (old) =>
        old ? old.map((s) => (s.id === id ? { ...s, ...input } : s)) : []
      );

      return { previousServices };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousServices) {
        queryClient.setQueryData(SERVICES_QUERY_KEY, context.previousServices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await servicesApi.deleteService(id);
      if (!result.ok) throw new Error(result.error);
      return id;
    },
    onMutate: async (deletedId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: SERVICES_QUERY_KEY });

      // Snapshot the previous query data
      const previousServices =
        queryClient.getQueryData<Service[]>(SERVICES_QUERY_KEY) || [];

      // Optimistically update to remove deleted service
      queryClient.setQueryData<Service[]>(SERVICES_QUERY_KEY, (old) =>
        old ? old.filter((s) => s.id !== deletedId) : []
      );

      return { previousServices };
    },
    onError: (_err, _deletedId, context) => {
      // Rollback to previous state on failure
      if (context?.previousServices) {
        queryClient.setQueryData(SERVICES_QUERY_KEY, context.previousServices);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}

export function useManualCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await servicesApi.triggerManualCheck(id);
      if (!result.ok) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SERVICES_QUERY_KEY });
    },
  });
}
